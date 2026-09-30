# Chapter 11: Escrow

Escrow is the simplest program in this book. It lets two people swap tokens without trusting each other or paying a middleman, and it does that with three instruction handlers. It also teaches the mechanics that every later program reuses:

- holding tokens in a vault whose authority is an address only the program can sign for, so nobody, including the program's author, can move them except along the paths the code defines
- storing the terms of a deal in an account the program owns, and checking every later instruction against them
- letting who signed, and what the stored terms say, decide what may happen next
- giving every state an exit that returns the tokens and the account rent deposits, so neither is stranded
- counting every amount in minor units, the integers the token program moves

The chapters that follow add what escrow does not have: a formula that sets a price, an outcome that decides a payout, time and interest, and an operator who must be constrained.

The program for this chapter lives at `finance/escrow` in the companion repository, with Anchor, Quasar, and native versions, plus machine-checked proofs of its core invariants under `kani-proofs`. This chapter covers the Anchor version.

## Escrow Lets Two Strangers Swap Without Trusting Each Other

Alice starts, like every character in this book, with one SOL and 1,000 USDC; she wants a share of Tesla stock and is prepared to spend 250 USDC on it. Bob holds TSLAx and likes that price. They want to trade.

![](figures/escrow-swap-intent.svg)

The naive version is that Alice sends Bob her USDC and waits. But what if Bob takes the USDC and leaves? An **escrow** lets Alice and Bob swap without having to trust each other.

Traditional finance solves this with a trusted third party. Alice sends her funds to the third party, which holds them in escrow until Bob has done the same, then distributes both sides to their destinations. And, as anyone who has sent money overseas knows, the third party takes a percentage of the amount for itself: 6.5% on average worldwide, and more than 20% on the worst corridors.[^remittance-cost]

![](figures/escrow-traditional-escrow.svg)

A Solana program replaces the third party. The program holds Alice's tokens under rules that are the deployed program itself: nobody, including the program's author, can move them except along the paths the code defines. There is no operator in this program at all: whoever deploys it earns nothing from it, takes no fee, and holds no key that matters. Each side receives one hundred percent of what the other side offered. Solana's transaction fees still apply, but they are a small fraction of a cent regardless of the size of the trade.

![](figures/escrow-program-swap.svg)

## The Deal: A Maker Offers, a Taker Accepts

Two roles run through this chapter, and the code names them the same way:

- **Alice is the maker.** She creates the offer: 250 USDC for 1 TSLAx.
- **Bob is the taker.** He accepts the offer as it stands.

The deal is priced the way all Solana money is priced: in **minor units**, the smallest denomination of each token, the raw integers programs operate on. USDC has six decimals, so Alice's 250 USDC is 250,000,000 minor units. TSLAx has eight decimals, so the single Tesla share she wants is 100,000,000 minor units, the same integer that means one hundred dollars in a USDC account. The same integer meaning two different things is why programs track each token's decimals instead of assuming them. The minor-units section of the *Arithmetic of Money* chapter covers this in depth.

## The Instruction Handlers

The program has three instruction handlers, and together they form the offer's complete state machine: `make_offer()` creates the offer and specifies what is wanted in return, and the offer stays open until someone else runs `take_offer()` or the maker runs `cancel_offer()`. Every state needs an exit, and an open offer has two.

![](figures/escrow-state-machine.svg)

### The Maker Makes the Offer

Alice calls `make_offer()` with three arguments: her chosen `id`, `token_a_offered_amount` (250,000,000 minor units of USDC), and `token_b_wanted_amount` (100,000,000 minor units of TSLAx).

![](figures/escrow-make-offer.svg)

Financial state on Solana is accounts, and this one transaction created the two the deal needs.

The **offer account** stores what Alice wants in return. It is the program's custom data, defined in `state/offer.rs`:

- `id`, the number Alice chose, so one maker can have many offers open at once
- `maker`, Alice's address, recorded so the program knows who may cancel and who receives payment
- `token_mint_a` and `token_mint_b`, identifying the two tokens in the deal
- `token_b_wanted_amount`, how much of token B the maker wants, in minor units
- `bump`, saved once at creation so later instruction handlers can rebuild the account's address cheaply

The offer account lives at a **PDA** (program derived address), an address derived from the seeds `"offer"`, the maker's address, and the ID. Because the maker's address is part of the seeds, two different makers can never collide.

The **vault** is where Alice's USDC waits. It is an ordinary token account with one difference: its authority is the offer PDA, not Alice and not the program's author. The offer PDA has no private key, so only the escrow program can sign as it, which means tokens leave the vault only along the code paths the program defines. Concretely, the vault is the offer account's **associated token account** for token mint A, so its address is derivable by anyone from the offer's address and the mint's address.

Around these two sit the accounts every token program interaction needs: the two mint accounts, Alice's token account for each mint, the System Program (which creates accounts), the token program, and the Associated Token Program (which derives where a wallet stores a given token). The escrow accepts either token program through one interface, so the same code works whether the tokens involved use the Classic Token Program or the Token Extensions Program; the constraints only require that every token account in one transaction uses the same one. Bob's accounts are faded in the figure because this transaction never touches them.

Before the handler code runs, the account constraints in `MakeOfferAccountConstraints` have already enforced the structure of the deal. Alice must have signed, and she is marked mutable because she pays to create the accounts this handler makes. Both mint accounts must belong to the token program named in the transaction. `maker_token_account_a` must be Alice's associated token account for token mint A, which is the account her USDC leaves. The offer account is created here, with space for the data fields plus the discriminator that marks the account's type, at the PDA derived from `"offer"`, Alice's address, and the ID. If that account already exists, creation fails and the whole transaction aborts, which is the ID-reuse check. The vault is also created here, as the offer's associated token account for token mint A.

`maker_token_account_b` is Alice's account for the token she *wants*: the TSLAx account Bob will pay into. She may not have one yet, so `make_offer()` creates it if it does not exist, and Alice pays the rent. Creating it now means Bob never has to. When he takes the offer the account is already there, and `take_offer()` only checks that it is. Otherwise Bob would be paying rent on an account that belongs to Alice.

With the structure verified, the handler code is two small steps:

- **`handle_send_offered_tokens_to_vault()`** calls the shared `transfer_tokens()` helper to move the 250,000,000 minor units from `maker_token_account_a` into the vault, with Alice as the signing authority.
- **`handle_save_offer()`** writes the offer's fields, including the saved bump, into the offer account.

### The Taker Takes the Offer

Bob calls `take_offer()`. It takes no arguments beyond the accounts themselves: the offer Bob wishes to take is specified by the offer account he provides. The account constraints then verify that every other account in the transaction is the one that offer implies. The maker account must match the address stored in the offer, and the two mint accounts must match the mints stored there. The seeds and stored bump prove the offer account sits at the program's own PDA. The vault must be the offer's associated token account for mint A, and the payment destination must be the maker's associated token account for mint B. Bob cannot substitute an account he controls anywhere in this structure, because every address is derived or checked against the offer's stored data. This is the account-substitution defense the validation section of the *Adversary* chapter covers in full.

![](figures/escrow-take-offer.svg)

That is all Alice does. She does not need to be awake, online, or anywhere in particular. She signed her part when she made the offer; the program does the rest.

The handler code runs two steps:

- **`handle_send_wanted_tokens_to_maker()`** moves the 100,000,000 minor units of TSLAx straight from `taker_token_account_b` to `maker_token_account_b`, with Bob signing. Bob's payment goes directly to Alice's token account; there is no intermediate stop for token B, because the program never needs custody of it.
- **`handle_withdraw_and_close_vault()`** moves the USDC out of the vault to `taker_token_account_a`, which was created in this same transaction if Bob had never held USDC before (Bob pays for his own account). The vault's authority is the offer PDA, so for this transfer the program signs with the offer's seeds: `"offer"`, the maker's address, the ID, and the saved bump.

Then the same helper pair closes the vault with `close_token_account()`, sending its rent deposit back to Alice, and the offer account itself is closed, refunding that rent to Alice too.

Both sides now hold exactly what the other offered. No percentage went to anyone.

### The Maker Cancels the Offer

If nobody takes the offer, Alice needs her USDC back. Without an exit, her tokens would sit in the vault forever, which is a stranded-funds bug. The exit is `cancel_offer()`.

![](figures/escrow-cancel-offer.svg)

The constraints make it maker-only: the signer must match the maker address stored in the offer. Bob cannot cancel Alice's offer, and the test suite proves it (more below). `cancel_offer()` mirrors the second half of `take_offer()`: it signs with the offer's seeds to move the full vault balance back to `maker_token_account_a`, and closes both the vault and the offer account, returning both rent deposits to Alice.

## The Math

Escrow has less arithmetic than any other program in this book, because the offer is all-or-nothing: there are no partial fills, no division, and so no rounding policy to decide. The amounts the maker states are the amounts that move. The only multiplication in the program is in `transfer_checked()`, which the `transfer_tokens()` helper uses so that every transfer verifies the mint's decimals match what the caller believes they are, one more guard against minor-unit confusion.

The money math that remains is rent. Alice fronts the rent deposits for the offer account and the vault (and for her own token B account if it did not exist). On either exit path, both program-created accounts close and both deposits return to her; when her token B account already existed, her lamports round-trip exactly, and the tests assert that to the lamport. Bob pays rent only for his own token A account if he never held that token, and that account remains his afterward. Nobody's rent ends up with the other party.

## The Invariants

Five things must hold before and after every handler:

- Alice's offered tokens are in exactly one place at any instant: her token account, the vault, or (after the take) Bob's token account.
- The vault holds at least `token_a_offered_amount` from the end of `make_offer()` until an exit runs (a direct donation could push it above, and changes nothing), and both exits empty the vault completely before closing it.
- The offer account's data never changes after `handle_save_offer()` writes it. There is no update handler, so there is nothing to get wrong.
- Only the taker's signature moves token B, and only the offer PDA's signature moves the vault.
- Rent returns to whoever paid it, on every path.

## The Failure Modes

- **Reused offer ID.** The offer account is created at an address derived from the maker and the ID, so a second `make_offer()` with the same ID fails at account creation.
- **Account substitution.** The classic escrow attack is a taker who passes the wrong account somewhere and hopes the program does not look. Three versions, and what stops each:
  - **The taker's own account as the maker's payment account.** Bob passes his own TSLAx account as `maker_token_account_b`, so the 1 TSLAx he pays would land back in his own wallet. That account must be Alice's associated token account for token mint B, an address derived from Alice's address and the mint, so Bob's account fails the check and the transaction is rejected before any token moves.
  - **A foreign vault.** Alice has a second offer open, with 1,000 USDC in its vault. Bob passes the first offer, which asks 1 TSLAx for 250 USDC, together with the second offer's vault, hoping to be paid 1,000 USDC for his 1 TSLAx. The vault must be the first offer's associated token account for token mint A, derived from that offer's address, so the second vault is rejected. Even without that check the token program would refuse the transfer, because the PDA signing for it is not that vault's authority.
  - **A mismatched mint.** Bob creates a token of his own, mints himself 100,000,000 minor units of it, and passes its mint as `token_mint_b` and his account of it as `taker_token_account_b`, hoping to pay Alice in a token worth nothing. The stored-address check compares the mint passed in against the `token_mint_b` recorded in the offer, and rejects it.

  Each is closed by the constraint structure: associated token account derivation binds each token account to its owner and mint, stored-address checks bind the maker and mints to the offer's stored data, and seeds plus bump bind the offer to the program. The *Adversary* chapter shows what happens to programs that skip these checks.
- **Unauthorized cancel.** `cancel_offer()` requires the maker's signature and checks it against the offer's stored maker.
- **The abandoned offer.** The failure mode that is a missing feature: without `cancel_offer()`, an untaken offer strands the maker's tokens permanently. Every state needs an exit.
- **Degenerate offers.** An offer with zero tokens on one side, or of a token for a different amount of itself, means someone is about to be cheated. `make_offer()` refuses an offer of zero tokens on either side with `ZeroAmount` (`test_make_offer_rejects_zero_offered_amount` and `test_make_offer_rejects_zero_wanted_amount`). An offer of a token for itself never reaches the handler: with one mint, the maker's token A and token B accounts are the same account, and Anchor refuses the same writable account twice with `ConstraintDuplicateMutableAccount`, which `test_make_offer_rejects_same_mint` checks.

## Testing Considerations

The tests live in `tests/test_escrow.rs`, creating the wallets, mints, and token accounts each scenario needs. Every piece of program state in the tests is created through the program's own instruction handlers, never injected, so a missing constraint or an unusable handler cannot hide behind a hand-built fixture.

- `test_make_offer` calls `make_offer()` and then checks both effects: the vault holds the offered amount, and the offer account's stored fields (ID, maker) match what Alice sent.
- `test_take_offer` runs the full happy path and asserts both directions of the swap: Bob's token A balance and Alice's token B balance. Symmetric flows get tested in both directions, because a bug that favors one side is invisible if you only assert the other. It then asserts the vault and offer accounts are gone, and that Alice's lamports round-tripped exactly, and so asserts the rent economics.
- `test_cancel_offer` asserts Alice's token A balance returns to its pre-offer value and her rent comes back in full.
- `test_cancel_offer_rejects_non_maker` is the adversarial case: Bob attempts to cancel Alice's offer and the transaction fails. Test the code path the bug lives in, and start with the one where money goes to the wrong person.

The testing section of the *Operating Financial Software* chapter builds the general method; this suite is the method at its smallest useful size. And escrow goes one step further: the `kani-proofs` crate in the companion repository proves the conservation invariants formally, over every possible input, with harnesses like `proof_take_offer_conserves_value` and `proof_cancel_offer_returns_all_to_maker`. The proving section of the *Operating Financial Software* chapter explains the technique.

## What You Learnt from Building the Escrow

In traditional finance, an escrow means a trusted third party: a company that holds both sides' assets, takes a percentage for the privilege, and must itself be trusted not to walk away. This chapter replaced that company with a program whose rules are its own deployed code, whose operator earns nothing and holds no key that matters, and whose fee is a fraction of a cent.

The escrow gave you five concepts:

- **Program custody.** Tokens held in a vault whose authority is a PDA, an address only the program can sign for, so funds move only along the code paths the program defines.
- **Terms in a data account.** The offer account records the deal (maker, mints, wanted amount), and every later handler checks its accounts against that stored data.
- **State transitions gated by signatures and stored terms.** Who signed, and what the stored data says, decide what may happen next; stored-address checks, seeds, and ATA derivation close every substitution.
- **An exit from every state.** `take_offer()` and `cancel_offer()` both empty and close everything, returning the tokens and the account rent deposits to whoever they belong to, so neither is stranded.
- **Minor units.** Every amount is an integer at the mint's declared scale, and identical integers can mean entirely different things.

In the *Fundraiser* chapter we will build an escrow with many depositors instead of one maker. Contributions collect in one vault until a deadline, and the deadline decides which exit opens: the money goes to the person raising it if the target was reached, and back to every contributor if it was not. Most programs in the rest of this part keep this chapter's shape, a vault owned by a data account with an exit from every state, and change what decides the exit.

[^remittance-cost]: The World Bank's figures for the third quarter of 2025, which put the global average near 6.5% with thirteen corridors above 20%. See [remittanceprices.worldbank.org](https://remittanceprices.worldbank.org).
