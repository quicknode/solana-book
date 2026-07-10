# Time

Solana has two clocks, and choosing the wrong one is a security decision made by accident.

## Slots Are Guaranteed to Progress

The **slot** counts block opportunities, roughly 400ms apart, and its progression is guaranteed by the runtime: slots only go up, at a rate nobody can meaningfully bend. Programs read the current slot from the **Clock sysvar**, a system account the runtime keeps fresh. The lending market and the perpetual futures venue both measure price staleness in slots.

## Timestamps Are Validator-Reported

The **unix timestamp**, read from the same Clock sysvar, is validator-reported wall time: right to within a few seconds, and exactly as trustworthy as that sentence sounds. The token fundraiser's deadline counts days of it, and the vault strategy checks its price feed's age in seconds of it, because the feed publishes a wall-clock time.

## Choose the Clock by Asking Who Benefits From the Error

Anything an adversary would profit from bending is measured in slots. Timestamps are for humans and long horizons, where seconds of slack are noise: display, record-keeping, and rates accrued over months. The vault strategy's annual management fee accrues by timestamp, because seconds of drift against a year is nothing; the lending market's per-slot interest does not.

![The two clocks: the slot counter steps evenly and only forward; the wall clock wobbles with its validators. Choose by asking who benefits from the error.](figures/two-clocks.svg)
