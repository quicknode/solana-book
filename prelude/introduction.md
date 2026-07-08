# Introduction

It might seem strange to release a book - let alone one available in a physical form - for building financial software on Solana. Countless YouTube videos, articles and online courses cover how Solana, as a development platform, is built, including topics like consensus, validators, and Proof of History: [Anza's documentation](https://docs.anza.xyz/) is by far the best source for these matters and is often regurgitated into other formats. Most of the existing materials go into the basics of minting and moving tokens. 

This isn't a book about how Solana is built, and how to use the token program. It's about **building on the platform**, and if you're creating financial products on the world's most active blockchain then we're aiming for it to be the essential reference for this topic.

## A Long-Lived Technical Book for Solana

Some technical books die with the release they document. A smaller number live for decades. *TCP/IP Illustrated* is still the book network engineers hand each other, thirty years on. *The UNIX and Linux System Administration Handbook* has outlasted every operating system release it ever mentioned. *Mastering Bitcoin* remains the standard text on its subject. What these books share is a decision about altitude: they teach the layer that does not change. Packets still flow the way Stevens drew them. Processes still fork on Unix and Linux. The mental models survive even as every command-line flag dies. This book provides the same long term knowledge for building financial products on Solana. 

Solana is a fast-moving space: framework releases, tool versions, and the Solana API are known to churn. A book that prints them is wrong within a year, and financial software is the worst possible place to learn from stale material.

Building Financial Software on Solana teaches the durable layer: **how financial ideas become Solana programs, implemented as accounts, instruction handlers, signatures, oracles, checks and math.** The account model has been stable since Solana launched. The math will not change. Nor will the desire of adversaries to seize your assets.

In this book you'll learn how each of the classic financial products actually works, how to handle assets without losing a lamport, what to verify and how to prove your program works. These long term concepts are what this book is for.

## Why Write a Book in the Age of AI?

AI can write a Solana program on request, and this book's own companion AI skill exists to make it do so correctly. 

**No model can understand a program on your behalf.** The value of this book is the knowledge it leaves in your head: how financial products exist on Solana, as programs, instruction handlers, accounts, structs, seeds, incentives, and trust decisions, so that you can design your own programs, understand and reason about them, and prove a program is correct.

That judgment matters most exactly where AI is weakest. Many AI coding models will happily produce a program that divides before multiplying, rounds toward the user, or trusts an unvalidated account, and the resulting code will look perfect and pass many happy-path unit tests. The only reliable defense is a person who knows the invariants well enough to catch the violation, whether the code was typed or generated.

The book splits the work with two companions. Both are available at [thesolanabook.com](https://thesolanabook.com):

- The **companion repository** holds the complete, tested programs that the program chapters walk through, in Anchor, Quasar, and native versions. Tests are run continuously, so the code stays correct and current in a way paper cannot.
- The **companion AI skill** distills this book's rules into a form AI coding tools apply automatically. 

The AI skill makes your tools better. The book makes you better.

Everything perishable is deliberately kept out of these pages. Where code appears, it is there to illustrate an idea, and the companion repository is the source of truth for running it. When the two disagree, trust the companion repository, and check the errata page.

## Prerequisites

This book assumes deep familiarity with neither Solana nor finance, and covers both in enough detail to work from either side with confidence. 

Every Solana mechanism is introduced before it is used, starting from the basics of users accounts, programs, and data. Every financial concept (escrow, collateral, liquidation, market making, interest) is explained from first principles, with the personas and dollar amounts on the page, before any code depends on it. 

Code here is given in Rust, Solana's primary programming language. The Rust is explained as it appears, and the programs are deliberately small. If you can read a Rust struct and a function, you can read the program chapters.

## Programs Follow Patterns, Patterns Build Understanding

The book has two foundation chapters and eight program chapters. **Building Blocks** is everything Solana-mechanical: accounts, tokens, PDAs, rent, atomicity, time, cranks. **Financial Programming Concepts** is everything money-specific: the arithmetic, offchain truth, the adversary, testing, and admin power. 

Then every program chapter walks one complete financial program. Incentives for admins and individual users are discussed, and we show how individual instruction handlers modify onchain state on behalf of their users.

Like *TCP/IP Illustrated*, this book teaches a way of thinking. Over time, you'll notice the same patterns and turn knowledge into understanding and habit. 

## Real War Stories

Real incidents appear throughout the book in boxed **War Story** sections. History does not go stale, which makes these the most durable pages in the book. In the rounding chapter, you'll read about the rounding bug that put about $2.6B at risk. In The Adversary, you'll read about the Mango Markets incident. None of them are told to dunk on the teams involved - the point is the awareness.

## Where to Start, Depending on What You Came For

Reading front to back works: the parts are ordered so that each one uses only what came before. But the book is built to be entered anywhere, so a few honest shortcuts:

- **Already building on Solana?** Skim [Solana Building Blocks](../TABLE-OF-CONTENTS.md#solana-building-blocks), read [Financial Programming Concepts in Solana](../financial-programming-concepts-in-solana/intro.md) properly, then take the [program chapters](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana) in order.
- **Here to ship one specific thing?** Read [The Arithmetic of Money](../financial-programming-concepts-in-solana/the-arithmetic-of-money.md) and [Offchain Truth](../financial-programming-concepts-in-solana/offchain-truth.md), then go straight to [your program chapter](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana). Each program chapter names the sections it leans on.
- **Auditing or reviewing?** [The Adversary](../financial-programming-concepts-in-solana/the-adversary.md) first, then the [program chapter](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana) matching what is in front of you, then [the Invariant Checklist](../appendices/invariant-checklist.md). Always get a second-opinion audit before releasing a Solana program to mainnet.

## Two Appendices Meant to Be Worn Out: the Glossary and the Invariant Checklist

Two appendices are meant to be worn out. 

The Glossary is a full vocabulary for Solana-based financial products, covering both the technical and financial vocabulary this field uses daily. When a term in a chapter surprises you, it is defined there. 

The Invariant Checklist is the whole book's rules on one page, for the moment before you ship. The diagrams throughout the book share one set of conventions, and each is explained by the first figure that uses it.
