# Chapter 5: Time

A Solana program has three ways to observe the passage of time:

- **The Unix timestamp** is wall-clock time, usually within a second or two of the real time.
- **The slot** is a count that goes up by one for each slot the network runs, roughly every 200 milliseconds, and never goes down.[^forks]
- **A counter** is something a program can implement: a number stored in one of its own accounts that goes up by one each time something happens, such as an order arriving. It says which of two events came first, but not how far apart they were.

The runtime supplies the first two. A program implements the third itself.

Which one to use depends on the job. A week promised to a contributor runs on the wall clock. A price freshness window counts whatever unit the price feed stamped, slots for three of this book's price feeds. Which order came first uses a counter.

## Leaders Take Turns Producing Blocks

A Solana cluster runs on **validators**: physical computers that each hold a copy of every account and run every transaction. Time on the network is divided into short windows called **slots**, and for each slot one validator is the **leader**. Leaders take **turns** of four slots in a row, assigned in advance in proportion to each validator's stake. The leader gathers transactions into a **block** and sends that block to the other validators, and each block builds on the one before it, its **parent**.

When a leader's block does not arrive in time, the others vote to skip that slot and the rest of that leader's turn, and those slots pass with no block.[^skip-turn] The next block names the last block that did arrive as its parent.

![](figures/leader-turns.svg)

## The Unix Timestamp

Programs read the **Unix timestamp** from the **Clock sysvar**, a system account the runtime keeps fresh. It is a time a leader reports, within a range the network enforces: a block whose time goes backwards, or runs more than two slot lengths ahead for each slot since its parent block, is rejected.[^alpenglow-clock] Each leader writes its own clock's time into the end of its block, and the transactions in the next block read that value. The value stays the same for the whole slot, so every transaction in a block sees one timestamp. The timestamp is usually within a second or two of real time. It counts whole seconds, and it was written one block earlier.

![](figures/unix-timestamp.svg)

At 200-millisecond slots, a block one slot after its parent can carry a time up to 400 milliseconds past the parent's. Real time moves about 200 milliseconds a slot, so a leader can push the timestamp ahead of real time, or hold it behind, by up to about 200 milliseconds for each slot it leads. The next leader that writes its own clock's time brings the timestamp back toward real time, so the error does not build up over a long span. Put a boundary on a timestamp and somebody can profit by moving it. If an auction close, an option expiry, or the start of a penalty sits on a timestamp, the leader of the slots around that boundary decides which side of it a transaction lands on. The leader writes the time its own next block reads, and chooses which transactions go in each block, so for most of its turn it controls both. Only the first block of a turn reads a time written by the previous leader. Handle this with a margin: close betting well before the result can be known, exercise an option before its last seconds, and set any deadline so a few seconds cannot change who gets paid.

## The Slot Counter

The slot count is how many slots have gone by. Programs read it from the same Clock sysvar as the timestamp. Slots only go up, and nobody can rewind the count or jump it forward.

![](figures/slot-counter.svg)

Two things affect how much wall-clock time a number of slots adds up to, and anyone converting between the two should know both:

- **Each slot usually runs slightly longer than the network intends.** The network sets a target, 200 milliseconds, and real slots mostly run a little over it.[^slot-time-live] A slot runs long when its leader was slow, or when the network waited out a timeout for a block that never came. A slot is a turn, not a tick of a clock: the next one starts when the last one ends, so every delay carries forward and nothing pulls the count back to real time. That extra time adds up but does not compound, because in normal running slots do not get slower as they go, and each adds only its own delay. Three slots at 219 milliseconds take 657 milliseconds, 57 more than the 600 they were sized for. So a slot-counted window covers more wall-clock time than it was sized for, which loosens it rather than tightening it.
- **The count stops when the chain does.** No block is produced during a halt, so the count stands still while real time moves on. The section on halts below covers what that does.

Slots are grouped into **epochs** of 432,000 slots, which is exactly a day at 200 milliseconds a slot, and about two hours longer if slots actually average 219 milliseconds. Some changes to the network, a new slot length among them, take effect only when a new epoch begins.

## Which Clock for Which Job

![](figures/clock-decision-tree.svg)

The decision tree's last question draws its line at 20 seconds because that is where a slot count's error grows as large as the timestamp's error:

- **The timestamp's error stays under a second or two, however long the span.** One leader can move it up to 800 milliseconds in its turn, and it counts only whole seconds. Outside a halt, nothing makes that error grow.
- **A slot count's error grows with the span.** With slots running about 10% long, a count sized at 200 milliseconds runs about 2 seconds over across 20 seconds, and about 16 hours over across a week.

So for a boundary days away, such as a fundraiser's deadline, the timestamp is the right clock, and a margin covers its few seconds.

The table at the end of this chapter shows where each program in this book lands.

## Interest and Funding Accrue by the Wall Clock

Three programs in this book accrue value over time, and all count it in seconds:

- **The lending market accrues interest on debt.** It carries one number per reserve, a **borrow accumulation factor**, and advances it by the Clock's current timestamp minus the one the reserve stored at its last accrual, `last_accrual_timestamp`; the *Lending and Borrowing* chapter builds the factor. Its rates are quoted annually, so the conversion divides by the seconds in a year.
- **The perpetual futures venue accrues funding on open positions.** It does the same, storing `cumulative_funding` alongside `last_funding_timestamp`, at a rate per second fixed when the pool is created.
- **The managed fund accrues its annual management fee.** It counts the seconds since `last_fee_accrual_timestamp` in the same way, and its `collect_fees()` refuses a timestamp at or before the stored one with `NoTimeElapsed`.

All three advance by elapsed time, and interest and funding decide what somebody owes, which decides whether a position can be liquidated. A leader can move the timestamp by less than a second in its turn, and at a 20% annual rate even two seconds of interest is about one hundred-millionth of the debt. A position that close to the liquidation line crosses it anyway if the leader waits two seconds, so moving the clock gains the leader nothing.

Counting slots instead would have no advantage here, and would be inaccurate: a rate quoted per year becomes a rate per slot only through the slot length, which the network changes and does not deliver exactly. If slots run about 10% long, a year holds that many fewer of them, so a market that assumes 200 milliseconds charges a borrower quoted 20% a year about 18.3%. That is nearly a tenth of all the interest, against the hundred-millionth a leader can move by shifting the timestamp.

The lending market and the perpetual futures venue treat a timestamp at or before the stored one as no time passed, and leave the stored one where it is. The network already rejects a block whose time goes backwards, so no second is ever charged twice.

## How to Turn Time Into Slots

A freshness window is agreed in seconds, and it has to become a slot count before a program can use it. Divide the time by the length of a slot in milliseconds. Multiplying runs the same arithmetic backwards, for telling a person what a slot count comes to in their own units.

The network's target slot length is 200 milliseconds.[^slot-simd]

A program can get that length three ways:

- **From Anza's documentation, written into your program.**[^anza-docs] This is correct until the network next shortens the slot, and wrong from then on, which the section on a shortened slot covers.
- **From the feature gates.** Changes to the network ship as **features**, built into the validator software, switched off, and turned on across the network at the start of an epoch. Each shortening of the slot ships as one, so a program can check which of them are live and take the shortest, falling back to 400 milliseconds when none are.[^check-slot-time] A new slot time applies from the start of the epoch after its feature gate activates, not from the moment it does, so check the epoch as well as the feature gate.
- **From the network itself, in future.** While no account reports the slot time in milliseconds at the time of writing, this is expected to change.[^onchain-params] Check Anza's documentation and the companion repository before writing either technique above, in case such an account now exists.

Avoid the Solana SDK's `DEFAULT_MS_PER_SLOT` - this value is set when the SDK is compiled, so what was true on build day may not reflect the network a program is running on.

To measure the average the network is actually delivering, take the seconds since `epoch_start_timestamp` in the Clock sysvar and divide by the slots since this epoch began, which `EpochSchedule` supplies. Check the divisor before that division: it is zero on an epoch's first slot. That measurement comes from the leader-written timestamp, so it belongs in offchain tooling, not in a handler. A handler that needs wall-clock time should read the timestamp itself, as the lending market's interest does. Multiplying a slot count by a measured slot length carries the timestamp's error and adds the slot count's.


## Who Fills First Is a Counter, Not a Clock

The order book exchange uses neither clock for the thing traders care most about: which order came first. Each resting order takes the next number from a counter the market keeps, and matching compares those numbers. The order also records a `timestamp`, but this is only kept so offchain tooling can show an age. Two orders can arrive in the same slot and carry the same timestamp. The market's counter still gives them different numbers. A leader can move the timestamp slightly, but has no way to change the numbers the counter hands out.

## Every Consumer Sets Its Own Freshness Window

A program reading a price has two questions to answer:

- Whether the source can be trusted.
- Whether the price is recent enough.

A **price feed** is an account that some publisher keeps updated with a price and the time they published it. The *Offchain Truth* chapter answers the first question, along with everything else a program checks about a price before acting on it. This chapter answers the second. Four of this book's programs answer it:

| Program | Refuses a price older than | Measured in |
| --- | --- | --- |
| the lending market | 25 slots | slots |
| the prop AMM | 150 slots | slots |
| the perpetual futures venue | 150 slots | slots |
| the managed fund | 60 seconds | seconds |

A window counted in slots is set once, and every price is checked against that number of slots. Nobody can move that boundary, and the check needs no conversion. Three of the four count slots because their price feeds stamp each update with the slot it landed in, so a price's age is already a slot count. The managed fund counts seconds because that is the unit its price feed publishes, and a program cannot compare someone else's seconds against its own slots without assuming a slot length.

## Integer Day Counts Have a Boundary, and Both Sides Must Use It

A clock gives a program seconds, so counting days means dividing by 86,400. That division is integer division, which throws the remainder away: six and a half days counts as six, and anything short of a full day counts as none of it. The fundraiser stores `time_started` and a duration in days, and three of its later handlers reconstruct elapsed days the same way:

```
elapsed days = (now − time_started) / 86,400
```

All three handlers compare that one count against the same duration:

- `contribute()` requires it to be *less than* the duration.
- `refund()` and `close_fundraiser()` require it to be *at least* the duration.

Because every handler compares the same expression, there is no gap and no overlap between "you may still contribute" and "you may now refund". At the moment the count reaches the duration, `contribute()` starts failing with `FundraiserEnded` and `refund()` stops failing with `FundraiserNotEnded`, with no second stored flag that has to be kept in step with the count.

The trap is what "seven days" means to the people using it.

![](figures/day-boundary.svg)

Say which edge you mean when you write the terms down. A contributor reads "seven days to fund" as a window closing at midnight at the end of the seventh day, and this one closes at whatever time of day it opened: a fundraiser opened at noon closes twelve hours after that midnight. Either edge works, as long as it is the one your users were told.

## Slots Stop When the Chain Stops, and the Wall Clock Does Not

It is easy to assume the two clocks always move together. They come apart when the chain stops.

When votes stop arriving, the network slows down rather than stopping. If no block has been finalized for about ten seconds, every validator waits a little longer for each leader's block, around 5% more with each turn, until a block is finalized again.[^standstill] A real halt comes from something waiting cannot fix, such as a bug in the validator software, and ends when the validators restart the chain together.

A halt is rare: at the time of writing, block production has not stopped for years. A program should still handle one.

No block is produced during a halt, so the slot count does not move. Wall-clock time does. The first block after a restart carries a slot roughly where the last one left off. Its timestamp cannot jump the hours the halt took either, because each block can move it at most two slot lengths for each slot since its parent. At the time of writing, the timestamp trails real time after a restart and gains on it at about one second per second, so a nine-hour halt leaves it trailing for about nine hours more.[^clock-catch-up] That gap has three consequences:

- **Accrual by timestamp charges the halt, late.** The lending market's interest, the perpetual futures venue's funding, and the managed fund's fee all count seconds, so a nine-hour halt accrues nine hours. It arrives over the nine hours of catch-up rather than in the first block. The loans were outstanding and the suppliers' deposits were locked for those nine hours, so charging for them is accurate.
- **Neither kind of freshness window refuses the old price on its own.** The lending market's 25-slot window sees a price stamped one slot ago and would accept a number nine hours old. The managed fund's sixty-second window does no better, because the timestamp it reads is trailing, so a price published just before the halt looks seconds old. The damage is largest on the perpetual futures venue, where leverage multiplies a bad price across every open position.
- **A deadline passes at twice real speed after a restart.** The fundraiser's day count stands still during the halt, then runs at twice real speed until the timestamp catches up, so a contributor with an hour left before the halt gets about half an hour after it. The fundraiser survives it because `refund()` has no closing deadline, so contributors can still get their money back after the halt. A design that allowed refunds only during a narrow window would have left them unable to.

Every freshness window needs one more check. The `LastRestartSlot` sysvar[^last-restart-slot] carries the slot of the most recent cluster restart, or zero if there has never been one, and a price from before that restart is stale however few slots have passed since. The lending market, the prop AMM, the perpetual futures venue, and the managed fund all make this check in their oracle readers: any price stamped at or before the restart slot is rejected with `PricePredatesRestart`, and the market pauses valuation until the publisher posts again. Make it in any program that checks a price's age, in slots or in seconds.

The order book comes through a halt untouched, because it acts on neither clock: the timestamp it records is never compared, and queue positions resume exactly as they were.

## A Shorter Slot Tightens Every Window Counted in Slots

The network changes its target slot length rarely, through a feature gate that takes effect at the start of an epoch. It has done so before: during 2026 the target was cut from 400 milliseconds to 200 in stages.[^slot-times] At the time of writing, no reduction below 200 milliseconds is planned.

When the network shortens the slot, a freshness window sized in slots gets stricter. A 150-slot window covers less wall-clock time than it did, so it refuses prices it used to accept. That can make the program refuse a price it should accept, but never accept one it should refuse, and the first refusal shows the window needs retuning. The programs in this book compile the window in as a constant, so a shorter slot means a redeploy.

A rate counted in seconds is untouched. The lending market's interest and the perpetual futures venue's funding charge the same per hour at any slot length, with nothing to retune. A rate counted in slots gives no such warning when the slot shortens. An annual rate divided by a fixed slots-per-year number assumes a slot length, so halving the slot doubles what a borrower pays in a day while every line of the program stays as it was.

A slot count that spans one of these changes cannot be converted at today's figure, because the slots before the change were longer, and multiplying by the current target would understate the time that passed. Split the count at each change, which always falls on an epoch boundary, and convert each piece at the target in force then. A count that starts after the reduction to 200 milliseconds needs no split.

> **War Story: the SPL token-lending slot constant.** The SPL token-lending program, the ancestor of several Solana lending markets, turned annual rates into per-slot rates with a constant built from the SDK's tick rate: ticks per second, divided by ticks per slot, times the seconds in a year.[^spl-slots-per-year] The SDK then ran 160 ticks a second and 64 to a slot, 2.5 slots a second, but integer division threw the half away and compiled the constant for 2. At the 400-millisecond target every borrower paid a quarter more than the annual rate they were quoted. Save's fork wrote the result in as a number, with a comment calling it the slot rate. At 200 milliseconds the same constant charges two and a half times the quoted rate.

## What the Programs in This Book Chose

The table lists every program in Part II that touches time, and the clock each one settled on.

| Program | What it times | Its answer | Why |
| --- | --- | --- | --- |
| fundraiser | its funding deadline | whole days from one stored timestamp | a week of slots is about 16 hours out |
| lending market | interest accrual, and price freshness | timestamps for interest, slots for freshness | seconds against a year are nothing, and a stale price can be exploited |
| perpetual futures | funding accrual, and price freshness | timestamps for funding, slots for freshness | the same, and leverage multiplies a stale price |
| prop AMM | price freshness | slots | a stale price can be exploited |
| managed fund | an annual fee, and price freshness | timestamps for both | seconds against a year are nothing, and the price feed stamps seconds |
| options | its expiry | the timestamp | a date the two parties agreed, days away |
| betting market | when betting closes | the timestamp | a time published to bettors, days away |
| order book | which order came first | a sequence number; neither clock decides anything | neither clock is fine enough to order by |

## What You Learnt

- A program has three ways to observe the passage of time. The Unix timestamp is wall-clock time written by a leader, usually within a second or two of real time, and the leader chooses where in that range it falls. The slot count only goes up and nobody can move it, but each slot starts when the last one ends, so it typically runs about 10% long and stops in a halt. A program's own counter records order and nothing else.
- Count slots for any span shorter than about 20 seconds that your own program stamps, where nobody can move the count and its drift stays under a second or two. Use the wall clock for any longer span, including a rate or a deadline quoted to a person, with a margin at any deadline. Use a counter of your own for order of arrival.
- Accrual by timestamp charges per second whatever the slot length: advance a stored factor by the seconds since the last stored timestamp. Counting slots instead undercharges when slots run long: at about 10% long, a rate quoted at 20% a year collects about 18.3%.
- Give every price a freshness window, set by each consumer, in the unit the source uses: slots where the program chooses, seconds where the price feed published seconds.
- A slot count converts to wall-clock time only at the slot length in force, and only across a span where that length held. Read that length from the slot-time feature gates or measure it against the epoch. Anza's documentation carries the current figure, and the companion repository the current way to get it.
- The network occasionally shortens its slot time, as it did during 2026, from 400 milliseconds to 200 in stages. Each change takes effect everywhere at the start of an epoch, with no transition. Every slot-counted window then covers less time, and a window compiled in as a constant, as this book's programs do, takes a redeploy to retune. A rate counted in seconds is untouched, while one counted in slots accrues faster without saying so.
- A deadline counted in whole days floors, so compute both sides of it from the same expression. The window closes exactly that many 24-hour periods after it opened, at the same time of day, so say so when you write the terms down.
- When votes stop arriving, Solana slows down rather than stopping, and it halts only on a fault such as a software bug. During a halt slots pause and wall-clock time keeps running, but the timestamp cannot jump, so it trails after a restart and takes about as long as the halt to catch up. Accrual by timestamp charges the halt during the catch-up, a deadline arrives at twice real speed while the timestamp catches up, and a price that is hours old still looks fresh.
- Pair every freshness window, in slots or in seconds, with a `LastRestartSlot` check, which rejects any price stamped at or before the last restart.

[^forks]: Two validators can briefly build on different parents, splitting the chain into **forks**, until the network settles on one. A block for a lower slot on one fork can even be produced after a block for a higher slot on another, but a program only ever sees one of the forks and will only see the slot go up.

[^alpenglow-clock]: The leader's time is carried in a footer at the end of its block. Source: Brennan Watt of Anza, in a message to the author in September 2026, and [github.com/anza-xyz/agave/issues/15441](https://github.com/anza-xyz/agave/issues/15441). Validators enforce the range in `nanosecond_time_bounds`, at [github.com/anza-xyz/agave/blob/master/runtime/src/block_component_processor.rs](https://github.com/anza-xyz/agave/blob/master/runtime/src/block_component_processor.rs).

[^clock-catch-up]: A leader writes its own clock's time, moved into the permitted range if it falls outside, in `skew_block_producer_time_nanos` at [github.com/anza-xyz/agave/blob/master/core/src/block_creation_loop.rs](https://github.com/anza-xyz/agave/blob/master/core/src/block_creation_loop.rs). While the timestamp trails, every leader writes the top of the range, which advances it two slot lengths for each slot that passes.

[^skip-turn]: Interview with Roger Wattenhofer, head of research at Anza, on Alpenglow, at [youtube.com/watch?v=2RlNav7GiUY](https://www.youtube.com/watch?v=2RlNav7GiUY). The next leader can start as soon as the skips are certified, without waiting out the skipped slots.

[^standstill]: Wattenhofer, in the same interview, calls this standstill, and gives the 5% as approximate. The waits grow with each turn, so the chain keeps slowing until even a degraded network can deliver a block in time.

[^spl-slots-per-year]: The constant is `SLOTS_PER_YEAR` in the program's state module, at [github.com/solana-labs/solana-program-library/blob/master/token-lending/program/src/state/mod.rs](https://github.com/solana-labs/solana-program-library/blob/master/token-lending/program/src/state/mod.rs), and Save's copy is at [github.com/solendprotocol/solana-program-library/blob/master/token-lending/program/src/state/mod.rs](https://github.com/solendprotocol/solana-program-library/blob/master/token-lending/program/src/state/mod.rs).

[^slot-times]: The stages of that reduction are published at [solana.com/upgrades/reduced-slot-times](https://solana.com/upgrades/reduced-slot-times).

[^anza-docs]: Anza maintains the validator client and its documentation, at [docs.anza.xyz](https://docs.anza.xyz).

[^onchain-params]: "Longer term, we will put these parameters onchain so they are client queryable." Brennan Watt of Anza, at [x.com/bw_solana/status/2089740425695535300](https://x.com/bw_solana/status/2089740425695535300).

[^check-slot-time]: Dean Little's `check_slot_time.rs`, at [gist.github.com/deanmlittle/90901c2fdc9f73fe0fcefb0959109825](https://gist.github.com/deanmlittle/90901c2fdc9f73fe0fcefb0959109825).

[^slot-simd]: [SIMD-0525](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0525-reduce-slot-times.md) cut the slot time to 200 milliseconds in stages. Anza's [feature tracker](https://github.com/anza-xyz/agave/wiki/Feature-Gate-Tracker-Schedule) lists the feature that completes it (address `iBRLjhJnkmDZgNoZRDMW11d8ZV7HvsL3vAyRjZB5npW`).

[^slot-time-live]: On testnet, the only network running Alpenglow at the time of writing, slots averaged 219 milliseconds over an hour, so a time counted in slots ran about 10% long. The reading is from Solana Explorer's live cluster statistics for testnet, at [explorer.solana.com/?cluster=testnet](https://explorer.solana.com/?cluster=testnet), on 24 September 2026, which showed 215 milliseconds over the last minute. Mainnet was not yet running Alpenglow then. Solana's slot time tracker for mainnet is at [solana.com/200ms](https://solana.com/200ms).

[^last-restart-slot]: One of the sysvars listed in Anza's runtime documentation, at [docs.anza.xyz/runtime/sysvars](https://docs.anza.xyz/runtime/sysvars).
