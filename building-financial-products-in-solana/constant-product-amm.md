# The Constant-Product AMM

The order book chapter built an exchange where every price is a commitment someone posted. This chapter builds the other kind: an **automated market maker**, where nobody posts prices at all. Every incoming order fills instantly, at a price determined by a formula, against tokens supplied by **liquidity providers** who earn a fee on every trade. That fee is not free money, and by the end of the chapter you will be able to say exactly why, with a number attached.

AMMs shine where order books struggle: tokens without much trading volume, where a taker might wait forever for a matching maker. That is why they are the standard venue for new token launches, and why this chapter's story is one. On Solana you know the genre from Orca, Raydium, and Pump.fun. The program lives at `finance/token-swap` in the companion repository.

A warning about most AMM explanations: they use two toy tokens, no admin fees, no liquidity providers, and they tell you "K never changes," which is false. This chapter does a genuine launch, with an operator, fees, LPs, and the true story of X, Y, and K after every single trade.

## X Times Y Equals K, and What K Is Actually For

The pool holds two tokens. Call the amount of the first one **X** (here, a new token called ACME) and the amount of the second **Y** (USDC, because you quote in the stable asset). **K is just X times Y.** Its only job is to hold X and Y in relation to each other during a trade: a buyer who adds USDC to the pool gets exactly the amount of ACME that keeps the product steady at K. Rearranged, that is the whole pricing engine:

output = taxed_input × other_reserve ÷ (this_reserve + taxed_input)

The spot price is just the ratio Y ÷ X, and every trade moves it: buying ACME removes X and adds Y, so the next buyer pays more. Big trades relative to the pool move the price a lot; that is slippage, made mechanical.

And the truth about K: **K is constant within a single trade and grows over time.** Deposits grow it (more of both tokens, same ratio). The liquidity providers' share of every fee stays in the pool and grows it. And the deeper K gets, the less any individual trade moves the price. Watch K in the story below; it never once stays still.

**[FIGURE: The constant-product curve. X on one axis, Y on the other, a trade sliding along the curve from one point to another, with the price as the slope and K as the curve itself.]**

## The Cast: An Operator, Two LPs, and Two Traders

**Maria operates the AMM** and is launching ACME today. She earns twice: an admin share of every trading fee, and LP fees on the liquidity she provides herself. **Alice works at ACME**, holds a token grant, and becomes the second liquidity provider. **Bob and Carol trade**: Bob is early and bullish, Carol shows up after the price has moved.

## The Account Model: One Config, One Pool per Pair, and a Virtual Fee Ledger

**[FIGURE: Account map. The config PDA; the pool config PDA for ACME/USDC; the pool authority PDA owning the two vaults and the LP mint; LP token accounts held by Maria and Alice.]**

The **config** is a singleton PDA (seed `"config"`) holding the `admin`, the trading `fee` in basis points, and the `admin_share_bps`, the slice of each fee that belongs to the admin rather than the LPs. One config per deployed program mirrors how real venues ship.

Each trading pair gets a **pool config** PDA, seeded by the config and the two mints, with one rule enforced at creation: `mint_a` must sort below `mint_b`, or creation fails with `InvalidMintOrder`. Without canonical ordering, an (ACME, USDC) pool and a (USDC, ACME) pool would both exist and split the liquidity between them.

The tokens sit in two vaults, `pool_a` and `pool_b`, owned by a **pool authority** PDA, alongside the **LP mint** (`liquidity_provider_mint`), whose tokens are the receipts liquidity providers hold.

The subtle fields are `admin_fees_owed_a` and `admin_fees_owed_b` on the pool config. The admin's share of fees is never transferred during a swap; it accrues in these counters as a *virtual claim* while the tokens physically sit in the vaults. Every piece of LP-facing math therefore runs on **effective reserves**: the raw vault balance minus the admin's owed slice. The admin's fees do not boost LP yield, do not distort the price, and get swept out later in one transfer. Keeping owed-to-whom separate from where-it-sits is the same discipline as the order book's fee vault, implemented as accounting instead of as an account.

## Maria Creates the Venue and Prices the Launch

Maria runs `create_config` with a fee of 30 basis points and an admin share of 1,667 basis points, one sixth of each fee, the classic Uniswap-style split. Then `create_pool` for ACME/USDC, which creates the pool config, the authority, the LP mint, and the two empty vaults.

Empty pools cannot price anything, so Maria seeds it. She believes a fair launch price is $140, so she runs `deposit_liquidity` with 1,000 ACME and 140,000 USDC. **The first deposit sets the price**, because the ratio she deposits *is* the ratio. X = 1,000, Y = 140,000, K = 140 million.

Her LP tokens come from a formula this book has been promising since the arithmetic chapter: the **integer square root of X times Y**, computed by `integer_sqrt`, a hand-rolled Newton's method loop on u128, floored. The square root of 140 million is about 11,832, so that is her LP position, minus one thing: `MINIMUM_LIQUIDITY`, a floor of 100 LP tokens that is **never minted to anyone**. It is not sent to a burn address (Uniswap V2's trick); it simply never exists as supply, while the reserves it represents stay in the pool. Why that floor exists is the inflation-attack defense, covered in the failure modes below.

**[FIGURE: Maria's initial deposit. 1,000 ACME and 140,000 USDC entering the vaults; sqrt(140,000,000) ≈ 11,832 LP tokens minted to Maria, with the 100-token floor shown locked, minted to nobody.]**

## Alice Adds Liquidity Without Moving the Price

Alice wants to earn fees on her ACME grant. Liquidity providers are not allowed to change the pool's ratio, so her 200 ACME must arrive with a matching 28,000 USDC (200 × $140). The handler enforces this by clamping: it computes how much of token B her token A implies at the current effective reserves, uses whichever pairing fits inside what she offered, and rejects with `DepositAmountTooSmall` if the clamp rounds her out entirely. Her LP tokens are minted pro rata, the minimum of her share against each side, floored, and guarded by her `minimum_lp_tokens_out`.

X is now 1,200, Y is 168,000, K is 201.6 million. The price is still exactly $140. **Deposits grow K without touching the price**; that is the first of K's two ways of growing.

## Bob Buys the Launch and Moves the Price

Bob runs `swap_tokens` to spend 14,000 USDC on ACME, with a `min_output_amount` as his slippage guard. Three things happen in strict order.

**The fee comes off the top.** 30 basis points of 14,000 is $42. One sixth of that, $7, accrues to `admin_fees_owed_b` as Maria's virtual claim; the other $35 simply stays in the pool, where it fattens the reserves that back every LP token. Bob's taxed input is 13,958.

**The curve prices the trade.** Y rises to 181,958, and X must fall to K ÷ Y ≈ 1,107.9. Bob receives about 92 ACME. Notice he paid an *average* of about $152 per token while the quoted price before his trade was $140 and the spot price after it is about $164: his own trade moved along the curve as it executed. Every AMM trade pays its own price impact.

**The invariant is re-checked.** After the transfers land, the handler reloads both vaults and requires the new effective product to be at least the old one, failing with `InvariantViolated` otherwise. The program's own comment calls this the most important defensive check in the file, and it is: it catches any bug in the math above it that would hand a user too much. The check tolerates growth, because growth is just LP fees enriching the pool. Assert after the math, not just before.

K is now about 201.64 million. It grew mid-trade, from the $35 of LP fees. That is K's second way of growing, the one the toy explanations lie about.

**[FIGURE: Bob's swap. 14,000 USDC in, split into fee slices (admin's $7 as a ledger entry, LPs' $35 into the reserves) and taxed input; 92 ACME out; the price sliding from 140 to 164 along the curve.]**

## Carol Pays the Price Bob Made

Carol arrives late and buys $7,000 of ACME: $21 of fees ($3.50 admin, $17.50 LPs), 6,979 taxed input, and the same arithmetic hands her about 40 ACME at an average near $171. Nothing new happened here, and that is the point: the second trader's numbers are fully determined by the first trader's footprint. Price impact compounds.

## Bob Takes Profit, Paying Fees in ACME

Bob sells 40 of his 92 ACME. A sell is the same instruction with `input_is_token_a` flipped: now the fee comes off his ACME input (0.12 ACME, of which 0.02 accrues to `admin_fees_owed_a`), X grows by the taxed amount, and Y falls to keep the product: about 6,800 USDC to Bob, an average near $170 against the $152 he paid. The spot price drops back to about $152. The admin's fee ledger now holds claims in *both* tokens, which is why the claim instruction sweeps two sides.

## Maria Sweeps the Admin Fees

Whenever she likes, Maria runs `claim_admin_fees`. It zeroes both owed counters and transfers exactly those amounts from the vaults to her token accounts, signed by the pool authority; anyone else is rejected (`test_claim_admin_fees_rejects_non_admin`), and claiming when nothing is owed fails with `NothingToClaim`. One transfer per token, however many swaps accrued it: the same consolidation logic as the order book's unsettled balances.

## Alice Withdraws and Meets Impermanent Loss

Alice wants her capital back. `withdraw_liquidity` burns her LP tokens and pays her a pro-rata slice of both effective reserves, with one adjustment: the divisor is the LP supply *plus* `MINIMUM_LIQUIDITY`, because the locked floor is backed by reserves but absent from the supply counter, and forgetting it would overpay every withdrawer.

Alice does not get back what she deposited. She deposited 200 ACME and 28,000 USDC; the pool's mix has shifted since, so her slice is about 184 ACME and 30,300 USDC. Valued at the current price, that is roughly $187 *less* than if she had simply held her original tokens in her wallet.

That gap is **impermanent loss**, and it is the honest price of being an LP. A constant-product pool mechanically sells the token that is rising and accumulates the token that is falling, so an LP always slightly underperforms just holding, whenever the price moves in either direction. Fees are the compensation. **An LP is a bet on trading volume, not on price direction**: if accumulated fees outrun the divergence, LPing wins; if the price runs hard in one direction on thin volume, holding wins. It is called *impermanent* because it only crystallizes at withdrawal; had Alice stayed in and ACME returned to $140, the loss would have evaporated. Nobody should provide liquidity without being able to draw this diagram.

**[FIGURE: Impermanent loss. Value of Alice's LP position versus value of just holding, plotted against ACME's price, touching at the deposit price and falling away on both sides, with the fee income shown as the offsetting band.]**

## The Math: Floors Everywhere, and a Square Root by Newton

Every formula in this program rounds the same direction: **down, in the pool's favour**. Swap output is floored, LP minting is floored, withdrawal amounts are floored; the dust stays in the reserves, where it accrues to all LPs rather than leaking to whoever transacts most often. Every multiplication runs in u128 before its division (multiply before divide), and every step is `checked_*` with `MathOverflow` waiting on failure. The one exotic operation, the initial deposit's square root, is eleven lines of Newton's method on integers, floored like everything else. The arithmetic sections of Financial Programming Concepts in Solana are these paragraphs, generalized; this program is where every one of those rules shows up in the same file.

## The Invariants: K Must Not Decrease

- After every swap, effective X times effective Y is at least what it was before, enforced onchain, after the transfers, not assumed from the algebra.
- The admin's owed fees never participate in pricing, LP minting, or withdrawal: all LP-facing math uses effective reserves.
- LP tokens are a fixed-share claim: mint pro rata on the way in, burn pro rata on the way out, with the locked floor consistently accounted on both paths.
- The pool never prices against an empty side (see below).

## The Failure Modes: Empty Pools, First Deposits, and the Vacuous Invariant

- **The empty-reserve drain.** If one reserve were zero, the swap formula outputs the *entire* other reserve (output = input × other ÷ (0 + input) = other), and here is the vicious part: the invariant check would not catch it, because the pre-trade K would be 0 × other = 0, and "new K ≥ 0" holds vacuously. A guard requires both effective reserves positive (`EmptyPoolReserve`) before any pricing runs. An invariant that can go vacuously true is not an invariant.
- **The inflation attack.** The empty-pool attack from Financial Programming Concepts in Solana, in its native habitat: a first depositor minting dust-level LP supply, donating tokens to skew the share price, and rounding later depositors down to zero. The `MINIMUM_LIQUIDITY` floor makes the attack uneconomic by forcing the first 100 LP tokens' worth of value to be unownable forever.
- **The first deposit sets the price, and anyone can be first.** The program's own source is candid that pool creation can be front-run with a bad ratio. The floor bounds the share-math games, but a launch operator should still expect arbitrage traffic (or hostile seeding) until the pool's price matches the market's, and seed with size. An honest limitation, stated as one.
- **Slippage and sandwiches.** Every trade and deposit carries a caller-supplied minimum (`min_output_amount`, `minimum_lp_tokens_out`, the withdrawal minimums), and the tests prove each one rejects (`SlippageExceeded`, `DepositBelowMinimum`, `WithdrawalBelowMinimum`). What the program cannot do is choose the number for you; a zero minimum is legal and is exactly what a sandwich attacker hopes you send.
- **Liquidity fragmentation.** Canonical mint ordering, one pool per pair, by construction.

## The Test That Catches the Bug

The suite (`tests/test_swap.rs`, LiteSVM plus solana_kite) reads like this chapter's outline: `test_invariant_holds_after_normal_swap` and `test_invariant_holds_after_b_to_a_swap` pin K's direction both ways; `test_lp_mint_after_swap_uses_effective_reserves` and `test_deposit_after_swap_uses_shifted_effective_ratio` pin the admin-fee exclusion, which is exactly the kind of accounting a refactor silently breaks; `test_deposit_clamps_excess_amount_a` and `_b` pin the ratio clamp from both directions (both directions of every symmetric flow); and the three reverts-below-minimum tests pin every slippage guard. If you write one property test for your own AMM, make it the round trip: swap in, swap back, and assert the pool did not pay for the privilege.

## The Formula Is the Maker

The order book needed a tree, a matching engine, and maker accounts, because humans were quoting the prices. The AMM replaced all of it with one multiplication and got instant liquidity for anything, priced by a curve, at the cost of price impact and impermanent loss. The vault strategy chapter, later in the book, climbs one level up the stack: it *uses* venues like this one, and the question stops being "how do trades clear" and becomes "who is allowed to trade with other people's money, and what stops them."
