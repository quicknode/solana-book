# Amazon product description

*The book description for the Amazon listing, written to fit the field's 4,000 character limit. The long-form summary is [BOOK-SUMMARY.md](BOOK-SUMMARY.md).*

---

There is no shortage of material on how Solana works: consensus, validators, Proof of History. This is not that book.

**Building Financial Software on Solana** is about building *on* Solana. It is for the engineer shipping an escrow, a lending market, an exchange, a fund, or a perpetual futures venue, who needs to know how a financial idea becomes accounts, instruction handlers, arithmetic, and checks that hold when someone attacks them.

Like *TCP/IP Illustrated*, it teaches the layer that does not change. Frameworks churn. The account model has been stable since Solana launched, the arithmetic of money will not change, and neither will the desire of adversaries to take your assets.

Products built this way have properties no traditional rail offers. Markets trade around the clock. Settlement is atomic, so no ordering of failures leaves one side paid and the other empty handed. Every party reads the same accounts, so there is nothing to reconcile. And a transaction costs a fraction of a penny whatever its size, which changes which products are worth building at all.

**Part I: The Fundamentals**

The Solana mechanics money depends on: accounts and atomic transactions, mints and the authorities that are a token's real constitution, PDAs and what "the program holds the funds" actually means, and the two clocks, chosen by asking who benefits from the error.

Then what is specific to money:

- Every financial product is a state machine, and every state needs an exit for every participant's money.
- Money is integers. Multiply before divide. Rounding is a policy decision: floor what the program pays, ceil what the user owes.
- Offchain truth: check a fact's provenance, freshness, and confidence before acting on it, and decide now what happens the day the source goes silent.
- The adversary: the confused deputy, empty-pool inflation attacks, prices that are true and manipulated, rounding leaks that become faucets, and trust boundaries between programs. Taught through real incidents, including the $2.6B SPL rounding bug, Cashio ($52M), Wormhole ($325M), and Mango Markets ($116M).
- Testing the path the bug lives in, proving what tests cannot, and bounding admin power so the operator is never the biggest risk.

**Part II: Nine Complete Programs**

Escrow. Token fundraiser. Parimutuel betting market. Order book exchange. Constant-product AMM. Prop AMM. Lending and borrowing. Vault strategy. Perpetual futures.

Each chapter walks one tested program end to end: the accounts it stores, the handlers that move its money, the math in minor units, the invariants, the ways it gets attacked, and the tests that catch each one. Every chapter names the incentives of everyone involved, users and operator alike. Account maps, state machines, and value flows are drawn in one visual language shared across all nine, so the programs can be compared at a glance. They have not been explained side by side in one place before.

**Who it is for**

No Solana experience and no finance background assumed. Both are built from first principles, with the people and the dollar amounts on the page before any code depends on them. Code is Rust, explained as it appears.

**Two companions**

The tested programs live in a companion repository, where continuous integration keeps them current in a way paper cannot. A companion AI skill applies the book's rules inside your coding tools.

An AI can write a Solana program on request. No AI can understand one on your behalf. The skill makes your tools better; the book makes you better.
