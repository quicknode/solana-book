# Chapter 5: Time

Solana has two clocks. Validators can nudge one of them, so measuring the wrong thing with it lets whoever profits from the error shift what your program computes.

| Clock | Source | Guarantee | Use it for |
| --- | --- | --- | --- |
| **slot** | The Clock sysvar's count of block opportunities, roughly 400ms apart | Only goes up, at a rate nobody can meaningfully bend | Anything an adversary would profit from bending: price staleness, per-slot interest |
| **unix timestamp** | The same Clock sysvar, validator-reported wall time | Right to within a few seconds | Humans and long horizons: day-counted deadlines, annual fees, display |

## Slots Are Guaranteed to Progress

The **slot** counts block opportunities, roughly 400ms apart, and its progression is guaranteed by the runtime: slots only go up, at a rate nobody can meaningfully bend. Programs read the current slot from the **Clock sysvar**, a system account the runtime keeps fresh.

Money that accrues does so per slot, in both programs of this book that accrue anything. The lending market carries one number per reserve, a **cumulative index** that grows each time anyone touches the market:

```
new index = old index × (1 + rate per slot × elapsed slots)
```

Elapsed slots is the current slot minus the slot of the last refresh, which the reserve stores. Every borrower's debt is their scaled principal times that index, so one multiplication per refresh does the work of looping over every borrower every slot. The Arithmetic of Money builds this properly; what matters here is the unit.

The perpetual futures venue does the same for funding, storing `cumulative_funding` alongside `last_funding_slot`. Both are indexes, both advance by elapsed slots, and both are money. That is the whole reason they count slots: a trader who could stretch a slot could stretch what they owe.

## Timestamps Are Validator-Reported

The **unix timestamp** comes from the same Clock sysvar, but it is wall-clock time reported by validators rather than a count the runtime guarantees. It is right to within a few seconds, and validators can nudge it.

Wall-clock time is still the right tool in places. The vault strategy reaches for it twice, for two different reasons:

- **Its annual management fee accrues by timestamp**, because a few seconds of drift measured against a year is nothing.
- **It checks its price feed's age in seconds rather than slots**, because the feed publishes a wall-clock time, and the comparison has to be made in the units the number arrived in.

Where a program's own deadline is for humans, timestamps are what humans mean.

## Every Consumer Sets Its Own Freshness Window

A price is only usable if it is recent, and how recent is a judgement each program makes for itself. Three of this book's programs make it differently:

| Program | Refuses a price older than | Measured in |
| --- | --- | --- |
| the lending market | 25 slots, about ten seconds | slots |
| the prop AMM | 150 slots, about a minute | slots |
| the vault strategy | 60 seconds | seconds |

The two that pick the window pick slots. The vault is the exception that shows the rule: its number is in seconds because the feed it reads publishes a wall-clock time, so seconds is the unit it was handed. Offchain Truth covers what else a program checks about a price before it uses one.

## Integer Day Counts Have a Boundary, and Both Sides Must Use It

A clock gives a program seconds, so counting days means dividing by 86,400. That division is integer division, which throws the remainder away: six and a half days counts as six, and anything short of a full day counts as none of it. The token fundraiser stores `time_started` and a duration in days, and both of its later handlers reconstruct elapsed days the same way:

```
elapsed days = (now − time_started) / 86,400
```

`contribute()` requires that count to be *less than* the duration. `refund()` requires it to be *at least* the duration. One expression, compared both ways, so there is no gap and no overlap between "you may still contribute" and "you may now refund": at the moment the count reaches the duration, contributions turn off and refunds turn on, by arithmetic rather than by a second stored flag anybody has to keep in step.

The trap is what "seven days" then means. With day-granularity math the window ends at the first tick of day seven, not at some intuitive end of the seventh day. That is a fine rule as long as it is the rule you meant and the one you told your users.

## Slots Stop When the Chain Stops, and the Wall Clock Does Not

Both clocks arrive in the same sysvar and a program reads them in the same breath, so it is easy to assume they always move together. They come apart in exactly one situation, and it is the situation financial software has to survive: the chain stopping.

Solana would rather stop than be wrong. When validators cannot agree which block is real, block production halts instead of continuing down two conflicting histories, and the network sits still until enough of the stake agrees where to resume. Mainnet has spent hours in that state. The [Agave restart guide](https://docs.anza.xyz/operations/guides/restart-cluster) is the procedure that ends one: agree on a slot to restart from, and start producing again once 80% of the stake is back online. For money the trade is the right way round, because a chain that kept producing blocks through a disagreement would be a chain that settled the same balance twice. It still leaves a gap for programs to handle.

No block is produced during a halt, so the slot count does not move. Wall-clock time does. The first block after a restart therefore carries a slot roughly where the last one left off and a timestamp hours later: everything measured in slots was paused, and everything measured in seconds was running the whole time. Three consequences, one for each way this book's programs use a clock:

- **Per-slot accrual pauses with the chain.** The lending market's index advances by elapsed slots, so a nine-hour halt accrues no interest at all: nobody is charged for a market they could not reach. A fee accruing by timestamp charges the full nine hours, because from its point of view nine hours is what happened.
- **A freshness window measured in seconds is blown at the restart, and one measured in slots does not notice.** The vault strategy refuses a price older than sixty seconds, so its first call after a halt fails until a publisher posts again. The lending market's 25-slot window sees a price stamped one slot ago and accepts it, though the number in it is nine hours old. Neither behavior is wrong, but only one of them is a decision somebody made on purpose.
- **A deadline can pass with nobody able to act on it.** The fundraiser's day count runs through a halt like any other nine hours, so a contributor with an hour left can find the window shut when the chain returns. That program survives it because its refund path has no deadline; a design whose only exit was a narrow window would have stranded them.

## Choose the Clock by Asking Who Benefits From the Error

Anything an adversary would profit from bending is measured in slots. Timestamps are for humans and long horizons, where seconds of slack are noise: display, record-keeping, and rates accrued over months. The vault strategy's annual management fee accrues by timestamp, because seconds of drift against a year is nothing; the lending market's per-slot interest does not.

![The two clocks: the slot counter steps evenly and only forward; the wall clock wobbles with its validators. Choose by asking who benefits from the error.](figures/two-clocks.svg)

The question has a second half. Ask also what the number does when the chain stops, because one clock pauses with it and the other does not, and the answer decides whether a halt is nine hours your program charges for, nine hours it forgives, or nine hours it does not know about.

## What You Learnt

- Solana has two clocks: the **slot**, whose progression the runtime guarantees, and the **unix timestamp**, which validators report.
- Choose the clock by asking who benefits from the error: slots for anything an adversary could profit from bending, timestamps for humans and long horizons.
- Money that accrues accrues per slot, as a **cumulative index** advanced by elapsed slots, so one multiplication replaces a loop over every account.
- A price needs a freshness window, each consumer sets its own, and the unit follows the source: slots where the program chooses, seconds where the feed published seconds.
- A deadline counted in whole days floors, so both sides of it must be computed from the same expression, and the window ends at the first tick of the last day.
- Solana halts rather than run two conflicting histories, and during a halt slots pause while wall-clock time keeps running: per-slot accrual stops, second-measured freshness windows blow past their limit at the restart, slot-measured ones do not notice, and deadlines expire with nobody able to act on them.
