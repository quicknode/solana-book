# Chapter 19: Options

Alice holds five NVDAx, a token that tracks a share of NVIDIA stock, and NVDAx is trading at $165. She would be happy to sell at $180, and she would like to be paid while she waits.

Bob thinks NVIDIA will pass $180 within the week, and he wants that upside for less than the $825 five shares would cost him.

An **option** serves them both: Alice sells Bob the right, but not the obligation, to buy her five NVDAx at $180 any time in the next week, and Bob pays her 25 USDC for it now. If NVIDIA rallies, Bob buys the shares below the market. If it does not, he loses the 25 USDC and Alice keeps it as income on shares she still owns.

Alice's offer to sell five NVDAx for 900 USDC, 180 USDC a share, is an ordinary offer with two additions: it expires, and the buyer pays to reserve it. The program lives at `finance/options` in the companion repository. It keeps one account per option, and the whole lifecycle is three states: `Listed`, `Held`, and `Exercised`.

## An Option Is a Right on One Side and an Obligation on the Other

Options have their own terms:

- An option is a **contract**: an agreement between the two parties to it.
- Its **underlying**, short for "underlying asset", is the asset the option is about: NVDAx in this chapter. Options traders drop the word "asset" and just say "the underlying". Markets write a pair as base/quote, NVDAx/USDC, and the underlying is the base token, the first of the two. USDC, which the strike and premium are paid in, is the quote token.
- Its **kind** is either a **call**, the right to buy the underlying, or a **put**, the right to sell it.
- Its **strike** is the price the trade happens at if the right is used.
- Its **expiry** is the moment the right lapses: the holder may exercise before it, and not at or after it.
- The **writer** creates the option, which is called **writing** it, and posts what the holder would receive on exercise: the underlying for a call, the strike for a put.
- Its **premium** is what the buyer pays for the right, once, up front.
- The **holder** buys the option and may use the right it carries. Using the right is **exercising** the option.
- An option the holder may exercise at any moment before expiry is **American**, and one that can be exercised only at expiry is **European**; the names are historical, not geographic. This program's options are American.
- An option worth exercising is **in the money**, and one that is not is **out of the money**.

The two sides have different payoffs:

- **The writer** keeps the premium whatever happens, and in exchange takes on an obligation to trade the underlying at the strike whenever the holder exercises. The writer's gain is capped at the premium. A call writer's loss against the market is not, since the shares can rise without limit; a put writer's is capped at the strike less the premium, since the price cannot fall below zero.
- **The holder's** loss is capped at the premium whatever happens. A call holder's gain is open-ended, and a put holder's is capped at the strike less the premium.

A sold option has exactly two endings: the holder exercises before expiry, or the option expires and the writer takes the collateral back. Where the price lands inside each ending decides how much each side made.

![](figures/options-payoff.svg)

## A Call Pays Off When the Price Rises, and a Put When It Falls

A call and a put are the same contract pointed in opposite directions. Each row of the table gives the call's version and the put's, and the rest of this chapter follows one of each: Alice's call and Carol's put.

> **A "contract" here is an option, not a Solana program.** Other chains call a program a "smart contract". In this chapter the word always means the option, which the program records as an `OptionContract` account.
>
> On an exchange, "contract" also means a unit of size: a US stock option contract covers 100 shares, and a trade is for some number of identical contracts, which the buyer can later sell or exercise one at a time. In this program, each option covers any amount of the underlying, and is bought and exercised whole.

| | Call Option | Put Option |
| --- | --- | --- |
| Who writes it | an owner of the asset who would sell at the strike | someone with cash who would buy at the strike |
| The writer posts | the underlying | the strike, in the quote token |
| Who buys it | someone who wants the upside without paying for the asset | an owner of the asset who wants insurance against a fall |
| The holder may | buy the underlying at the strike | sell the underlying at the strike |
| Worth exercising when the price is | above the strike | below the strike |
| On exercise, the holder | pays the strike and takes the underlying | delivers the underlying and takes the strike |
| On exercise, the writer | is owed the strike, and the underlying is gone | is owed the underlying, and the strike is gone |
| The holder profits past | the strike plus the premium | the strike minus the premium |
| In this chapter | Alice writes, Bob buys: strike $180, premium $5 a share, profit past $185 | Carol writes, Dave buys: strike $150, premium $4 a share, profit past $146 |

Traditional options venues let a writer take on the obligation with only a fraction of it posted as **margin**, and then watch the position every day to make sure the fraction still covers it. **A writer posts the whole obligation, up front, into the vault**, which is the table's second row. That makes a call **covered** and a put **cash-secured**: what the holder might claim is already in custody, so the writer cannot fail to deliver or to pay.

Nothing in this program is ever undercollateralized, so it has no margin, no health factor, no liquidator, and no oracle.

## Settlement Is Physical, So No Price Is Read

Exercising moves the two tokens in the table's on-exercise rows, through the vaults, and no price is computed. This is **physical settlement**.[^psyoptions] The name is inherited from markets where settling meant delivering the share certificates or the barrels of oil themselves, and it does not mean anything happens offchain. "Physical" here means the underlying asset itself changes hands at the strike. Whether exercising is worth doing is the holder's decision, made against whatever the market is doing offchain, and a holder who exercises an option that is out of the money only hurts themselves. The program enforces the terms of the deal and never reads a price.

The other design, **cash settlement**, pays the holder the difference between the market price and the strike in the quote token, USDC here, and that difference is a number only a price feed can supply. A cash-settled venue needs a price feed, a staleness check on it, and a defense against its manipulation. Zeta Markets used that design on Solana, with margin and an oracle.[^zeta]

## The Operator Opens the Venue

Maria runs the venue. Her incentive is a fee of 1% on every premium paid, and her power is limited to collecting it. She calls `initialize_market()` with `fee_bps` of 100. The handler refuses two configurations, both as `InvalidParameter`:

- A venue whose underlying and quote are the same token.
- A fee of 100% or more, which would leave a writer nothing from a sale.

A fee of zero is allowed: a venue run at cost is a valid choice. `test_zero_fee_venue_pays_the_writer_the_whole_premium` checks that the writer receives all 25 USDC and, counting the transaction's inner instructions, that the purchase made one token transfer: `buy_option()` skips the fee transfer rather than sending one for zero. Her public key is stored as the market's `admin`, and the only handler that reads it is `collect_fees()`.

![](figures/options-open-venue.svg)

This one transaction created the three accounts the venue needs.

The **market** account lives at a PDA with seeds `"market"`, the underlying mint, and the quote mint, so one venue exists per pair: every call and put on NVDAx settled in USDC shares the same two vaults and the same fee schedule. Its struct, `Market`, holds the `admin`, the two mints, the two vault addresses, the `fee_bps` charged on every premium, and three counters:

- `underlying_owed`: how much of the underlying vault the market owes, as call writers' collateral and as put holders' deliveries waiting for the writer to collect them.
- `quote_owed`: how much of the quote vault the market owes, as put writers' collateral and as call holders' strike payments waiting to be collected.
- `fees_owed`: how much of the quote vault belongs to the admin.

The market PDA is the authority of the **underlying vault** and the **quote vault** (seeds `"underlying_vault"` and `"quote_vault"` + market), and the program signs for them with the market's seeds. Both vaults hold other people's tokens, mixed: the underlying vault holds every call writer's shares together, and the quote vault holds every put writer's cash, every exercised call's strike payment, and the venue's fees together. The three counters record how much of each vault is owed, and before every transfer `check_custody()` checks that each vault will still hold at least that much once the transfer lands.

## A Writer Posts the Whole Obligation and Names a Price

Alice, carrying the standard wallet of one SOL and 1,000 USDC plus her five NVDAx, calls `write_option()`. She passes an `id` of 1 and an `OptionTerms` struct: kind `Call`, an underlying amount of 5 NVDAx, a strike amount of 900 USDC (180 USDC a share), a premium of 25 USDC, and an expiry one week out.

The handler checks the terms before it touches a token:

- **A zero amount** in `underlying_amount` or `strike_amount` is refused (`InvalidParameter`). It would be an option that delivers nothing or costs nothing to exercise.
- **A zero premium** is refused the same way. It would make the option a gift rather than a sale.
- **An expiry at or before now** is refused (`ExpiryInPast`). The holder may exercise while `now < expiry`, so such an option could never be exercised.

Then the handler does four things in order:

1. The `OptionContract` is written with status `Listed` and an empty holder.
2. The market's `underlying_owed` rises by 5 NVDAx.
3. The custody check runs against what the vault balance will be once the transfer lands.
4. Alice's 5 NVDAx move into the underlying vault.

From this moment the vault holds everything a future holder could ever claim from her.

![](figures/options-write-call.svg)

The transaction also created the option itself. Each option is an `OptionContract` account at a PDA with seeds `"option"`, the market, the writer, and an `id` the writer chooses, so one writer can have many options open. Its fields are the five terms plus the bookkeeping around them:

- `kind`, `Call` or `Put`, and `status`, which is `Listed` (written and collateralized, unsold), `Held` (sold), or `Exercised`.
- `writer` and `holder`. The holder is empty until someone buys.
- `underlying_amount` and `strike_amount`, the two amounts that change hands on exercise. Alice's option covers 5 NVDAx for a strike amount of 900 USDC.
- `premium`, in the quote token, for the whole option.
- `expiry`, a Unix timestamp. An option's expiry is a calendar date the two parties agreed on, so it is measured in wall-clock time rather than in slots.

![](figures/options-state-machine.svg)

**Every amount the option ever moves is one the account stores.** A call writer posts `underlying_amount` and a call holder pays `strike_amount`; a put swaps the roles, so the writer posts the strike amount and the holder delivers the underlying amount.

There is no strike *price* to multiply by a quantity and divide by a decimals factor, so settlement does no arithmetic at all, and has no rounding direction to get wrong. The chapter's "180 USDC strike" is the 900 USDC strike amount spread over the five shares it buys.

One more account is set up here. Alice's USDC account, where her premium will arrive, is created if it does not exist, paid for by Alice, so that `buy_option()` can require it to exist rather than make the buyer pay rent on an account that belongs to the writer.

Nobody has paid anything yet. Until someone does, Alice can call `cancel_option()` at any time, which returns her collateral and closes the account, rent back to her. That includes after the expiry: an unsold option has no holder whose rights the cancel would cut short, and `test_cancel_unsold_option_works_after_expiry` checks it. Without `cancel_option()`, the shares a writer posted for an option nobody buys would stay in the market's vault forever.

## A Buyer Pays the Premium, and the Collateral Does Not Move

Bob calls `buy_option()`. The handler does four things:

- It requires the option to be `Listed` and unexpired (`OptionNotListed`, `OptionExpired`), because a right nobody can exercise any more is not for sale.
- It splits the premium: `fee_bps` of it, 0.25 USDC, goes into the quote vault and is added to `fees_owed`.
- It sends the remaining 24.75 USDC straight from Bob to Alice.
- It sets the option's `holder` to Bob and its `status` to `Held`.

![](figures/options-buy-call.svg)

The premium is the only payment in the purchase, and it is Alice's from this moment whatever Bob does later. The 5 NVDAx do not move. Bob's downside is fixed at the 25 USDC he just paid, and Alice's upside on the shares is capped at $180 until the week is out.

A writer cannot buy their own option. In the Anchor build, the premium's source and destination are each derived as their party's associated token account, so with the writer on both sides the same account would fill two mutable slots. Anchor refuses the instruction with `ConstraintDuplicateMutableAccount` before the handler runs. `test_writer_cannot_buy_their_own_option` asserts that error and that the option is still `Listed`. A second buyer is refused because the option is no longer `Listed` (`test_buy_is_refused_once_sold`).

## The Holder Exercises Before Expiry, and the Tokens Change Hands

NVIDIA reports earnings and NVDAx moves to $200. Bob calls `exercise_option()` before the week is out. The handler requires the option to be `Held`, the clock to be before `expiry` (`OptionNotHeld`, `OptionExpired`), and the signer to be the holder. Then it updates the ledger and moves both legs:

- The market's `underlying_owed` falls by 5 NVDAx, because that collateral is no longer owed to anyone.
- The market's `quote_owed` rises by 900 USDC, because the strike is now owed to Alice.
- Bob pays the strike, 5 times 180 USDC, 900 USDC, into the quote vault.
- The underlying vault pays Bob the 5 NVDAx. Bob's NVDAx account, which he has never needed before, is created in the same transaction at his expense.

![](figures/options-exercise.svg)

Bob now holds 5 NVDAx worth $1,000 and has spent 925 USDC to get them, 25 of premium and 900 of strike. His 1,000 USDC is 75 USDC. Had NVDAx stayed at $165, he would not have exercised (paying 900 for shares the market sells for 825), and the 25 USDC would have been his whole loss. The call would have expired, and once the week was out Alice would have called `reclaim_collateral()` for her 5 NVDAx, keeping the premium and the shares.

![](figures/options-call-expires.svg)

The strike payment stays in the vault, owed to Alice, rather than being sent to her directly. Paying the writer inside the exercise would mean requiring the writer's token account to exist at that moment, and a writer who closed it could then block the holder from ever exercising. The vault holds it instead, and the writer withdraws it later with `collect_proceeds()`.

A put exercises the same way with the two tokens swapped. `test_put_lifecycle_delivers_the_underlying_for_the_strike` runs that path with a put on five NVDAx at a 150 strike, whose writer collects the five NVDAx at the end.

## The Writer Collects the Strike, and the Account Closes

Alice calls `collect_proceeds()`. The handler requires the option to be `Exercised` (`OptionNotExercised`) and the signer to be the writer, pays her the 900 USDC from the quote vault, reduces `quote_owed` by the same amount, and closes the option with its rent back to her.

![](figures/options-collect-proceeds.svg)

Alice sold her five NVDAx for 900 USDC and had already been paid 24.75 USDC for agreeing to. She holds 1,924.75 USDC, an effective $184.95 a share against the $200 they now trade at. The $15.05 a share she gave up is the writer's side of the $200 column in the payoff figure at the start of the chapter, 75 USDC, plus Maria's 0.25 fee: the premium was all she could make.

## A Put Writer Posts Cash, and the Option Expires Unexercised

Carol would like to own NVDAx at $150 and would like to be paid for standing ready to buy. She calls `write_option()` with kind `Put`, an underlying amount of 5 NVDAx, a strike amount of 750 USDC (150 USDC a share), a premium of 20 USDC, and an expiry a week out. A put writer's collateral is the strike amount, so 750 USDC leaves Carol's account for the quote vault, and `quote_owed` rises to match. Her 1,000 USDC is 250.

![](figures/options-write-put.svg)

Dave holds five NVDAx and wants insurance against a fall below $150 for the week. He calls `buy_option()`: 19.80 USDC to Carol, 0.20 USDC into the quote vault for Maria, and the option is `Held`. This is a **protective put**, the position a stockholder buys the way a homeowner buys fire insurance, and like fire insurance it is meant to expire unused.

![](figures/options-buy-put.svg)

The week passes with NVDAx above $150, and Dave does nothing: selling at 150 when the market pays more would be a gift to Carol. Once the expiry has passed, Carol calls `reclaim_collateral()`. The handler checks two things and then unwinds the option:

- The option must be `Held`, because an exercised option has no collateral left to reclaim (`OptionNotHeld`).
- The clock must be at or past `expiry` (`OptionNotExpired`).
- It returns her 750 USDC from the quote vault, reduces `quote_owed`, and closes the account.

![](figures/options-reclaim.svg)

Carol's return is the 19.80 USDC premium on a purchase that never happened. Dave's insurance cost him 20 USDC and paid nothing. `test_reclaim_collateral_after_expiry_returns_the_strike_to_the_put_writer` follows this path, from Dave's purchase to the reclaim, and checks that the 750 USDC and the option's rent come back to Carol.

Had NVDAx fallen below $150, Dave would have exercised instead: his 5 NVDAx into the underlying vault, the 750 USDC out to him, and the shares owed to Carol, who would have bought at $150 what the market then sold for less.

![](figures/options-put-exercised.svg)

## The Operator Collects the Fees

Maria calls `collect_fees()`. The handler pays her `fees_owed`, 0.45 USDC across the two sales, zeroes the counter, and refuses to run when there is nothing to collect (`NothingToCollect`). The vaults are empty: every token that entered has left to the party it was owed to.

![](figures/options-collect-fees.svg)

Here is where everyone ends up:

- Alice earned a premium and sold her shares at her price.
- Bob turned 25 USDC of premium into five NVDAx at $180 a share against a $200 market, a $75 gain after the premium.
- Carol was paid to wait for a purchase that never came.
- Dave bought insurance he did not need.
- Maria earned 1% of every premium.

## The Math: One Floor and One Comparison

The arithmetic lives in `contract_math.rs`:

- **Settlement.** `collateral_amount()` returns the underlying amount for a call and the strike amount for a put, and `exercise_payment()` returns the other.
- **The premium split.** `split_premium()` rounds the fee up, `premium` times `fee_bps` over 10,000, and gives the writer the rest. The venue keeps the rounding minor unit, so a writer gives up at most one minor unit per sale and a premium of one minor unit goes entirely to the venue.
- **The expiry.** `may_exercise()` is `now < expiry` and `may_reclaim()` is `now >= expiry`.

Every checked operation on a counter maps to `MathOverflow`; a vault balance that would go below zero maps to `CustodyInvariantViolated`.

## The Invariants: The Vaults Cover the Ledger, and Expiry Separates Exercise From Reclaim

- **Each vault covers what the market owes.** The underlying vault holds at least `underlying_owed`; the quote vault holds at least `quote_owed` plus `fees_owed`. Every handler that moves tokens updates the counters first and then calls `check_custody()` against the balances its transfers will leave behind, and fails with `CustodyInvariantViolated` if a refactor ever breaks the accounting. The tests strengthen it to equality after every step, because nothing in them donates to a vault.
- **At every instant, exactly one of `exercise_option()` and `reclaim_collateral()` accepts a held option.** The two comparisons are complements, so the deadline has the one boundary the *Time* chapter asks for, and both sides use it.
- **`cancel_option()`, `collect_proceeds()`, and `reclaim_collateral()` all close the account.** Each ends by closing the option account and returning its rent to the writer, so an option cannot be collected twice: the account is gone.
- **The admin reaches only the fees.** `collect_fees()` moves `fees_owed` and nothing else; no handler moves collateral or a strike payment to the admin under any parameters.
- **Physical settlement moves exactly the posted terms.** What the writer collects is what the holder paid, and what the holder receives is what the writer posted, to the minor unit, for every option the program would accept.

The companion repository's `kani-proofs` crate model-checks the custody ledger, the expiry partition, the admin's reach, and physical settlement; not the account closure. `proof_vault_ledger_stays_consistent_across_every_lifecycle` writes two options of either kind into shared vaults, ends each with a cancel, a reclaim, or an exercise and collection, and shows the ledger consistent after every step and both vaults empty at the end. `proof_exercise_and_reclaim_windows_partition_time` checks the expiry partition for every pair of timestamps. `proof_collect_fees_pays_only_the_fees_owed` checks the admin's reach for every ledger the program could hold: whatever is owed to writers and holders, and whatever surplus sits in the vault beside it, the handler pays the admin exactly `fees_owed` and leaves nothing for a second collection to pay. `proof_exercise_moves_exactly_the_posted_terms` checks physical settlement for every option the program would accept.

## The Failure Modes: What Can Go Wrong When Nothing Can Be Liquidated

- **The writer defaults.** This cannot happen. `write_option()` takes the entire obligation into the vault, and the only paths that return it are `cancel_option()` before anyone buys and `reclaim_collateral()` after the holder's window has closed. `test_cancel_is_refused_once_sold` and `test_reclaim_is_refused_before_expiry` check the two refusals that must hold while a holder could still exercise.
- **The clock.** Expiry is a Unix timestamp, and the network's clock can drift from wall-clock time by seconds. A holder who waits until the final second to exercise risks that drift putting the exercise after expiry, and the program cannot help them. The boundary itself is tested from both sides (`test_exercise_is_allowed_up_to_but_not_at_expiry`, `test_reclaim_is_refused_before_expiry`).
- **A writer blocks the exercise.** The strike goes into the vault, as the exercise section explains, so no account of the writer's is on the exercise path.
- **The wrong account carries the premium.** The buyer pays the writer directly, so the destination has to be bound to the writer or a buyer could name their own account and buy the option for free. The Anchor build derives it as the writer's associated token account, as the purchase step above shows; the Quasar build, whose token accounts are not associated token accounts, checks the account's owner and mint in the handler, and `buy_refuses_a_premium_account_the_writer_does_not_own` checks it.
- **What is absent.** Most of the usual attacks on a financial program do not apply here: the oracle and the liquidator went with the margin, there are no shares to inflate, and there is no rounding to drain, as the math section says. What is left is the custody ledger and the two comparisons against the clock, which is why both are model-checked as well as tested.

## Testing Considerations

The suite (`tests/test_options.rs`) follows the call from write to collected strike and from purchase to expiry and reclaim. It follows the put from write to exercise (`test_put_lifecycle_delivers_the_underlying_for_the_strike`) and from purchase to expiry and reclaim (`test_reclaim_collateral_after_expiry_returns_the_strike_to_the_put_writer`). Every balance is asserted to the minor unit, and the lifecycle tests call the custody check's equality form after every step. Around the happy paths there is one test per refusal, and each asserts the error code the refusal fails with, the program's own or Anchor's, rather than only that the transaction failed:

- The expiry boundary, from both sides.
- Cancel after a sale, and buy after a sale or after expiry.
- Exercise by anyone but the holder, and collection by anyone but the writer or before an exercise.
- Reclaim after an exercise, fee collection by anyone but the admin, and a second collection with nothing owed.
- The three zero terms, and a writer buying their own option.
- An expiry already past, and a venue opened with the same token on both sides or a fee of 100%.

When you build your own, copy the shape of the two boundary tests: a deadline needs one test one second inside it and one at it. A test that set the deadline to zero would have no second inside it to test from, so the suite could pass without ever showing that exercise works before expiry.

## What You Learnt from Building the Options Venue

An options exchange needs a clearing house standing behind every writer, a margin department watching every account, and a settlement desk on expiry day. In this program, making the writer post the whole obligation before they sell the right does all three jobs. The clearing house is the vault, the margin department has nothing to watch, and settlement is two token transfers the holder triggers.

The options venue added six concepts:

- **The option's terms.** A call or a put, a strike, an expiry, and a premium; a writer who keeps the premium and takes on an obligation, and a holder whose loss is capped at the premium.
- **Full collateralization removes margin, liquidation and the oracle.** A covered call and a cash-secured put cannot default; the *Perpetual Futures* chapter needs all three because it lets traders post less than they owe.
- **Physical settlement needs no price.** The holder's decision replaces the price feed, and the program's job is to enforce the terms, not to value them.
- **Store the amounts that change hands, not a price.** An option that records its underlying and strike amounts settles by moving them.
- **A ledger for mixed custody.** When one vault holds several parties' tokens, the state account counts what each is owed and every handler asserts the vault still covers it, after the math.
- **One deadline, compared both ways.** At every moment exactly one party can claim the collateral.

In the *Perpetual Futures* chapter we will relax the collateral rule. Traders post a fraction of their exposure, an oracle values the rest continuously, a haircut pays each winner only as far as the pool can back it, and a liquidator is paid to close what the fraction no longer covers.

[^psyoptions]: PsyOptions ran physically settled, fully collateralized options on Solana, with no oracle, and this chapter's venue follows its settlement design. It launched on mainnet on 22 August 2021 and was, by its own account, the first options program live there; see [x.com/PsyOptions/status/1436041089518030849](https://x.com/PsyOptions/status/1436041089518030849). PsyOptions represented each option series as a token, one mint per series; this program keeps one account per option instead, for a simpler custody ledger.

[^zeta]: Zeta Markets ran a margined, cash-settled options venue on Solana, later a perpetual futures one, and wound down on 1 May 2025 as its team moved to Bullet, a trading network of its own; see [x.com/ZetaMarkets/status/1908072806765735956](https://x.com/ZetaMarkets/status/1908072806765735956) and [docs.zeta.markets](https://docs.zeta.markets). The comparison is between two settlement designs, not two products: a cash-settled venue can offer leverage and needs a price feed to do it, and a physically settled one offers neither.
