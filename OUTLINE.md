# Building Financial Software on Solana

Working title. "Definitive" and "canonical" are labels readers award. They never appear on the cover.

## Opening Pages

- **Praise for Building Financial Software on Solana** (placeholder)
- **Dedication** (placeholder)
- **Acknowledgements and Credits** (placeholder, grows with the pre-print feedback loop)
- **About the Author** (draft below)
- **About the Technical Reviewers** (placeholder until reviewers are recruited)

### About the Author (draft)

Mike MacCana leads Solana content at QuickNode. He built the Solana Foundation developer courses, the highest-retention content on solana.com, and co-created and presented the Solana Foundation Developer Bootcamp 2024, watched 350,000 times on YouTube. His four-day Solana training program for the Solana Foundation has been taught to hundreds of students from Romania to US Ivy League universities. He is a top ten member of Solana StackExchange, the author of solana-helpers (25,000 downloads a week) and Kite, and a two-time Solana Sandstorm award winner for Portal Payments. Before Solana, Mike worked at Google, Microsoft, and Red Hat, founded CertSimple, was the first engineering hire at Humanloop (acquired by Anthropic), and is in the top 0.1% of developers worldwide on Stack Overflow. He lives in New York City.

## How to Use This Book

- Why a book, and why this book: the fundamentals-title tradition of TCP/IP Illustrated, the UNIX and Linux System Administration Handbook, and Mastering Bitcoin. These books last because they teach the layer that does not change: the mental models, the math, the adversary.
- What this book is about: building software **on** Solana. Plenty of good material already explains how the chain itself is built and run, from consensus to validators to Proof of History; community maps of the ecosystem's content, like [solana-awesome](https://github.com/helius-labs/solana-awesome), show how much of it there is. This book is about the other thing: what a developer writes.
- What lives where: the book holds the durable layer. Runnable, current code lives in the CI-verified companion repo, [Solana Program Examples](https://github.com/quicknode/solana-program-examples), and the [Solana Finance plugin](https://github.com/quicknode/solana-finance-claude-plugin). Where framework details appear in the book they are illustrations, and the repo is the source of truth.
- The chapter anatomy: every chapter in Part V follows the same seven beats. **Concept, account model, instruction handlers, the math, the invariants, the failure modes, the test that catches the bug.**
- **War Stories**: real incidents dissected inside the chapter where their lesson lives, in a recurring boxed feature. History does not go stale.
- Pointers to the terminology reference (Appendix B) and the diagram conventions (Appendix C).

## Part I - How Financial Software Becomes a Solana Program

The representation layer: turning a financial idea into accounts and instruction handlers.

1. **Money as State, Logic as Instruction Handlers** - the account model as a data model; why financial state is accounts, not contract storage.
2. **Solana Building Blocks** - the asset layer: mints, token accounts, associated token accounts, decimals, mint and freeze authority, and the token extensions that matter for finance (transfer fees, transfer hooks, confidential transfers, permanent delegate, interest-bearing, non-transferable). Transaction atomicity as a financial primitive: flash loans, atomic pay-and-settle across programs. Cranks: permissionless, incentivized automation for the work no user has a reason to do, like funding settlement, expiry processing, and matching.
3. **Instruction Handlers: The API of Money** - designing the verbs (deposit, settle, cancel, liquidate); one handler, one state transition.
4. **PDAs, Authority, and Who May Sign** - deterministic addresses; recording who may move funds and verifying it on the way out.
5. **Rent and the Account Lifecycle** - rent exemption, account growth, closing and reclaiming; stranded-funds bugs.
6. **Financial Software as State Machines** - created, funded, settled, cancelled, liquidated; the rule that every state needs an exit.

## Part II - The Arithmetic of Money

The safe-calculation layer: the part AI and humans most often get subtly wrong.

7. **Why Integers** - determinism across validators; money is discrete; never floats, never `powf`.
8. **Multiply Before Divide** - wider intermediates (`u128`, `U256`), phantom overflow, and the hand-rolled Newton's-method integer square root.
9. **Fixed Point and Scale** - minor units and major units; WAD representation; tracking decimals; never hard-coding `10^9`.
10. **Rounding Is a Policy Decision** - round against the user; dust ownership; floor for credit, ceil for debt. *War Story: the SPL token-lending rounding bug, about $2.6B at risk, fixed by changing `round` to `floor`.*
11. **Invariants and Conservation** - K must not decrease; total in equals total out; assert after the math, not just before.
12. **Interest and Growth Over Time** - cumulative-index accrual, exponentiation by squaring, discrete vs continuous compounding, the binomial-approximation tradeoff.

## Part III - Offchain Truth

How facts from outside the chain get onto it, and how a program verifies them. Deliberately placed before Part V, because several of those programs are built on this.

13. **Defining Offchain Truth** - how a program verifies the price of SOL: by verifying a signature from a trusted source. Oracles are signed publications of offchain facts; the program checks the signature, the publisher, the freshness, and the confidence interval, exactly as it checks any other input. Trust is an engineering parameter: who signs, what it costs them to lie, how stale is too stale, and what the program does when publication stops. Choosing publishers (specific products are conventions and live in the companion repo).
14. **Time Onchain** - slots vs unix timestamps; why adversarial logic counts slots; deadlines, expiry, and grace periods.

## Part IV - The Adversary

The threat model. Exploit classes recur for a decade while APIs churn.

15. **The Adversarial Environment** - cheap transactions, industrialized off-by-ones, MEV, sandwiching, slippage.
16. **Validation: Signers, Owners, and the Confused Deputy** - the account-substitution attacks that never go away. *War Stories: Cashio (unvalidated account chain, $52M); Wormhole (bypassed signature verification, $325M).*
17. **The Empty Pool: Inflation and Donation Attacks** - first-depositor share math and its defenses: virtual shares, dead shares, minimum deposits.
18. **Price Manipulation** - attacking the inputs a program trusted (builds directly on Defining Offchain Truth); spot prices vs time-weighted and confidence-aware feeds. *War Story: Mango Markets ($116M, self-described as "a highly profitable trading strategy").*
19. **Rounding and Precision Exploits** - the recurring drain class end to end. *War Stories: the Hundred and Sonne precision drains on emptied markets.*
20. **Ordering and Composability** - checks-effects-interactions; CPI trust boundaries; what another program can do mid-transaction. The threat-model counterpart to the atomicity superpowers in Solana Building Blocks.

## Part V - The Financial Software

The backbone of the book. Each chapter walks one complete, tested program from the companion repo through the same seven beats (concept, account model, instruction handlers, the math, the invariants, the failure modes, the test that catches the bug), with War Stories inline where an incident matches the program.

21. **Escrow** - atomic two-party settlement; the best first program. *(finance/escrow)*
22. **Token Fundraiser** - targets, deadlines, refund paths; onchain crowdfunding. *(finance/token-fundraiser)*
23. **The Constant-Product AMM** - pools, liquidity providers, slippage, the K invariant. *(finance/token-swap)*
24. **The Order Book Exchange** - bids, asks, matching, maker and taker fees, lots and ticks. *(finance/order-book)*
25. **Vaults and Share Accounting** - deposits for shares, NAV, management fees; the inflation attack in practice. *(finance/vault-strategy)*
26. **Lending and Borrowing** - interest accrual via the cumulative-rate index (Interest and Growth Over Time in practice), collateral, liquidation. *(finance/lending)*
27. **The Betting Market** - parimutuel pools, outcome settlement, fee splits; resolution as an offchain-truth question (Defining Offchain Truth in practice). *(finance/betting-market)*
28. **Perpetual Futures** - the capstone: leverage, margin, mark vs index price, funding payments, liquidation. Uses everything: fixed point, offchain truth, time, the adversary. *(finance/perpetual-futures)*

## Part VI - Operating Financial Software

29. **Testing Financial Software** - test the branch the bug lives in; both directions of symmetric flows; nonzero, asymmetric values; property-based invariants (conservation, monotonicity, never rounds in the user's favour); state built through real instruction handlers, not fixtures.
30. **Admin Power, Pausing, and Upgrades** - financially-safe config validation; upgrade authority as a normal, honest part of Solana; escape hatches for when a price feed dies or a counterparty vanishes.

## Appendices

- **Appendix A: The Invariant Checklist** - the one-page rules, distilled from the Solana Finance plugin skill.
- **Appendix B: Terminology** - the [solana.com terminology reference](https://solana.com/docs/references/terminology) as the base (account, instruction, lamport, slot, epoch, PDA, rent, CPI, and the rest), extended with the financial vocabulary that reference lacks: lot, tick size, minor unit and major unit, WAD, basis point, dust, Newton's method (integer square root), maker and taker, NAV, slippage, notional, funding rate, mark price and index price, collateral factor, liquidation.
- **Appendix C: The Visual Language** - the diagram conventions used throughout: account-relationship maps, state machines, transaction and CPI flow, and the War Story box format.
- **Index** (print edition placeholder)
