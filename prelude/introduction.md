# Chapter 1: Introduction

It may seem odd to release a book about building financial software on Solana, and odder still to print one. Many videos, online courses, and blog posts cover how Solana is built, including topics like consensus, validators, and the leader schedule. Most explain the basics of minting and moving tokens. Some end by showing you how to build your first onchain program.

This isn't a book about how Solana is built. It's about **building on it**. It is a guide to creating financial products on the world's most active blockchain.[^most-active] It explains ten complete financial Solana programs, from a two-party escrow to a perpetual futures venue.

## Why Build Financial Programs on Solana?

Financial products built on Solana have properties no traditional financial system offers:

- **Settlement is atomic, instant, and global.** A trade and its settlement can be the same event, whether the two parties are in the same city or on different continents. No failure leaves one side paid and the other with nothing. There is no gap between one side paying and the other receiving, so nobody can step in during it.
- **Everyone reads the same accounts.** A traditional trade is recorded in two firms' separate books, and departments exist to check the copies against each other. Onchain there is one set of books. A market's state is its accounts, and every party reads the same ones, so there is nothing to reconcile.
- **Transactions cost a fraction of a cent**, whatever the size of the transfer. Moving dollars the traditional way costs a percentage of the amount. Think back to the last time you bought a coffee: the café that sold it paid roughly 1.5% to 3.5% of the price in card fees, plus a fixed 10 to 30 cents.[^card-fees] Sending $200 across a border costs about $13 on average, and more than $40 on the worst corridors.[^remittance-scope] A flat fee makes it worth sending payments that were too small to bother with.
- **Markets trade around the clock, every day.** There is no opening bell, no weekend close, and no holiday calendar.[^after-hours]
- **Assets are programmable.** An institution enforces its rules with staff and procedure: release the escrow when both sides have delivered, accrue the interest, liquidate the underwater loan, pay the winners their share. Onchain, the same rules run as instruction handlers, which are code anyone can invoke and nobody has to remember. Every chapter of this book builds rules like these.
- **Blockchains can move assets of any kind.** As of mid-2026, Solana is the most popular blockchain for trading real-world assets: equities, bonds, commodities, real estate, and exotics.[^rwa-scope] Solana is also one of the most active chains for trading crypto-native assets such as BTC.[^btc-scope]
- **A deployed program reaches every user at once.** A traditional fund spends months working through intermediaries before it reaches investors: an exchange listing, market makers, brokerage approvals. Each gatekeeper adds cost and delay. Every wallet on the network, and every other program, can reach a deployed program the moment it exists.


Open networks use these properties for permissionless markets anyone can join. More and more traditional institutions run on them too. They build tokenized funds, stablecoin settlement, and internal ledgers on the same primitives, and operate them inside the permissions and accountability their regulators require.[^tokenized-funds] Whichever market you build for, it uses the accounts, tokens, math, and checks in this book.

## A Long-Lived Technical Book for Solana

Some technical books go out of date as soon as the release they document does. A smaller number stay useful for decades. *TCP/IP Illustrated* is still the book network engineers hand each other, thirty years on. *The UNIX and Linux System Administration Handbook* has outlasted every operating system release it ever mentioned. *Mastering Bitcoin* remains the standard text on its subject. These books all chose to teach the primitive layer that does not change. Packets still flow the way *TCP/IP Illustrated* drew them. Processes still fork on Unix and Linux. This book provides the same long-term knowledge for building financial products on Solana.

Solana changes quickly: network releases, framework versions, chain constants, and tools change often. A book that prints them is wrong within a year, and financial software is the worst place to learn from out-of-date material.

*Building Financial Software on Solana* teaches the part that doesn't change: **how financial ideas become Solana programs, implemented as accounts, instruction handlers, signatures, oracles, checks and math.** The account model has been stable since Solana launched. The math will not change.

In this book you'll learn how each of the classic financial products works as a Solana program, how to handle assets so that none are lost, and how to test that your program works.

## Why Read a Book When an AI Can Write the Program?

An LLM can write a Solana program on request, and we expect you to use an AI to do that. This book includes a companion AI plugin, introduced below, to help you do it correctly.

However, **no AI can understand a program for you.** This book should leave you with a working model of how financial products exist as Solana programs. That model is enough to design one, read one, judge its incentives and trust decisions, and take responsibility for what you ship. After reading it, you will be able to:

- Design financial products as Solana programs
- Understand existing programs
- Iterate with your AI as a peer
- Understand the economic incentives of your programs
- Be responsible for the programs you have created

The book splits the work with two companions. Both are available at [solanabook.org](https://solanabook.org):

- The **companion repository** holds the complete, tested programs behind the program chapters, in Anchor 1, Anchor 2, and Quasar versions, with further languages and frameworks added as they arrive. The tests run continuously, so the code stays correct and current in a way paper cannot.
- The **companion AI plugin** turns this book's rules into a form AI coding tools apply automatically.

## Prerequisites

This book does not assume you have written a Solana program, and it does not assume a background in finance. It covers both in enough detail to work from either side with confidence.

The book introduces every Solana mechanism before using it, starting from the basics of users, accounts, programs, and data. It explains every financial concept (escrow, collateral, liquidation, market making, interest) from first principles. Named people with real dollar amounts use the program in realistic scenarios: making gains, taking losses, and sometimes trying to attack it.

The book does not assume you are a software engineer, or that you know Rust, the programming language Solana programs are written in. The text explains the behavior of every program in detail, and it uses the handler and field names so that you can read the explanation and the code side by side. Software engineers will find a complete implementation of every program in the companion repository.

The diagrams throughout the book (account maps, state machines, and value flows) share one set of conventions, and the first figure that uses a convention explains it.

## The Glossary

The Glossary defines all the technical and financial vocabulary this book uses. If a term in a chapter surprises you, look there.

## The Book Has Two Parts: The Fundamentals, Then Ten Programs

**The Fundamentals** is everything you need before writing financial software: the Solana mechanics first (accounts, tokens, PDAs, rent, atomicity, and time), then what is specific to financial software (state machines, the arithmetic, offchain truth, the adversary, testing, and admin power).

**Building Financial Products in Solana** is ten chapters, and each one builds a complete financial program. A Solana program is code deployed onchain, and other blockchains call the same thing a "smart contract" or a "protocol". Together the ten cover the financial products commonly built on Solana: escrow, crowdfunding, a betting market, an order book exchange, both kinds of automated market maker, lending and borrowing, a managed fund, options, and perpetual futures. Each chapter gives the accounts the program stores, the instruction handlers that move its tokens, and what each handler checks first. It also gives the incentives of the people who use the program and of whoever administers it, and the ways it can be attacked.

Real incidents appear throughout the book in boxed **War Story** sections. They are not told to embarrass the teams involved. They are here so you recognize the same mistake in your own code before it costs you.

To keep the balances easy to track, every character starts every chapter with the same wallet: **one SOL** for rent deposits and transaction fees, **one thousand USDC**, and whatever assets the chapter's story gives them (a share grant, a stock position, a token inventory).

## How This Book Was Produced

Two things were developed for the Solana Foundation's Professional Education Program: the order in which this book introduces Solana concepts, and the visual language its figures use for accounts and their changes. Most of the program chapters in Part II began as videos the author produced for Quicknode's YouTube channel. Their first drafts were transcripts of those videos, rewritten for the page. The manuscript was written by hand.

AI tools did the mechanical checking: spelling and grammar, terminology and naming across chapters, every name in the prose and figures against the companion repository, and the diagrams' numbers against program state.

## Corrections Are Welcome, and Expected

Long-lived technical books are not written once. Keen readers correct them, edition after edition. The errata page is at [solanabook.org](https://solanabook.org), alongside the two companions. If a number here does not match the code, if a mechanism has changed, or if an explanation left you stuck, tell us. Contributors are credited by name.

## Where to Start, Depending on What You Came For

- **A software engineer who wants to build a complete financial product?** Read [Part I](../TABLE-OF-CONTENTS.md#part-i-the-fundamentals) front to back, chapter by chapter, and decide on a framework before you finish it. The companion repository's front page describes each program and how to install it. When you reach [Part II](../TABLE-OF-CONTENTS.md#part-ii-building-financial-products-in-solana), open each chapter's project in the companion repository in the framework you chose, and read the chapter and the code side by side. The chapter explains what each instruction handler checks and moves, and the handler and its tests show how, under the same names.
- **A software engineer who wants to build one specific thing?** Read [Part I](../TABLE-OF-CONTENTS.md#part-i-the-fundamentals), then the [*Escrow*](../building-financial-products-in-solana/escrow.md) chapter, which teaches the vault, the stored terms, and handlers (`take_offer()` and `cancel_offer()`) that empty the vault from every state. Every later program reuses all three. Then skip ahead to [your program's chapter](../TABLE-OF-CONTENTS.md#part-ii-building-financial-products-in-solana), with its project from the companion repository open beside it. Where that chapter depends on an earlier one, it names the earlier chapter there.
- **Here to understand how these products work on Solana, not to build one?** That covers an analyst, a risk or compliance officer, a product manager, a lawyer, a founder deciding what to fund, and anyone else whose work touches onchain finance without writing its code. Read [Solana Building Blocks](../TABLE-OF-CONTENTS.md#solana-building-blocks) for the vocabulary, then the [*Offchain Truth*](../financial-programming-concepts-in-solana/offchain-truth.md) and [*Adversary*](../financial-programming-concepts-in-solana/the-adversary.md) chapters, then the [program chapters](../TABLE-OF-CONTENTS.md#part-ii-building-financial-products-in-solana) in order. You can follow a program chapter's story without reading any code. The [*Arithmetic of Money*](../financial-programming-concepts-in-solana/the-arithmetic-of-money.md) and [*Operating Financial Software*](../financial-programming-concepts-in-solana/operating-financial-software.md) chapters are written for whoever writes the program, so you can skim them.

Part I opens with the computer itself: one giant machine that spans the world, and two people, Alice and Bob, using it to pay each other. Let's get started.

[^most-active]: Artemis counted 4.1 million daily active addresses and 146 million transactions on Solana on August 31, 2026, against 1.7 million addresses on BNB Chain and under half a million on Ethereum. See [classic.artemis.ai/asset/solana](https://classic.artemis.ai/asset/solana).

[^card-fees]: The 1.5% to 3.5% is a United States café's total acceptance cost in 2026: interchange plus the processor's margin. Visa's published US interchange alone, effective April 18, 2026, runs from 1.19% plus 10 cents for a debit card at a restaurant to about 2.7% for a credit card, and the Federal Reserve's Regulation II caps regulated debit at 0.05% plus 21 cents. Source: Visa, [usa.visa.com/dam/VCOM/download/merchants/visa-usa-interchange-reimbursement-fees.pdf](https://usa.visa.com/dam/VCOM/download/merchants/visa-usa-interchange-reimbursement-fees.pdf).

[^remittance-scope]: In the third quarter of 2025 thirteen remittance corridors cost more than 20%, nine of them sending out of sub-Saharan Africa, against a global average of 6.36%. Source: The World Bank, Remittance Prices Worldwide issue 54, [remittanceprices.worldbank.org](https://remittanceprices.worldbank.org).

[^after-hours]: Allium measured that 63% of Solana's tokenized-equity volume in the twelve months to August 18, 2026 traded while US exchanges were closed, and 17% of it traded on weekends. See [allium.so/solana](https://allium.so/solana).

[^rwa-scope]: In the twelve months to August 18, 2026, Allium counted $46B in onchain RWA spot trading across 24 chains. Solana had $14.7B of it: 32% of the volume and 47% of the trades, more than any other chain. See [allium.so/solana](https://allium.so/solana).

[^tokenized-funds]: By Allium's count, BlackRock's tokenized Treasury fund, BUIDL, had $741M of its shares issued as Solana tokens on August 18, 2026, 27% of the fund. See [allium.so/solana](https://allium.so/solana).

[^btc-scope]: Blockworks Research put BTC spot volume on Solana near $80M in a day in August 2026. See [blockworks.com/analytics/solana/solana-bitcoin](https://blockworks.com/analytics/solana/solana-bitcoin).

