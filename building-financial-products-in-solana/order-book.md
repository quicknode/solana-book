# Chapter 14: The Order Book Exchange

NYSE, NASDAQ, and the CME are order book exchanges. On Solana, OpenBook and Phoenix are order book exchanges. All of them run the same machinery: orders arrive carrying a price their owner refuses to cross, wait in two sorted lists, trade when one order reaches across the gap, and settle out of vaults the venue's operator cannot reach.

The program lives at `finance/order-book` in the companion repository. It assumes you know the escrow pattern from the *Escrow* chapter: tokens held in program-owned vaults, terms recorded in data accounts, and every movement gated by who signed. An exchange is that pattern scaled up from one deal to thousands of simultaneous ones.

## A Limit Order Is a Price You Refuse to Cross

A **limit order** is an order with a price limit attached. A **bid** says "I will buy, but only at or below this price." An **ask** says "I will sell, but only at or above this price." The **order book** is the two lists where those orders wait: bids on one side, asks on the other, best prices at the front. The gap between the best bid and the best ask is the spread, and when a new order's limit reaches across that gap, a trade happens.

![The NVDAx/USDC order book: asks stacked lowest price first, bids highest first, and the spread between the best bid and best ask.](figures/order-book-bids-asks-spread.svg)

The other model for an exchange is the automated market maker, where there are no limit orders and every trade fills immediately against a pooled formula; that is the next chapter. An order book is better at price discovery, because every price on it is a real commitment someone funded. An AMM is better for new assets without much liquidity around them. Real markets need both.

One naming note: this design is traditionally called a *central limit* order book, because the book lives in one central place. Here that place is a Solana account, so the "central" book is stored on a decentralized network.

## The Account Model: A Market, Its Book, and a Ledger of Who Is Owed What

The market this chapter builds trades NVDAx over USDC: NVDAx, a stock, is the **base token**, the thing being bought and sold; USDC is the **quote token**, the thing prices are stated in. You quote in the stable asset so that "250" always means dollars.

![One market account, one book, three vaults; every trader's accounts hang beneath their spot on the curve.](figures/order-book-accounts.svg)

The **market** is a PDA holding one trading pair's configuration: the two mint addresses, the fee in basis points, the tick size, the lot sizes, the minimum order size, an `is_active` flag, and the authority (Maria). Its seeds are the string `"market"` plus the two mints, so one base/quote pair maps to one market. The market PDA is also the authority of all three vaults, so tokens leave them only through the program's own instruction handlers.

The **order book** is the largest account: about 180 KB holding two trees of resting orders (one per side, 1,024 orders each) plus a monotonic `next_order_id` counter. It is **zero-copy**: an account this large would be prohibitively expensive to deserialize on every instruction, so the program reads and writes fields in place through an `AccountLoader` instead.

> **Why the order book is not a PDA.** Solana caps account allocations made from inside a program at 10 KB, so `initialize_market()` cannot create a 180 KB account. Instead, the client creates the account directly with the System Program before calling `initialize_market()`, sized to `ORDER_BOOK_ACCOUNT_SIZE` and owned by the program. And it cannot be a PDA at all, because creating an account that way requires the new account's own signature, which a PDA cannot give. The program instead ties the book to its market with a `has_one = order_book` constraint, checked on every instruction that touches it.

Three **vaults** hold the money: a base vault for locked NVDAx, a quote vault for locked USDC, and a separate **fee vault** for Maria's earnings. The fee vault holds the same token as the quote vault, and keeping them separate means balances owed to users and balances earned by the market can never be confused. That separation is what stops a caller from being paid out of Maria's fees; the failure modes section shows the attack it blocks.

Each trader gets a **market user** account (seeds: `"market_user"`, the market, the owner), tracking their `open_orders` (capped at 20) and two numbers that keep the design cheap: `unsettled_base` and `unsettled_quote`, the amounts the program owes them. When the program takes tokens from a user it transfers them immediately into a vault; when it owes tokens to a user it just increments these counters. Users claim what they are owed whenever they like, and many small payouts consolidate into one transfer, saving compute units on the path every fill takes.

Finally, every order placed becomes an **order** account of its own (seeds: `"order"`, the market, the order ID): side, price, original quantity, filled quantity, a status that walks Open, PartiallyFilled, Filled, or Cancelled, and a timestamp.

## Why the Book Is a Tree, Not a List

The first instinct is to store the bids and asks as sorted arrays. Arrays get slow when an exchange gets busy: inserting into the middle of a sorted list means shifting everything after it, and on a chain where compute is metered, that cost lands on your users.

So the book's two sides are **critbit trees**. Each resting order gets a fixed-size binary key, and the tree branches at the first bit where keys differ (the "critical bit"). Inserting an order means walking to where its key diverges and adding one node there; nothing shifts. The key is built from the price in the high bits and a sequence number in the low bits, which yields the exchange rule you want for free: walking the tree visits orders best price first, and within a single price, earliest order first. That ordering has a name, **price-time priority**, and it is the fairness rule every serious exchange runs on.

![A four-leaf critbit tree: binary keys with price bits before sequence bits, branch points at the first differing bit, and a walk order that visits best price first and earliest order first.](figures/order-book-critbit.svg)

## The Market Authority Opens the NVDAx/USDC Market

Maria runs the exchange. She is the market authority: she creates the market and she alone can withdraw its fees. Her revenue is a fee of 25 **basis points**, a quarter of one percent, carved out of each fill's quote proceeds when orders match, so it is borne by whichever side of the fill receives the quote token.

Maria's client first creates the empty order book account, then calls `initialize_market()` with her chosen parameters: `fee_basis_points` (25), `tick_size`, `base_lot_size`, `quote_lot_size`, and `min_order_size`. The handler validates all of them: every size must be nonzero, and the fee is capped at 10,000 basis points, because a fee above 100% is nonsense. It creates the market account and the three vaults with the market as authority, records every address on the market account, and stamps the order book's first bytes so each tree knows which side it is.

The tick size and minimum order size keep the book usable. Prices must land on a multiple of `tick_size` or the order is rejected, which keeps the book from fragmenting into thousands of dust price levels. Orders below `min_order_size` are rejected outright, which keeps spam from filling the trees.

![Maria's initialize_market() creates the market account with its parameters and three empty vaults, and stamps two empty trees onto the pre-created order book account.](figures/order-book-initialize-market.svg)

## Every Trader Gets a Ledger Line

Three traders use the market this chapter: Alice, Bob, and Carol, each starting with the standard wallet of one SOL and 1,000 USDC, plus (for the two sellers, Alice and Carol) some NVDAx. Before trading, each of them calls `initialize_market_user()` once. It creates their market user account with zeroed unsettled balances and an empty open-order list. It is their line in the exchange's internal ledger: the account the exchange will owe money to.

## An Ask Rests Above the Best Bid

Alice holds NVDAx and thinks AI is overhyped. She wants out, but not at any price: she calls `place_order()` with side `Ask`, price 265, quantity ten shares.

The handler validates first: the market is active, the price is nonzero and tick-aligned, the quantity meets the minimum, and Alice is under her 20-open-order cap. Then it takes her money up front. An ask locks the base: her ten shares move immediately from her token account into the base vault. (A bid locks the quote instead: price times quantity.) This lock-on-entry rule is what makes every order on the book a funded commitment rather than a promise; there is no path where a matched order turns out to be backed by nothing.

The book's ask side is empty and no bid reaches 265, so there is nothing to match. Alice's order becomes a **resting order**: a leaf in the ask tree, an order account stamped Open, and an entry in her open-order list. Placing it cost her nothing but rent and the transaction fee; the exchange's own fee only ever applies to fills.

![Alice's ten shares flow into the base vault, and her ask becomes the only leaf in the ask tree at price 265.](figures/order-book-alice-ask.svg)

## A Bid Below the Best Ask Rests Too

Bob wants in, but he is not prepared to pay more than 250. He calls `place_order()` with side `Bid`, price 250, quantity four. The handler locks 4 × 250 = 1,000 USDC from his token account into the quote vault: every dollar he has, committed the moment the order rests. The best ask is Alice's 265, and Bob's limit refuses to cross it, so his bid rests too. The book now has a spread: bid 250, ask 265.

![The book after two orders: Alice's ask at 265 and Bob's bid at 250, with the spread between them.](figures/order-book-resting-spread.svg)

## A Crossing Ask Fills Against the Resting Bid

Carol also owns NVDAx and also wants out, and she is less patient than Alice: she asks three shares at 245. Her limit is at or below the best bid, so this order crosses.

The planning function, `plan_fills()`, walks the opposite side of the book in price-time priority and returns the list of fills without mutating anything. Bob's bid is the best (and only) bid, it covers all three shares, so the plan is one fill: three shares against Bob's order. The walk stops at the first resting order that fails to cross, because if the best price fails, every price behind it fails too.

The fill executes at **the resting order's posted price**: 250, not Carol's 245. This is the standard order book rule. The maker's posted price is the deal on offer; the taker chose to hit it. The surprise always lands in the taker's favor: a taker bid pays less than its limit allowed, and a taker ask, like Carol's, receives more.

One Solana-specific mechanic makes this work: the program cannot load arbitrary accounts mid-instruction, so Carol's transaction must carry the accounts of the makers she will match with, passed as pairs of (order account, market user account) in the order the book would walk them. The program does not trust that list. It plans fills from its own tree, then verifies each supplied pair against the plan: the order IDs must match, the accounts must belong to this market, and each maker order's owner must match its market user. A wrong or missing account fails the transaction with `MakerAccountMismatch`, `MakerOwnerMismatch`, or `MissingMakerAccounts`.

Now the money moves, in the unsettled-balance style. Gross proceeds are 3 × 250 = 750 USDC. Maria's fee is 25 basis points of that: 1.875 USDC, computed with ceiling division so any rounding goes to the market rather than leaking value one minor unit per fill (the fee section below returns to this). Carol's `unsettled_quote` is credited with the net 748.125 USDC. Bob's `unsettled_base` is credited with three shares. The fee moves from the quote vault to the fee vault in a single program-signed transfer at the end, aggregated across all fills in the order. Bob's order account is stamped PartiallyFilled with three of four filled, and the leaf in the bid tree has its remaining quantity reduced to one in place. Carol's order account is stamped Filled; nothing of hers rests.

![Nothing transfers at match time: both sides get unsettled balances, and 1.875 USDC goes to the fee vault.](figures/order-book-match.svg)

Bob did nothing at all. Like Alice in the *Escrow* chapter, a maker signs once when placing and the program handles their side of every subsequent fill.

## Canceling Returns the Unfilled Lock

Bob decides three shares is enough. He calls `cancel_order()` on his order account. The handler checks the signer is the order's owner, and that the status is still Open or PartiallyFilled; a Filled or already-Cancelled order rejects with `OrderNotCancellable`. His remaining share at 250 means 250 USDC of his original lock is still sitting in the quote vault, so his `unsettled_quote` is credited 250, using the same price-times-remaining formula that locked it. The leaf comes out of the bid tree, the order ID leaves his open-order list, and the order account is stamped Cancelled, closing out its state machine.

![An order's state machine: fills walk it from Open through PartiallyFilled to Filled, cancel_order() exits from either live state, and both final states refuse further transitions.](figures/order-book-state-machine.svg)

![Bob's cancel: his leaf comes out of the bid tree, and the 250 USDC still locked for it moves to his unsettled quote balance.](figures/order-book-cancel.svg)

## Settlement Turns Claims Into Tokens

Unsettled balances are claims, not tokens. When Bob and Carol want their assets in hand, each calls `settle_funds()`, and the market PDA signs the transfers out of the vaults: Bob receives three NVDAx shares and his 250 USDC refund; Carol receives her 748.125 USDC.

One line in the handler belongs in everything you build: it snapshots the unsettled amounts and **zeroes the counters before making the transfers**. If a token transfer could ever call back into this program (token extensions can attach hooks to transfers), a caller re-entering mid-transfer would find balances already zeroed instead of still-credited, so double-withdrawal is impossible. The pattern is called checks-effects-interactions, and the *Adversary* chapter explains it fully.

![settle_funds() for Bob and Carol: the unsettled counters are zeroed first, then the market PDA signs the transfers from the base and quote vaults to their token accounts.](figures/order-book-settle.svg)

## The Market Authority Withdraws the Fees

At any time, Maria calls `withdraw_fees()`, and the fee vault's balance (1.875 USDC so far) transfers to her token account. The handler compares the signer against the authority recorded on the market at creation and rejects anyone else with `NotMarketAuthority`. One detail is deliberate: when the fee vault is empty it succeeds as a no-op instead of failing, so Maria can run it on a schedule unattended. Scheduled maintenance that succeeds as a no-op when there is nothing to do is a **crank** (the *Lending and Borrowing* chapter explains it fully), though this handler adds an authority gate because it moves fee money.

![withdraw_fees() empties the fee vault into Maria's USDC account, gated by the authority check.](figures/order-book-withdraw-fees.svg)

## The Math: Lots, Ticks, and a Fee That Rounds Up

**Lots.** The program never stores "shares" or "dollars"; both sides of the book are denominated in **lots**. The market defines `base_lot_size` and `quote_lot_size`, and the two conversion rules are: raw base = quantity × base lot size, and raw quote = price × quantity × quote lot size. Choosing the lot sizes from the two tokens' decimals (each is ten to the power of the decimal difference, floored at one) makes `price` read as the human quote-per-base rate regardless of how mismatched the mints' decimals are. For NVDAx (8 decimals) over USDC (6 decimals) that gives a base lot of 100 raw NVDAx and a quote lot of 1, and a stored price of 250 reads directly as $250.00 per share. Every real order book on Solana, OpenBook and Phoenix included, uses a lot model like this.

**Wider intermediates.** The bid lock and the gross fill amount both multiply three u64 values (price × quantity × lot size), which can overflow 64 bits with high-decimal mints. The program promotes to u128 for the multiplication and narrows back down afterward, so the failure mode is an explicit error on an amount too large to transfer, never wrong arithmetic.

**The fee rounds up.** Fee = gross × fee basis points ÷ 10,000, computed with ceiling division. Rounding down would hand up to one minor unit of quote back per fill, and one minor unit per fill is not small when an attacker can manufacture thousands of tiny fills; rounding against the user, in the program's favor, closes the leak. A defensive check that the fee never exceeds the gross backs the arithmetic up. The rounding section of the *Arithmetic of Money* chapter states the general rule.

**Price improvement is computed, not assumed.** When a taker bid locks at its own limit but fills at a better resting price, the difference between the lock and the gross is credited back to the taker's unsettled quote, calculated per fill with the same u128 care.

## The Invariants: The Vaults Equal What the Book Owes

- Every resting order's full lock is in a vault: quote for bids (price × remaining × quote lot size), base for asks. The vaults always hold at least the sum of all resting locks plus all unsettled balances.
- Every locked minor unit is accounted for on exit: a fill splits the lock into maker proceeds, taker rebate, and fee, and those three always sum exactly to what was locked for that fill. Cancellation returns exactly the remainder's lock.
- `filled_quantity` never exceeds `original_quantity`, and order status only moves forward: Open to PartiallyFilled to Filled, or out to Cancelled.
- The fee vault only ever receives the computed fee, and only the recorded authority can withdraw from it.
- Every leaf in a tree corresponds to exactly one Open or PartiallyFilled order account, and to an entry in its owner's open-order list.

## The Failure Modes: Vault Swaps, Fake Makers, and Book Spam

- **The vault swap.** The fee vault and the quote vault hold the same token and have the same authority, so a token-program transfer cannot tell them apart. Without further checks, a caller invoking `settle_funds()` could pass the fee vault where the quote vault belongs and be paid out of Maria's fees. The defense is `has_one` constraints binding every vault and mint on every instruction to the addresses recorded on the market at creation, and the test suite proves the attack fails. This is the same account-substitution attack the *Escrow* chapter described, against a bigger program.
- **The fake maker list.** Takers supply the maker accounts they match against, so a hostile taker will supply the wrong ones. The program re-derives the fills from its own book and verifies every supplied account against that plan: order ID, market, and owner all have to line up, or the transaction fails.
- **The rounding drain.** Floor the fee instead of ceiling it and every fill leaks a minor unit, which an attacker turns into a drain with thousands of tiny fills. The math section covered it, and a test below checks it.
- **Book spam.** A full tree is a denial-of-service on everyone else's orders. Tick alignment, the minimum order size, the 20-open-orders-per-user cap, and the `OrderBookFull` check all reject spam, each with its own named error.
- **The unauthorized paths.** Canceling someone else's order rejects with `Unauthorized`; withdrawing fees without being the authority rejects with `NotMarketAuthority`; placing orders on a paused market rejects with `MarketPaused`.

## Testing Considerations

The suite in `tests/test_order_book.rs` builds all state through the program's own instruction handlers, and covers each code path above by name:

- Locking: `place_bid_locks_quote_in_vault`, `place_ask_locks_base_in_vault`, and the rejection tests for zero prices, unaligned ticks, and undersized orders.
- Matching, both directions and both partial-fill shapes: `taker_bid_fully_crosses_best_ask`, `taker_ask_fully_crosses_best_bid`, `taker_partially_fills_resting_order_rest_stays_on_book`, `taker_partially_filled_remainder_rests_on_book`, and `taker_crosses_multiple_resting_orders_best_price_first`.
- The fairness rules: `resting_orders_at_same_price_fill_by_time_priority` and `taker_bid_gets_price_improvement_from_resting_ask`.
- The money: `fee_vault_receives_exactly_bps_of_taker_gross`, `fee_rounds_up_when_gross_is_not_a_bps_multiple`, `cancel_and_settle_bid_refunds_full_quote`, and `settle_funds_after_match_pays_out_both_unsettled_balances`.
- The adversarial cases: `settle_funds_rejects_fee_vault_substituted_for_quote_vault`, `cancel_order_rejects_non_owner`, and `authority_can_withdraw_fees_after_match`.

If you write one test after reading this chapter, write the vault-swap one for your own program. The code path where two accounts are interchangeable to the token program but not to your accounting is the path the bug lives in.

## What You Learnt from Building the Order Book Exchange

NYSE, NASDAQ, and the CME each run a matching engine, a clearing house, and a settlement system, staffed and audited. This program's matching engine is two critbit trees holding the book in price-time order, its clearing house's internal ledger is the unsettled balances, and its settlement is `settle_funds()`, permissionless and instant. The one operator who remains sets the market's parameters and collects its fee, and can do nothing else.

The order book added five concepts on top of the escrow's:

- **Every resting order is a funded commitment.** Lock-on-entry means no matched order can turn out to be backed by nothing.
- **A data structure chosen for onchain cost.** The critbit tree gives insertion without shifting and price-time priority for free, on a chain where compute is metered.
- **An internal ledger that consolidates payouts.** Unsettled balances turn many small payouts into one claimed transfer, and zeroing them before the transfer (checks-effects-interactions) makes double-withdrawal impossible.
- **A fee whose rounding direction is a security decision.** Ceiling division on the fee closes a leak an attacker could industrialize through thousands of tiny fills.
- **Vault separation plus `has_one`.** Two vaults holding the same token are indistinguishable to the token program; only stored-address checks keep user money and fee money apart.

In the *Constant-Product AMM* chapter we will build a market with no order book. Two vaults hold the pair of tokens, and a formula sets the price from their balances, so anyone can trade at any time without waiting for a counterparty to post an order. You will see what the people who fill the vaults earn for it, and what it costs them.
