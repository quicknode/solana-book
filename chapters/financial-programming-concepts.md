# Financial Programming Concepts in Solana

Not yet drafted. This chapter is everything money-specific: the arithmetic, the trust model, the adversary, and the operating discipline. Everything here applies to every program chapter that follows. Planned sections:

## Financial Software Is a State Machine, and Every State Needs an Exit

Created, funded, settled, cancelled, liquidated: model the states and every legal transition, and give every state an exit so no path strands anyone's funds.

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

## Offchain Truth: Verifying Signatures from Trusted Sources

How a program verifies the price of SOL: by verifying a signature from a trusted source. Oracles as signed publications of offchain facts; checking the signature, the publisher, the freshness, and the confidence interval exactly as any other input is checked. Trust as an engineering parameter: who signs, what it costs them to lie, how stale is too stale, and what the program does when publication stops.

## The Adversarial Environment

Cheap transactions, industrialized off-by-ones, MEV, sandwiching, slippage: what it means to deploy financial software where every user might be hostile and every mistake is monetizable.

## Validation: Signers, Owners, and the Confused Deputy

The account-substitution attacks that never go away. *War Stories: Cashio (unvalidated account chain, $52M); Wormhole (bypassed signature verification, $325M).*

## The Empty Pool: Inflation and Donation Attacks

First-depositor share math and its defenses: virtual shares, dead shares, minimum deposits.

## Price Manipulation

Attacking the inputs a program trusted; spot prices versus time-weighted and confidence-aware feeds. *War Story: Mango Markets ($116M, self-described as "a highly profitable trading strategy").*

## Rounding and Precision Exploits

The recurring drain class end to end. *War Stories: the Hundred and Sonne precision drains on emptied markets.*

## Ordering and Composability: CPI Trust Boundaries

Checks-effects-interactions; what another program can do mid-transaction; the threat-model counterpart to atomicity as a superpower.

## Testing Financial Software: Test the Branch the Bug Lives In

Both directions of symmetric flows; nonzero, asymmetric values; property-based invariants (conservation, monotonicity, never rounds in the user's favour); state built through real instruction handlers, not fixtures.

## Admin Power, Pausing, and Upgrades

Financially-safe config validation; upgrade authority as a normal, honest part of Solana; escape hatches for when a price feed dies or a counterparty vanishes.
