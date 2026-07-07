# A Transaction Happens Entirely or Not at All

A Solana transaction is a signed bundle of instructions, possibly addressed to several different programs, and it executes atomically: every instruction succeeds, or the whole transaction never happened. There is no partial state, no "the payment cleared but the delivery failed."

For financial software this is not plumbing; it is a primitive you design with.

## Atomic Settlement Removes Counterparty Risk

Settlement risk between steps simply does not exist inside a transaction: the escrow's `take_offer` moves Bob's payment and Alice's goods in one atomic unit, and no ordering of failures leaves one side paid and the other empty-handed.

## Flash Loans Are Atomicity Turned Into Credit

A **flash loan** borrows in instruction one, uses the money in the middle, and repays in the final instruction. If repayment fails, the borrow itself is unwound: the lender risked nothing, so the loan needs no collateral. Whole categories of arbitrage and liquidation strategies exist only because transactions are all-or-nothing.

## Prerequisites Become Un-Skippable

Sequencing turns from a race into a pattern: the lending market requires its price refresh in the same transaction as the action that depends on it, so "acting on stale state" is not a bug to chase but a transaction that cannot be built.

## Compute Is Metered, and the Meter Shapes Design

The budget for all this is metered in **compute units** per transaction, and the meter shapes financial design directly: it is why the order book credits balances instead of making one transfer per fill, and why work gets consolidated everywhere you look. Compute cost is a design input, not an afterthought.

**[FIGURE: One transaction as a sealed box containing three instructions across two programs (borrow, swap, repay); a green path where all three commit together, and a red path where the failed repay unwinds the entire box, leaving the chain untouched.]**
