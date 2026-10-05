# Building Financial Software on Solana

## Prelude

[Copyright](prelude/copyright.md), [dedication](prelude/dedication.md), [about the author](prelude/about-the-author.md), [about the technical reviewers](prelude/about-the-technical-reviewers.md), and the [epigraph](prelude/epigraph.md).

## [Chapter 1: Introduction](prelude/introduction.md)

## Part I: The Fundamentals

### Solana Building Blocks

- [Chapter 2: The Core Building Blocks of Solana](solana-building-blocks/accounts-and-instruction-handlers.md) - keys, accounts, rent, programs, instruction handlers, and atomic transactions
- [Chapter 3: Tokens](solana-building-blocks/tokens.md)
- [Chapter 4: PDAs: How Solana Programs Find Their Data](solana-building-blocks/pdas.md) - derived addresses, key/value storage, and program custody
- [Chapter 5: Time](solana-building-blocks/time.md)

### Financial Programming Concepts in Solana

- [Chapter 6: State Machines](financial-programming-concepts-in-solana/intro.md) - financial software is a state machine
- [Chapter 7: The Arithmetic of Money](financial-programming-concepts-in-solana/the-arithmetic-of-money.md) - integers, scale, rounding, and interest
- [Chapter 8: Offchain Truth](financial-programming-concepts-in-solana/offchain-truth.md) - how real-world facts (prices, event outcomes, anything the chain cannot see) get onchain, and how a program verifies them
- [Chapter 9: The Adversary](financial-programming-concepts-in-solana/the-adversary.md) - how onchain money gets stolen, exploit class by exploit class
- [Chapter 10: Operating Financial Software](financial-programming-concepts-in-solana/operating-financial-software.md) - testing money, wielding admin power safely, and monitoring a live program

## Part II: Building Financial Products in Solana

Each chapter explains one complete, tested program from the [companion repository](https://github.com/quicknode/solana-program-examples).

- [Chapter 11: Escrow](building-financial-products-in-solana/escrow.md) - two strangers swap without trusting each other
- [Chapter 12: The Fundraiser](building-financial-products-in-solana/fundraiser.md) - onchain crowdfunding
- [Chapter 13: The Betting Market](building-financial-products-in-solana/betting-market.md) - a parimutuel pool with no bookmaker
- [Chapter 14: The Order Book Exchange](building-financial-products-in-solana/order-book.md) - a traditional NYSE/NASDAQ/CME style exchange
- [Chapter 15: The Constant-Product AMM](building-financial-products-in-solana/constant-product-amm.md) - instant swaps priced by a formula
- [Chapter 16: The Prop AMM](building-financial-products-in-solana/prop-amm.md) - a market maker quoting its own capital at oracle prices
- [Chapter 17: Lending and Borrowing](building-financial-products-in-solana/lending.md) - deposits, collateral, interest, liquidation, and cranks
- [Chapter 18: The Managed Fund](building-financial-products-in-solana/managed-fund.md) - an onchain mutual fund, which some Solana platforms call a "vault"
- [Chapter 19: Options](building-financial-products-in-solana/options.md) - calls and puts, fully collateralized and physically settled
- [Chapter 20: Perpetual Futures](building-financial-products-in-solana/perpetual-futures.md) - leveraged bets on a price, and the last of the ten programs

## [Chapter 21: Where to Go From Here](conclusion/where-to-go-from-here.md)

## [Glossary](appendices/glossary.md)

## Postlude

[Acknowledgements and credits](postlude/acknowledgements.md).
