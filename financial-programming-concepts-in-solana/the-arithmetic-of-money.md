# The Arithmetic of Money

Not yet drafted. The safe-calculation layer: the part AI and humans most often get subtly wrong. Planned sections:

## Money Is Integers: No Floats Near Funds

Determinism across validators; money is discrete; never floats, never `powf`.

## Minor Units, Lots, and Fixed-Point Scale

Minor units and major units; lot models for order books; WAD representation; tracking decimals instead of assuming them; never hard-coding `10^9`.

## Multiply Before Divide, with Wider Intermediates

Order of operations as a correctness rule; `u128` and `U256` headroom; phantom overflow; the hand-rolled Newton's-method integer square root.

## Rounding Is a Policy Decision

Round against the user; dust ownership; floor for credit, ceil for debt. *War Story: the SPL token-lending rounding bug, about $2.6B at risk, fixed by changing `round` to `floor`.*

## Invariants and Conservation: Assert After the Math

K must not decrease; total in equals total out; every locked minor unit accounted for on every exit; assert after the math, not just before.

## Interest and Growth Over Time

Cumulative-index accrual, exponentiation by squaring, discrete versus continuous compounding, the binomial-approximation tradeoff, and utilization-driven rate curves.
