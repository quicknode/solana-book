# Chapter 1: Introduction

It may seem odd to release a book, let alone a printed one, about building financial software on Solana. Countless videos, online courses, and blog posts cover how Solana is built, including topics like consensus, validators, and Proof of History. Most of the existing materials go into the basics of minting and moving tokens. Some end by showing you how to build your first onchain program.

This isn't a book about how Solana is built. It's about **building on it**. This is the reference for creating financial products on the world's most active blockchain.[^most-active] It explains ten complete financial Solana programs, from a two-party escrow to a perpetual futures venue.

## Why Build Financial Programs on Solana?

Financial products built on Solana have properties no traditional payment system offers:

- **Markets are tradable 24 x 7.** No opening bell, no weekend close, no holiday calendar.[^after-hours]
- **Settlement is atomic, instant, and global.** A trade and its settlement can be the same event, whether the two parties are in the same city or on different continents, and no failure leaves one side paid and the other empty-handed.
- **Everyone reads the same accounts.** A traditional trade is recorded in two firms' separate books, and departments exist to check the copies against each other. Onchain there are no copies: a market's state is its accounts, and every party reads the same ones. There is nothing to reconcile.
- **Money is programmable.** The rules an institution enforces with staff and procedure (release the escrow when both sides have delivered, accrue the interest, liquidate the underwater loan, pay the winners their share) run as instruction handlers: code anyone can invoke and nobody has to remember. Every chapter of this book builds rules like these.
- **Transactions cost a fraction of a penny**, regardless of the size of the transfer. Moving money the traditional way costs a percentage of it. Think back to the last time you bought a coffee: the café that sold it paid roughly 1.5% to 3.5% of the price in card fees, plus a fixed 10 to 30 cents. Sending $200 across a border costs under 1% through a digital service like Wise, and up to 20% at a Western Union or MoneyGram cash counter in some parts of the world.[^remittance-scope] A flat fee changes what products are worth building.
- **Blockchains can move assets of any kind.** As of mid-2026, Solana is the most popular blockchain for trading real-world assets: equities, bonds, commodities, real estate, and exotics.[^rwa-scope] Solana is also one of the most active chains for trading crypto-native assets such as BTC.[^btc-scope]
- **A deployed program reaches every user at once.** A traditional fund spends months working through intermediaries before it reaches investors: an exchange listing, market makers, brokerage approvals. Each gatekeeper adds cost and delay. A deployed program is reachable by every wallet on the network, and by every other program, the moment it exists.

Other blockchains offer some of these properties. Only Solana offers all of them.

Open networks use these properties for permissionless markets anyone can join. Traditional institutions increasingly run on them too: tokenized funds, stablecoin settlement, and internal ledgers built on the same primitives, operated inside the permissions and accountability their regulators require.[^tokenized-funds] Whichever market you build for, the accounts, tokens, math, and checks in this book are the layer both share.

## A Long-Lived Technical Book for Solana

Some technical books are out of date as soon as the release they document is. A smaller number stay useful for decades. *TCP/IP Illustrated* is still the book network engineers hand each other, thirty years on. *The UNIX and Linux System Administration Handbook* has outlasted every operating system release it ever mentioned. *Mastering Bitcoin* remains the standard text on its subject. What these books share is a decision to teach the primitive layer that does not change. Packets still flow the way *TCP/IP Illustrated* drew them. Processes still fork on Unix and Linux. The mental models survive even as the implementation evolves. This book provides the same long-term knowledge for building financial products on Solana.

Solana changes quickly: network releases, framework versions, chain constants, and tools churn frequently. A book that prints them is wrong within a year, and financial software is the worst possible place to learn from stale material.

*Building Financial Software on Solana* teaches the durable layer: **how financial ideas become Solana programs, implemented as accounts, instruction handlers, signatures, oracles, checks and math.** The account model has been stable since Solana launched. The math will also not change. Nor will the desire of adversaries to take your assets.

In this book you'll learn how each of the classic financial products works as a Solana program, how to handle assets without losing a penny, and how to prove your program works.

## Why Write a Book When an AI Can Write the Program?

An LLM can write a Solana program on request, and we expect you to use an AI to do exactly that. This book includes a companion AI plugin, introduced below, to help you do it correctly.

However, **no AI can understand a program for you.** What this book should leave you with is a working model of how financial products exist as Solana programs: enough to design one, read one, judge its incentives and trust decisions, and stand behind what you ship. After reading it, you will be able to:

- Design financial products as Solana programs
- Understand existing programs
- Iterate with your AI as a peer
- Understand the economic incentives of your programs
- Be responsible for the programs you have created

The book splits the work with two companions. Both are available at [solanabook.org](https://solanabook.org):

- The **companion repository** holds the complete, tested programs behind the program chapters, in Anchor 1, Anchor 2, and Quasar versions. Tests are run continuously, so the code stays correct and current in a way paper cannot.
- The **companion AI plugin** distills this book's rules into a form AI coding tools apply automatically.

The AI plugin improves the code your tools write. The book improves your own understanding of it.

## Prerequisites

This book does not assume you have written a Solana program, and it does not assume a background in finance. It covers both in enough detail to work from either side with confidence.

Every Solana mechanism is introduced before it is used, starting from the basics of users, accounts, programs, and data. Every financial concept (escrow, collateral, liquidation, market making, interest) is explained from first principles, through named people with real dollar amounts using the program in realistic scenarios: making gains, taking losses, and occasionally trying to attack it.

It does not assume you are a software engineer, or that you know Rust, the programming language Solana programs are written in. The behavior of every program is explained in detail: the accounts it stores, the instruction handlers that move its money, what each handler checks before it does, and what happens when a check is missing. Handler and field names appear in the text so that the explanation and the code can be read side by side. Software engineers will find a complete implementation of every program in the companion repository, in Anchor 1, Anchor 2, and Quasar, with further languages and frameworks added as they arrive. Its tests run continuously, so the code stays current in a way a printed book cannot.

The diagrams throughout the book share one set of conventions, and each convention is explained by the first figure that uses it.

## The Glossary

All technical and financial vocabulary this book uses is defined in the Glossary. If a term in a chapter surprises you, look there.

## Programs Follow Patterns, Patterns Build Understanding

The book has two parts. **The Fundamentals** is everything you need before writing financial software: the Solana mechanics first (accounts, tokens, PDAs, rent, atomicity, and time), then what is specific to money (the arithmetic, offchain truth, the adversary, testing, and admin power).

**Building Financial Products** is ten chapters, and each one builds a complete financial program. A Solana program is code deployed onchain, and other blockchains call the same thing a "smart contract" or a "protocol". Between them the ten cover the financial products commonly built on Solana: escrow, crowdfunding, a betting market, an order book exchange, both kinds of automated market maker, lending and borrowing, a vault, options, and perpetual futures. Each chapter gives the accounts the program stores, the instruction handlers that move its money, the incentives of the people who use it and of whoever administers it, and the ways it can be attacked. Each chapter is written and drawn in the same visual language: account maps, state machines, and value flows.

Real incidents appear throughout the book in boxed **War Story** sections. None of them is told to embarrass the teams involved; they are here so you recognize the same mistake in your own code before it costs you.

To keep the money easy to track, every character starts every chapter with the same wallet: **one SOL** for rent deposits and transaction fees, **one thousand USDC**, and whatever story-specific assets the chapter hands them (a share grant, a stock position, a token inventory).

## How This Book Was Produced

The order in which this book introduces Solana concepts, and the visual language its figures use for accounts and their changes, were developed for the Solana Foundation's Professional Education Program. Most of the program chapters in Part II began as videos Mike produced for Quicknode's YouTube channel, and their first drafts were transcripts of those videos, rewritten for the page. The manuscript was written and edited by hand.

AI tools did the mechanical work: checking spelling and grammar, keeping terminology and structure consistent across chapters, ensuring naming is consistent across the text, the figures, and the companion repository, and keeping the diagrams in step with actual program state.

## Corrections Are Welcome, and Expected

Long-lived technical books are not written once. They are corrected, edition after edition, by keen readers. The errata page is at [solanabook.org](https://solanabook.org), alongside the two companions. If a number here does not match the code, if a mechanism has changed, or if an explanation left you stuck, tell us. Contributors are credited by name.

Follow @QuicknodeSolana on X for updates to the book, new chapters and editions as they ship, and the fastest way to ask a question or send feedback.[^quicknode-solana-x]

## Where to Start, Depending on What You Came For

- **A software engineer who wants to build a complete financial product?** Read [Part I](../TABLE-OF-CONTENTS.md#part-i-the-fundamentals) front to back, chapter by chapter, and decide on a framework before you finish it. The companion repository ships every program in Anchor 1, Anchor 2, and Quasar, and its front page describes each one and how to install it. When you reach [Part II](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana), open each chapter's project in the companion repository in the framework you chose, and read the chapter and the code side by side. The chapter explains what each instruction handler checks and moves, and the handler and its tests show how, under the same names.
- **A software engineer who wants to build one specific thing?** Read [Part I](../TABLE-OF-CONTENTS.md#part-i-the-fundamentals), then the [*Escrow*](../building-financial-products-in-solana/escrow.md) chapter, which teaches the vault, the stored terms, and the exits that every later program reuses. Then skip ahead to [your program's chapter](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana), with its project from the companion repository open beside it. Where that chapter leans on an earlier one, it names the earlier chapter at the point it does.
- **Here to understand how these products work on Solana, not to build one?** An analyst, a risk or compliance officer, a product manager, a lawyer, a founder deciding what to fund: anyone whose work touches onchain finance without writing its code. Read [Solana Building Blocks](../TABLE-OF-CONTENTS.md#solana-building-blocks) for the vocabulary, then the [*Offchain Truth*](../financial-programming-concepts-in-solana/offchain-truth.md) and [*Adversary*](../financial-programming-concepts-in-solana/the-adversary.md) chapters, then the [program chapters](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana) in order. Each program chapter tells its story with named people and dollar amounts, says who earns what and why, and ends with how the program can be attacked, and none of that needs the code. The [*Arithmetic of Money*](../financial-programming-concepts-in-solana/the-arithmetic-of-money.md) and [*Operating Financial Software*](../financial-programming-concepts-in-solana/operating-financial-software.md) chapters are written for whoever writes the program, so you can skim them.

Part I opens with the computer itself: one giant machine that spans the world, and two people, Alice and Bob, using it to pay each other. Let's get started.

[^most-active]: Artemis counted 4.1 million daily active addresses and 146 million transactions on Solana on August 31, 2026, against 1.7 million addresses on BNB Chain and under half a million on Ethereum. See [classic.artemis.ai/asset/solana](https://classic.artemis.ai/asset/solana).

[^remittance-scope]: In the third quarter of 2025 thirteen remittance corridors cost more than 20%, nine of them sending out of sub-Saharan Africa, against a global average near 6.5%. Source: The World Bank, [remittanceprices.worldbank.org](https://remittanceprices.worldbank.org).

[^after-hours]: Allium measured 63% of Solana's tokenized-equity volume in the twelve months to August 18, 2026 as traded while US exchanges were closed, and 17% of it on weekends. See [allium.so/solana](https://allium.so/solana).

[^rwa-scope]: Allium counted $14.7B of the $46B in onchain RWA spot trading across 24 chains in the twelve months to August 18, 2026 on Solana: 32% of the volume and 47% of the trades, more than any other chain. See [allium.so/solana](https://allium.so/solana).

[^tokenized-funds]: By Allium's count, BlackRock's tokenized Treasury fund, BUIDL, had $741M of its shares issued as Solana tokens on August 18, 2026, 27% of the fund.

[^btc-scope]: Blockworks Research put BTC spot volume on Solana near $80M in a day in August 2026. See [blockworks.com/analytics/solana/solana-bitcoin](https://blockworks.com/analytics/solana/solana-bitcoin).

[^quicknode-solana-x]: [x.com/QuicknodeSolana](https://x.com/QuicknodeSolana).
