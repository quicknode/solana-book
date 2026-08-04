# Chapter 10: Operating Financial Software

Correct code is only the start. This section is the rest of the job: proving the code is correct in the ways money demands, and holding power over a live market without becoming its biggest risk.

## Testing Financial Software: Test the Code Path the Bug Lives In

Financial code fails in the code paths nobody drives: the refund path, the second claim, the withdrawal that lands exactly at the health boundary. Coverage of the happy path proves a demo; the discipline below proves a market.

- **Build state through the program's own instruction handlers, never by injecting accounts.** Hand-built fixtures skip the very constraints under test; a program can pass every fixture-based test while being unusable, or unsafe, onchain. The only exception is accounts a foreign program would have created, like a price feed, which the harness builds deliberately as a controllable fixture, because valuation code cannot be honestly tested against prices you cannot move.
- **Test both directions of every symmetric flow.** Deposit and withdraw. Bid and ask. Borrow and repay. A bug that favors one side is invisible if you only assert the other, and the swap that works A-to-B routinely fails B-to-A.
- **Use nonzero, asymmetric values.** A test with `duration: 0` or equal amounts on both sides sits exactly where opposite comparisons coincide, so it passes with the inequality written backwards. Prime-ish, unequal, memorable numbers make wrong math produce wrong answers.
- **Test both sides of every boundary.** The borrow at maximum loan-to-value must succeed, and the same borrow plus one minor unit must fail. Two tests, one unit apart; the lending suite's `withdraw_at_health_boundary_then_one_more_unit_fails` is the pattern's name made literal.
- **Test the adversarial code path by name.** Every rule in the failure-modes section of a program chapter earns a test that tries to break it: the non-maker canceling, the fee vault substituted for the user vault, the double claim. A wall that has never been pushed on is a hypothesis.
- **Assert properties, not just balances.** Conservation (a round trip creates no value), monotonicity (an index never decreases), directional rounding (no path rounds in the user's favor). Property tests catch whole bug classes; balance assertions catch instances.

The mechanics are cheap: LiteSVM runs the real program in-process in milliseconds, slot-warping makes weeks of interest pass in a test, and injected feed accounts make prices a fixture. Nothing about the discipline is expensive except deciding to have it.

## Proving Goes Further Than Testing

A test checks the inputs you thought of; a proof checks all of them. The ladder has three rungs, and financial software should climb as high as the money justifies. Tests come first: the discipline above, driving every code path with chosen values. Property tests come second: assert a law (a round trip creates no value, an index never decreases) over generated inputs, so the values are not just the ones you imagined. **Formal verification** is the top rung: a model checker like [Kani](https://github.com/model-checking/kani) explores *every* possible input to a function, bit by bit, and either proves the property holds or hands you the exact counterexample.

The escrow program in the companion repository ships a set of Kani harnesses that do precisely this for its verifiable core:

- `proof_take_offer_conserves_value` proves that taking an offer conserves both tokens' totals on every input, not just the tested ones.
- `proof_cancel_offer_returns_all_to_maker` proves the refund path whole.
- `proof_offer_id_seed_injective` proves two different offer IDs can never derive the same address.

Onchain code that delegates to other programs cannot be symbolically executed end to end, so the technique is to mirror the program's arithmetic and ordering in pure functions and prove those: the same shape the Percolator perpetuals engine uses. When a chapter of this book says an invariant "must hold," this is what taking that sentence literally looks like.

## Ship With a Second Opinion

Before any program in this book's genre touches mainnet, get a **second-opinion audit**: an independent reviewer, unattached to the team, walking the adversary's checklist against your code. Every wall in the failure-modes sections exists because someone's first opinion missed it. An audit is the cheapest way to have someone hunt for the same holes an attacker would, because a reviewer hands you the list instead of draining the program.

## Everything Around the Program Decides How Sure It Needs to Be

A handler cannot ask whether the block it is running in will survive. There is no sysvar for it and no check to write: a program always executes at the optimistic edge of the chain, and if its block loses, the transaction did not happen and every account it touched goes back with it. Onchain that is the whole story, and it is why atomicity is enough.

The question becomes real one step out, because the systems around a program act on what they read, and some of those actions cannot be taken back. Solana gives a reader three answers to choose between, its [commitment levels](https://docs.anza.xyz/consensus/commitments):

| Commitment | What it means | What can still happen to it |
| --- | --- | --- |
| **processed** | A leader executed the transaction and put it in a block | It can vanish: the block may be skipped or lose a fork |
| **confirmed** | A supermajority of stake has voted for that block | It can vanish in theory; no confirmed block has been rolled back on mainnet |
| **finalized** | So many blocks sit on top that no validator can now vote another way | Nothing. This is the record |

The distance between the last two is a protocol parameter rather than a law of nature: Tower BFT finalizes 32 slots back, about 12.8 seconds, and Anza's [Alpenglow](https://www.anza.xyz/blog/alpenglow-a-new-consensus-for-solana) consensus finalizes one or two slots back instead.

Match the level to how reversible your reaction is. A liquidator bot scanning positions at `processed` is fine, because it is reading in order to decide what transaction to send, and a transaction aimed at a state that evaporated simply fails. Anything that leaves the chain and cannot be recalled waits for `finalized`: paying out fiat, emailing a customer that their money arrived, crediting a balance in your own books. The chain is allowed to un-happen a `confirmed` transaction, and your bank is not going to un-happen the wire.

The same discipline covers the restart after a halt, which the Time chapter describes from the program's side. A cluster resumes from an agreed slot, and transactions that did not make it into that history did not happen, whatever any bot saw at the time. So the offchain half of a market resubmits rather than assumes, and that is the second reason the Lending and Borrowing chapter's cranks are built to be idempotent: a handle that is safe to turn twice is safe to turn again after a restart.

## Admin Power, Pausing, and Upgrades

Every market in this book has an operator with real power: Maria withdraws fees, settles events, sets prices, changes weights. Admin power is not a design failure; on Solana even upgrade authority is normal and honest, because programs must be fixable when The Adversary's exploit classes are discovered in yours. The failure is *unbounded* power, and the discipline is to treat the admin as a component with a specification, exactly like an oracle: what can this key do, what can it never do, and what happens if it goes rogue or goes silent?

- **Bound what configuration can express.** Validate every parameter at write time against limits that make abuse structurally impossible: the fee that cannot exceed 10,000 basis points, the loan-to-value that cannot exceed the liquidation threshold, the manager fee capped because an uncapped one drains the vault *by configuration*. A config the admin cannot make dangerous is worth more than an admin promise.
- **Snapshot terms when money commits.** The betting market copies the fee onto each event at creation; the vault strategy's fee has no setter at all. Whatever the admin can change, they cannot change it retroactively for funds already inside.
- **Keep admin money and user money in different pots.** The fee vault, the accumulated-fees counter carved out of the exchange rate: the admin's upside is segregated so that collecting it cannot touch what users are owed, and the withdraw path moves only from the segregated pot.
- **Give the admin no path to principal.** The strongest property in the book's programs: no instruction handler, under any parameters, moves user deposits to the operator. Rebalancing moves funds between program-owned vaults; settlement pays by formula. When that property holds, the honest claim is not "non-custodial", it is better and more precise: the rules are the deployed program, and the operator is not in them.
- **Pausing is for entrances, not exits.** A pause switch that stops new deposits and new positions during an incident protects users; one that blocks withdrawals holds them hostage. Design the pause to narrow the program toward its exits, and remember the state-machine rule: every state needs an exit *even while paused*.
- **Plan for the admin going silent.** Fees claimable whenever (a no-op when empty, so a cron can run it), and nothing user-facing gated on the operator showing up. Add an escape hatch for the day the price feed dies: a market that cannot value collateral should be able to wind down, closing positions and letting deposits leave, rather than freezing everyone in place waiting for truth that is not coming.
- **Make upgrade authority worth trusting.** Ship fixes through a multisig with named holders rather than one laptop key, and say so. Users are not trusting that the code will never change; they are trusting that changing it takes more than one bad day.

## What You Learnt

- Test the code path the bug lives in: both directions of every symmetric flow, both sides of every boundary, adversarial paths by name, and properties as well as balances.
- Proving goes further than testing: property tests over generated inputs, then formal verification of the arithmetic core, as far up the ladder as the money justifies.
- Ship with a second-opinion audit; a reviewer hunting the same holes an attacker would hands you the list instead of draining the program.
- A program cannot see whether its own block is final, so the systems around it choose: read at `processed` when the reaction is another transaction, and wait for `finalized` before anything that leaves the chain and cannot be recalled.
- Admin power is a component with a specification: bounded config, snapshotted terms, segregated money, no path to principal, pauses that narrow toward exits, a plan for silence, and upgrade authority worth trusting.

The through-line of the whole chapter, one last time: the arithmetic decides what transitions compute, offchain truth decides what the world may trigger, the adversary is loose in every code path, and the operator is just one more account whose powers are checked like everyone else's. Programs built that way are the ones the next nine chapters walk through.
