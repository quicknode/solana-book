# Chapter 15: The Constant-Product AMM

The *Order Book Exchange* chapter built an exchange where every price is a commitment someone posted. This chapter builds the other kind: an **automated market maker**, where nobody posts prices at all. Every incoming order fills instantly, at a price determined by a formula, against tokens supplied by **liquidity providers** who earn a fee on every trade. That fee is compensation for a loss, and the chapter puts a number on it.

AMMs work where order books do not: tokens without much trading volume, where a taker might wait forever for a matching maker. So they are the standard venue for new token launches, and this chapter follows one. Orca, Raydium, and Pump.fun are popular AMMs on Solana. The program lives at `finance/token-swap` in the companion repository.

The K in "constant product" is held fixed only while the pool prices a trade. The pool then adds the liquidity providers' share of that trade's fee to the reserves, so every swap leaves K a little larger. Liquidity providers' deposits grow K too, and their withdrawals shrink it. The launch below runs with an operator, trading fees, and liquidity providers, and states X, Y, and K after every trade.

## X Times Y Equals K, and K Prices Every Trade

The pool holds two tokens. Call the amount of the first one **X** (here, ACME, the freshly listed stock of a robotics startup) and the amount of the second **Y** (USDC, because you quote in the stable asset). **K is X times Y.** Its only job is to hold X and Y in relation to each other during a trade: a buyer who adds USDC to the pool gets exactly the amount of ACME that keeps the product steady at K. Rearranged, that is the pricing formula:

output = taxed_input × other_reserve ÷ (this_reserve + taxed_input)

The spot price is just the ratio Y ÷ X, and every trade moves it: buying ACME removes X and adds Y, so the next buyer pays more. Big trades relative to the pool move the price a lot; that is price impact.

**The curve holds K fixed while it prices a trade, and K changes between trades.** It grows two ways:

- **Liquidity deposits** add more of both tokens at the same ratio.
- **Fees**: the liquidity providers' share of every trade's fee is added to the reserves without being used to price the trade. Nobody is paid it at the time; liquidity providers collect it as part of their slice when they withdraw.

Liquidity withdrawals shrink K, by the withdrawer's share of both reserves.

The deeper the pool, the less any one trade moves the price.

![](figures/amm-curve.svg)

## Creating the Venue Sets the Launch Price

Maria operates the AMM and is launching ACME today. She earns twice: an admin share of every trading fee, and LP fees on the liquidity she provides herself. Like every character in this book she starts with one SOL and 1,000 USDC; she also holds 400 ACME of founder stock.

Maria runs `initialize_config()` with a fee of 30 basis points and an admin share of 1,667 basis points, about one sixth of each fee, the classic Uniswap-style split. Then `initialize_pool()` for ACME/USDC, which creates the pool config, the LP mint, and the two empty vaults.

Financial state on Solana is accounts, and those two transactions created the venue's five.

The **config** is a singleton account at a PDA (seed `"config"`) holding the `admin`, the trading `fee` in basis points, and the `admin_share_bps`, the slice of each fee that belongs to the admin rather than the LPs. One config per deployed program mirrors how real venues ship.

The **pool config** is an account at a PDA seeded by the config and the two mints, one per trading pair, with one rule enforced at creation: `mint_a` must sort below `mint_b`, or creation fails with `InvalidMintOrder`. Without canonical ordering, an (ACME, USDC) pool and a (USDC, ACME) pool would both exist and split the liquidity between them.

The tokens are held in two vaults, `pool_a` and `pool_b`, whose authority is the pool config PDA, alongside the **LP mint** (`liquidity_provider_mint`), whose tokens are the receipts liquidity providers hold and whose mint authority is the same PDA. Only the program can sign as that PDA, with the pool config's seeds, so nobody else can move the vaults' tokens or mint LP tokens.

Two more fields are `admin_fees_owed_a` and `admin_fees_owed_b` on the pool config. The admin's share of fees is never transferred during a swap; it accrues in these counters as a *virtual claim* while the tokens physically sit in the vaults. So every piece of LP-facing math runs on **effective reserves**: the raw vault balance minus the admin's owed slice. The admin's fees do not boost LP yield, do not distort the price, and get swept out later in one transfer. The order book kept its fees in a separate fee vault; this pool leaves them in the trading vaults and records the admin's share in these two counters.

Empty pools cannot price anything, so Maria seeds it. She believes a fair launch price is $2.25, so she runs `deposit_liquidity()` with her 400 ACME and 900 USDC, the founder stock and nine-tenths of her cash. **The first deposit sets the price**, because the ratio she deposits *is* the ratio. X = 400, Y = 900, K = 360,000.

Her LP tokens come from the formula the *Arithmetic of Money* chapter described: the **integer square root of X times Y**, computed by `integer_sqrt()`, the program's own Newton's method loop on u128, floored. The square root of 360,000 is exactly 600, so that is her LP position, minus one thing: `MINIMUM_LIQUIDITY`. That is a floor of 100 **minor units** of LP supply (the LP mint has six decimals, so a ten-thousandth of one LP token) that is **never minted to anyone**. It is not sent to a burn address, as Uniswap V2 does; it never exists as supply, while the reserves it represents stay in the pool. Its value is a fraction of a cent. What makes it work is that it is always part of the share supply the pool divides by. Why that floor exists is the inflation-attack defense, covered in the failure modes below.

![](figures/amm-first-deposit.svg)

> **A square root with no floats.** `integer_sqrt()` is **Newton's method** running on integers: start with a guess, then repeatedly replace it with the average of the guess and the target divided by the guess. The sequence converges on the square root in a few dozen iterations, and the result is floored. Any real-valued function a program needs onchain (roots, exponentials, logs) can be computed the same way, as an integer iteration with a known, bounded error, because floats can never touch funds.

## Adding Liquidity in Ratio Does Not Move the Price

Alice works at ACME, holds a grant of 100 ACME alongside her standard wallet, and becomes the second liquidity provider: she wants to earn fees on her ACME grant. Liquidity providers are not allowed to change the pool's ratio, so her 100 ACME must arrive with a matching 225 USDC (100 × $2.25). The handler enforces this by clamping: it computes how much of token B her token A implies at the current effective reserves, uses whichever pairing fits inside what she offered, and rejects with `DepositAmountTooSmall` if the clamp rounds her out entirely. Her LP tokens are minted pro rata, the minimum of her share against each side, floored, and checked against her `minimum_lp_tokens_out`. Her share is measured against the LP supply plus `MINIMUM_LIQUIDITY`, because the floor is part of the supply the reserves are divided among.

X is now 500, Y is 1,125, K is 562,500. The price is still exactly $2.25. **Deposits grow K without touching the price**; that is the first of K's two ways of growing.

## A Buy Moves the Price Along the Curve

Bob is early and bullish. He runs `swap_tokens()` to spend 100 USDC on ACME, a tenth of everything he has, with a `min_output_amount` as his slippage check. Three things happen in strict order.

**The fee is deducted first.** 30 basis points of 100 is 30 cents. The admin share, about 5 cents (1,667 basis points of it, floored in minor units), accrues to `admin_fees_owed_b` as Maria's virtual claim; the remaining 25 cents stays in the pool, where it adds to the reserves that back every LP token. Bob's taxed input is 99.70.

**The curve prices the trade.** Y rises to 1,224.70, and X must fall to K ÷ Y ≈ 459.3. Bob receives about 40.7 ACME. He paid an *average* of about $2.46 per token while the quoted price before his trade was $2.25 and the spot price after it is about $2.67: his own trade moved along the curve as it executed. Every AMM trade pays its own price impact.

**The invariant is re-checked.** After the transfers land, the handler reloads both vaults and requires the new effective product to be at least the old one, failing with `InvariantViolated` otherwise. The program's own comment calls this the most important defensive check in the file: it catches any bug in the math above it that would hand a user too much. The check tolerates growth, because growth is just LP fees enriching the pool. Assert after the math, not just before.

K is now about 562,615. It grew mid-trade, from the 25 cents of LP fees. That is K's second way of growing.

![](figures/amm-bob-swap.svg)

## The Next Trader Pays the Price the Last One Made

Carol has watched the launch all morning and wants in even though the price has already moved. She arrives late and buys $50 of ACME: 15 cents of fees (about 2.5 cents admin, about 12.5 cents LPs), 49.85 taxed input, and the same arithmetic hands her about 18 ACME at an average near $2.78. The second trader's numbers follow from what the first trader's swap did to the pool.

## Selling Back Pays the Fee in the Input Token

Bob sells 20 of his 40.7 ACME. A sell is the same instruction with `input_is_token_a` flipped. Now the fee comes off his ACME input (0.06 ACME, of which 0.01 accrues to `admin_fees_owed_a`), X grows by the taxed amount, and Y falls to keep the product: about 55.11 USDC to Bob, an average near $2.76 against the $2.46 he paid. The spot price falls back to about $2.64. The admin's fee ledger now holds claims in *both* tokens, which is why the claim instruction sweeps two sides.

## The Admin Sweeps Its Share of the Fees

Whenever she likes, Maria runs `claim_admin_fees()`. It zeroes both owed counters and transfers exactly those amounts from the vaults to her token accounts, signed by the pool config; anyone else is rejected (`test_claim_admin_fees_rejects_non_admin`), and claiming when nothing is owed fails with `NothingToClaim`. One transfer per token, however many swaps accrued it: the same consolidation logic as the order book's unsettled balances.

## Withdrawing Realizes Impermanent Loss

Alice wants her capital back. `withdraw_liquidity()` burns her LP tokens and pays her a pro-rata slice of both effective reserves, dividing by the LP supply *plus* `MINIMUM_LIQUIDITY`, the same divisor her deposit was minted against. The locked floor is backed by reserves but absent from the supply counter. Leaving it out here would overpay every withdrawer, and leaving it out of the deposit would underpay every depositor.

Alice does not get back what she deposited. She deposited 100 ACME and 225 USDC; the pool's mix has shifted since, so her slice is about 92.3 ACME and 244 USDC. Valued at the current price, that is roughly $1.50 *less* than if she had simply held her original tokens in her wallet: a small number at launch scale, and the same number becomes a serious loss once the pool is a million times larger.

That gap is **impermanent loss**, and every LP is exposed to it. A constant-product pool mechanically sells the token that is rising and accumulates the token that is falling, so an LP always slightly underperforms just holding, whenever the price moves in either direction. Fees are the compensation. **An LP position profits from trading volume, not from price direction**: if accumulated fees outrun the divergence, LPing wins; if the price moves far in one direction on low volume, holding wins. It is called *impermanent* because it only crystallizes at withdrawal; had Alice stayed in and ACME returned to $2.25, there would have been no loss.

![](figures/amm-impermanent-loss.svg)

Fee income is what an LP is paid for carrying that gap, and the gap is small for ordinary moves. It grows with the square of the price change, so a move of a quarter costs Alice about $3 and a doubling about $39. The LPs keep 25 of every 30 basis points of fee and Alice holds a fifth of the pool, so she earns about five basis points of everything traded: $10 for every $20,000. The table sets the two against each other for her $450 position, counting fee income at face value. Each cell is what she has at withdrawal minus what she would have had by holding, and the fee columns are $20,000, $100,000, and $400,000 of trading, the last roughly a year of turning the pool over once a day.

| ACME at withdrawal | Just holding | LP, no fees | LP, $10 of fees | LP, $50 of fees | LP, $200 of fees |
|---|---|---|---|---|---|
| $1.13 (halves) | $338 | −$19 | −$9 | +$31 | +$181 |
| $1.69 (down a quarter) | $394 | −$4 | +$6 | +$46 | +$196 |
| $2.25 (unchanged) | $450 | $0 | +$10 | +$50 | +$200 |
| $2.81 (up a quarter) | $506 | −$3 | +$7 | +$47 | +$197 |
| $4.50 (doubles) | $675 | −$39 | −$29 | +$11 | +$161 |
| $9.00 (quadruples) | $1,125 | −$225 | −$215 | −$175 | −$25 |

Across any row, LPing wins once fee income outruns the gap, and for ordinary moves it does not take much: $10 of fees covers a move of a quarter in either direction. Down the first column, with nobody trading, the LP is behind in every row but one; that is the solid curve in the figure, and a pool that pays nothing for the risk it asks LPs to carry. Down the last column the LP is still behind when the price quadruples, because the gap grows faster than fee income can, whatever the volume. An LP is paid in proportion to the trading and loses in proportion to the square of the price move.

## The Math: Floors Everywhere, and a Square Root by Newton

Every division in this program floors. Swap output, LP minting, and withdrawal amounts floor **in the pool's favor** (the only floor that favors the trader is the fee itself, clipped by at most one minor unit). The dust stays in the reserves, where it accrues to all LPs rather than leaking to whoever transacts most often. Every multiplication runs in u128 before its division (multiply before divide), and every step is `checked_*` with `MathOverflow` on failure. The only unusual operation, the initial deposit's square root, is eleven lines of Newton's method on integers, floored like everything else. Every rule in the *Arithmetic of Money* chapter appears in this one file.

## The Invariants: K Must Not Decrease

- After every swap, effective X times effective Y is at least what it was before, enforced onchain, after the transfers, not assumed from the algebra.
- The admin's owed fees never participate in pricing, LP minting, or withdrawal: all LP-facing math uses effective reserves.
- LP tokens are a fixed-share claim: mint pro rata on the way in and burn pro rata on the way out, dividing by the supply plus the locked floor both ways.
- The pool never prices against an empty side (see below).

## The Failure Modes: Empty Pools, First Deposits, and the Vacuous Invariant

- **The empty-reserve drain.** If one reserve were zero, the swap formula outputs the *entire* other reserve (output = input × other ÷ (0 + input) = other). The invariant check would not catch it either, because the pre-trade K would be 0 × other = 0, and "new K ≥ 0" holds vacuously. A check requires both effective reserves positive (`EmptyPoolReserve`) before any pricing runs.
- **The inflation attack.** The empty-pool attack from the *Adversary* chapter: a first depositor mints dust-level LP supply, donates tokens straight to the vaults to inflate the value behind each LP token, and waits for a later deposit to round down to zero. The `MINIMUM_LIQUIDITY` floor makes the attack uneconomic, because `deposit_liquidity()` and `withdraw_liquidity()` both divide by the LP supply plus the floor. The smallest pool an attacker can open leaves them 1 LP token out of 101 units of supply. Rounding a deposit down to zero then takes a donation of about 101 times that deposit, and 100/101 of the donation belongs to units nobody can redeem. The floor has to be in both divisors: a deposit divided by the bare supply of 1 rounds down against a donation merely as large as itself. `test_donation_cannot_round_a_later_deposit_to_zero` runs the attack with a donation of 1,000,000 minor units to each vault: the victim's equal deposit is minted 100 LP tokens, and the attacker's 1 LP token redeems 9,950 minor units of each token.
- **The first deposit sets the price, and anyone can be first.** The program's own source notes that pool creation can be front-run with a bad ratio. The floor bounds the share-math games, but a launch operator should still expect arbitrage traffic (or hostile seeding) until the pool's price matches the market's, and seed with size.
- **Slippage and sandwiches.** Every trade and deposit carries a caller-supplied minimum (`min_output_amount`, `minimum_lp_tokens_out`, the withdrawal minimums), and the tests check that each one rejects (`SlippageExceeded`, `DepositBelowMinimum`, `WithdrawalBelowMinimum`). What the program cannot do is choose the number for you; a zero minimum is legal and is what a sandwich attacker hopes you send.
- **Liquidity fragmentation.** Because `initialize_pool()` fails with `InvalidMintOrder` unless `mint_a` sorts below `mint_b`, each pair of tokens can have only one pool, so its liquidity is never split between two.

## Testing Considerations

The suite (`tests/test_swap.rs`) covers each section of this chapter. Two tests, `test_invariant_holds_after_normal_swap` and `test_invariant_holds_after_b_to_a_swap`, check K's direction both ways, while `test_lp_mint_after_swap_uses_effective_reserves` and `test_deposit_after_swap_uses_shifted_effective_ratio` check the admin-fee exclusion, the accounting a refactor is most likely to break. Two more, `test_deposit_clamps_excess_amount_a` and `_b`, check the ratio clamp from both directions (both directions of every symmetric flow), and the three reverts-below-minimum tests check every slippage minimum. If you write one invariant test for your own AMM, make it the round trip: swap in, swap back, and assert the pool did not lose value.

## What You Learnt from Building the Constant-Product AMM

The order book needed a tree, a matching engine, and maker accounts, because humans were quoting the prices. The AMM replaced all of it, and the market makers themselves, with a pricing formula: instant liquidity for anything, priced by a curve, funded by anyone willing to earn fees for supplying it.

Six concepts came with the curve:

- **A formula as the market maker.** Output = taxed input × other reserve ÷ (this reserve + taxed input); the first deposit sets the price, and every trade pays its own price impact.
- **How K changes.** Fixed while a trade is priced, growing with deposits and every swap's fee, shrinking with withdrawals; and the K check needs both reserves to be positive first, because on an empty pool new K ≥ 0 passes whatever the trade pays out.
- **Assert after the math.** The post-trade product re-check catches every "computed the output wrong and overpaid" bug, including the ones not written yet.
- **Effective reserves.** The admin's virtual fee claim is excluded from every piece of LP-facing math, and kept in two counters on the pool config rather than in a separate fee vault.
- **The inflation-attack defense.** A locked minimum of LP supply, never minted to anyone and counted in the divisor on the way in and on the way out, keeps the share divisor from ever being dust-sized.
- **Impermanent loss.** An LP position profits from trading volume, not from price direction: the further the price moves in either direction, the more the LP loses against simply holding the two tokens, and only fees make up for it.

In the *Prop AMM* chapter we will build a market maker that quotes its own capital at prices taken from an oracle. There is no curve, so a trade does not move the price and there is no impermanent loss, but the firm carries a different risk: the traders who arrive while its quote is stale know something it does not. The *Managed Fund* chapter, later in the book, uses venues like these to trade investors' deposits, and the question there is what the manager is allowed to do with them.
