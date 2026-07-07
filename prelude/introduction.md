# Introduction

## A Long-Lived Technical Book for Solana

Some technical books die with the release they document. A smaller number live for decades. *TCP/IP Illustrated* is still the book network engineers hand each other, thirty years on. *The UNIX and Linux System Administration Handbook* has outlasted every operating system release it ever mentioned. *Mastering Bitcoin* remains the standard text on its subject. What these books share is a decision about altitude: they teach the layer that does not change. Packets still flow the way Stevens drew them. Processes still fork. The mental models survive even as every command-line flag dies.

This book makes the same decision for financial software on Solana. It teaches the durable layer: **how financial ideas become accounts and instruction handlers, how to calculate with money using integers without losing a lamport, how facts from outside the chain are verified on it, how programs get attacked, and how each of the classic financial products actually works.** The math will not change. The adversary will not change. The account model has been stable since Solana launched. That is the material a book is for.

## A Book About Building Financial Products, Not About How Solana Is Built

This is a book about building software **on** Solana, not about how Solana itself is built. There is already a great deal of good material on consensus, validators, and Proof of History: [Anza's documentation](https://docs.anza.xyz/) covers the validator and the runtime, and the [Firedancer project](https://github.com/firedancer-io/firedancer) documents a validator built from scratch. This book gladly points to material like that when the internals matter. Here, the chain is the **platform**: explained exactly as far as an application developer needs, and no further. The subject is what a developer writes: the programs, the math, the invariants, the tests.

## Why a Book at All, in the Age of AI

AI can write a Solana program on request, and this book's own companion AI skill exists to make it do so correctly. What no model can do is know things on your behalf. The value of this book is the knowledge it leaves in your head: **how financial products exist on Solana**, as accounts, instruction handlers, invariants, and trust decisions, so that you can design one, judge one, and prove a program is correct.

That judgment matters most exactly where AI is weakest. An assistant will happily produce a swap handler that divides before multiplying, rounds toward the user, or trusts an unvalidated account, and the code will look perfect and pass the happy-path test. The only reliable defense is a person who knows the invariants well enough to catch the violation, whether the code was typed or generated.

So the book and the companion AI skill split the job. The skill encodes these rules so AI coding tools apply them mechanically; the book builds the understanding that tells you whether they were applied. One makes your tools better. The other makes you better.

## The Ideas Live in the Book, the Code Lives in the Companion Repository

Everything perishable is deliberately kept out of these pages. Framework releases, tool versions, and API details churn; a book that prints them is wrong within a year, and financial software is the worst possible place to learn from stale material.

So the book splits the work with two companions:

- The **companion repository** ([Solana Program Examples](https://github.com/quicknode/solana-program-examples)) holds the complete, tested programs that the program chapters walk through, in Anchor, Quasar, and native versions. CI runs their tests continuously, so the code stays correct and current in a way paper cannot.
- The **companion AI skill** ([Solana Finance plugin](https://github.com/quicknode/solana-finance-claude-plugin)) distills this book's rules into a form AI coding tools apply automatically.

Where code appears in these pages, it is there to illustrate an idea, and the companion repository is the source of truth for running it. When the two disagree, trust the companion repository, and check the errata page.

## For Working Programmers: No Solana or Finance Background Required

You should be a working programmer, comfortable in some language. Beyond that, this book assumes deep familiarity with neither Solana nor finance, and covers both in enough detail to work from either side with confidence. Every Solana mechanism is introduced before it is used, starting from the account model itself. Every financial concept (escrow, collateral, liquidation, market making, interest) is explained from first principles, with the personas and dollar amounts on the page, before any code depends on it. You also do not need to know Rust: the Rust that matters is introduced as it appears, and the programs are deliberately small. If you can read a struct and a function, you can read the program chapters.

## Every Program Chapter Follows the Same Seven Beats

The book has two foundation chapters and eight program chapters. **Solana Building Blocks** is everything Solana-mechanical: accounts, tokens, PDAs, rent, atomicity, time, cranks. **Financial Programming Concepts in Solana** is everything money-specific: the arithmetic, offchain truth, the adversary, testing, and admin power. Then every program chapter walks one complete financial program through the same seven beats, in the same order:

**Concept. Account model. Instruction handlers. The math. The invariants. The failure modes. The test that catches the bug.**

The repetition is the point. By the third chapter the structure disappears and what remains is the habit of asking the seven questions in order, which is precisely the habit that builds correct financial software. It is the same trick *TCP/IP Illustrated* pulled with its relentless per-topic structure, and it is why that book teaches a way of thinking rather than a list of facts.

The two foundation chapters are lighter per section: claim, mechanism, consequence.

## War Stories: Real Incidents, Placed Where Their Lesson Lives

Real incidents appear throughout the book in boxed **War Story** sections, each placed inside the chapter that teaches the lesson the incident proves: the rounding bug that put about $2.6B at risk sits in the rounding chapter, Mango Markets sits in the price manipulation chapter. History does not go stale, which makes these the most durable pages in the book. None of them are told to dunk on the teams involved; every one of them could have happened to a careful team having a bad month, and the point is the defense, not the blame.

## Where to Start, Depending on What You Came For

Reading front to back works: the parts are ordered so that each one uses only what came before. But the book is built to be entered anywhere, so a few honest shortcuts:

- **Already building on Solana?** Skim [Solana Building Blocks](../TABLE-OF-CONTENTS.md#solana-building-blocks), read [Financial Programming Concepts in Solana](../financial-programming-concepts-in-solana/intro.md) properly, then take the [program chapters](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana) in order.
- **Here to ship one specific thing?** Read [The Arithmetic of Money](../financial-programming-concepts-in-solana/the-arithmetic-of-money.md) and [Offchain Truth](../financial-programming-concepts-in-solana/offchain-truth.md), then go straight to [your program chapter](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana). Each program chapter names the sections it leans on.
- **Auditing or reviewing?** [The Adversary](../financial-programming-concepts-in-solana/the-adversary.md) first, then the [program chapter](../TABLE-OF-CONTENTS.md#building-financial-products-in-solana) matching what is in front of you, then [the Invariant Checklist](../appendices/invariant-checklist.md).
- **In a hurry and dangerous about it?** [The Invariant Checklist](../appendices/invariant-checklist.md) is the one-page distillation of the whole book's rules. It will not teach you why, but it will stop the worst bugs while you circle back for the why.

## Two Appendices Meant to Be Worn Out: Terminology and the Invariant Checklist

Two appendices are meant to be worn out. The Terminology appendix is the glossary: Solana's own vocabulary plus the financial vocabulary this field uses daily (minor units, lots, ticks, basis points, WAD, and the rest). When a term in a chapter surprises you, it is defined there. The Invariant Checklist is the whole book's rules on one page, for the moment before you ship. The diagrams throughout the book share one set of conventions, and each is explained by the first figure that uses it.
