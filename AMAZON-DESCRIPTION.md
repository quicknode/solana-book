# Amazon product description

*The book description for the Amazon listing, written to fit the field's 4,000 character limit. It follows the house style of the fundamentals titles it means to sit beside: the positioning claim in the first sentence, concrete topic runs a buyer can scan, and the book rather than the reader as the subject.*

---

**Building Financial Software on Solana** is a detailed, program-by-program guide to building financial products as Solana programs: how a financial idea becomes accounts, instruction handlers, arithmetic, and checks that hold when someone attacks them.

Written for engineers shipping software that holds other people's money, and for the analysts, risk officers, and product people who need to understand that software without writing it, it leaves the internals of consensus and validators to other books and covers the layer above: token mints and the authorities that decide who may mint, freeze and transfer, program derived addresses and vault custody, the two clocks and which one an adversary can bend, integer arithmetic in minor units, rounding as a security boundary, oracles and the provenance, freshness, and confidence checks a program runs before acting on a price, conservation invariants, state machines with an exit from every state, cranks, admin power, and the attack classes that have drained real markets.

**Part I** builds the fundamentals: Solana's accounts, tokens, PDAs, and time, then financial software as a state machine, the arithmetic of money, offchain truth, the adversary, and operating a program in production. Exploit classes are taught through the incidents that made them famous, among them the $2.6B SPL token-lending rounding bug, Cashio ($48M), Wormhole ($326M), and Mango Markets ($116M).

**Part II** walks ten complete, tested programs end to end: an escrow, an all-or-nothing fundraiser, a parimutuel betting market, an order book exchange with a critbit matching engine, a constant-product AMM, an oracle-priced proprietary AMM, a lending and borrowing market with per-second interest and a liquidation engine, a managed fund (what some Solana platforms call a "vault"), a fully collateralized options venue, and a perpetual futures venue with funding, margin, and a haircut that keeps the pool solvent. Every chapter gives the account model, the instruction handlers walked as a story, the math in minor units with its rounding directions, the invariants, the failure modes, the tests that catch each one, and the incentives of everyone involved, operator and user alike. Account maps, state machines, and value flows are drawn in one visual language across all ten, so the programs can be read against each other. They have not been explained side by side in one place before.

In the tradition of *TCP/IP Illustrated*, the book teaches the layer that does not change. Frameworks churn. The account model has been stable since Solana launched, the arithmetic of money will not change, and neither will the desire of adversaries to take your assets.

No Solana experience, no finance background, and no programming are assumed. The first two are built from first principles, with the people and the dollar amounts on the page, and every program is explained in prose and figures, with its Rust in the companion repository.

The tested programs live in a companion repository, where continuous integration keeps them current in a way paper cannot, and a companion AI plugin applies the book's rules inside AI coding tools. An AI can write a Solana program on request. No AI can understand one on your behalf.

Published by Quicknode.
