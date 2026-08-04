# Chapter 8: Offchain Truth

A program can verify a lot on its own: signatures, balances, account ownership, its own arithmetic. But most financial products depend on facts that happen in the real world, outside anything the chain can see. Did the Federal Reserve cut rates this afternoon? Which film grossed highest this month? Did the shipment arrive? Did the borrower's collateral just crash? Every one of the book's markets turns on a fact like this: prices for the lending market and the perpetual futures exchange, an event outcome for the betting market, asset valuations for the vault strategy. And they all get onchain on the same foundation: some party signs, and a careful program checks far more than that signature.

## An Oracle's Publication Is Input, Not Gospel

A fact becomes onchain truth when a key the program trusts has vouched for it. Publishers of such facts are called **oracles**, and what an oracle publishes reaches a program in one of two shapes.

The first is **signed straight to you**: the trusted key signs the transaction carrying the fact. The betting market's admin settling an event is this, and the program checks a signer, and which key it is.

The second is **published to an account**: the key signs its statement offchain, an oracle program verifies that signature onchain and records the fact in an account it owns, and your program reads that account in a later transaction. Pyth, Switchboard, and Chainlink all work this way, and it is worth being clear about what your own program does here, because it is not what most people expect: it verifies no signature at all. The signature was checked already, in somebody else's transaction. What your program establishes is where the account came from.

Either way, by the time your program sees the fact it is an ordinary instruction argument or ordinary account data, and it can be held to the same standard as every other input:

- **The provenance.** Is this the exact account the program was configured with, owned by the program whose verification you are relying on? A fact from an unexpected account is not a fact. Anchor's `Account<T>` enforces the owner and the discriminator, and the feed's own identity is a stored-pubkey comparison on top of that. The vault strategy rejects any price account that is not the exact feed recorded in its registry; the lending market, which takes the first path, lets only the market owner's key write its feeds.
- **The freshness.** A true price from five minutes ago can be a dangerously wrong price now. Every consumer states its tolerance and rejects anything older: the lending market refuses prices more than 25 slots old, the vault strategy more than 60 seconds. Which clock a tolerance is stated in, and why the answer is usually slots, is the Time chapter's subject.
- **The confidence.** Good price feeds publish their own uncertainty: $250 ± $0.10 is a different fact from $250 ± $8, and the second one, during a volatile minute, may not be safe to liquidate against. A production consumer checks the confidence interval and rejects or degrades when it is too wide. Fresh but uncertain is its own failure mode.
- **The degenerate values.** A price of zero or a negative mantissa is never a market fact; it is a broken feed, and it must fail closed before it multiplies against anything.

> **How a Pyth price actually reaches your program.** Publishers sign their prices, and the aggregate is attested by the signatures of Wormhole's guardians. Anyone can then post that signed update to Solana, where the **Pyth Receiver program** verifies those guardian signatures and writes a `PriceUpdateV2` account that it owns. Your program reads that account in a later transaction, and what it checks are `feed_id`, `publish_time`, and `conf`, never a signature, because the receiver already did that. One field is worth knowing beyond the four checks above: `verification_level` records whether the full guardian set was checked or only some of its signatures, so a partially verified update is a weaker fact than a fully verified one. The companion repository's Pyth example reads exactly these fields.

The habit to build: an oracle's publication is *input*, exactly as untrusted as an instruction argument until each of those checks has passed. Programs that treat the feed account as gospel are one substitution or one stale read away from valuing the world wrongly, and everything downstream of a wrong valuation (health checks, liquidations, payouts) executes faithfully on the wrong number.

## Trust Is an Engineering Parameter

Who signs the fact is a design decision with a full spectrum of answers, and the honest way to make it is to ask three questions: who publishes, what does it cost them to lie, and what happens when they stop publishing?

At one end sits the **single trusted key**. The betting market's admin settles the event with one signature; her word becomes the onchain truth. For a small market whose operator's business is its reputation, this can be the right design, and the program's job is to make the trust *visible and narrow*: the admin picks the winning outcome, but she cannot touch the pro-rata math, exceed the snapshotted fee, or reach the vault by any other path. A reader of the code can see exactly what her signature can and cannot do.

In the middle sit **committees and multi-party resolution**: several parties must agree before a fact lands, so lying requires collusion and any single defector breaks the lie. The cost is coordination and latency.

At the far end sit **price feed networks** like Pyth and Switchboard, which aggregate many independent publishers (exchanges, market makers) into a single signed publication with a confidence interval, updated continuously. Lying requires bribing a meaningful share of publishers whose businesses depend on being right, which is the strongest economic answer available to "what does it cost them to lie." This is what the lending market and perpetual futures exchange consume. Which network, and which crate decodes it, is a convention that lives in the companion repository; the checks in the previous section are the law and apply to all of them.

The third question, **what happens when publication stops**, is the one designs forget. Feeds go stale during outages; committees deadlock; admins lose keys or interest. A program whose only paths require fresh truth is a program that can strand everyone's funds by simply not hearing anything. The staleness checks above handle the safety half (never act on old truth); the liveness half belongs to the state machine: an exit from every state that does not depend on the feed. The betting market can be canceled and refunded without an outcome ever being declared. A lending market whose oracle dies needs an escape hatch (the admin-power section of Operating Financial Software takes this up). When you choose your trusted source, choose in the same breath what the program does the day it goes silent.

One more consequence of taking trust seriously: **the fact's meaning must be pinned when the money commits, not when the fact arrives.** The betting market locks its outcome list the moment the first bet lands and snapshots its fee at event creation, so the question bettors staked on cannot be quietly rewritten before it is answered. Whatever the source, the deal is: the terms were fixed when you entered; only the answer arrives later.

The Adversary's price-manipulation section covers the case these checks cannot catch: a signed fact that is fresh, confident, correctly verified, and *engineered* - a true report of a market the attacker just bent.

## What You Learnt

- A fact is onchain truth because a key the program trusts vouched for it, either by signing your transaction directly or by signing offchain for an oracle program to verify and record in an account. Either way the publication is input: check its provenance, its freshness (in the right clock), its confidence, and its degenerate values.
- Trust is an engineering parameter: a single key, a committee, or a feed network, chosen by asking who publishes, what lying costs them, and what happens when they go silent.
- Pin the fact's meaning when the money commits, and give every state an exit that does not depend on the feed.
