# Building Financial Software on Solana

## Prelude

[Praise](prelude/praise.md), [dedication](prelude/dedication.md), [acknowledgements](prelude/acknowledgements.md), [about the author](prelude/about-the-author.md), and [about the technical reviewers](prelude/about-the-technical-reviewers.md).

## [Introduction](prelude/introduction.md)

## Solana Building Blocks

- [The core building blocks of Solana](solana-building-blocks/accounts-and-instruction-handlers.md)
- [Tokens are accounts: mints define them, token accounts hold them](solana-building-blocks/tokens.md)
- [PDAs are addresses a program can sign for](solana-building-blocks/pdas.md)
- [Accounts pay a rent deposit, and closing refunds it](solana-building-blocks/rent.md)
- [A transaction happens entirely or not at all](solana-building-blocks/atomicity.md)
- [Slots for adversarial logic, timestamps for humans](solana-building-blocks/time.md)
- [Cranks pay someone to do the work nobody owns](solana-building-blocks/cranks.md)

## Financial Programming Concepts in Solana

- [Financial software is a state machine](financial-programming-concepts-in-solana/intro.md), and every state needs an exit.
- [The Arithmetic of Money](financial-programming-concepts-in-solana/the-arithmetic-of-money.md) - integers, scale, rounding, and interest
- [Offchain Truth](financial-programming-concepts-in-solana/offchain-truth.md) - how real-world facts (prices, event outcomes, anything the chain cannot see) get onchain, and how a program verifies them
- [The Adversary](financial-programming-concepts-in-solana/the-adversary.md) - how onchain money gets stolen, exploit class by exploit class
- [Operating Financial Software](financial-programming-concepts-in-solana/operating-financial-software.md) - testing money, and wielding admin power safely

## Building Financial Products in Solana

Each chapter walks one complete, tested program from the [companion repository](https://github.com/quicknode/solana-program-examples).

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
- [Glossary](appendices/glossary.md)
- Index (print edition)
