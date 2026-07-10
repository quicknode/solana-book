# Cranks

Some work in a financial product has no natural caller. Funding indexes must advance, cached prices and interest must refresh, expired offers must process, and no user's own transaction is obliged to do any of it. The onchain pattern is the **crank**: an instruction handler that anyone may call, safe to call at any time, so that keeping the machine turning is a permissionless job rather than an operator's promise.

A good crank has three properties:

## Permissionless: the Handler Checks State, Not Identity

If the work is valid, anyone's signature will do. The lending market's `refresh_reserve` and `refresh_obligation` are the canonical examples: they bring interest and cached prices up to date for whoever asks, no special key required. Gating maintenance on the operator's key turns the operator's absence into everyone's outage.

## Idempotent and Quiet: a No-Op Succeeds

Calling the crank when there is nothing to do succeeds cleanly (refreshing an already-fresh reserve simply rewrites the same numbers), so a bot on a schedule never needs babysitting and never fails spuriously.

## Paid, If You Need It Reliable

The strongest maintenance carries its own incentive, and liquidation is the boundary case worth studying closely. Dave, the lending market's liquidator, is not a crank operator turning a handle for a fee: he is a principal who repays someone else's debt from his own pocket and takes their collateral at a discount, risking his own capital on prices holding while he does it. The market stays solvent precisely because that job pays well enough to be worth the risk. If your design has work that must happen and nobody is paid to do it, you have found a bug in your incentives, not your code.

![The crank loop: anyone's scheduled bot calls the permissionless handler, and every outcome is clean: work done, a quiet no-op, or a refusal of work the state does not permit.](figures/crank-loop.svg)
