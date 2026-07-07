# How to Use This Book

## The Shelf This Book Wants to Sit On

Some technical books die with the release they document. A smaller number live for decades. TCP/IP Illustrated is still the book network engineers hand each other, thirty years on. The UNIX and Linux System Administration Handbook has outlasted every operating system release it ever mentioned. Mastering Bitcoin remains the standard text on its subject. What these books share is a decision about altitude: they teach the layer that does not change. Packets still flow the way Stevens drew them. Processes still fork. The mental models survive even as every command-line flag dies.

This book makes the same decision for financial software on Solana. It teaches the durable layer: how financial ideas become accounts and instruction handlers, how to calculate with money using integers without losing a lamport, how facts from outside the chain are verified on it, how programs get attacked, and how each of the classic pieces of financial software actually works. The math will not change. The adversary will not change. The account model has been stable since Solana launched. That is the material a book is for.

## What This Book Is About, and What It Is Not

This is a book about building software **on** Solana, not about how Solana itself is built. There is already a great deal of good material on consensus, validators, and Proof of History; community maps of the ecosystem's content, like [solana-awesome](https://github.com/helius-labs/solana-awesome), show how much of it there is, and this book gladly points you there when the internals matter. Here, the chain is the platform, the way TCP/IP Illustrated treats the wire: explained exactly as far as an application developer needs, and no further. The subject is what a developer writes: the programs, the math, the invariants, the tests.

## Where the Code Lives, and Why It Does Not Live Here

Everything perishable is deliberately kept out of these pages. Framework releases, tool versions, and API details churn; a book that prints them is wrong within a year, and financial software is the worst possible place to learn from stale material.

So the book splits the work with two companions:

- [Solana Program Examples](https://github.com/quicknode/solana-program-examples) holds the complete, tested programs that Part V walks through, in Anchor, Quasar, and native versions. CI runs their tests continuously, so the code stays correct and current in a way paper cannot.
- The [Solana Finance plugin](https://github.com/quicknode/solana-finance-claude-plugin) distills this book's rules into a form AI coding tools apply automatically.

Where code appears in these pages, it is there to illustrate an idea, and the repo is the source of truth for running it. When the two disagree, trust the repo, and check the errata page.

## Who This Book Is For

You should be a working programmer, comfortable in some language. You do not need prior blockchain experience, and you do not need to know Rust: the Rust that matters is introduced as it appears, and the programs are deliberately small. If you can read a struct and a function, you can read Part V.

## The Shape of a Chapter

Every chapter in Part V walks one complete financial program through the same seven beats, in the same order:

**Concept. Account model. Instruction handlers. The math. The invariants. The failure modes. The test that catches the bug.**

The repetition is the point. By the third chapter the structure disappears and what remains is the habit of asking the seven questions in order, which is precisely the habit that builds correct financial software. It is the same trick TCP/IP Illustrated pulled with its relentless per-topic structure, and it is why that book teaches a way of thinking rather than a list of facts.

The concept chapters in the other parts are lighter: claim, mechanism, consequence.

## War Stories

Real incidents appear throughout the book in boxed **War Story** sections, each placed inside the chapter that teaches the lesson the incident proves: the rounding bug that put about $2.6B at risk sits in the rounding chapter, Mango Markets sits in the price manipulation chapter. History does not go stale, which makes these the most durable pages in the book. None of them are told to dunk on the teams involved; every one of them could have happened to a careful team having a bad month, and the point is the defense, not the blame.

## Reading Paths

Reading front to back works: the parts are ordered so that each one uses only what came before. But the book is built to be entered anywhere, so a few honest shortcuts:

- **Already building on Solana?** Skim Part I, but do not skip Financial Software as State Machines. Start properly at Part II.
- **Here to ship one specific thing?** Read Part II, then Defining Offchain Truth, then go straight to your chapter in Part V. Each Part V chapter names the concept chapters it leans on.
- **Auditing or reviewing?** Part IV first, then the Part V chapter matching the program in front of you, then the Invariant Checklist in Appendix A.
- **In a hurry and dangerous about it?** Appendix A is the one-page distillation of the whole book's rules. It will not teach you why, but it will stop the worst bugs while you circle back for the why.

## The Reference Pages

Two appendices are meant to be worn out. Appendix B is the terminology reference: Solana's own vocabulary plus the financial vocabulary this field uses daily (minor units, lots, ticks, basis points, WAD, and the rest). When a term in a chapter surprises you, it is defined there. Appendix C defines the visual language: every diagram in the book (account-relationship maps, state machines, token-movement flows) uses one consistent set of conventions, defined once, so that by mid-book you read the diagrams faster than the prose.
