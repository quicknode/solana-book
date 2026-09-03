# Chapter 10: Operating Financial Software

Correct code is only the start. The rest of the job is proving that code on every path money can take, waiting for the chain's answer to become final before acting on it, and bounding the operator's power so the admin key can neither drain the market nor lock users inside it.

## Bugs Live at the Boundaries, So Test Both Sides of Every One

Financial code fails at the edges the happy path never reaches: the refund, the second claim, the withdrawal that lands exactly on the health boundary. A suite that covers only the happy path proves the demo works. The rules below push every test to an edge.

- **Build state through the program's own instruction handlers, never by injecting accounts.** A hand-built fixture skips the constraints under test, so a program can pass every fixture-based test and still be unusable, or unsafe, onchain. The one exception is an account a foreign program would have created, like a price feed. The harness builds that one as a fixture, so a test can set the price it needs.
- **Test the mirror image of every flow.** Withdraw as well as deposit, the ask as well as the bid, repay as well as borrow. The mirror is separate code, so a test of one copy says nothing about the other: a swap that works from USDC to NVDAx can fail from NVDAx to USDC.
- **Use nonzero, asymmetric values.** A test with `duration: 0`, or the same amount on both sides, sits at the one value where `<=` and `>=` both hold, so it passes with the comparison written backwards. Use unequal, memorable numbers instead, like 1,000 USDC against 3 NVDAx, so a formula with its operands swapped produces a total the assertion rejects.
- **Test both sides of every boundary.** The withdrawal that lands exactly on the loan-to-value limit must succeed, and the same withdrawal plus one minor unit must fail. The lending suite's `withdraw_at_health_boundary_then_one_more_unit_fails` is that pair: a withdrawal that leaves borrowing power exactly equal to the debt passes, and one more minor unit is refused.
- **Test every attack by name.** Every rule in a program chapter's failure-modes section gets a test that tries to break it: the non-maker canceling an offer, the fee vault passed in place of the user vault, the second claim on a settled event.
- **Assert properties, not just balances.** Conservation (a round trip creates no value), monotonicity (an index never decreases), directional rounding (no path rounds in the user's favor). A property test catches a whole bug class; a balance assertion catches one instance of it.

None of this needs a validator. LiteSVM runs the compiled program in-process in milliseconds, warping the slot makes weeks of interest accrue inside one test, and an injected feed account sets whatever price the test needs.

## Proving Goes Further Than Testing

A test checks the inputs you thought of. A proof checks all of them. Three levels of assurance run from one to the other, and how far up to go is set by how much money the program will hold:

- **Tests** drive every code path with values you chose, by the rules above.
- **Property tests** assert a law (a round trip creates no value, an index never decreases) over generated inputs, so the values are no longer only the ones you imagined.
- **Formal verification** hands a function to a model checker like Kani,[^kani] which explores *every* possible input, bit by bit, and either proves the property holds or hands you the exact input that breaks it.

The escrow program in the companion repository ships Kani harnesses for the parts of it a proof can reach:

- `proof_take_offer_conserves_value` proves that taking an offer conserves the total of each token, on every input rather than only the tested ones.
- `proof_cancel_offer_returns_all_to_maker` proves the refund path returns every vault token to the maker.
- `proof_offer_id_seed_injective` proves two different offer IDs can never derive the same address.

A handler that moves tokens through the Token Program cannot be model-checked end to end, because the cross-program invocation is a syscall the checker cannot step into. So the harness mirrors the program's arithmetic and statement order in pure functions and proves those. Percolator, Anatoly Yakovenko's Kani-verified perpetual-futures risk engine, is built the same way: a self-contained core the checker can explore whole. Each invariant in a program chapter's invariants section is a property a harness like these can settle.

## Ship With a Second Opinion

Before a program that holds other people's money touches mainnet, get a **second-opinion audit**: an independent reviewer, unattached to the team, walking the *Adversary* chapter's exploit classes against your code. Every check in the program chapters' failure-modes sections exists because someone's first opinion missed it. An auditor hunts for the same holes an attacker would, and hands you the list instead of draining the program.

## Wait for Finality Before Doing Anything You Cannot Undo

A handler cannot ask whether the block it is running in will survive. There is no sysvar for it and no check to write, because a program always executes in a block no validator has voted on yet. If that block is skipped or loses a fork, the transaction did not happen, and every account it touched goes back with it.

The code that reads the chain has to answer that question, because it acts on what it finds: the liquidator bot, the crank on a schedule, the backend that marks an order paid, the ledger your accountants close the month with. Some of what they do cannot be taken back. Solana gives a reader three commitment levels to choose between:[^commitment-levels]

| Commitment | What it means | What can still happen to it |
| --- | --- | --- |
| **processed** | A leader executed the transaction and put it in a block | It can vanish: the block may be skipped or lose a fork |
| **confirmed** | A supermajority of stake has voted for that block | It can vanish in theory; no confirmed block has been rolled back on mainnet |
| **finalized** | So many blocks sit on top that no validator can now vote another way | Nothing. This is the record |

A liquidator bot scans at `processed`, because it is reading only to decide which transaction to send next, and a transaction aimed at a state that vanished fails. A frontend telling a user their swap landed reads at `confirmed`, because a screen can be redrawn if the block is dropped. Anything that leaves the chain and cannot be recalled waits for `finalized`: paying out fiat, emailing a customer that their money arrived, crediting a balance in your own books. The rule underneath is to match the level to how reversible your reaction is. The chain may still drop a `confirmed` transaction, and your bank will not take the wire back. Waiting costs latency, and how much is set by the network's consensus rules, not by anything in your code.

## Admin Power Runs on a Written Specification

Every market in this book has an operator with real power: withdrawing fees, settling events, setting prices, changing weights. Admin power is normal, and on Solana upgrade authority is expected, because a program has to be fixable when one of the *Adversary* chapter's exploit classes turns up in it. The failure is *unbounded* power. Write the admin key a specification with three parts: what it can do, what it can never do, and what happens when it goes rogue or goes silent. The rules below are that specification, as the book's programs implement it.

- **Bound what configuration can express.** Validate every parameter at write time against a limit that makes abuse impossible by configuration. The vault strategy refuses a management fee above 1,000 basis points a year, because `collect_fees` mints shares to the manager and dilutes every depositor, so an uncapped fee would drain the vault. The lending program refuses a loan-to-value ratio above the liquidation threshold, so no loan it grants is liquidatable the moment it is taken.
- **Snapshot terms when money commits.** The betting market copies the config's fee onto each event when the event is created, so the fee an event pays is fixed the moment it opens. The vault strategy's fee has no setter at all. A parameter the admin can change applies to money that arrives after the change, never to money already inside.
- **Keep admin money and user money apart.** The order book's fee vault holds only taker fees, and `withdraw_fees` moves only from that vault to the market authority. The lending reserve keeps its share in `accumulated_protocol_fees`, which the exchange rate subtracts before valuing a supplier's shares, so collecting it changes nothing a supplier is owed.
- **Give the admin no path to principal.** No instruction handler in the book's programs, under any parameters, moves user deposits to the operator. Rebalancing moves funds between program-owned vaults, and settlement pays by formula. When that holds in your program, say it in those words rather than claiming "non-custodial": the rules are the deployed program, and the operator is not in them.
- **Pause entrances, never exits.** A pause that refuses new deposits and new positions during an incident protects users; one that refuses withdrawals holds them hostage. The prop AMM's `paused` flag, set through `set_quote`, makes `swap` refuse and is read by no other handler. Whatever a pause stops, every participant must still be able to get their money out of every state, paused included.
- **Plan for the admin going silent.** Let nothing a user does wait on the operator: a deposit, a withdrawal, or canceling your own offer runs without an admin signature. The order book's `withdraw_fees` returns success with nothing to move when the fee vault is empty, so a scheduled job can call it every hour without failing. And add a way out for the day the price feed dies. A lending market that can no longer value collateral needs a wind-down path that closes positions and lets deposits leave, rather than freezing every user in place until a price arrives.
- **Make upgrade authority worth trusting.** Ship fixes through a multisig with named holders rather than one laptop key, and say so where users can read it. A user who reads that knows a change to the code takes several named people to sign, and that one stolen laptop cannot ship one.

## What You Learnt

- Bugs live at the boundaries, so a test suite pushes to every one: the mirror image of every flow, both sides of every limit, every attack by name, and properties as well as balances.
- Proving goes further than testing: property tests over generated inputs, then formal verification of the arithmetic core, and how far to go is set by how much money the program will hold.
- Ship with a second-opinion audit: an auditor hunts for the same holes an attacker would and hands you the list instead of draining the program.
- A program cannot see whether its own block is final, so whatever reads the chain chooses a commitment level. A bot deciding which transaction to send next reads at `processed`, a screen that can be redrawn reads at `confirmed`, and a backend that pays out fiat or tells a customer their money arrived waits for `finalized`.
- Admin power runs on a written specification: bounded config, snapshotted terms, admin money kept apart from user money, and no path to principal. A pause stops entrances and leaves exits open, nothing a user does waits on the operator, and upgrade authority is held by a named multisig.

[^kani]: Kani is a Rust model checker from the AWS-backed model-checking project, at [github.com/model-checking/kani](https://github.com/model-checking/kani).

[^commitment-levels]: The three levels, and what each one guarantees, are documented in Anza's commitment reference at [docs.anza.xyz/consensus/commitments](https://docs.anza.xyz/consensus/commitments).
