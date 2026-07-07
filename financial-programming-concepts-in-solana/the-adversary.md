# The Adversary

Not yet drafted. The threat model: exploit classes recur for a decade while APIs churn. Planned sections:

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
