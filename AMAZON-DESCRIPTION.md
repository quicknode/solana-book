# Building Financial Software on Solana

*The book summary, used as the product description on the Amazon listing.*

---

## The Book That Teaches You to Build the Money, Not the Machine

There is no shortage of material about how Solana works. Videos, courses, and blog posts cover consensus, validators, Proof of History, and the internals of the runtime. A great deal of it is good. None of it is this book.

**Building Financial Software on Solana** is about building *on* Solana, not about how Solana is built. It is for the person whose job is to ship an escrow, a lending market, an exchange, a fund, or a perpetual futures venue, and who needs to know how a financial idea becomes accounts, instruction handlers, arithmetic, and checks that hold when someone attacks them. The network's internals appear only where they change what you build. Everything else is about money: how to hold it, how to calculate with it, how to decide what is true about the outside world before you move it, and how it gets stolen from programs that got one of those wrong.

You will not find a tour of the validator. You will find nine complete financial products, drawn and explained side by side, and the disciplines that make all nine correct.

## A Fundamentals Book, in the Tradition of the Ones That Lasted

Some technical books die with the release they document. A smaller number live for decades. *TCP/IP Illustrated* is still the book network engineers hand each other, thirty years on. *The UNIX and Linux System Administration Handbook* has outlasted every operating system release it mentioned. *Mastering Bitcoin* remains the standard text on its subject. What those books share is a decision to teach the primitive layer that does not change: the mental models survive even as every command line flag dies.

This book is written to belong in that group, for a field that needs one. Solana moves fast: framework releases, library versions, and tooling churn constantly. A book that prints them is wrong within a year, and financial software is the worst possible place to learn from stale material. So this book teaches the durable layer: **how financial ideas become Solana programs, implemented as accounts, instruction handlers, signatures, oracles, checks, and math**. The account model has been stable since Solana launched. The arithmetic of money will not change. Neither will the desire of adversaries to take your assets.

Runnable, version pinned code is deliberately not this book's job. It lives in the companion repository, where continuous integration keeps it honest.

## Why Financial Products Get Built on Solana at All

Financial products built on Solana have properties no traditional rail offers, and the book opens by naming them, because they decide which products are worth building:

- **Markets trade 24 hours a day, 7 days a week.** No opening bell, no weekend close, no holiday calendar.
- **Settlement is atomic, instant, and global.** A trade and its settlement can be the same event, and no ordering of failures leaves one side paid and the other empty handed.
- **Everyone reads the same accounts.** A traditional trade lands in two firms' separate books, and whole departments exist to check the copies against each other. Onchain there are no copies to reconcile.
- **Money is programmable.** The rules an institution enforces with staff and procedure (release the escrow, accrue the interest, liquidate the underwater loan, pay the winners their share) run as instruction handlers.
- **Transactions cost a fraction of a penny**, regardless of the size of the transfer, against card fees of roughly 1.5% to 3.5% plus a fixed amount, and remittance corridors the World Bank prices above 20%. A fee that ignores the amount changes which products are worth building at all.
- **Any asset can move**, including real world assets. As of mid 2026, Solana is the most popular chain for real world asset trading, which is why the examples here trade tokenized stocks rather than toy tokens.
- **Distribution is the deployment.** A deployed program is reachable by every wallet on the network, and by every other program, the moment it exists.

Open networks use these properties for permissionless markets anyone can join. Traditional institutions increasingly run on them too: tokenized funds, stablecoin settlement, and internal ledgers on the same primitives. Whichever market you build for, this book is the layer both share.

## Why a Book, in the Age of AI

An AI can write a Solana program on request, and this book fully expects you to use one. But **no AI can understand a program on your behalf.** The value of this book is the knowledge it leaves in your head: how financial products exist as Solana programs, so you can design your own, judge their incentives and trust decisions, work with your AI tools as a peer rather than as an oracle, and take responsibility for what you deploy.

The book splits the work with two companions:

- The **companion repository** holds the complete, tested programs the product chapters walk through, in Anchor and Quasar versions, with a native Rust version of the escrow. Its tests run continuously, so the code stays correct in a way paper cannot.
- The **companion AI skill** distills the book's rules into a form AI coding tools apply automatically.

The AI skill makes your tools better. The book makes you better.

## Who This Book Is For

This book does not assume you have written a Solana program, and it does not assume a background in finance. It covers both in enough detail to work from either side with confidence. Every Solana mechanism is introduced before it is used, and every financial concept (escrow, collateral, liquidation, market making, interest, funding, impermanent loss, adverse selection) is explained from first principles, with the people and the dollar amounts on the page, before any code depends on it.

Code is in Rust. It is explained as it appears, and the programs are deliberately small: if you can read a Rust struct and a function, you can read the product chapters. To keep the money easy to follow, every character starts every chapter with the same wallet: **one SOL** for rent deposits and transaction fees, **one thousand USDC**, and whatever story specific assets that chapter hands them.

---

# Part I: The Fundamentals

Part I is everything you need before writing financial software: the Solana mechanics money depends on, then what is specific to money.

## Solana Building Blocks

**The Core Building Blocks of Solana** takes the whole tour through two payments between two people. Key pairs, addresses, and accounts as data with an owner program and a lamport balance. Transactions carrying instructions, each addressed to a program's instruction handler. Atomicity, and what it means to design with it: settlement risk between steps simply does not exist inside a transaction, and a flash loan is atomicity turned into credit. Signatures as grants of **authority**, the address whose signature a particular action requires. Rent as a deposit rather than a fee. And the design fact that shapes the whole book: instructions supply the accounts, and instruction handlers check them, because every account a caller hands in is a claim to verify.

**Tokens** covers the asset layer. Every distinct token has its own mint account, and that address is the token's identity: the name and symbol are decoration, so the address has to be checked. A mint is a factory, and the mint authority is its boss. The freeze authority can stop any holder cold, which is the compliance mechanism behind regulated assets. Decimals define the minor unit, read from the mint and never assumed. And a table covers the token extensions that change what a transfer means: transfer fees, transfer hooks, confidential transfers, permanent delegate. Send 100 and 99 arrives, and your program has to know that before it believes its own accounting.

**PDAs: How Solana Programs Store Data** generalizes a mechanism you have already been using. A program derived address is computed from a program's ID and chosen seeds, and has no private key, so only the deriving program can act as it. Three properties follow, and they are the three jobs every program in the book uses: seeds make data findable, seeds make relationships verifiable, and PDA authority over a vault is what "the program holds the funds" actually means.

**Time** is a chapter most Solana material never writes. Solana has two clocks, and choosing between them is a security decision. The **slot** counts block opportunities and its progression is guaranteed. The **unix timestamp** is validator reported wall clock time, right to within a few seconds, and nudgeable. The rule: choose the clock by asking who benefits from the error. Anything an adversary would profit from bending is measured in slots, which is why interest and funding accrue per slot; timestamps are for humans and long horizons. The chapter also covers freshness windows for prices and what a chain halt does to both clocks.

## Financial Programming Concepts in Solana

This section is the heart of the book's claim to be about financial software rather than about Solana.

**Financial Software Is a State Machine** is the framing everything else hangs from. Every financial product is a small number of states and the legal transitions between them: an escrow offer is open, then taken or canceled; a loan is healthy, unhealthy, repaid, or liquidated. Draw the machine before writing a handler, and the design rules fall out of the drawing. One handler performs one transition. Make state explicit, often by the account's own existence rather than a flag that can desynchronize. Guard every transition by state and not just by signer. And the rule that finds missing requirements rather than missing code: **from every state, every participant must be able to get their money out**. An escrow with no cancel handler strands the maker's tokens the day nobody takes the offer.

**The Arithmetic of Money** is the chapter every bug class in it has drained a real market. Money is integers: no floats near funds, ever. Every amount is an integer at a declared scale, read from the mint and never assumed. Multiply before divide, with wider intermediates, because integer division destroys information and phantom overflow corrupts perfectly legal trades. Use checked arithmetic with named overflow errors, and understand why `saturating_sub` on a value your accounting relies on is worse than wrapping. **Rounding is a policy decision**: floor what the program pays out, ceil what the user owes, round once, and keep safety checks conservative in the same direction. Assert invariants after the math, because a check on the way in catches bad inputs while a check on the way out catches your own bug. And one cumulative index compounds interest for every borrower at once, replacing a loop nobody could afford to run onchain.

A War Story makes the rounding rule concrete: in 2021, researchers at Neodyme found that the widely forked SPL token lending program rounded a conversion to the nearest integer instead of flooring it. Rounding half up means rounding in the user's favor half the time, and a carefully sized deposit and withdraw loop could keep the rounding on the favorable side. Roughly $2.6B across Solana lending markets was exposed, and the fix that shipped was one word.

**Offchain Truth** answers the question every market in the book turns on: how does a fact from the real world become something a program will act on? A fact becomes onchain truth when a key the program trusts has vouched for it, either by signing your transaction directly or by signing offchain for an oracle program to verify and record in an account. Either way the publication is *input*, held to the same standard as any other: check its provenance, its freshness in the right clock, its confidence interval, and its degenerate values. Fresh but uncertain is its own failure mode. The chapter then treats trust as an engineering parameter, chosen by asking who publishes, what it costs them to lie, and what happens when they go silent. That last question is the one designs forget, and the answer belongs in the state machine as an exit that does not depend on the feed.

**The Adversary** is the most durable chapter in the book and the one to reread before every launch. Deploying financial software on a public chain means accepting a threat model no other kind of software faces: every handler is callable by anyone on earth, pseudonymously, for a fraction of a cent, and every mistake is not a crash report but a bounty. Then the exploit classes, each with its defense and, where an incident makes the lesson concrete, a War Story told to teach rather than to blame:

- **Validation and the confused deputy.** The most exploited bug class in Solana's history is a program believing an account it should have checked. The checklist is short: signer, owner, stored address, derivation. **Cashio, $52M, 2022**: one unvalidated link in an account chain, so an attacker fabricated the whole chain and minted stablecoins against nothing. **Wormhole, $325M, 2022**: a spoofable check let an attacker present a proof nobody had produced. Verification you did not perform is verification that did not happen.
- **The empty pool.** Every share based pool prices shares as value divided by supply, and that formula has a degenerate zone at the beginning. The inflation attack exploits it; the chapter names four defenses.
- **A true price can still be a manipulated price.** The nastiest class, because the fact is real, fresh, correctly verified, and an accurate report of a market the attacker just bent. **Mango Markets, $116M, 2022**: an attacker moved a thin token's spot price more than twentyfold, and the risk engine faithfully valued their positions against it. Time weight the price, respect the confidence interval, bound per block state change, and never build leverage on a market thinner than the credit it collateralizes.
- **Rounding errors become faucets once someone finds the loop.** **Hundred Finance and Sonne Finance, $7M and $20M**, a year apart, two forks of the same design, the same sequence both times. The defense is a round trip property test that would have failed on both.
- **Ordering and composability.** Checks, effects, interactions at every trust boundary: your invariants must hold at the end of *your* instruction, because the instructions after yours belong to someone else.

**Operating Financial Software** is the rest of the job. Test the code path the bug lives in: build state through the program's own handlers rather than injecting accounts, test both directions of every symmetric flow, test both sides of every boundary one minor unit apart, test the adversarial path by name, and assert properties rather than just balances. Proving goes further, up a ladder from tests to property tests to formal verification. Ship with a second opinion audit. And the subject most books skip: **admin power**, treated as a component with a specification. Bound what configuration can express. Snapshot terms when money commits. Keep admin money and user money in different pots. Give the admin no path to principal. Pausing is for entrances, not exits.

---

# Part II: Building Financial Products in Solana

Nine chapters, nine complete programs, each from the companion repository where its tests run continuously. Every chapter runs the same eight beats: the concept with real people and real incentives, the account model, the instruction handlers walked as a story, the math in minor units with rounding directions stated, the invariants, the failure modes, the testing considerations, and what you learnt. These nine products have not been drawn and explained side by side in one place before.

**Escrow** is first because it is the smallest program that actually handles value, and because once you have built an escrow, everything else looks like an escrow. Two strangers swap a stock for stablecoins without trusting each other, and without the one to six percent a traditional escrow agent charges. You get program custody, terms in a data account, transitions gated by signature and state, an exit from every state, and your first feel for minor units.

**Token Fundraiser** is onchain crowdfunding with the all-or-nothing promise Kickstarter makes as company policy, made instead a property of code. One new ingredient over the escrow: a deadline, expressed as one floored day count compared both ways, so contributions and refunds can never both be legal at once. It teaches receipt accounts per participant, cumulative caps that turn broad participation into arithmetic, the habit of naming the closer for every account you create, and the rule that generalizes to every gate you will ever write: **the counter is the truth, the vault is just custody**.

**The Betting Market** is a parimutuel pool with no bookmaker: everyone's stakes go into one vault, and winners split the losers' money pro rata. The program carries no risk, and the house takes a fee from the losing side only, which buys a guarantee worth printing: a winner can never receive less than they staked. It is also the book's cleanest treatment of offchain truth by designated signer, with the operator's trust made visible and narrow: she picks the winning outcome, and can touch nothing else. Plus account closure as the double claim defense.

**The Order Book Exchange** rebuilds what NYSE, NASDAQ, and the CME run as three separate institutions into one program: matching engine, clearing house, and settlement. Limit orders, the spread, and price time priority. Critbit trees, chosen because compute is metered and inserting into a sorted array is not free. Lock on entry, so every resting order is a funded commitment. An internal ledger of unsettled balances, zeroed before transfer so double withdrawal is structurally impossible. And the vault swap attack, where the fee vault and the quote vault hold the same token with the same authority and only stored address checks keep them apart.

**The Constant-Product AMM** builds the other kind of exchange, where nobody posts prices and a formula is the market maker. It is deliberately not the toy version: there is an operator, real fees, liquidity providers, and the true story of X, Y, and K after every trade, including the fact most explanations get wrong, which is that K grows. You get price impact, the integer square root by Newton's method because floats can never touch funds, the locked minimum liquidity that closes the inflation attack, and an honest treatment of **impermanent loss**: an LP is a bet on trading volume, not on price direction, and nobody should provide liquidity without being able to draw the diagram.

**The Prop AMM** covers the design that quietly took most of Solana's swap volume from both of the above: a market making firm quoting its own capital at oracle prices. No curve, no liquidity providers, no shares. The oracle is the price and the spread is the fee, which means no price impact and nothing to sandwich. For a market maker, the oracle freshness and confidence checks are not hygiene, they are the business, because a lagging quote is a free option for whoever notices first. The chapter teaches adverse selection as the structural cost of the business, and why entire attack classes return "not applicable" against a design that never built the mechanism they need.

**Lending and Borrowing** is a commercial bank with the branding stripped off. Reserves, share tokens as the yield mechanism, obligations as loan files, and collateral that keeps earning while pledged. The cumulative borrow rate index compounds interest for every borrower with one multiplication and no tokens moving. A kinked utilization curve does a central bank's job in fifteen lines of integer math. Valuation floors collateral and ceils debt, so every health check errs against the borrower. Liquidation is a paid correction, capped per call by a close factor and priced by a bonus. And the chapter introduces the **crank**: permissionless, idempotent maintenance anyone may call, because work nobody is paid to do is a bug in your incentives rather than in your code.

**The Vault Strategy** is an onchain index fund, and it asks a different question about other people's money: not "is the loan covered" but "what is the manager allowed to do." The answer is the strongest property in the book's programs: **no instruction handler, under any parameters, moves user deposits to the operator.** A curator approves which assets and price feeds exist; the manager only picks weights among them, so a manager can neither list their own token nor pair a real asset with a feed they control. It teaches net asset value as the share price, fees paid by dilution with no setter, and the most transferable idea in the chapter: **when an untrusted party routes the trade, the acceptable outcome must be computed from a price source they do not control.**

**Perpetual Futures** is the capstone, because building one honestly requires everything: tokens, PDAs, vault custody, pool shares, offchain truth, liquidation, time, and arithmetic that must round the right way under leverage. A pool is the counterparty to every position, which creates the problem the whole program is organized around: proving the pool can pay every winner at every moment without ever iterating over open positions. The answer is pre-funded solvency, with the maximum payout reserved at open and profit capped at that reservation, plus per side accumulators that make solvency and share pricing constant time. You get funding as the rent the crowded side pays, mark to market LP share pricing, and an honest accounting of where a loss too big to pay goes: liquidation takes it from the loser, an insurance fund takes it from a pot filled by fees, and auto-deleveraging takes it from the winners. Those tiers do not make a venue lose less money. They name, before the loss happens, which users pay for it.

---

## What You Take Away

The closing chapter makes the book's argument explicit. An escrow that holds two strangers to one deal and a perpetual futures venue that prices leverage against an oracle look like different species of software. They are not. Strip both of their subject matter and the same small machine is left, built from six pieces:

- A data account holds the terms, and a separate vault holds the money.
- A PDA is the authority over the vault, so funds move only along code paths.
- One instruction handler performs one state transition.
- Terms freeze when money commits.
- From every state, every participant must be able to get their money out.
- Arithmetic runs in integers of minor units, multiplying before dividing, rounding against whoever could profit from the rounding.

Frameworks will change under those six sentences, and they will keep being true.

The book is honest about what it leaves out, and says why: staking and reward distribution, vesting and streaming payments, formal verification as a full discipline, governance, and the interface layer. Knowing which parts are missing is part of knowing the shape of the field.

It closes with an appendix meant to be worn out. The **Glossary** is a full vocabulary for Solana based financial products, covering the technical and financial terms this field uses daily but rarely defines.

## The Figures

Every figure is drawn to one set of conventions, taught by the first figure that uses it. Addresses with private keys sit on a curve; derived addresses sit off it, captioned with the seeds they came from. Every walkthrough step is followed by a diagram of what moved, what was created, and what changed. Account maps, state machines, and value flows appear in every product chapter in the same visual language, which is what makes nine different products comparable at a glance.

## Where to Start

Reading front to back works, and the parts are ordered so each uses only what came before. The book also names the honest shortcuts:

- **Already building on Solana?** Skim Solana Building Blocks, read Financial Programming Concepts in Solana properly, then take the product chapters in order.
- **Here to ship one specific thing?** Read The Arithmetic of Money and Offchain Truth, then go straight to your product chapter. Each one names the sections it leans on.
- **Arriving from another chain?** A Solana program is what other ecosystems call a smart contract. Start at the beginning; the account model is genuinely different, and the first four chapters are short.

The gap between reading this book and being able to ship is one project wide. Pick the smallest product you actually want to exist. Draw its state machine before you write a handler. Give every state an exit. Write the tests that drive the machine down every path. Then get a second opinion from somebody who was not in the room.

The account model has been stable since Solana launched. The arithmetic will not change. Neither will the desire of adversaries to take your assets. Build carefully, and the rest of it is detail.

---

*Published by Quicknode. Text and figures are licensed CC BY-NC-SA 4.0; code samples are MIT. Both companions are linked from the book's home page.*
