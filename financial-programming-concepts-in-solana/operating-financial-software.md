# Chapter 10: Operating Financial Software

Correct code is only the start. The rest of the job is testing it on every flow and running it safely once it holds other people's assets.

## Test the Edges of Every Interaction

Financial code fails at the edges the happy path never reaches: the refund, the second claim, the withdrawal that lands exactly on the health boundary.

- **Build state through the program's own instruction handlers, never by injecting accounts.** A hand-built fixture skips the constraints under test, so a program can pass every test built on hand-made accounts and still be unusable, or unsafe, onchain. The one exception is an account a foreign program would have created, like a price feed. The managed fund's suite writes a Pyth price account as a fixture; the lending, prop AMM and perpetual futures suites post prices through a handler of their own or of a mock price-feed program.
- **Test the mirror image of every flow.** Withdraw as well as deposit, the ask as well as the bid, repay as well as borrow. The mirror is separate code, so a test of one copy says nothing about the other: a swap that works from USDC to NVDAx can fail from NVDAx to USDC.
- **Use nonzero, asymmetric values.** A test with `duration: 0`, or the same amount on both sides, sits at the one value where `<=` and `>=` both hold, so it passes with the comparison written backwards. Equal amounts hide a second bug: a formula with its operands swapped computes the same total either way. Use unequal amounts you can recognize in a failed assertion's output, like 1,000 USDC against 3 NVDAx, so a wrong total tells you which input it was built from.
- **Test both sides of every numerical boundary.** The withdrawal that lands exactly on the loan-to-value limit must succeed, and the same withdrawal plus one minor unit must fail. The lending suite's `withdraw_at_health_boundary_then_one_more_unit_fails` is that pair: a withdrawal that leaves borrowing power exactly equal to the debt passes, and one more minor unit is refused.
- **Test every attack by name.** Every check in a program chapter's failure-modes section gets a test that tries to get past it: the non-maker canceling an offer, the fee vault passed in place of the user vault, the second claim on a settled event. The handlers that lost Cashio and Wormhole, in the *Adversary* chapter, each accepted a substituted account.
- **Assert invariants, not just account values.** Conservation (a round trip creates no value), monotonicity (an index never decreases), directional rounding (no path rounds in the user's favor). An invariant test catches a whole bug class; an assertion on one account's value catches one instance of it.

Every test in this list is quick to write and fast to run. The companion suites run on LiteSVM, which loads the compiled program into the test process, so a test runs in milliseconds. A rewritten Clock sysvar makes weeks of interest accrue inside one test, and `warp_to_slot()` ages a slot-stamped price.

## Model Checking Goes Further Than Testing

A test checks the values you thought of. A model checker checks all of them. There are three levels of assurance, and how far up to go is set by how much the program's vaults will hold:

- **Tests** drive every code path with values you chose, at the edges listed above.
- **Invariant tests** assert one of the invariants listed above at values you chose. Testing libraries that generate the values call this "property-based testing".
- **Model checking** hands a function to a model checker like Kani,[^kani] which tries *every* possible value of the function's inputs, bit by bit, and either reports that the invariant holds for all of them or hands you the exact values that break it.

Though Kani calls its checks "proofs", a model check is not a formal proof. A formal proof is a mathematical argument a person writes in a proof assistant such as Lean, which the tool then checks step by step, and it can cover code a model checker cannot explore. The companion repository has model checks and tests, and no formal proofs.

The escrow program in the companion repository ships Kani harnesses for the parts of it a model checker can reach. Kani marks a harness with `#[kani::proof]`, which is why the directory is called `kani-proofs` and the harnesses are named `proof_*`; each one is a model check:

- `proof_take_offer_conserves_value` checks that taking an offer conserves the total of each token, for every value rather than only the tested ones.
- `proof_cancel_offer_returns_all_to_maker` checks that the refund path returns every vault token to the maker.
- `proof_offer_id_seed_injective` checks that two different offer IDs never produce the same seed bytes, so they cannot derive the same address.

A handler that moves tokens through the Token Program cannot be model-checked end to end, because the cross-program invocation is a syscall the checker cannot step into. So the harness mirrors the program's arithmetic and statement order in pure functions and checks those. Percolator, Anatoly Yakovenko's Kani-checked perpetual-futures risk engine, is built the same way: a self-contained core the checker can explore whole.[^percolator] Each invariant in a program chapter's invariants section is a claim a harness like these can check.

## Wait for Finality Before Doing Anything You Cannot Undo

A handler cannot ask whether the block it is running in will be finalized. There is no sysvar for it and no check to write, because a program always executes in a block no validator has voted on yet. If that block is skipped or loses a fork, the transaction did not happen, and every account it touched goes back with it.

The code that reads the chain has to answer that question, because it acts on what it finds. That code is the liquidator bot, the job that calls a crank (a maintenance handler anyone may call) on a schedule, the backend that marks an order paid, and the export your accountants close the month from. Some of what they do cannot be taken back. A reader of the chain asks for one of two states,[^confirmed] by the commitment level it passes with the request:[^commitment-levels]

| Commitment | What it means | What can still happen to it |
| --- | --- | --- |
| **processed** | A leader executed the transaction and put it in a block | It can vanish: the block may be skipped or lose a fork |
| **finalized** | The validators have voted the block final, and no fork can replace it | Nothing. This is the record |

- **A liquidator bot scans at `processed`**, because it is reading only to decide which transaction to send next, and a transaction aimed at a state that vanished fails.
- **Anything that leaves the chain and cannot be recalled waits for `finalized`**: paying out fiat, emailing a customer that their payment arrived, crediting a balance in your own books.

Waiting adds latency, and how much is set by the network's consensus rules, not by anything in your code.

## Admin Power Runs on a Written Specification

Most programs in this book have an operator with real power: withdrawing fees, settling events, setting prices, changing weights. Admin power is normal, and on Solana upgrade authority is expected, because a program has to be fixable when a bug turns up. *Unbounded* power, however, is a problem. Write a specification for the admin's private key with three parts: what it can sign for, what it can never do, and what happens when its holder acts against users or stops responding.

- **Bound what configuration can express.** Validate every parameter at write time against a limit that makes abuse impossible by configuration. The managed fund refuses a fee above 10% at creation, as the *Managed Fund* chapter shows. The lending program refuses a loan-to-value ratio above the liquidation threshold, so no loan it grants is liquidatable the moment it is taken. Where a parameter must stay adjustable, bound it instead. The lending program caps borrow rates at 300% a year and refuses a liquidation bonus the collateral could not pay at the threshold. An update may raise a reserve's liquidation threshold but never lower it, so no update moves the liquidation line toward an open borrow.
- **Snapshot terms when participants commit their tokens**, which is the *Offchain Truth* chapter's rule. The managed fund's fee has no setter. Let a parameter the admin can change apply only to deposits that arrive after the change.
- **Give the admin no path to user deposits.** No instruction handler in the book's programs, under any parameters, moves user deposits to the operator. The way to make that checkable is to keep the operator's fees in their own place. The order book's fee vault holds only the fee carved out of each fill's quote proceeds, and `withdraw_fees()` moves only from that vault to the market authority. The lending reserve keeps its share in `accumulated_program_fees`, which the exchange rate subtracts before valuing a supplier's shares, so collecting it changes nothing a supplier is owed. A rebalance swaps one asset for another through the router the fund recorded at creation, with a minimum output from the oracle, and the betting market pays each winner by formula through `claim_winnings()`, at the fee fixed when the event was created. When that holds in your program, say it in those words rather than claiming "non-custodial": the deployed program sets the rules, and the operator is not in them.
- **Give a pause two levels, and let only the second stop withdrawals.** The first level refuses new deposits and new positions and leaves withdrawals running, so it protects users during an incident without trapping their deposits. The order book's `pause_market()` is a first level: it stops `place_order()` and leaves `cancel_order()`, `settle_funds()`, and `withdraw_fees()` running. The prop AMM's `paused` flag, set through `set_quote()`, does the same for `swap()`. The second level stops withdrawals too, for the incident where the bug is in a withdrawal handler, since stopping that handler is the only way to stop the loss before a fix ships.
- **Bound the second level so it cannot become a lockup.** Give it to a stricter authority than the first, such as a multisig that needs more signers, and make it expire on its own after a fixed time written into the program. A halt can then delay withdrawals but never end them, and once it expires every participant can get their assets out of every state again.
- **Plan for the admin going silent.** Let nothing a user does wait on the operator: a deposit, a withdrawal, or canceling their own offer runs without an admin signature. The order book's `withdraw_fees()` succeeds as a no-op when the fee vault is empty, as the *Order Book Exchange* chapter says, so a scheduled job can call it unattended. And plan for what happens if the price feed stops publishing. The lending market reads a price only where a debt is at stake: `redeem_reserve_collateral()` takes no price feed, and `withdraw_obligation_collateral()` reads none when the borrower owes nothing (`debt_free_withdraw_needs_no_price_and_no_refresh`). A borrower can repay, which reads no price either, and then take their collateral out (`withdraw_after_full_repay_needs_no_price`).
- **Make upgrade authority trustworthy.** Ship fixes through a multisig with named holders rather than a single private key on one person's laptop, and say so where users can read it. A user who reads that knows a change to the code takes several named people to sign, and that one stolen laptop cannot ship one.
- **Keep each private key where losing it is survivable.** The private key that signs routine operations, like the order book's `withdraw_fees()`, lives in a hot wallet holding only what those operations need, and the treasury stays in cold storage. Back up every production private key, because a lost one takes its powers with it permanently, and generate new ones for mainnet rather than reusing the ones you tested with on devnet.

## Ship to Mainnet With a Second Opinion and a Verified Build

Before a program that holds other people's assets touches mainnet, get a **second-opinion audit**: an independent reviewer, unattached to the team, checking your code against the *Adversary* chapter's exploit classes. An auditor hunts for the same holes an attacker would, and hands you the list instead of draining the program.

An audit reviews one commit of your source code, but users run whatever program is deployed. A **verified build** connects the two. The program is built in a container that produces the same bytes from the same source every time, so anyone can rebuild that commit and check that the result matches the program onchain. The `solana-verify` tool does the build and the comparison, and records the repository and commit onchain, so explorers can show the program as verified.[^solana-verify] Publish the audit report with the commit it covered, and the verified build shows users that commit is the code they are running. Verify again after every upgrade, because each one replaces the bytes.

## Monitoring Tells You What the Program Is Doing After Launch

Tests and audits check a program before it holds anything. Once it is live, the questions change: is someone using the admin's private key, are funds leaving faster than usual, and has something offchain stopped? A **monitor** reads every transaction that touches your program, decodes it, and sends an alert when one matches a rule you wrote. Write rules for three things:

- **Every admin action.** The specification above lists what the admin's private key can sign for, and a monitor tells you each time it does: the order book's `withdraw_fees()`, the prop AMM's `set_quote()`, the betting market's `settle_event()`. Whether its holder signed or someone who stole the private key did, the team hears about it within seconds rather than from users.
- **Unusual movements out of the vaults.** A withdrawal far larger than usual, or a burst of `liquidate_obligation()` calls in the lending market, is either a market moving fast or an attack in progress, and both need a person looking.
- **Refusals, counted by reason.** A program's errors record what it refused and why. A run of `StalePriceFeed` refusals from the lending program usually means the price feed has stopped updating, and without an alert nobody notices until a user complains.

A monitor can check invariants against the live chain, too. The fundraiser's vault must never hold less than its `current_amount` until the maker claims, and a monitor that reads both values checks that on every transaction, long after the test suite last ran.

Solana Microscope, which the Solana Foundation publishes as open source, is one such monitor.[^microscope] It reads the transactions for one program, decodes each instruction using the program's interface definition (its IDL, the file Anchor generates listing every handler and account), and sends alerts to Slack, Telegram, or PagerDuty. A rule names an instruction and sets conditions on its fields, so "alert whenever `withdraw_fees()` succeeds" is a single rule. It can also follow a Squads multisig, such as the one holding your upgrade authority.

## What You Learnt

- Bugs live at numerical boundaries, so push your test suite to every one: the mirror image of every flow, both sides of every limit, every attack by name, and invariants as well as account values.
- Model checking goes further than testing: invariant tests at the values you choose, then a model checker over every value the arithmetic core can take, and how far to go is set by how much the program's vaults will hold.
- A program cannot see whether its own block is final, so whatever reads the chain chooses a commitment level. A bot deciding which transaction to send next reads at `processed`, and a backend that pays out fiat or tells a customer their payment arrived waits for `finalized`.
- Write admin power down as a specification: bounded config, snapshotted terms, and no path to user deposits. Give a pause two levels: the first stops deposits and trades, and the second, which expires on its own, stops withdrawals too. Make sure nothing a user does waits on the operator, and give upgrade authority to a named multisig. Keep routine private keys in hot wallets holding only what they need, the treasury in cold storage, and a backup of every production private key.
- Ship with a second-opinion audit, and a verified build that ties the deployed bytes to the audited commit.
- Monitor the program once it is live: alert on every admin action, on unusual movements out of the vaults, and on refusals counted by reason, and check invariants against the live chain.

[^kani]: Kani is a Rust model checker, at [github.com/model-checking/kani](https://github.com/model-checking/kani).

[^solana-verify]: `solana-verify` is at [github.com/solana-foundation/solana-verifiable-build](https://github.com/solana-foundation/solana-verifiable-build).

[^percolator]: Percolator's README, at [github.com/aeyakovenko/percolator](https://github.com/aeyakovenko/percolator/blob/master/README.md), lists the four guarantees its proofs cover; the *Perpetual Futures* chapter's invariants use its names.

[^microscope]: Solana Microscope is at [github.com/solana-foundation/solana-microscope](https://github.com/solana-foundation/solana-microscope).

[^commitment-levels]: The commitment levels, and what each one guarantees, are documented in Anza's commitment reference at [docs.anza.xyz/consensus/commitments](https://docs.anza.xyz/consensus/commitments).

[^confirmed]: A third level, `confirmed`, existed under Tower BFT, the consensus mechanism Alpenglow replaced; under Alpenglow, `confirmed` means the same as `finalized`: Brennan Watt of Anza, in a message to the author on August 28, 2026.
