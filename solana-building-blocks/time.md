# Slots for Adversarial Logic, Timestamps for Humans

Solana has two clocks, and choosing the wrong one is a security decision made by accident.

## Slots Are Guaranteed to Progress

The **slot** counts block opportunities, roughly 400ms apart, and its progression is guaranteed by the runtime: slots only go up, at a rate nobody can meaningfully bend. Price staleness windows, auction deadlines, and expiry logic in this book are all measured in slots.

## Timestamps Are Validator-Reported

The **unix timestamp**, read from the same Clock sysvar, is validator-reported wall time: right to within a few seconds, and exactly as trustworthy as that sentence sounds.

## Choose the Clock by Asking Who Benefits From the Error

Anything an adversary would profit from bending is measured in slots. Timestamps are for humans and long horizons, where seconds of slack are noise: display, record-keeping, and rates accrued over months. The vault strategy's annual management fee accrues by timestamp, because seconds of drift against a year is nothing; the lending market's per-slot interest does not.

**[FIGURE: The two clocks side by side. A slot counter ticking upward in fixed guaranteed steps next to a wall clock with a small wobble band labelled "validator-influenced"; a staleness check pointing at the slot counter, a yearly fee accrual pointing at the wall clock.]**
