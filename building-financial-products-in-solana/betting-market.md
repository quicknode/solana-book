# Chapter 13: The Betting Market

What is going to be the top-grossing film this month? You have an opinion, and so does everyone else. There are two main ways to let everyone put money on it:

- **With a bookmaker.** The house quotes odds, locks them in when each bet is placed, and takes the other side of every bet, so it carries the risk of paying winners more than the losers staked. This is fixed-odds betting, the model of a high-street betting shop or a sportsbook.
- **Without a bookmaker.** Bettors are matched against each other, and the house takes a fee instead of a position. **Parimutuel** betting, also called pool betting or, in Britain and the Commonwealth, the tote, was devised in 1867 by Joseph Oller, who ran a horse-race betting office in Paris. It reached Churchill Downs in Kentucky by 1878 and spread to racetracks around the world. France's law of 2 June 1891 banned bookmakers there and left authorized parimutuel pools as the only legal way to bet on horses. Prediction markets such as Polymarket and Kalshi use a similar system: there is no bookmaker, and bettors bet against each other.

This chapter builds a parimutuel market. The program lives at `finance/betting-market` in the companion repository. Structurally it is the *Escrow* chapter with many parties and one new, serious question: who decides what happened in the real world?

## Nobody Sets the Odds: The Pool Is the Odds

In a parimutuel market, all stakes on all outcomes go into one vault, and when the event settles, the losing side's stakes (minus the house fee) are distributed to the winning side, based on the size of each winner's stake. Your payout odds are the ratio between the pools when betting closes, not the odds showing when you placed your bet, which means the odds float as people bet, and betting heavily on a favorite compresses everyone's payout.

**Parimutuel winnings are proportional to stake.** Bet three times as much as the next winner and you win three times as much of the losing pool.

![](figures/betting-parimutuel-pools.svg)

## The Operator Creates the Market

Maria is the admin. Her public key is recorded in the program's config, and only she can create events, add outcomes, open betting, settle, and cancel; her revenue is a 2% fee, charged only on the losing pool. She runs `initialize_config()` once, naming herself admin, USDC as the token, herself as fee recipient, and 200 basis points (2%) as the fee. For this month's market she runs `initialize_event()` with a description ("top-grossing film this month") and a `betting_closes_at` of midnight on the last day of the month. A close time already in the past fails with `CloseTimeInPast`. The event starts as a Draft, and Maria calls `add_outcome()` twice: "Glowbugs 3" and "The Quiet Floor". Then she calls `open_betting()`, which moves the event to Open. The first signer of `initialize_config()` becomes the admin. Every handler after it checks the signer against that address and rejects anyone else with `Unauthorized`; `test_only_admin_can_initialize_event` and the last step of `test_open_betting_needs_two_outcomes` check it.

![](figures/betting-maria-setup.svg)

Those five transactions created the five accounts the market needs.

The **config** is a single account at a PDA (seed `"config"`), created once by `initialize_config()`, holding the `admin`, the `token_mint` bets are denominated in, the `fee_recipient`, the `default_fee_bps` each new event copies at creation, and a running `event_count`. The fee is capped at 10,000 basis points, because a fee above 100% is nonsense.

The **event** is an account at a PDA (seeds: `"event"`, the event ID) with a description, a status (Draft, Open, Settled, or Cancelled), the `betting_closes_at` time when betting stops, and the running `total_pool`. After settlement it also holds the `winning_outcome_index`, `winning_pool`, and `distributable_losing_pool`. Two design details:

- **Each event keeps the terms it was created with.** `initialize_event()` copies the config's `default_fee_bps` into the event's own `fee_bps` and sets `betting_closes_at` once, and settlement reads the event's copy, never the config.
- **The vault is one token account for the whole event**, an associated token account whose authority is the event PDA. Stakes on every outcome mix in one vault; the accounting that keeps them straight lives in the data accounts, not in separate pots.

Each **outcome** is an account at a PDA (seeds: `"outcome"`, the event, an index byte) holding its label, its `total_amount` staked, and its `bet_count`.

One rule protects the bettors: **the outcome list is fixed before any stake can arrive**. `add_outcome()` works only on a Draft and fails with `EventNotDraft` once the event is Open. `place_bet()` on a Draft fails with `EventNotOpen`, so nobody can bet while the list is still changing. `open_betting()` refuses a market with fewer than two outcomes (`NotEnoughOutcomes`), because a single outcome has no losing side to pay its winners from. The tests `test_outcomes_lock_when_betting_opens` and `test_open_betting_needs_two_outcomes` check all three rules.

A simpler but naive design would lock the list at the first bet, by refusing `add_outcome()` once the pool holds any stakes. That would let anyone freeze a half-built market with a one-minor-unit bet on its only outcome. It would also let Maria's last `add_outcome()` and the first bet land in either order, so the first bettor could stake on a list with an outcome their screen never showed. An explicit status that only Maria can change has neither problem; the *State Machines* chapter gives the general rule.

## Bettors Stake on Their Chosen Outcomes

Three bettors take a view, each from the standard wallet of one SOL and 1,000 USDC, and all in USDC, the token the config designates. Alice is confident about school holidays and puts $300 on Glowbugs 3. Bob agrees but has less to spend: $100 on Glowbugs 3. Carol believes in word of mouth and puts $200 on The Quiet Floor.

Each bettor calls `place_bet()` with an amount, any time before the close. Zero-amount bets reject with `ZeroAmount`, and a bet once the clock reaches `betting_closes_at` rejects with `BettingClosed`. A first bet on an outcome creates the bet account before the handler runs (the account is created if it does not exist). The handler moves the stake immediately from the bettor's token account into the event's vault (the bettor signs this transfer directly; no PDA signature is needed on the way in). It then fills in a fresh account's fields and increases the outcome's `total_amount` and the event's `total_pool`. A fresh bet account has amount zero, which is how the handler tells a first bet from a top-up: only a first bet adds one to the outcome's `bet_count`.

After all three bets, the vault holds 600 USDC: 400 staked on Glowbugs 3, 200 on The Quiet Floor.

![](figures/betting-place-bets.svg)

A bettor's first bet on an outcome also created an account for them. Each **bet** is an account at a PDA (seeds: `"bet"`, the outcome, the bettor), holding the bettor, the outcome index, and the amount. One bet account per bettor per outcome: betting again on the same outcome tops up the existing account rather than creating a second one. The bettor's address is the first field after the account's discriminator, so a wallet app lists someone's open bets by asking an RPC node for every bet account with their address at that offset (`getProgramAccounts` with a `memcmp` filter). The program keeps no list of a wallet's bets, so it sets no limit on how many a wallet holds open at once (checked by `test_no_cap_on_open_bets_per_wallet`).

## The Film Grosses: The Operator Settles the Event

The month ends, and betting closes at midnight. In the real world, Glowbugs 3 wins. In program terms, the fact that decides where 600 USDC goes exists entirely offchain. This program resolves it by having a designated trusted party sign. Maria calls `settle_event()` with the winning outcome's index, her signature is checked against the config's admin, and her answer is written to the event account as `winning_outcome_index`. The *Offchain Truth* chapter covers the full spectrum, from a single admin signer like this one, through multi-party resolution, to signed price feeds. This program makes the trusted party explicit and limits what their signature can do. Maria can pick which outcome won, but she cannot touch the payout math, take more than the snapshotted fee, or reach into the vault by any other path.

`settle_event()` works only once the clock reaches `betting_closes_at`, and earlier fails with `BettingStillOpen`. The two windows split time exactly: a bet needs the clock before the close, and settlement needs it at or after. So no bet can land once the event can be settled, and Maria cannot end the market early (checked by `test_betting_closes_at_close_time`).

Settlement does four things, none of which involve paying bettors yet:

- Marks the event Settled, so `place_bet()` now rejects with `EventNotOpen` (checked by `test_cannot_bet_after_settle`).
- Validates the winner structurally: the winning outcome account is re-derived from the index via its PDA seeds, and an outcome nobody bet on rejects with `OutcomeHasNoBets`, because a winning pool of zero would put a divide-by-zero in every claim (checked by `test_settle_outcome_without_bets_fails`).
- Does the fee math. The losing pool is `total_pool` minus the winning outcome's total: 600 − 400 = 200 USDC. The fee is 2% of the *losing pool only*: 4 USDC, computed in u128 and floored. The remaining 196 becomes the `distributable_losing_pool`, stored on the event. Charging the fee only on the losing side gives one guarantee: **a winner can never receive less than they staked**.
- Transfers the 4 USDC fee out of the vault to the fee recipient's token account, signed by the event PDA.

![](figures/betting-settlement.svg)

## Winners Claim: Winnings Are Proportional to Stake

Winners come and claim their payouts whenever they like; nothing pays out automatically. Alice calls `claim_winnings()`. Her payout is her stake back plus her share of the distributable losing pool, in proportion to her stake:

payout = stake + floor(stake × distributable_losing_pool ÷ winning_pool)

For Alice: 300 + floor(300 × 196 ÷ 400) = 300 + 147 = **447 USDC**. For Bob: 100 + 49 = **149 USDC**. Alice staked three times what Bob staked and won exactly three times the winnings. Carol staked 200 and receives nothing; had The Quiet Floor won, she alone would have taken the entire 400-dollar losing side, minus the fee.

None of these payouts depended on when anyone bet. Had Alice bet first, when Glowbugs 3 held only her stake, or last, after Bob, she would still receive 447 USDC, because the payout reads the pools at the close. A racetrack's tote board works the same way: the odds it shows keep moving until the race starts, and every winning ticket is paid at the final odds.

The multiply runs in u128 and divides exactly once, after the multiplication, so the result is floored a single time; dividing first would throw away precision on every claim. The floor means the payouts can fall a few minor units short of the distributable pool; that dust stays in the vault, and no claimant receives it.

The claim closes the bet account, refunding its rent to the bettor. **A closed account stops a double claim**: Alice claiming twice fails because the bet account the second claim needs is already gone (checked by `test_double_claim_fails`), and there is no `claimed` flag to forget to check.

![](figures/betting-alice-claim.svg)

## Closing Out, and Getting Assets Out of Every State

Carol's losing bet pays nothing, but its account still holds her rent. She calls `close_losing_bet()`, which checks the event is settled and her outcome is not the winner (a winner trying to use this path for losing bets rejects with `BetWon` and must use `claim_winnings()`), then closes the account and returns the rent to her. Both rules are checked by `test_close_losing_bet_only_after_settle_and_only_for_losers`.

An Open event can also be voided: if the studio pulls both films from release, there is no result to settle. `cancel_event()`, admin-only, flips the status to Cancelled, and every bettor reclaims their exact stake through `claim_refund()`, no fee taken, using the same close-the-account-to-prevent-double-claims mechanic (checked by `test_cancel_and_refund`). `cancel_event()` works on a Draft too, which is how Maria abandons a market she set up wrong before anyone has staked on it. Settled and Cancelled are the two ways an Open event ends, and in both every bet account has a handler that pays it out or closes it.

![](figures/betting-state-machine.svg)

## The Math: One Division, Floored Once, Fee Off the Losers

The financial arithmetic of this program is four expressions:

- **The losing pool**: a subtraction.
- **The fee**: a u128 multiply, floor-divided by 10,000 basis points.
- **Each winner's share**: a u128 multiply of stake by distributable pool, then one floor division by the winning pool.
- **The payout**: stake plus share, checked.

Every checked operation maps to `MathOverflow`. There are no rates and no curves, and time appears only as one comparison against the close.

## The Invariants: The Vault Covers Every Claim

- At every moment, the vault balance equals stakes not yet claimed: before settlement, the total pool; after settlement, winning stakes plus unclaimed winnings plus dust.
- The winning pool, the distributable losing pool, and the fee always sum exactly to the pre-settlement total pool: 400 + 196 + 4 = 600.
- A winner's payout is never less than their stake.
- One bet account per bettor per outcome, and no bet account survives its payout, refund, or close.
- The outcome list never changes once the event is Open, and no stake enters the pool at or after `betting_closes_at`.
- Only the admin's signature can settle or cancel, and only the payout formula decides amounts.

## The Failure Modes: The Oracle Is a Person, and Everything Downstream of That

- **The resolution itself.** Maria could settle the wrong outcome, maliciously or by mistake, and the decision is hers alone. This program is deliberately the simplest case; the *Offchain Truth* chapter covers what it costs a trusted party to lie, and how to replace a single signer with several.
- **Settling an empty outcome** would divide by zero in every claim; rejected at the source with `OutcomeHasNoBets`.
- **Double claims** fail because the bet account is gone, as the claim step showed.
- **Changing the terms after betting opens** is impossible: the outcome list, the fee, and the close time are all fixed before the first bet can land.
- **Betting on a known result**: a bettor who learns the result before Maria settles cannot stake on it, because `place_bet()` stops at `betting_closes_at` with `BettingClosed`. The program cannot tell when the result becomes public, so choosing a close time before that moment is Maria's job.
- **Betting after settlement or cancellation** rejects with `EventNotOpen`, whether the event was settled or canceled.

## Testing Considerations

The suite builds all state through the program's own handlers, and its centerpiece is `test_full_lifecycle`, config through claims. It uses the same pools as the story above (400 on the winner, 200 on the loser, a 4 USDC fee) and asserts balances after the bets, the settlement, and the claims. Around it, one test per failure mode: the admin-only handlers, the outcome list locking when betting opens, the two-outcome minimum, both edges of the close time, a close time in the past, bet-after-settle, double claims, empty-outcome settlement, and cancel-and-refund. `test_close_losing_bet_only_after_settle_and_only_for_losers` checks that `close_losing_bet()` works only on a settled event and only for a bet that lost. When you write your own market, copy the shape: the happy path checks the math, and every adversarial code path gets a test whose name says what it refuses to allow.

## What You Learnt from Building the Betting Market

A racetrack's parimutuel pool needs a tote board, a licensed operator, and a payout window. Here a vault and four expressions of arithmetic do those jobs: the pool is the odds, the program carries no risk, and the house takes a fee only from the losers.

This chapter added five concepts:

- **The parimutuel structure.** All stakes pool together; winners split the losing pool in proportion to their stakes, so a larger stake wins more and no one sets odds.
- **A designated signer decides the result.** The operator acts as the oracle, and the program's job is making that trust visible and narrow: their signature picks the winner and does nothing else.
- **Terms locked before bettors commit stakes.** The outcome list, the fee, and the close time are all fixed before the first stake lands, so the question bettors staked on cannot be rewritten.
- **Account closure as the double-claim defense.** A paid-out bet has no account left to claim with.
- **Cancellation refunds every stake.** Draft and Open events can be canceled, and stakes in a canceled event are refunded in full, so a voided event strands nobody's stake.

In the *Order Book Exchange* chapter we will build an exchange. Instead of paying into one pool, traders post orders at the prices they want, backed by tokens moved into a vault when the order is placed, and the program matches each new order against the best resting one. You will see how orders are stored, matched, and paid out onchain, where every step costs compute. The pooled payout formula and the trusted signer both return later, in the *Lending and Borrowing* and *Perpetual Futures* chapters, where the trusted signature is a price feed and settlement runs continuously instead of once.
