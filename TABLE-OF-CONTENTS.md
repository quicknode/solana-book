# Building Financial Software on Solana

Working title. "Definitive" and "canonical" are labels readers award. They never appear on the cover.

## Opening Pages

- [Praise for Building Financial Software on Solana](chapters/praise.md)
- [Dedication](chapters/dedication.md)
- [Acknowledgements and Credits](chapters/acknowledgements.md)
- [About the Author](chapters/about-the-author.md)
- [About the Technical Reviewers](chapters/about-the-technical-reviewers.md)

## [How to Use This Book](chapters/how-to-use-this-book.md)

Why long-lived fundamentals books exist and why this is one; what lives in the book versus the CI-verified companion repo; the seven-beat anatomy of every program chapter; War Stories; reading paths.

## [Solana Building Blocks](chapters/solana-building-blocks.md)

Everything Solana-mechanical the rest of the book stands on:

- Money lives in accounts, logic lives in instruction handlers
- Tokens: mints, token accounts, and minor units
- The token extensions that matter for finance
- PDAs: addresses a program can sign for
- Rent and the account lifecycle
- One transaction, all or nothing: atomicity, flash loans, and composed settlement
- Time onchain: slots for adversarial logic, timestamps for humans
- Cranks: incentivized automation for work nobody owns

## [Financial Programming Concepts in Solana](chapters/financial-programming-concepts.md)

Everything money-specific, from arithmetic to the adversary:

- Financial software is a state machine, and every state needs an exit
- Money is integers: no floats near funds
- Minor units, lots, and fixed-point scale
- Multiply before divide, with wider intermediates
- Rounding is a policy decision (*War Story: the SPL token-lending rounding bug, about $2.6B at risk*)
- Invariants and conservation: assert after the math
- Interest and growth over time
- Offchain truth: verifying signatures from trusted sources
- The adversarial environment
- Validation: signers, owners, and the confused deputy (*War Stories: Cashio, Wormhole*)
- The empty pool: inflation and donation attacks
- Price manipulation (*War Story: Mango Markets*)
- Rounding and precision exploits (*War Stories: the Hundred and Sonne precision drains*)
- Ordering and composability: CPI trust boundaries
- Testing financial software: test the branch the bug lives in
- Admin power, pausing, and upgrades

## The Financial Software

Each chapter walks one complete, tested program from the [companion repo](https://github.com/quicknode/solana-program-examples) through the same seven beats: concept, account model, instruction handlers, the math, the invariants, the failure modes, the test that catches the bug.

- [Escrow](chapters/escrow.md) - atomic two-party settlement; the best first program *(finance/escrow)*
- [Token Fundraiser](chapters/token-fundraiser.md) - targets, deadlines, refund paths; onchain crowdfunding *(finance/token-fundraiser)*
- [The Constant-Product AMM](chapters/constant-product-amm.md) - pools, liquidity providers, slippage, the K invariant *(finance/token-swap)*
- [The Order Book Exchange](chapters/order-book.md) - bids, asks, matching, maker and taker fees, lots and ticks *(finance/order-book)*
- [Vaults and Share Accounting](chapters/vault-strategy.md) - deposits for shares, NAV, management fees via dilution *(finance/vault-strategy)*
- [Lending and Borrowing](chapters/lending.md) - interest accrual, collateral, liquidation *(finance/lending)*
- [The Betting Market](chapters/betting-market.md) - parimutuel pools, outcome settlement, fee splits *(finance/betting-market)*
- [Perpetual Futures](chapters/perpetual-futures.md) - the capstone: leverage, margin, mark and index prices, funding, liquidation *(finance/perpetual-futures)*

## Appendices

- [The Invariant Checklist](chapters/invariant-checklist.md) - the one-page rules, distilled from the Solana Finance plugin skill
- [Terminology](chapters/terminology.md) - the [solana.com terminology reference](https://solana.com/docs/references/terminology) extended with the financial vocabulary it lacks: lot, tick size, minor unit and major unit, WAD, basis point, dust, Newton's method (integer square root), maker and taker, NAV, slippage, notional, funding rate, mark price and index price, collateral factor, liquidation
- [The Visual Language](chapters/visual-language.md) - the diagram conventions used throughout
- Index (print edition placeholder)
