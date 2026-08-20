# Chapter 1: Introduction

It may seem odd to release a book, let alone a printed one, about building financial software on Solana. Countless videos, online courses, and blog posts cover how Solana is built, including topics like consensus, validators, and Proof of History. Most of the existing materials go into the basics of minting and moving tokens. Some even show you how to build your first onchain program.

This isn't a book about how Solana is built. It's about **building on the Solana platform**. We're aiming for it to be the essential reference for creating financial products on the world's most active blockchain.

## Why Build Financial Programs on Solana?

Financial products built on Solana have properties no traditional rail offers:

- **Markets are tradable 24 x 7.** No opening bell, no weekend close, no holiday calendar.
- **Settlement is atomic, instant, and global.** A trade and its settlement can be the same event, whether the two parties are in the same city or on different continents, and no failure leaves one side paid and the other empty-handed.
- **Everyone reads the same accounts.** A traditional trade lands in two firms' separate books, and departments exist to check the copies against each other. Onchain there are no copies: a market's state is its accounts, and every party reads the same ones. There is nothing to reconcile.
- **Money is programmable.** The rules an institution enforces with staff and procedure (release the escrow when both sides have delivered, accrue the interest, liquidate the underwater loan, pay the winners their share) run as instruction handlers: code anyone can invoke and nobody has to remember. Every chapter of this book builds rules like these.
- **Transactions cost a fraction of a penny**, regardless of the size of the transfer. Moving money the traditional way costs a percentage of it. Card payments take roughly 1.5% to 3.5% of each sale, plus a fixed 10 to 30 cents. Sending $200 across a border costs under 1% through a digital service like Wise, and 20% at a Western Union or MoneyGram cash counter in some parts of the world.[^remittance-scope] A fee that ignores the amount is a different kind of fee from one that scales with it, and it changes which products are worth building at all.
- **Blockchains can move assets of any kind.** As of mid-2026, Solana is the most popular blockchain for trading real world assets: equities, bonds, commodities, real estate, and exotics.[^rwa-scope] In addition Solana is one of the most active chains for trading traditional "crypto" assets like BTC and SOL.[^btc-scope]
- **Distribution is the deployment.** A traditional fund spends months and a chain of intermediaries reaching its investors: an exchange listing, market makers, brokerage platform approvals, each a gatekeeper with its own cost and lead time. A deployed program is reachable by every wallet on the network, and by every other program, the moment it exists.

Open networks use these properties for permissionless markets anyone can join. Traditional institutions increasingly run on them too: tokenized funds, stablecoin settlement, and internal ledgers built on the same primitives, operated inside the permissions and accountability their regulators require. Whichever market you build for, the accounts, tokens, math, and checks in this book are the layer both share.

## A Long-Lived Technical Book for Solana

Some technical books die with the release they document. A smaller number live for decades. _TCP/IP Illustrated_ is still the book network engineers hand each other, thirty years on. _The UNIX and Linux System Administration Handbook_ has outlasted every operating system release it ever mentioned. _Mastering Bitcoin_ remains the standard text on its subject. What these books share is a decision to teach the primitive layer that does not change. Packets still flow the way _TCP/IP Illustrated_ drew them. Processes still fork on Unix and Linux. The mental models survive even as the implementation evolves. This book provides the same long term knowledge for building financial products on Solana.

Solana is a fast-moving space: validator framework releases, library versions, and tools churn constantly. A book that prints them is wrong within a year, and financial software is the worst possible place to learn from stale material.

_Building Financial Software on Solana_ teaches the durable layer: **how financial ideas become Solana programs, implemented as accounts, instruction handlers, signatures, oracles, checks and math.** The account model has been stable since Solana launched. The math will also not change. Nor will the desire of adversaries to take your assets.

In this book you'll learn how each of the classic financial products actually works as a Solana program, how to handle assets without losing a penny, and how to prove your program works. These long term concepts are what this book is for.

## Why Write a Book in the Age of AI?

An LLM can write a Solana program on request, and we fully expect you to use an AI to do exactly that - this book includes a companion AI plugin, introduced below, to help you do this correctly.

However **no AI can understand a program on your behalf.** The value of this book is the knowledge it leaves in your head: how financial products exist as Solana programs, so you can design your own programs, understand their implementation, incentives and trust decisions, and have confidence in what you have built. After reading it, you will be able to:

- Design financial products as Solana programs
- Understand existing programs
- Iterate with your AI as a peer
- Understand the economic incentives of your programs
- Be responsible for the programs you have created

The book splits the work with two companions. Both are available at [thesolanabook.com](https://thesolanabook.com):

- The **companion repository** holds the complete, tested programs that the program chapters walk through, in Anchor and Quasar versions. Tests are run continuously, so the code stays correct and current in a way paper cannot.
- The **companion AI plugin** distills this book's rules into a form AI coding tools apply automatically.

The AI plugin makes your tools better. The book makes **you** better.

Framework-specific code is kept in the companion repository. Where code appears in these pages, it is there to illustrate an idea, and the companion repository is the source of truth for running it. When the two disagree, trust the companion repository, and check the errata page described next.

## Corrections Are Welcome, and Expected

Long-lived technical books are not written once. They are corrected, edition after edition, by keen readers. The errata page sits alongside the two companions at [thesolanabook.com](https://thesolanabook.com). If a number here does not match the code, if a mechanism has changed, or if an explanation left you stuck at exactly the wrong moment, we would love to hear it, and contributors are credited by name.

## Prerequisites

This book does not assume you have written a Solana program, and it does not assume a background in finance. It covers both in enough detail to work from either side with confidence.

Every Solana mechanism is introduced before it is used, starting from the basics of users, accounts, programs, and data. Every financial concept (escrow, collateral, liquidation, market making, interest) is explained from first principles, with the personas and dollar amounts on the page, before any code depends on it.

Code here is given in Rust, Solana's primary programming language. The Rust is explained as it appears, and the programs are deliberately small. If you can read a Rust struct and a function, you can read the program chapters.

The diagrams throughout the book share one set of conventions, and each convention is explained by the first figure that uses it.

## Programs Follow Patterns, Patterns Build Understanding

The book has two parts. **The Fundamentals** is everything you need before writing financial software: the Solana mechanics first (accounts, tokens, PDAs, rent, atomicity, and time), then what is specific to money (the arithmetic, offchain truth, the adversary, testing, and admin power).

**Building Financial Products** is nine chapters, and each one walks a complete financial program. A Solana program is code deployed onchain, and other blockchains call the same thing a "smart contract" or a "protocol". Between them the nine cover the financial products commonly built on Solana: escrow, crowdfunding, a betting market, an order book exchange, both kinds of automated market maker, lending and borrowing, a vault, and perpetual futures. Each chapter gives the accounts the program stores, the instruction handlers that move its money, the incentives of the people who use it and of whoever administers it, and the ways it can be attacked. Each is drawn as well as written: account maps, state machines, and value flows, in one visual language shared across all nine. These programs have not been drawn and explained side by side in one place before.

Real incidents appear throughout the book in boxed **War Story** sections. History does not go stale, which makes these among the most durable pages in the book. None of them are told to dunk on the teams involved - rather, they are here so you recognize the same shape in your own code before it costs you.

To keep the money easy to track, every character starts every chapter with the same wallet: **one SOL** for rent deposits and transaction fees, **one thousand USDC**, and whatever story-specific assets the chapter hands them (a share grant, a stock position, a token inventory).

Like _TCP/IP Illustrated_, this book teaches a way of thinking. Over time, you'll notice the same patterns and turn knowledge into understanding and habit.

## How This Book Was Produced

It is reasonable for readers to be concerned about AI slop. This book is the culmination of three years of work. The visual mechanism that describes Solana accounts and their changes, and the order in which clusters, transactions, instructions and the escrow program are introduced, were conceived for the Professional Education Program at Solana Foundation. Every financial program other than the escrow was first made as a video for Quicknode, and this book began as transcriptions of that video content. The book was edited and reviewed by hand. Claude Fable 5, Opus 4.8 and Opus 5 were used to ensure consistency throughout the book: for example to ensure that concepts were defined on their first use, that the glossary was complete, and to ensure diagrams accurately reflected program state. Quicknode stands by the contents of _Building Financial Software on Solana_.

## Where to Start, Depending on What You Came For

Reading front to back works: the parts are ordered so that each one uses only what came before. But you can start anywhere, so here are a few honest shortcuts:

- **Already building on Solana?** Skim [Solana Building Blocks](../TABLE-OF-CONTENTS.md#solana-building-blocks), read [Financial Programming Concepts in Solana](../financial-programming-concepts-in-solana/intro.md) properly, then take the [program chapters](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana) in order.
- **Here to ship one specific thing?** Read the [_Arithmetic of Money_](../financial-programming-concepts-in-solana/the-arithmetic-of-money.md) chapter and the [_Offchain Truth_](../financial-programming-concepts-in-solana/offchain-truth.md) chapter, then go straight to [your program chapter](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana). Each program chapter names the sections it leans on.

## The Glossary

All technical and financial vocabulary this book uses is defined in the Glossary. If a term in a chapter surprises you, look there.

[^remittance-scope]: The World Bank prices every corridor quarterly at [remittanceprices.worldbank.org](https://remittanceprices.worldbank.org): in the third quarter of 2025 thirteen corridors cost more than 20%, nine of them sending out of sub-Saharan Africa, against a global average near 6.5%.

[^rwa-scope]: [app.rwa.xyz](https://app.rwa.xyz) prices tokenized assets by class and by network, and [defillama.com/rwa/chains](https://defillama.com/rwa/chains) ranks the chains.

[^btc-scope]: Blockworks Research put BTC spot volume on Solana near $80M in a day in August 2026, on about 6,700 tokenized BTC, at [blockworks.com/analytics/solana/solana-bitcoin](https://blockworks.com/analytics/solana/solana-bitcoin).
