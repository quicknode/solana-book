# Chapter 1: Introduction

It might seem strange to release a book - let alone one available in a physical form - for building financial software on Solana. Countless YouTube videos, articles and online courses cover how Solana is built, including topics like consensus, validators, and Proof of History: [Anza's documentation](https://docs.anza.xyz/) is by far the best source for these matters. Most of the existing materials go into the basics of minting and moving tokens.

This isn't a book about how Solana is built. It's about **building on the Solana platform**. We're aiming for it to be the essential reference for creating financial products on the world's most active blockchain.

## Why Build Financial Programs on Solana?

Financial products built on Solana have properties no traditional rail offers:

- **Markets are tradable 24 x 7.** No opening bell, no weekend close, no holiday calendar.
- **Settlement is instant, across the globe.** A trade and its settlement are the same event, whether the two parties are in the same city or on different continents.
- **Transactions cost a fraction of a penny**, regardless of the size of the transfer.
- **Blockchains can move assets of any kind.** Traditional "crypto" assets like BTC and SOL, and real-world assets (RWAs): commodities, equities, real estate, and exotics. As of mid-2026, Solana is the most popular chain for RWA trading.

## Institutions Are Adopting the Primitives, Not the Philosophy

For years the standard story was that traditional finance and DeFi would converge into a single elegant hybrid. What is actually happening, as a16z crypto's essay [*TradFi doesn't want DeFi. It wants blockchain.*](https://x.com/a16zcrypto/status/2077098776003543381) lays out, is more selective: **an institution adopts a blockchain primitive when it improves cost, risk, or distribution, and stays compatible with the institution's requirements for control and accountability.** JPMorgan settles institutional deposits on a permissioned blockchain. BlackRock and Franklin Templeton run tokenized money market funds. SWIFT frames tokenized assets as a way for existing institutions to coordinate better. None of these firms embraced decentralization; each found better plumbing for something it already does. Stablecoins are the clearest example: banks, payment providers, and fintechs move dollars on them because they are faster settlement infrastructure, not because they signed up for permissionless finance.

The primitives passing that adoption test are the material of this book:

| Primitive institutions adopt | What it buys them | Where this book teaches it |
|---|---|---|
| Atomic settlement | The trade and its settlement become one event, erasing counterparty risk and freeing the collateral parked against unsettled trades | The Core Building Blocks of Solana |
| A shared ledger | Reconciliation, the back office's largest hidden cost, becomes a non-event | The Core Building Blocks of Solana |
| Programmable money | Coupon payments, margin calls, and corporate actions run as code instead of chains of manual instructions | Tokens, and every program chapter |
| Tokenized funds | Fund subscription and yield distribution become token mints, transfers, and burns | The Vault Strategy |
| AMM curve math | A pricing engine for onchain FX and tokenized fund NAVs | The Constant-Product AMM |
| Collateralized lending | Credit strategies that run on shared, inspectable rails | Lending and Borrowing |

What institutions discard is just as predictable: open access, pseudonymity, and execution nobody can pause, the properties that deliver value only by removing institutional control. The result is a category the essay calls **programmable financial infrastructure**: financial products built on blockchain rails and shaped around institutional constraints like KYC, sanctions screening, and the ability to freeze assets and identify counterparties. Some of it consumes crypto-native infrastructure directly. Apollo's ACRED fund, for example, runs part of its onchain lending strategy through Morpho, a lending protocol born in DeFi and repackaged with institutional distribution and compliance.

This means there are two markets for what this book teaches, not one. Open networks reward permissionless access, composability, and liquidity; institutions reward compliance, controls, and fit with existing workflows. They are different businesses with different customers, but they run on the same rails, and innovation flows in one direction: every primitive institutions are adopting today, from atomic settlement to AMM math, was invented on open networks first. Whichever market you build for, the accounts, tokens, math, and checks in these pages are the layer both markets share.

## A Long-Lived Technical Book for Solana

Some technical books die with the release they document. A smaller number live for decades. *TCP/IP Illustrated* is still the book network engineers hand each other, thirty years on. *The UNIX and Linux System Administration Handbook* has outlasted every operating system release it ever mentioned. *Mastering Bitcoin* remains the standard text on its subject. What these books share is a decision about altitude: they teach the layer that does not change. Packets still flow the way Stevens drew them. Processes still fork on Unix and Linux. The mental models survive even as every command-line flag dies. This book provides the same long term knowledge for building financial products on Solana.

Solana is a fast-moving space: framework releases, tool versions, and the Solana API are known to churn. A book that prints them is wrong within a year, and financial software is the worst possible place to learn from stale material.

*Building Financial Software on Solana* teaches the durable layer: **how financial ideas become Solana programs, implemented as accounts, instruction handlers, signatures, oracles, checks and math.** The account model has been stable since Solana launched. The math will not change. Nor will the desire of adversaries to seize your assets.

In this book you'll learn how each of the classic financial products actually works, how to handle assets without losing a lamport, what to verify and how to prove your program works. These long term concepts are what this book is for.

## Why Write a Book in the Age of AI?

AI can write a Solana program on request, and this book's own companion AI skill, introduced below, exists to make it do so correctly.

**No AI can understand a program on your behalf.** The value of this book is the knowledge it leaves in your head: how financial products exist on Solana, as programs, instruction handlers, accounts, seeds, tests, and proofs, so you can design your own programs, understand their implementation, incentives and trust decisions, and have confidence in what you have built. After reading it, you will be able to:

- Design programs
- Understand existing programs
- Iterate with your AI as a peer
- Understand the economic incentives of your programs
- Be responsible for the programs you have created

The book splits the work with two companions. Both are available at [thesolanabook.com](https://thesolanabook.com):

- The **companion repository** holds the complete, tested programs that the program chapters walk through, in Anchor and Quasar versions, with a native Rust version of the escrow. Tests are run continuously, so the code stays correct and current in a way paper cannot.
- The **companion AI skill** distills this book's rules into a form AI coding tools apply automatically.

The AI skill makes your tools better. The book makes you better.

Framework-specific code is kept in the companion repository. Where code appears in these pages, it is there to illustrate an idea, and the companion repository is the source of truth for running it. When the two disagree, trust the companion repository, and check the errata page at [thesolanabook.com](https://thesolanabook.com).

## Prerequisites

This book assumes deep familiarity with neither Solana nor finance, and covers both in enough detail to work from either side with confidence.

Every Solana mechanism is introduced before it is used, starting from the basics of users, accounts, programs, and data. Every financial concept (escrow, collateral, liquidation, market making, interest) is explained from first principles, with the personas and dollar amounts on the page, before any code depends on it.

Code here is given in Rust, Solana's primary programming language. The Rust is explained as it appears, and the programs are deliberately small. If you can read a Rust struct and a function, you can read the program chapters.

The diagrams throughout the book share one set of conventions, and each convention is explained by the first figure that uses it.

## Programs Follow Patterns, Patterns Build Understanding

The book has two foundation chapters and nine program chapters. **Building Blocks** is everything Solana-mechanical: accounts, tokens, PDAs, rent, atomicity, and time. **Financial Programming Concepts** is everything money-specific: the arithmetic, offchain truth, the adversary, testing, and admin power.

Then every program chapter walks one complete financial program. Incentives for admins and individual users are discussed, and we show how individual instruction handlers modify onchain state on behalf of their users.

Real incidents appear throughout the book in boxed **War Story** sections: in The Arithmetic of Money, the rounding bug that put about $2.6B at risk; in The Adversary, the Mango Markets incident. History does not go stale, which makes these among the most durable pages in the book, and none of them are told to dunk on the teams involved - the point is the awareness.

To keep the money easy to track, every character starts every chapter with the same wallet: **one SOL** for rent deposits and transaction fees, **one thousand USDC**, and whatever story-specific assets the chapter hands them (a share grant, a stock position, a token inventory). When larger sums move, they belong to a firm's treasury or to a crowd, and the chapter says so.

Like *TCP/IP Illustrated*, this book teaches a way of thinking. Over time, you'll notice the same patterns and turn knowledge into understanding and habit.

## Where to Start, Depending on What You Came For

Reading front to back works: the parts are ordered so that each one uses only what came before. But the book is built to be entered anywhere, so a few honest shortcuts:

- **Already building on Solana?** Skim [Solana Building Blocks](../TABLE-OF-CONTENTS.md#solana-building-blocks), read [Financial Programming Concepts in Solana](../financial-programming-concepts-in-solana/intro.md) properly, then take the [program chapters](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana) in order.
- **Here to ship one specific thing?** Read [The Arithmetic of Money](../financial-programming-concepts-in-solana/the-arithmetic-of-money.md) and [Offchain Truth](../financial-programming-concepts-in-solana/offchain-truth.md), then go straight to [your program chapter](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana). Each program chapter names the sections it leans on.
- **Auditing or reviewing?** [The Adversary](../financial-programming-concepts-in-solana/the-adversary.md) first, then the [program chapter](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana) matching what is in front of you. Always get a second-opinion audit before releasing a Solana program to mainnet.

## An Appendix Meant to Be Worn Out: the Glossary

The Glossary is a full vocabulary for Solana-based financial products, covering both the technical and financial vocabulary this field uses daily. When a term in a chapter surprises you, it is defined there.
