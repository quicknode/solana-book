# Chapter 5: Time

Solana has two clocks, and they go wrong in opposite ways. Which one a program should reach for follows from which of the two errors is bigger for the job in front of it.

## The Slot Counter

The **slot** counts block opportunities. Programs read the current one from the **Clock sysvar**, a system account the runtime keeps fresh. Slots only go up, and nobody can rewind the count or jump it forward, which is what makes it safe to hang money on.

![The slot counter steps evenly and only forward; what a step is worth in milliseconds is a target rather than a promise.](figures/slot-counter.svg)

Counting slots is safe. Turning a slot count into seconds is not, and it goes wrong in three ways:

- **A step is not exactly the length the network intends.** The network sets a target in the range of hundreds of milliseconds, which no program can read, and real slots run a little longer or shorter.[^slot-time-live] A count of them is out by a share of itself, so the longer the span, the further out it is.
- **A leader can stretch its own slots, though it cannot shorten them.** Proof of history fixes the hashes in a tick, so nobody outruns it. What a leader can do is produce its slots slowly, or not at all, which makes those slots take longer in wall-clock time. That loosens a slot-counted window rather than tightening it, and the lever is one leader's turn wide, four slots, unless somebody holds a great deal of stake.
- **The count stops when the chain does.** No block is produced during a halt, so the count stands still while the world outside keeps moving. That pauses per-slot accrual, which is usually what you want, and it makes an hours-old price look one slot old, which never is.

## The Unix Timestamp

The **unix timestamp** comes from the same Clock sysvar, but it is wall-clock time reported by validators rather than a count the runtime guarantees. It is right to within a few seconds, and validators can nudge it.

![The wall clock, right to within a few seconds, and nudgeable by whoever reports it.](figures/unix-timestamp.svg)

Its error is the other shape: a few seconds, whatever the span, and seconds somebody chose. That is what makes a boundary sitting on a timestamp worth attacking. If an auction closes, an option expires, or a penalty starts on one, whoever moves the clock decides which side a transaction lands on.

## Pick the Clock Whose Error Is Smaller

Four questions, and a default if you answer no to all of them.

![Yes goes right to an answer, no goes down to the next question; four noes leave the slot count.](figures/clock-decision-tree.svg)

The third question asks what the seconds are worth. A price three seconds stale can be worth a liquidation to whoever kept it alive, so that boundary counts slots. A contribution three seconds late is worth one contribution, which a margin covers, so the fundraiser's week falls through to the fourth question.

The fourth question is the arithmetic. A few seconds stay a few seconds however long the span runs, while a percent or two of a slot count grows with it, until across a week it is hours. That is why the vault's annual fee accrues by timestamp while the lending market's interest, which decides who can be liquidated, does not.

## Interest and Funding Accrue by Slot

Two programs in this book accrue value over time, and both count it in slots:

- **The lending market accrues interest on debt.** It carries one number per reserve, a **borrow accumulation factor** that grows each time anyone touches the market:

  ```
  new factor = old factor × (1 + rate per slot × elapsed slots)
  ```

  Elapsed slots is the current slot minus the slot of the last refresh, which the reserve stores. Rather than recalculating every borrower's debt, the market stores each borrower's principal and updates the one shared factor, so a borrower's current debt is their principal multiplied by that factor. Its rates are quoted annually, so the conversion divides by the slots in a year, and the reserve stores that divisor as `slots_per_year` rather than working it out. The *Arithmetic of Money* chapter covers how to build that factor safely.
- **The perpetual futures venue accrues funding on open positions.** It does the same, storing `cumulative_funding` alongside `last_funding_slot`. Its funding rate is set per slot to begin with, so the slot time is what decides the cost of an hour.

Both accumulate, both advance by elapsed slots, and both decide what somebody owes, which decides whether a position can be liquidated. A few seconds at that line are worth money to whoever moves them, so the accrual counts slots. The slot count's own error, a percent or two across a year, is a calibration its owner retunes in config.

## How to Turn Time Into Slots

A freshness window is agreed in seconds, a borrower is quoted a rate per year, and each of those has to become a slot count before a program can use it. Divide the time by the length of a slot in milliseconds. Multiplying runs the same arithmetic backwards, for telling a person what a slot count or a per-slot rate comes to in their own units.

The length of a slot is a static value, usually in the range of hundreds of milliseconds. At the time this book was written, the network was part way through reducing it to 200 milliseconds.[^slot-simd]

How to get it:

- **From Anza's documentation, written into your program.**[^anza-docs] Good while no reduction is pending, and stale from the moment one activates. Keep any rate that depends on the slot length in config, where a transaction can change it, which the section on a shortened slot covers.
- **From the feature gates.** Each shortening of the slot ships as a feature, so a program can check which of them are live and take the shortest, falling back to 400 milliseconds when none are.[^check-slot-time]
- **From the network itself, in future.** While no account reports the slot time in milliseconds at the time of writing, this is expected to change.[^onchain-params] Check Anza's documentation and the companion repository before writing either technique above, in case that day has come.

Avoid the Solana SDK's `DEFAULT_MS_PER_SLOT` - this value is set when the SDK is compiled, so what was true on build day may not reflect the network a program is running on.

The gates give the length the network aims for, and the network can run slower than that. When slots take longer than the configured length, the difference is money. Interest that accrues per slot earns less over a real year than its annual rate implies, and a 150-slot freshness window covers more wall-clock time than it was sized for, so it accepts older prices.

To measure the average the network is actually delivering, take the seconds since `epoch_start_timestamp` in the Clock sysvar and divide by the slots since this epoch began, which `EpochSchedule` supplies. Guard that division: the divisor is zero on an epoch's first slot. That measurement reads the validator-reported clock, the one these accruals count slots to avoid, so keep it out of a handler.

> **One conversion covers one slot time.** Converting only works over a period where the slot time in milliseconds was constant. If the slot time changed during the period being measured, multiplying by the current figure understates the time that passed, since slots in the past were longer. Converting over a period where the slot time changed means splitting it at each change and converting each piece at the slot time the network used then. No further reductions are planned once the network reaches 200 milliseconds.

A program that needs a long span in wall-clock time should store a timestamp beside the slot and subtract, which is not a conversion at all.

## The Wall Clock Measures Human Time

The wall clock wins where its few seconds are small against the span being measured, and where no boundary in that span is worth a few seconds to anybody. The vault strategy uses it twice:

- **Its annual management fee accrues by timestamp**, because a few seconds of drift measured against a year is nothing.
- **It checks its price feed's age in seconds rather than slots.** A **price feed** is an account that some publisher keeps updated with a price and the time they published it. This one publishes a wall-clock time, so the comparison has to be made in the unit the number arrived in.

When the deadline is one you promised a person, use timestamps, and leave a margin so a few seconds cannot change who gets paid. A contributor told they have a week to fund is owed seven days of wall-clock time. A week counted in slots is out by hours, which breaks that promise, while a week of wall clock is out by seconds, which the margin covers.

## Who Fills First Is a Counter, Not a Clock

The order book exchange uses neither clock for the thing traders care most about: who queued first. Each resting order takes the next number from a counter the market keeps, and matching compares those numbers. The order also records a `timestamp`, but this is only kept so offchain tooling can show an age. A number that decides who fills first is not a number to let anyone influence.

## Every Consumer Sets Its Own Freshness Window

A program reading a price has two questions to answer:

- Whether the source can be trusted.
- Whether the price is recent enough.

The *Offchain Truth* chapter answers the first, along with everything else a program checks about a price before acting on it. This chapter answers the second. Four of this book's programs answer it differently:

| Program | Refuses a price older than | Measured in |
| --- | --- | --- |
| the lending market | 25 slots | slots |
| the prop AMM | 150 slots | slots |
| the perpetual futures venue | 150 slots | slots |
| the vault strategy | 60 seconds | seconds |

Need a price fresh to within two seconds? Turn that into a slot count once, and check every price against that number of slots. Nobody can move that boundary, and the check needs no conversion. Three of the four count slots, because a window this short is exactly where a few seconds of clock would be most of the margin. The vault counts seconds because that is the unit its feed publishes, and a program cannot compare someone else's seconds against its own slots without assuming a slot length. What the three slot counts come to in seconds depends on that length, so a window sized once in slots covers less wall-clock time if the slot is ever shortened.

## Integer Day Counts Have a Boundary, and Both Sides Must Use It

A clock gives a program seconds, so counting days means dividing by 86,400. That division is integer division, which throws the remainder away: six and a half days counts as six, and anything short of a full day counts as none of it. The token fundraiser stores `time_started` and a duration in days, and both of its later handlers reconstruct elapsed days the same way:

```
elapsed days = (now − time_started) / 86,400
```

Both handlers compare that one count against the same duration:

- `contribute()` requires it to be *less than* the duration.
- `refund()` requires it to be *at least* the duration.

One expression, compared both ways, so there is no gap and no overlap between "you may still contribute" and "you may now refund". At the moment the count reaches the duration, contributions turn off and refunds turn on, by arithmetic rather than by a second stored flag anybody has to keep in step.

The trap is what "seven days" then means: the window ends at the first tick of day seven, not at the end of the seventh day.

![One expression decides both windows, so they meet at an instant with no gap and no overlap.](figures/day-boundary.svg)

Say which edge you mean when you write the terms down. A contributor reads "seven days to fund" as a window closing at the end of the seventh day, and this one closes at its start, a full day earlier than they think. Either edge is defensible; only one is what your users were told.

## Slots Stop When the Chain Stops, and the Wall Clock Does Not

Both clocks arrive in the same sysvar, so it is easy to assume they always move together. They come apart when the chain stops.

Solana would rather stop than be wrong. When validators cannot agree which block is real, block production halts instead of continuing down two conflicting histories, and the network sits still until enough of the stake agrees where to resume. That is the trade financial software wants, because a chain that kept producing blocks through a disagreement could settle the same balance twice.

A halt is a rare event: at the time of writing, block production has not stopped for years. Write for the one you will probably never see.

No block is produced during a halt, so the slot count does not move. Wall-clock time does. The first block after a restart carries a slot roughly where the last one left off and a timestamp hours later. Three consequences:

- **Per-slot accrual pauses with the chain.** The lending market's factor advances by elapsed slots, so a nine-hour halt accrues no interest: nobody is charged for a market they could not reach. A fee accruing by timestamp charges the full nine hours.
- **A window counted in seconds refuses the old price. One counted in slots accepts it, which is the dangerous half.** The vault strategy refuses a price older than sixty seconds, so its first call after a halt fails until a publisher posts again. The lending market's 25-slot window sees a price stamped one slot ago and, on the slot count alone, would accept a number nine hours old. A price stamped one slot ago is not always a price from a fraction of a second ago. This bites hardest on the perpetual futures venue, where leverage multiplies a bad price across every open position.
- **A deadline can pass with nobody able to act on it.** The fundraiser's day count runs through a halt like any other nine hours, so a contributor with an hour left finds the window shut when the chain returns. That program survives it because its refund path has no deadline; a design whose only exit was a narrow window would have stranded them.

A slot-counted window needs one more check. The `LastRestartSlot` sysvar[^last-restart-slot] carries the slot of the most recent cluster restart, or zero if there has never been one, and a price from before that restart is stale however few slots have passed since. The lending market, the prop AMM, and the perpetual futures venue all make this check in their oracle readers: any price stamped at or before the restart slot is rejected with `PricePredatesRestart`, and the market pauses valuation until the publisher posts again. Make it in any program whose freshness window is counted in slots.

The order book comes through a halt untouched, because it reads neither clock: queue positions resume exactly as they were.

## A Shorter Slot Tightens Every Window and Speeds Up Every Rate

The network has shortened the slot before, and a further staged reduction is published.[^slot-times] This is a rare event rather than a drift: the number holds for years, then moves once. It is still worth writing for. A program that planned for it keeps charging what its owner intended; one that did not needs a redeploy.

A shorter slot pulls the two uses of a slot count in opposite directions:

- **A freshness window sized in slots gets stricter.** A 150-slot window covers less wall-clock time than it did, so it refuses prices it used to accept. That costs availability and never safety, and it announces itself the first time a price is refused.
- **A rate expressed per slot accrues faster, and that one is silent.** An annual rate divided by a fixed slots-per-year number has a slot duration baked into it, so halving the slot doubles what a borrower pays in a day while every line of the program stays as it was.

The defense is the same for both: keep the number where a transaction can reach it. The lending market holds its divisor as `slots_per_year`, a config value its owner can retune for exactly this reason. The perpetual futures venue's `set_funding_rate()` does the same job for a per-slot rate, advancing the index at the old rate before storing the new one, so the slots already elapsed are charged at the rate that applied to them. A change to the slot time is then an afternoon's configuration rather than a release.

## What the Programs in This Book Chose

Every program in Part II that touches time, and the clock it settled on.

| Program | What it times | Its answer | Why |
| --- | --- | --- | --- |
| token fundraiser | its funding deadline | whole days from one stored timestamp | a week of slots is hours out |
| lending market | interest accrual, and price freshness | slots for both | seconds at the liquidation line are worth money |
| perpetual futures | funding accrual, and price freshness | slots for both | the same, and leverage multiplies it |
| prop AMM | price freshness | slots | a stale price is the attack |
| vault strategy | an annual fee, and price freshness | timestamps for both | seconds against a year are nothing, and the feed stamps seconds |
| order book | who queued first | a sequence number, neither clock | neither clock is fine enough to order by |

## What You Learnt

- Solana has two clocks, and they go wrong in opposite ways. The **unix timestamp** validators report is out by a few seconds however long the span, and by seconds somebody chose. Nobody bends the **slot** count, but it is out by a share of the span, because a slot is only roughly as long as the network intends.
- Compare those two errors against the span in front of you. Short spans and tight boundaries take slots, and days or years take the wall clock with a margin. Order of arrival takes a counter of your own, and the age of a published number takes whatever unit its publisher stamped.
- To accrue interest or funding without touching every account, store each account's principal and one shared **accumulation factor** that advances by elapsed slots. A current balance is the principal multiplied by the factor.
- A price needs a freshness window, each consumer sets its own, and the unit follows the source: slots where the program chooses, seconds where the feed published seconds.
- A slot count converts to wall-clock time only at the slot length in force, and only across a span where that length held, and nothing onchain reports it today. Read it from the slot-time feature gates or measure it against the epoch, and better still hold it as a figure you can update without a redeploy. Anza's documentation carries the current figure, and the companion repository the current way to get it.
- A shortened slot is rare and arrives all at once: every slot-counted window tightens, and every per-slot rate accrues faster without saying so. Keep both where a transaction can retune them.
- A deadline counted in whole days floors, so both sides of it must be computed from the same expression, and the window ends at the first tick of the last day. Say which edge you meant when you write the terms down.
- Where a clock would decide something valuable and neither clock is safe enough, count instead: the order book settles who queued first with a sequence number, and keeps its timestamp for display only.
- Solana halts rather than run two conflicting histories. During a halt slots pause and wall-clock time keeps running, so per-slot accrual stops, deadlines expire with nobody able to act on them, and a price that is hours old still looks one slot old.
- Pair every slot-counted freshness window with a `LastRestartSlot` check, which rejects any price stamped at or before the last restart.

[^slot-times]: The stages, and how far each one has got, are published at [solana.com/upgrades/reduced-slot-times](https://solana.com/upgrades/reduced-slot-times).

[^anza-docs]: Anza maintains the validator client and its documentation, at [docs.anza.xyz](https://docs.anza.xyz).

[^onchain-params]: "Longer term, we will put these parameters onchain so they are client queryable." Brennan Watt of Anza, at [x.com/bw_solana/status/2089740425695535300](https://x.com/bw_solana/status/2089740425695535300).

[^check-slot-time]: Dean Little's `check_slot_time.rs`, at [gist.github.com/deanmlittle/90901c2fdc9f73fe0fcefb0959109825](https://gist.github.com/deanmlittle/90901c2fdc9f73fe0fcefb0959109825).

[^slot-simd]: [SIMD-0525](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0525-reduce-slot-times.md).

[^slot-time-live]: Solana's slot time tracker at [solana.com/200ms](https://solana.com/200ms). In late August 2026 it read about 360 milliseconds against a 350 millisecond target.

[^last-restart-slot]: One of the sysvars listed in Anza's runtime documentation, at [docs.anza.xyz/runtime/sysvars](https://docs.anza.xyz/runtime/sysvars).
