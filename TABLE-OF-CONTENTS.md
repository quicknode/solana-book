# Building Financial Software on Solana

## Opening Pages

- [Praise for Building Financial Software on Solana](opening-pages/praise.md)
- [Dedication](opening-pages/dedication.md)
- [Acknowledgements and Credits](opening-pages/acknowledgements.md)
- [About the Author](opening-pages/about-the-author.md)
- [About the Technical Reviewers](opening-pages/about-the-technical-reviewers.md)
- [How to Use This Book](opening-pages/how-to-use-this-book.md)

## Solana Building Blocks

[Solana Building Blocks](solana-building-blocks/solana-building-blocks.md) is everything Solana-mechanical the rest of the book stands on: accounts, tokens, PDAs, rent, atomic transactions, time, and cranks.

## Financial Programming Concepts in Solana

- [Financial software is a state machine](financial-programming-concepts-in-solana/intro.md), and every state needs an exit.
- [The Arithmetic of Money](financial-programming-concepts-in-solana/the-arithmetic-of-money.md) is how programs calculate with funds and never lose a minor unit: integers, scale, rounding, and interest.
- [Offchain Truth](financial-programming-concepts-in-solana/offchain-truth.md) is how a program verifies the price of SOL: by verifying a signature from a trusted source.
- [The Adversary](financial-programming-concepts-in-solana/the-adversary.md) is how onchain money actually gets stolen, exploit class by exploit class.
- [Operating Financial Software](financial-programming-concepts-in-solana/operating-financial-software.md) is how to test money and wield admin power safely.

## Building Financial Products in Solana

Each chapter walks one complete, tested program from the [companion repo](https://github.com/quicknode/solana-program-examples), end to end.

- [Escrow](building-financial-products-in-solana/escrow.md) lets two strangers swap without trusting each other, and it is the pattern inside everything else.
- [Token Fundraiser](building-financial-products-in-solana/token-fundraiser.md) is onchain crowdfunding: targets, deadlines, and refund paths.
- [The Order Book Exchange](building-financial-products-in-solana/order-book.md) matches bids and asks the way NASDAQ does, with lots, ticks, and taker fees.
- [The Constant-Product AMM](building-financial-products-in-solana/constant-product-amm.md) fills every trade instantly against a pooled formula, and pays its liquidity providers for the privilege.
- [The Betting Market](building-financial-products-in-solana/betting-market.md) pays winners from the losers' pool, pro rata by conviction, with no bookmaker.
- [Lending and Borrowing](building-financial-products-in-solana/lending.md) is a bank built from a growing interest index, marked-to-market collateral, and a liquidation engine.
- [The Vault Strategy](building-financial-products-in-solana/vault-strategy.md) is an index fund whose manager can rebalance and earn a fee, and can do nothing else.
- [Perpetual Futures](building-financial-products-in-solana/perpetual-futures.md) is the capstone: leverage, margin, funding, and liquidation, using everything above at once.

## Appendices

- [The Invariant Checklist](appendices/invariant-checklist.md)
- [Terminology](appendices/terminology.md)
- [The Visual Language](appendices/visual-language.md)
- Index (print edition)
