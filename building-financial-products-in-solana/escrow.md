# Chapter 11: Escrow

Escrow lets two people swap tokens without trusting each other or paying a middleman, with three instruction handlers. It also teaches what later programs reuse: a vault only the program can sign for, terms stored in an account, a closing handler for every state, and amounts counted in minor units.

The chapters that follow add what escrow does not have: a formula that sets a price, an outcome that decides a payout, time and interest, and an operator who must be constrained.

The program for this chapter lives at `finance/escrow` in the companion repository, with Anchor 1, Anchor 2, Quasar, and native versions, plus Kani model checks of its core invariants under `kani-proofs`. This chapter covers the Anchor 1 version, in `anchor-v1`.

## Escrow Lets Two Strangers Swap Without Trusting Each Other

Alice starts, like every character in this book, with one SOL and 1,000 USDC; she wants a share of Tesla stock and is prepared to spend 250 USDC on it (an illustrative price). Bob holds TSLAx and likes that price. They want to trade.

![](figures/escrow-swap-intent.svg)

The naive version is that Alice sends Bob her USDC and waits, and Bob can take the USDC and leave. An **escrow** lets Alice and Bob swap without having to trust each other.

Traditional finance solves this with a trusted third party. Alice sends her funds to the third party, which holds them in escrow until Bob has done the same, then distributes both sides to their destinations. And, as anyone who has sent money overseas knows, the third party takes a percentage of the amount for itself: even a plain transfer through an intermediary costs 6.36% on average worldwide, and more than 20% on the worst corridors.[^remittance-cost]

![](figures/escrow-traditional-escrow.svg)

A Solana program replaces the third party. The program holds Alice's tokens in a vault, and only the program's own code can move them out of it. There is no operator in this program at all: whoever deploys it earns nothing from it, takes no fee, and holds no private key that can sign for the vault. Each side receives one hundred percent of what the other side offered. Solana's transaction fees still apply, but they are a small fraction of a cent regardless of the size of the trade.

![](figures/escrow-program-swap.svg)

## The Deal: A Maker Offers, a Taker Accepts

Two roles run through this chapter, and the code names them the same way:

- **Alice is the maker.** She creates the offer: 250 USDC for 1 TSLAx.
- **Bob is the taker.** He accepts the offer as it stands.

The deal is priced in minor units. USDC has six decimals, so Alice's 250 USDC is 250,000,000 minor units. TSLAx has eight decimals, so the single Tesla share she wants is 100,000,000 minor units, the same integer that means one hundred dollars in a USDC account.

## The Instruction Handlers

The program has three instruction handlers, and together they form the offer's complete state machine: `make_offer()` creates the offer and specifies what is wanted in return, and the offer stays open until someone else runs `take_offer()` or the maker runs `cancel_offer()`. As the *State Machines* chapter requires, an open offer can be ended by either side.

![](figures/escrow-state-machine.svg)

### The Maker Makes the Offer

Alice calls `make_offer()` with three arguments: her chosen `id`, `token_a_offered_amount` (250,000,000 minor units of USDC), and `token_b_wanted_amount` (100,000,000 minor units of TSLAx).

![](figures/escrow-make-offer.svg)

This one transaction created the two accounts the deal needs, and a third for Alice, covered below.

The **offer account** stores what Alice wants in return. It is the program's custom data, defined in `state/offer.rs`:

- `id`, the number Alice chose, so one maker can have many offers open at once
- `maker`, Alice's address, recorded so the program knows who may cancel and who receives payment
- `token_mint_a` and `token_mint_b`, identifying the two tokens in the deal
- `token_b_wanted_amount`, how much of token B the maker wants, in minor units
- `bump`, the stored bump the *PDAs* chapter describes

The offer account lives at a PDA derived from the seeds `"offer"`, the maker's address, and the ID. Because the maker's address is part of the seeds, two different makers can never collide.

The **vault** is where Alice's USDC waits. It is an ordinary token account with one difference: its authority is the offer PDA, not Alice and not the program's author, so, as the *PDAs* chapter explains, only this program can move what it holds. It is the offer account's **associated token account** for token mint A.

Around these two sit the accounts every token program interaction needs: the two mint accounts, Alice's token account for each mint, the System Program, the token program, and the Associated Token Program. The escrow accepts either token program, as long as every token account in one instruction uses the same one. Bob's accounts are faded in the figure because this transaction never touches them.

Before the handler code runs, the account constraints in `MakeOfferAccountConstraints` have already enforced the structure of the deal. Alice must have signed, and she is marked mutable because she pays to create the accounts this handler makes. Both mint accounts must belong to the token program named in the transaction. `maker_token_account_a` must be Alice's associated token account for token mint A, which is the account her USDC leaves. The offer account is created here, with space for the data fields plus the discriminator that marks the account's type, at the PDA derived from `"offer"`, Alice's address, and the ID. If that account already exists, creation fails and the whole transaction aborts. The vault is also created here, as the offer's associated token account for token mint A.

`maker_token_account_b` is Alice's account for the token she *wants*: the TSLAx account Bob will pay into. She may not have one yet, so `make_offer()` creates it if it does not exist, and Alice pays the rent. Creating it now means Bob never has to. When he takes the offer the account is already there, and `take_offer()` only checks that it is.

With the structure verified, the handler code is three small steps:

- **`handle_validate_offer()`** refuses an offer with zero tokens on either side with `ZeroAmount`.
- **`handle_send_offered_tokens_to_vault()`** calls the shared `transfer_tokens()` helper to move the 250,000,000 minor units from `maker_token_account_a` into the vault, with Alice as the signing authority.
- **`handle_save_offer()`** writes the offer's fields, including the saved bump, into the offer account.

### The Taker Takes the Offer

Bob calls `take_offer()`. The offer account Bob passes names the offer he is taking, and every other account is checked against its stored data; the failure modes below show what each check stops. Bob also passes the terms he saw when he chose the offer: `minimum_token_a_out`, the least USDC he will accept (250,000,000 minor units), and `maximum_token_b_in`, the most TSLAx he will pay (100,000,000 minor units).

![](figures/escrow-take-offer.svg)

Alice takes no part in this transaction. She does not need to be awake, online, or anywhere in particular. She signed her part when she made the offer; the program does the rest.

The handler code runs three steps:

- **`handle_check_offer_terms()`** refuses the take with `OfferTermsChanged` unless the vault holds at least `minimum_token_a_out` and the offer wants no more than `maximum_token_b_in`. It runs before any token moves.
- **`handle_send_wanted_tokens_to_maker()`** moves the 100,000,000 minor units of TSLAx straight from `taker_token_account_b` to `maker_token_account_b`, with Bob signing. Bob's payment goes directly to Alice's token account; there is no intermediate stop for token B, because the program never needs custody of it.
- **`handle_withdraw_and_close_vault()`** moves the USDC out of the vault to `taker_token_account_a`, which was created in this same transaction if Bob had never held USDC before (Bob pays for his own account). The vault's authority is the offer PDA, so for this transfer the program signs with the offer's seeds: `"offer"`, the maker's address, the ID, and the saved bump.

Then `close_token_account()`, the other shared helper, closes the vault, sending its rent deposit back to Alice, and the offer account itself is closed, refunding that rent to Alice too.

Both sides now hold what the other offered.

### The Maker Cancels the Offer

If nobody takes the offer, Alice needs her USDC back. Without a handler that returns them, her tokens would sit in the vault forever. That handler is `cancel_offer()`.

![](figures/escrow-cancel-offer.svg)

The constraints make it maker-only: the signer must match the maker address stored in the offer. Bob cannot cancel Alice's offer, which `test_cancel_offer_rejects_non_maker` checks. `cancel_offer()` mirrors the second half of `take_offer()`: it signs with the offer's seeds to move the full vault balance back to `maker_token_account_a`, and closes both the vault and the offer account, returning both rent deposits to Alice.

## The Math: No Division, So No Rounding

The offer is all-or-nothing, so there are no partial fills, no division, and no rounding policy to decide. The amounts the maker states are the amounts that move. There is no multiplication either. Every transfer goes through the shared `transfer_tokens()` helper, which uses `transfer_checked()`, the decimals-checking transfer the *Tokens* chapter describes.

The lamport math that remains is rent, under the *State Machines* chapter's rule: whoever opens an account pays its deposit and gets it back. Alice fronts the rent deposits for the offer account and the vault (and for her own token B account if it did not exist). When her token B account already existed, she gets back exactly the lamports she paid in, and the tests assert that to the lamport. Bob pays rent only for his own token A account if he never held that token, and that account remains his afterward. Nobody's rent ends up with the other party.

## The Invariants: Tokens Are in Exactly One Place

Five things must hold before and after every handler:

- Alice's offered tokens are in exactly one place at any instant: her token account, the vault, or (after the take) Bob's token account.
- The vault holds at least `token_a_offered_amount` from the end of `make_offer()` until `take_offer()` or `cancel_offer()` runs, and both handlers empty the vault completely before closing it. A direct donation could push the balance above that amount. The only check that reads the balance compares it with the taker's `minimum_token_a_out`, and whatever is in the vault goes to the taker on a take or back to the maker on a cancel.
- The offer account's data never changes after `handle_save_offer()` writes it. There is no update handler.
- Only the taker's signature moves token B, and only the offer PDA's signature moves the vault.
- Rent returns to whoever paid it, on every path.

## The Failure Modes: Every Substitution Is Checked

- **Reused offer ID.** The offer account is created at an address derived from the maker and the ID, so a second `make_offer()` with the same ID fails at account creation while the first offer is open.
- **A switched offer.** Once an offer closes, its ID is free again, so a maker could change the terms under a taker. Bob sends `take_offer()` for 250 USDC; before it lands, Alice cancels and makes a new offer with the same ID, 1 USDC for the same 1 TSLAx, at the same address. Bob's take then finds the new offer, and fails with `OfferTermsChanged`, because the vault holds less than his `minimum_token_a_out`. `test_take_offer_rejects_switched_offer` runs this attack, and `test_take_offer_rejects_switched_offer_wanting_more_token_b` runs it with a new offer of the same 250 USDC for 2 TSLAx, more than his `maximum_token_b_in`.
- **Account substitution.** The classic escrow attack is a taker who passes the wrong account somewhere and hopes the program does not look. Three versions, and what stops each:
  - **The taker's own account as the maker's payment account.** Bob passes his own TSLAx account as `maker_token_account_b`, so the 1 TSLAx he pays would land back in his own wallet. That account must be Alice's associated token account for token mint B, an address derived from Alice's address, the token program, and the mint, so Bob's account fails the check and the transaction is rejected before any token moves.
  - **A foreign vault.** Alice has a second offer open, with 500 USDC in its vault. Bob passes the first offer, which asks 1 TSLAx for 250 USDC, together with the second offer's vault, hoping to be paid 500 USDC for his 1 TSLAx. The vault must be the first offer's associated token account for token mint A, derived from that offer's address, so the second vault is rejected. Even without that check the token program would refuse the transfer, because the PDA signing for it is not that vault's authority.
  - **A mismatched mint.** Bob creates a token of his own, mints himself 100,000,000 minor units of it, and passes its mint as `token_mint_b` and his account of it as `taker_token_account_b`, hoping to pay Alice in a token worth nothing. The stored-address check compares the mint passed in against the `token_mint_b` recorded in the offer, and rejects it.

  Each is blocked by a constraint: associated token account derivation binds each token account to its owner and mint, stored-address checks bind the maker and mints to the offer's stored data, and seeds plus bump bind the offer to the program. The *Adversary* chapter shows what happens to programs that skip these checks.
- **Unauthorized cancel.** `cancel_offer()` requires the maker's signature and checks it against the offer's stored maker.
- **Degenerate offers.** An offer with zero tokens on one side, or of a token for a different amount of itself, means someone is about to be cheated. `make_offer()` refuses an offer of zero tokens on either side with `ZeroAmount` (`test_make_offer_rejects_zero_offered_amount` and `test_make_offer_rejects_zero_wanted_amount`). An offer of a token for itself never reaches the handler: with one mint, the maker's token A and token B accounts are the same account, and Anchor refuses the same writable account twice with `ConstraintDuplicateMutableAccount`, which `test_make_offer_rejects_same_mint` checks.

## Testing Considerations

The tests live in `tests/test_escrow.rs`, creating the wallets, mints, and token accounts each scenario needs. Every piece of program state in the tests is created through the program's own instruction handlers, never injected, as the testing section of the *Operating Financial Software* chapter requires.

- `test_make_offer` calls `make_offer()` and then checks both effects: the vault holds the offered amount, and the offer account's stored fields (ID, maker) match what Alice sent.
- `test_take_offer` runs the full happy path and asserts both directions of the swap in both tokens: Bob gains 250 USDC and pays his 1 TSLAx, and Alice gains 1 TSLAx and is left with 750 USDC. Assert both directions of every symmetric flow, as the testing section of the *Operating Financial Software* chapter says. It then asserts the vault and offer accounts are gone, and that Alice's lamports round-tripped exactly, and so checks that no rent ended up with the wrong party.
- `test_take_offer_rejects_switched_offer` and `test_take_offer_rejects_switched_offer_wanting_more_token_b` cancel and remake the offer between Bob building his take and sending it. Each asserts the take fails with `OfferTermsChanged`, Bob still holds his 1,000 USDC and 1 TSLAx, Alice received no TSLAx, and the switched offer's USDC is still in the vault.
- `test_cancel_offer` asserts Alice's token A balance returns to its pre-offer value and her rent comes back in full.
- `test_cancel_offer_rejects_non_maker` is the adversarial case: Bob attempts to cancel Alice's offer and the transaction fails. Test the code path the bug lives in, and start with the one where tokens go to the wrong person.

The testing section of the *Operating Financial Software* chapter builds the general method. The `kani-proofs` crate in the companion repository also model-checks the conservation invariants over every possible value, with harnesses like `proof_take_offer_conserves_value`, `proof_take_offer_honors_taker_terms`, and `proof_cancel_offer_returns_all_to_maker`. The crate models the native version's transfer-and-close arithmetic as pure functions, as the model-checking section of the *Operating Financial Software* chapter explains.

## What You Learnt from Building the Escrow

In traditional finance, an escrow means a trusted third party: a company that holds both sides' assets, takes a percentage, and must itself be trusted not to walk away. This chapter replaced that company with a program whose rules are its own deployed code.

The escrow gave you four concepts:

- **Program custody.** The vault is the offer account's associated token account, and its authority is the offer PDA, so only this program's handlers move what it holds.
- **Terms in a data account.** The offer account records the deal (maker, mints, wanted amount), and every later handler checks its accounts against that stored data. The taker also passes the terms they saw, so a maker who replaces the offer at the same address cannot change the terms under them.
- **State transitions checked against signatures and stored terms.** Who signed, and what the stored data says, decide what may happen next; stored-address checks, seeds, and ATA derivation close every substitution.
- **Every state has a handler that empties the vault.** `take_offer()` and `cancel_offer()` both empty and close everything, returning the tokens and the account rent deposits to whoever they belong to, so neither is stranded.

In the *Fundraiser* chapter we will build an escrow with many depositors instead of one maker. Contributions collect in one vault: the maker takes them the moment the target is reached, and if the deadline passes first, every contributor takes theirs back. Most programs in the rest of this part keep this chapter's shape (a vault whose authority is a PDA, and a handler in every state that empties it) and change only what decides who is paid.

[^remittance-cost]: The Introduction's note on remittance costs gives the scope of these figures and the World Bank source for them.
