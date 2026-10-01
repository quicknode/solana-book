# Chapter 8: Offchain Truth

A program can verify a lot on its own: signatures, balances, account ownership, its own arithmetic. But most financial products depend on facts that happen in the real world, outside anything the chain can see. Did the Federal Reserve cut rates this afternoon? Which film grossed highest this month? Did the shipment arrive? Did the borrower's collateral just crash? Every one of the book's markets turns on a fact like this: prices for the lending market and the perpetual futures exchange, an event outcome for the betting market, asset valuations for the managed fund. They all reach the program the same way: someone the program trusts signs the fact with their private key, and the program checks that fact's provenance, freshness, and confidence, and rejects degenerate values, before it uses it.

## An Oracle's Publication Is an Input to Check

A program can act on a fact from outside the chain once someone it trusts has signed it with their private key. Publishers of such facts are called **oracles**, and what an oracle publishes reaches a program in one of two shapes.

The first is **signed straight to you**: the trusted party signs the transaction carrying the fact with their private key. The betting market's admin settling an event is this, and the program checks a signer, and which public key signed.

The second is **published to an account**: the trusted party signs its statement offchain with their private key, an oracle program verifies that signature onchain and records the fact in an account it owns, and your program reads that account in a later transaction. Pyth and Chainlink both work this way, and your own program verifies no signature at all. The signature was checked already, in somebody else's transaction. What your program establishes is where the account came from.

Either way, by the time your program sees the fact it is an ordinary instruction argument or ordinary account data, and it can be held to the same standard as every other input:

- **The provenance.** Is this the exact account the program was configured with, owned by the program whose verification you are relying on? A fact from an unexpected account is rejected. Anchor's `Account<T>` enforces the owner and the discriminator, and the feed's own identity is a stored-pubkey comparison on top of that. The managed fund rejects any price account that is not the exact feed recorded in its registry; the lending market, which takes the first path, lets only a transaction signed with the market owner's private key write its feeds.
- **The freshness.** A true price from five minutes ago can be a dangerously wrong price now. Every consumer states its tolerance and rejects anything older: the lending market refuses prices more than 25 slots old, the managed fund more than 60 seconds. Which clock a tolerance is stated in, and why the answer is usually slots, is the *Time* chapter's subject.
- **The confidence.** Good price feeds publish their own uncertainty: $250 ± $0.10 is a different fact from $250 ± $8, and the second one, during a volatile minute, may not be safe to liquidate against. A production consumer checks the confidence interval and rejects or degrades when it is too wide. A fresh price with a wide confidence interval is a separate failure mode from a stale one.
- **The degenerate values.** A price of zero or below means a broken feed, and the program must fail before that number multiplies against anything. Negative prices are real but exceptionally rare, and never for a token.[^negative-oil]

> **How a Pyth price reaches your program.** Publishers sign their prices, and the aggregate is attested by the signatures of Wormhole's guardians. Anyone can then post that signed update to Solana, where the **Pyth Receiver program** verifies those guardian signatures and writes a `PriceUpdateV2` account that it owns. Your program reads that account in a later transaction, and what it checks are `feed_id`, `publish_time`, and `conf`, never a signature, because the receiver already did that. One more field beyond the four checks above: `verification_level` records whether the full guardian set was checked or only some of its signatures, so a partially verified update is a weaker fact than a fully verified one. The companion repository's Pyth example reads these fields.

An oracle update is as untrusted as any other input. The program must check it for substitution, staleness, uncertainty and degenerate values, or every health check, liquidation, and payout downstream runs on the wrong number.

## Trust Is an Engineering Parameter

Who signs the fact is a design decision with a range of answers, and the way to make it is to ask three questions: who publishes, what does it cost them to lie, and what happens when they stop publishing?

At one end is the **single trusted signer**. The betting market's admin settles the event with one signature: `settle_event()` writes their answer to the event account's `winning_outcome_index`, and every payout follows from it. For a small market whose operator's business is its reputation, this can be the right design, and the program's job is to make the trust *visible and narrow*. The admin picks the winning outcome, but they cannot touch the pro-rata math, exceed the snapshotted fee, or reach the vault by any other path. A reader of the code can see what their signature can and cannot do.

In the middle are **committees and multi-party resolution**: several parties must agree before a fact is recorded, so lying requires collusion and any single defector breaks the lie. The drawback is coordination and latency.

At the far end are **price feed networks** like Pyth, which aggregate many independent publishers (exchanges, market makers) into a single signed publication with a confidence interval, updated continuously. Lying requires bribing a meaningful share of publishers whose businesses depend on being right, which is the strongest economic answer available to "what does it cost them to lie." This is what the lending market and perpetual futures exchange consume. Which network, and which crate decodes it, is a convention that lives in the companion repository; the checks in the previous section apply to all of them.

The third question, **what happens when publication stops**, is an important one to include in your design. Feeds go stale during outages; committees deadlock; admins lose private keys or interest. A program in which every way to withdraw needs a fresh fact strands everyone's funds when the source stops publishing. The staleness checks above stop the program acting on an old fact. The state machine has to cover the other case: every participant must be able to get their assets out of every state without a new fact arriving. The betting market's admin can call `cancel_event()`, after which each bettor takes their stake back with `claim_refund()`, without an outcome ever being declared. A lending market whose oracle stops publishing needs a way for depositors to withdraw without a fresh price.[^escape-hatch] When you choose a trusted source, decide at the same time what the program does when it goes silent.

One more rule applies: **the fact's meaning must be fixed when participants commit their tokens, not when the fact arrives.** The betting market fixes its outcome list when the admin opens it to bets, before any bet can land, and fixes its fee and its betting close time at event creation. The question bettors staked on cannot be rewritten before it is answered, and betting stops before the answer can be known.

The price-manipulation section of the *Adversary* chapter covers the case these checks cannot catch: a signed fact that is fresh, confident, correctly verified, and *engineered*, a true report of a market the attacker just manipulated.

## What You Learnt

- A program can act on a fact from outside the chain once someone it trusts has signed it with their private key, either by signing your transaction directly or by signing offchain for an oracle program to verify and record in an account. Either way the publication is input: check its provenance, its freshness (in the right clock), its confidence, and its degenerate values.
- Treat trust as an engineering parameter: choose a single signer, a committee, or a feed network by asking who publishes, what lying costs them, and what happens when they go silent.
- Fix the fact's meaning when participants commit their tokens, and make sure every participant is able to get their assets out of every state without waiting on a new fact.

[^negative-oil]: WTI crude oil futures traded as low as −$40.32 a barrel on 20 April 2020, the first negative price since the contract began trading in 1983, after storage filled and holders of the expiring May contract paid counterparties to take delivery off their hands. The EIA's account is at [eia.gov/todayinenergy/detail.php?id=43495](https://www.eia.gov/todayinenergy/detail.php?id=43495).

[^escape-hatch]: The admin-power section of the *Operating Financial Software* chapter takes this up.
