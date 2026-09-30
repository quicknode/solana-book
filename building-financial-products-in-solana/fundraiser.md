# Chapter 12: The Fundraiser

Maria has designed a compact commercial espresso machine, and the factory quoted 9,000 USDC for the first production run. The cost is indivisible: the injection-mold tooling has to be cut whole, so 6,000 USDC buys not two-thirds of a run but nothing at all. She could collect preorder promises by hand and hope enough of them are real, or she could put one rule onchain: **everyone's contribution comes back unless the full target amount is raised**. This chapter's program enforces that rule. It is an all-or-nothing fundraiser, the same promise Kickstarter makes, enforced by code instead of by a company.

The program lives at `finance/fundraiser` in the companion repository. It is one of the smallest programs in this part of the book: six instruction handlers, two account types, and one vault. Read it as the *Escrow* chapter with the parties rearranged. An escrow locks two strangers' assets until both sides of one deal are ready; a fundraiser locks many strangers' contributions until one shared condition is met. The vault and the PDA that signs for it work the same way, with one addition: a **deadline**.

The program calls the fundraiser's creator the **maker**, Maria here. She wants all-or-nothing because a partial raise is useless to her: 3,600 USDC cannot buy part of a mold. There is no platform operator and no fee in this program; the maker runs their own raise, and the only costs anyone pays are rent deposits on the accounts.

## Success and Failure Are Both Written Down in Advance

Two numbers are recorded the moment the fundraiser opens: the **target** and the **duration**. Together they define exactly two endings. If contributions reach the target, Maria takes everything. If the deadline passes first, every contributor takes back exactly what they put in. There is no third outcome, no partial award, and no moment where anyone has to trust Maria with USDC she has not yet earned: until the target is hit, her claim handler refuses to run.

A fundraiser can only end one way. The claim requires the total to have reached the target and a refund requires it not to have, so whichever one the total allows, it rules out the other.

## The Maker Starts the Fundraiser

Maria calls `initialize_fundraiser()` with a target of 9,000 USDC and a duration of 7 days, and this is the last decision she gets to make. Nothing in the program lets her extend the deadline, raise or lower the target, or touch the vault before the target is met. A crowdfunding platform can, and occasionally does, change campaign rules mid-campaign. Here the terms cannot change, because no handler exists to change them.

![](figures/fundraiser-initialize.svg)

This transaction created the two accounts the raise needs.

The **fundraiser** account lives at a PDA with seeds `"fundraiser"` and the maker's address, which means one live fundraiser per maker; a second `initialize_fundraiser()` from the same key finds the account already in existence and fails. Its struct, `Fundraiser`, holds the raise's terms:

- `maker` and `mint_to_raise`: who is raising, and in what token, USDC here.[^any-mint]
- `amount_to_raise`: the target, 9,000 USDC in minor units. `initialize_fundraiser()` rejects a target below three major units with `InvalidAmount`, so a dust-sized raise cannot exist.
- `current_amount`: the running total the program itself has counted, which is deliberately not the same number as the vault's balance.
- `time_started` and `duration`: the clock's Unix timestamp at creation, and the window length in days. The program does not store a deadline; it computes one from these two fields.

The **vault** is an associated token account whose authority is the fundraiser PDA, the arrangement the escrow used: tokens sit in an account only the program can sign for.

The handler stamps `time_started` from the cluster clock and stores the duration. Both later handlers reconstruct the deadline the same way: elapsed days are `(now − time_started) / 86,400`, integer division, floored, using the constant `SECONDS_TO_DAYS`. `contribute()` requires the floored day count to be *less than* the duration; `refund()` requires it to be *at least* the duration, so every moment falls in exactly one of the two windows. The switch happens exactly 604,800 seconds (7 × 86,400) after `time_started`: from that second on, `contribute()` fails and `refund()` works.

## Nobody May Carry More Than a Tenth of the Raise

Eleven backers fund this raise, each starting with the standard wallet of one SOL and 1,000 USDC, and each with their own reason. Alice runs three cafes and wants Maria's machine on her counters. Bob distributes restaurant equipment and wants a new product line to carry. Carol is an espresso enthusiast who wants one at home badly enough to help it exist. None of them will trust Maria, or each other, with a refund promise. They will trust a program that gives Maria no way to redirect the vault to herself, and whose deployed code is verified to match its published source.

Maria wants the raise to show that many people want the machine, so one large backer should not be able to fund it alone. The program caps each backer at a tenth of the target, so **a successful raise needs at least ten contributors**. A single backer who wanted to fill the raise would need ten wallets, and the fundraiser would record ten receipts.[^proof-of-personhood]

Alice tries to contribute her entire 1,000 USDC. The program refuses with `ContributionTooBig`. Her limit, computed by `calculate_max_contribution()`, is 10% of the target: 900 USDC. The constants behind it, `MAX_CONTRIBUTION_PERCENTAGE` over `PERCENTAGE_SCALER`, read 10/100, and the multiply runs in u128 before one floor division, multiply before divide, as in every other chapter.

She contributes 900 USDC instead, and every backer makes the same call: `contribute()` moves the tokens from Alice's own token account into the vault, and adds 900 to `current_amount`. The program can deduct from Alice's token account because she signed the transaction.

![](figures/fundraiser-contribute.svg)

The transaction also created an account for her. Each backer gets a **contributor** account at a PDA with seeds `"contributor"`, the fundraiser, and their own address, holding a single number: `amount`, their cumulative contribution. It is a receipt the program writes for itself. A backer's first `contribute()` creates it, every later one adds to it, and it is closed when the backer is refunded or, after a successful raise, when they call `close_contributor()`.

The cap applies to each backer's total across all their calls. Carol contributes 450 USDC, then comes back the next day with 450 more, and her contributor account's running total reaches the 900 cap. A third contribution would fail with `MaximumContributionsReached`. And at the bottom end, anything under one major unit rejects with `ContributionTooSmall`, so nobody spams the raise with dust.

So the contributions arrive like this: Alice 900, Bob 900, Carol 450 and 450, and eight more backers between 550 and 900 apiece. Ten backers is the minimum; this raise took eleven because most of them gave less than the cap. Total: exactly 9,000 USDC.

![](figures/fundraiser-cap.svg)

## The Claim Reads the Program's Counter, Not the Vault Balance

The claim handler compares the target against `current_amount`, the program's own count of accepted contributions, and **never against the vault's token balance**. Anyone can transfer tokens to any token account on Solana, no permission required. If the check read the vault balance, Maria could top her own vault up with 5,400 USDC on day six, "reach" the target, and walk off with 3,600 USDC of contributions the target was meant to protect. Because the check reads the counter, that transfer changes nothing: the test `test_check_contributions_ignores_direct_vault_donations` mints the full target straight into the vault and asserts that the claim still fails.

The same applies to any check that releases tokens from the vault: **it should read a number the program itself wrote**, because anyone can pass a check on a token balance by transferring tokens in.

## The Target Is Met: The Maker Claims, and Everything Closes

`check_contributions()` is the maker's claim. Maria signs, the PDA seeds re-derive her fundraiser, and `current_amount` has reached the target, so the handler does not fail with `TargetNotMet`. Three things then happen in one transaction: the vault's entire balance transfers to Maria's token account (signed by the fundraiser PDA), the vault closes, and the fundraiser account closes too, returning both rent deposits to her. The program sets no "finished" flag. A second claim fails because the fundraiser account it would read no longer exists. The test `test_check_contributions_success_pays_maker_and_closes_vault` asserts all three effects.

![](figures/fundraiser-success.svg)

The eleven contributor receipts are still open after the claim. `check_contributions()` does not close them, and `refund()`, which does, only runs if the raise fails. Without another handler, each backer's receipt rent (about a thousandth of a SOL) would be stuck in an account nothing could close, so the program has one more: `close_contributor()`. A backer signs, passes the address their receipt was written for, and the handler makes one check: the account at that address is no longer owned by the program. A live fundraiser is program-owned, and a closed one belongs to the system program again, so while the raise is open the call fails with `FundraiserStillOpen` and the receipt stays a live claim on the vault. Once the fundraiser is gone the receipt closes and the rent comes back, which `test_close_contributor_after_successful_claim_returns_rent` asserts. The handler pays out no tokens and checks nothing else. The general rule: *for every account your program creates, name the handler that closes it.*

## The Target Is Missed: Everyone Leaves With Exactly What They Brought

Now the other ending: the deadline passes with only 3,600 USDC in the counter. No handler marks the raise as failed; `refund()` simply starts accepting calls. Alice calls it. The handler checks the deadline has passed (`FundraiserNotEnded` otherwise) and the target was missed (`TargetMet` otherwise). It then reads her receipt's `amount`, subtracts it from `current_amount`, zeroes the receipt, transfers exactly that amount from the vault back to her token account with the PDA's signature, and closes the receipt to return her rent.

The order inside that handler is checks-effects-interactions: the receipt is zeroed and the counter decremented *before* the token transfer. A second refund fails because the receipt it would read has been closed. The escrow closed its offer accounts for the same reason.

![](figures/fundraiser-refunds.svg)

Each backer calls `refund()` for themselves, whenever they like; refunds have no deadline, and every contributor gets back exactly what they put in.

The fundraiser account and the vault are still open. The fundraiser PDA is derived from `"fundraiser"` and Maria's address alone, so Maria cannot open a second raise while the first one still exists. Once every contribution has been refunded, she calls `close_fundraiser()`. It checks the deadline has passed, the target was missed, and the counter is back to zero (`RefundsOutstanding` otherwise, so she cannot close the vault while any backer is still owed). It then sends her any tokens that were transferred into the vault without going through `contribute()`, and closes both the vault and the fundraiser, returning her rent. Nothing of the failed raise remains onchain, and Maria can try again next quarter with a smaller target. Every account this program creates is closed on both paths: the receipts close through `refund()` here and through `close_contributor()` after a win.

## The Math: Three Constants and a Floor

The program's financial arithmetic is four expressions:

- **The cap**: `amount_to_raise × 10 / 100`, in u128, floored.
- **The minimum target**: `3 × 10^decimals` (`MIN_AMOUNT_TO_RAISE`).
- **The minimum contribution**: `10^decimals`.
- **The deadline**: `(now − time_started) / 86,400`, floored.

Every addition and subtraction on `current_amount` and the receipts is checked and maps overflow to `MathOverflow`. No rates, no pro-rata, no prices: refunds pay recorded amounts back verbatim, so, like the escrow, this program never has to *compute* what people are owed.

## The Invariants: The Counter Balances Like a Ledger

- `current_amount` equals the sum of all live contributor receipts, at every moment: contributions add to both together, refunds subtract from both together.
- Tokens that entered through `contribute()` equal `current_amount` plus tokens already refunded; the vault can only exceed that by direct donations, which no check ever reads.
- No contributor's receipt ever exceeds 10% of the target.
- The claim requires `current_amount` to be at least the target and the refund requires it to be below, so a fundraiser can only end one way.
- Tokens leave the vault only through the claim or a refund, both signed by the fundraiser PDA, the claim requiring the maker's signature and the counter at the target, a refund requiring the contributor's signature, a passed deadline, and their own receipt.

## The Failure Modes: One Check per Attack

- **Claiming early or after a miss** fails on the counter: `TargetNotMet`.
- **Refunding early or after a win** fails on the deadline or the counter: `FundraiserNotEnded`, `TargetMet` (checked by `test_refund_before_deadline_fails` and `test_refund_when_target_met_fails`).
- **Contributing after the deadline** fails with `FundraiserEnded` (checked by `test_contribute_after_deadline_fails`).
- **Capture by one large backer** fails on the cumulative cap: `ContributionTooBig` per call, `MaximumContributionsReached` across calls (checked by `test_contribute_above_cap_fails` and `test_cumulative_contributions_above_cap_fail`).
- **Inflating the vault directly** moves tokens but never moves the counter, so the claim still fails with `TargetNotMet` (checked by `test_check_contributions_ignores_direct_vault_donations`).
- **Double refunds** fail because the receipt account is gone.
- **Dust contributions** fail on the one-major-unit minimum: `ContributionTooSmall`.
- **Closing the fundraiser early or with contributions inside** fails with `FundraiserNotEnded` before the deadline, `TargetMet` after a win, and `RefundsOutstanding` while any contribution remains unrefunded.
- **Closing a receipt while its raise is live** fails because the fundraiser account still belongs to the program: `FundraiserStillOpen` (checked by `test_close_contributor_while_fundraiser_open_fails`).

## Testing Considerations

The suite warps the clock with a helper that advances whole days, and asserts balances after every move. Three tests follow a whole lifecycle: `test_check_contributions_success_pays_maker_and_closes_vault` funds the raise with ten contributors at the cap and claims it, `test_refund_after_deadline_target_not_met_succeeds` follows the losing timeline to a clean refund, and `test_close_fundraiser_after_failed_raise_allows_a_new_raise` closes the failed fundraiser and checks the same wallet can raise again. The rest each call a handler in a state where it must refuse, and assert the error, such as `test_refund_before_deadline_fails`. Every vault program needs a donation test: mint tokens straight into your vault outside your own handlers, then assert that nothing unlocks (`test_check_contributions_ignores_direct_vault_donations` on the claim; `test_close_fundraiser_sweeps_direct_donations_to_maker` checks that `close_fundraiser()` pays such tokens to the maker).

## What You Learnt from Building the Fundraiser

Kickstarter's all-or-nothing promise is a company policy: the platform holds the pledges, takes its cut, and can change campaign rules mid-campaign. This chapter's program enforces the same all-or-nothing outcome in code: no platform, no fee, and terms that cannot change because no handler exists to change them.

The fundraiser added five concepts on top of the escrow's:

- **A deadline that decides which handlers work.** One floored day-count expression, compared both ways, so contributions and refunds can never both be legal at once.
- **Checks read the program's counter, not the vault balance.** A check that releases tokens from a vault must read a number the program itself wrote, never a token balance anyone can raise by transferring tokens in.
- **A receipt account per participant**, at a PDA, created on first use, added to on later contributions, and closed on refund, so a second refund finds nothing to read.
- **Cumulative caps.** Per-participant limits checked against running totals, so a raise cannot succeed without many participants.
- **Every account has a handler that closes it.** A successful raise closes the vault and the fundraiser but cannot reach the receipts, so a handler exists whose only job is to close one once the fundraiser is gone.

In the *Betting Market* chapter we will build a pool that many people pay into, where who gets paid is decided by something the program cannot see: which outcome happened in the real world. Someone has to tell the program the answer, and you will see how the program limits what that person can do with the pooled stakes while trusting them for the result.

[^any-mint]: Any mint works, Token Extensions mints included, because every account is declared through the token interface.

[^proof-of-personhood]: The cap counts wallets, and a wallet costs nothing to create, so ten receipts show ten wallets rather than ten people. A raise that needs distinct people has to bring that proof from outside the program. Proof-of-personhood services exist to supply it: a person proves once, to the service, that they are a unique human, and a program can then require that proof before it accepts a contribution. Two such services are World ID ([world.org](https://world.org)) and VeryAI ([very.org](https://very.org)). How each proof reaches a Solana program differs by service, and checking one is outside this book.
