# Building Financial Software on Solana

## Prelude

[Praise](prelude/praise.md), [dedication](prelude/dedication.md), [acknowledgements](prelude/acknowledgements.md), [about the author](prelude/about-the-author.md), and [about the technical reviewers](prelude/about-the-technical-reviewers.md).

## [Introduction](prelude/introduction.md)

What this book is, who it is for, why it exists in the age of AI, and the fastest path through it for what you came to do.

## Solana Building Blocks

[Solana Building Blocks](solana-building-blocks/solana-building-blocks.md) is everything Solana-mechanical the rest of the book stands on: accounts, tokens, PDAs, rent, atomic transactions, time, and cranks.

## Financial Programming Concepts in Solana

- [Financial software is a state machine](financial-programming-concepts-in-solana/intro.md), and every state needs an exit.
- [The Arithmetic of Money](financial-programming-concepts-in-solana/the-arithmetic-of-money.md) - integers, scale, rounding, and interest
- [Offchain Truth](financial-programming-concepts-in-solana/offchain-truth.md) - how real-world facts (prices, event outcomes, anything the chain cannot see) get onchain, and how a program verifies them
- [The Adversary](financial-programming-concepts-in-solana/the-adversary.md) - how onchain money gets stolen, exploit class by exploit class
- [Operating Financial Software](financial-programming-concepts-in-solana/operating-financial-software.md) - testing money, and wielding admin power safely

## Building Financial Products in Solana

Each chapter walks one complete, tested program from the [companion repo](https://github.com/quicknode/solana-program-examples).

- [Escrow](building-financial-products-in-solana/escrow.md) - two strangers swap without trusting each other
- [Token Fundraiser](building-financial-products-in-solana/token-fundraiser.md) - onchain crowdfunding
- [The Order Book Exchange](building-financial-products-in-solana/order-book.md) - a traditional NYSE/NASDAQ/CME style exchange
- [The Constant-Product AMM](building-financial-products-in-solana/constant-product-amm.md) - instant swaps priced by a formula
- [The Betting Market](building-financial-products-in-solana/betting-market.md) - a parimutuel pool with no bookmaker
- [Lending and Borrowing](building-financial-products-in-solana/lending.md) - deposits, collateral, interest, and liquidation
- [The Vault Strategy](building-financial-products-in-solana/vault-strategy.md) - an onchain index fund
- [Perpetual Futures](building-financial-products-in-solana/perpetual-futures.md) - leveraged bets on a price; the capstone

## Appendices

- [The Invariant Checklist](appendices/invariant-checklist.md)
- [Terminology](appendices/terminology.md)
- Index (print edition)
