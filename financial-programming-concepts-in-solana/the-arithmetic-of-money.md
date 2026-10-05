# Chapter 7: The Arithmetic of Money

Every bug class in this chapter has shipped in a real program, and the worst of them have drained real markets. Avoiding them takes only a few rules, and they follow from one fact: onchain amounts are integers.

## Amounts Are Integers: No Floats Near Funds

Every validator that executes your program must compute exactly the same result, or the network cannot agree on state, so a program's float operations are emulated in software rather than run on the hardware. That makes them slow. They also accumulate representation error (0.1 has no exact binary form) and round to nearest, a direction nobody chose. Token amounts are discrete anyway: every token comes in whole minor units, so representing them as integers is exact.

So keep token amounts, prices, rates, and everything derived from them as integers: u64 for amounts and u128 for intermediate math. No `f32`, no `f64`, no `powf`, no library that uses them internally. When a calculation needs fractions, scale integers up instead, as the Wads and Lots section below describes. When it needs a square root or an exponential, compute it with integer iteration: Newton's method for the square root, which the *Constant-Product AMM* chapter's `integer_sqrt()` implements, and exponentiation by squaring for a power, both covered later in this chapter. None of the programs in this book uses a float, and your programs should not either.

## Every Amount Is an Integer at a Declared Scale

Programs calculate in minor units, the integers the *Tokens* chapter defined, at the scale the mint's decimals declare. USDC has 6, so $10 is 10,000,000; TSLAx (Tesla stock) has 8, so a tenth of a share is also 10,000,000. The same integer means two different things, and three rules keep them straight:

- **Read decimals from the mint**, as the *Tokens* chapter says; hard-coding 10^9 because SOL has 9 decimals is a bug that the first token with 6 decimals will expose.
- **Never mix scales in one calculation.** An amount in USDC minor units times a price per whole share is nonsense with a plausible magnitude, which is the hardest kind of bug to notice. Name variables with their unit and scale.
- **Use `transfer_checked()`** for every transfer; the *Tokens* chapter describes what it checks.

## Wads and Lots

Two conventions build on minor units:

- Fractional values (interest rates, indexes, exchange rates) use **fixed point**: scale everything by a large constant, so at a scale of 10^18, 1.05 is stored as 1_050_000_000_000_000_000. A value at that scale is called a **wad**,[^wad-origin] and it is a common scale on Solana. A wad is typically stored as a u128, because the largest u64, about 1.8 × 10^19, is only about 18 at a scale of 10^18. Multiplying two wads needs a wider intermediate still, such as a U192 or U256. Their raw product is at a scale of 10^36 until one 10^18 is divided back out, and it overflows a u128 once both values pass about 18.

- Order books often use **lots**, a market-level quantity unit; the *Order Book Exchange* chapter defines them.

The wad is not a standard, though: Solana has no single fixed-point format. SPL's token-lending program used wads, held in a 192-bit `Decimal` type, but the spl-math library's `PreciseNumber` scales by 10^12. Kamino's lending program uses binary fixed point instead. Its numbers are u128s with the last 60 bits after the binary point, so 1.0 is stored as 2^60.[^fixed-point-formats] That gives about the same precision as a wad, and rescaling becomes a bit shift rather than a division. The companion repository mixes scales too: the lending program's `FIXED_POINT_SCALE` is 10^18, and the perpetual futures program's `FUNDING_PRECISION` is 10^9.

So the rule for decimals applies to fixed point as well: **read the format of every number you did not produce; never assume it.** Before using a rate, an index, or a price from another program, find its scale in that program's source, and convert it to yours once, where it enters your code. An interest rate stored at 10^12 and read as a wad comes out a million times too small. Every operation on it still succeeds, so the program raises no error: it charges borrowers a millionth of the interest they owe.

## Every Operation Is Checked

Use checked arithmetic everywhere: `checked_add`, `checked_mul`, `checked_sub`, with a named overflow error. A plain `+` or `*` in a Rust release build **wraps**: when the result is too big for the type, it starts again from zero, so a `u64` balance one lamport past the maximum becomes a balance of almost nothing instead of an error. Overflow checks can be turned on in the build profile, but a financial program should not depend on a build setting.

`saturating_*` clamps at the type's limit instead of failing, which is right only where a result past the limit has no meaning. In the programs in this book that limit is zero. A price feed's age floors at zero when the price feed's slot is momentarily ahead of the local clock. The interest accrued since the last refresh cannot be negative because the factor only grows. The order book's `remaining_quantity()` subtracts the filled quantity from the original with `saturating_sub`, and the lending market's `withdraw_obligation_collateral()` subtracts the withdrawn collateral's borrowing power from the obligation's allowance the same way: neither can be below zero. Where the accounting relies on the value, a clamp is worse than wrapping. `saturating_sub` turns 5 minus 10 into 0 rather than an error, so a debt that should have failed the calculation is recorded as no debt at all, and nothing anywhere reports a problem. The order book's fill accounting uses `checked_sub` for the filled quantity, and the comment beside it in `place_order.rs` says why. A silent clamp on the filled quantity would hide a remainder larger than the order, which is a bug the program must reject rather than silently accept.

## Multiply Before Divide, with Wider Intermediates

Integer division throws away the remainder, so every division destroys information. The rule that follows: **do all multiplication before any division, and divide exactly once.** `amount * share / total` is right; `amount / total * share` is wrong (the first division usually yields zero). When a formula seems to need two divisions, refactor until it needs one. Dividing once is also rounding once, which is why the errors never accumulate: there is only ever one remainder to lose.

Multiplying first creates the second problem: intermediates overflow. Two u64 values multiply into up to 128 bits, so `price * quantity` can overflow u64 even when the final result, after division, fits easily. This is **phantom overflow**: rejecting or corrupting a perfectly legal trade because the middle of the calculation was too big, not the answer. Fix it by promoting to u128 (or a U256 type for chained multiplications) before multiplying, dividing, then narrowing back to u64 with an explicit checked conversion, so the only failure left is an amount too large to transfer.

Some formulas need more than the four operations. The one every AMM needs is the first issuance of liquidity-provider (LP) tokens, the square root of a product of two u64s. It is computed with **Newton's method** on integers, a short loop that starts at the number itself and reaches the floor of the root within seventy passes for any product of two u64s. Each pass replaces the guess with the average of the guess and the target divided by the guess. The same holds for any real-valued function you need onchain: square roots, exponentials, and logs each become an integer iteration or approximation, and you pick one whose error you know the size and direction of.

## Every Division Rounds Against the User

Integer division nearly always leaves a remainder, and that remainder is **dust**: a fraction smaller than one minor unit. Every division rounds one way, **against the user, in favor of the program.**

| What is being computed | Round | Examples |
| --- | --- | --- |
| What the program pays out | Down (floor) | Withdrawals, winnings, swap outputs, shares minted |
| What the user owes | Up (ceil) | Debt, fees |

Keeping the dust in the pool is the only policy nobody can exploit: the pool belongs to its depositors, so the remainder stays with everyone rather than leaking to whoever transacts most often. One minor unit of rounding in the user's favor is invisible in a test, and an attacker who can loop a transaction thousands of times turns it into a drain; the rounding-error section of the *Adversary* chapter shows that attack succeeding in production.

> **War Story: the SPL token-lending rounding bug.** In 2021, security researchers at Neodyme found that the widely-forked SPL token-lending program rounded its collateral-to-liquidity conversions with `try_round_u64()`, to the nearest integer, instead of flooring them. Rounding half-up means rounding in the user's favor half the time, and a carefully-sized deposit-withdraw loop could keep a lending pool's rounding on the favorable side, extracting value on every pass. Roughly $2.6B across Solana lending markets was exposed.[^spl-lending] The fix replaced `try_round_u64()` with `try_floor_u64()` at both conversion sites, so the pool rounds down whenever it pays out.

### Safety Checks Round Against the User Too

The table covers tokens changing hands. The same direction applies to the numbers a program checks before it lets tokens move at all. A lending market floors collateral value and ceils debt, so a position always looks slightly worse than it is, never slightly better. The program refuses a loan the borrower can only just afford, rather than granting one they cannot quite repay.

### Rounding Up Never Makes a Fee Exceed What It Is Charged On

The order book follows its ceiling division with a check that the fee never exceeds the gross. Fee parameters are bounded when they are written, too: the order book refuses a fee rate above 100%, and the managed fund caps its manager's fee at 10%.

### Debt Rounds Up, So No Sub-Unit of It Is Ever Forgiven

Debt is ceiled wherever the program computes it, so no schedule of tiny repayments can reduce the debt by more than was repaid. Over-repayment clamps to the debt, so nobody is overcharged either.

## Invariants and Conservation: Assert After the Math

An **invariant** is a condition that must hold before and after every state change, stated in code, checked at runtime. A check on the way in catches bad inputs; a check on the way out catches *your own bug*. The most useful invariants are conservation laws:

- **Total in equals total out.** Every minor unit held in an escrow's vault, an order book's vaults, or a betting pool is accounted for on every path out of the program: paid out, refunded, or taken as fee, summing exactly.
- **The pool product must not decrease.** The AMM's x·y ≥ K check.
- **The vaults equal what the books owe.** Vault balances always cover the sum of every recorded obligation.

Check them **after the math, not just before.** The AMM re-checks its product after the transfers complete, and that check catches any bug above it that overpays a user by more than the fee the swap leaves in the pool, including bugs in code that has not been written yet. The check is two reloads and a multiplication; without it, nothing bounds what a bug above it can pay out.

A degenerate value like zero can make an invariant hold vacuously: with one reserve at zero, the AMM's pre-trade product is zero, and a check that the new product is at least zero passes whatever the swap pays out. So the AMM requires both reserves positive (`EmptyPoolReserve`) before it prices anything; the *Constant-Product AMM* chapter shows the empty-reserve case.

## Simple Interest per Refresh Approximates Compounding

A lending market cannot visit every loan each second to add its interest, so it keeps one accumulation factor per reserve, a fixed-point number that grows by the current rate whenever anyone refreshes the reserve, and derives every live debt from it. The *Lending and Borrowing* chapter builds that factor. Its growth approximates compounding, with an error that depends on how often the market is touched:

- **The everyday update approximates.** The factor grows by simple interest at each refresh: one multiply by (1 + rate × elapsed seconds), where true compounding over n seconds is (1 + rate)ⁿ, a power. Nothing bounds the interval between refreshes, though: `refresh_reserve()` charges whatever time has passed since the last one, and the undercharge grows with the gap. At 20% APR on a 10,000 USDC debt, one day untouched gives simple growth of 1.000547945 against compound growth of 1.000548095, about 0.0015 USDC undercharged, or 1,500 minor units, where a floored division loses at most one. Thirty days untouched undercharges about 1.36 USDC. The program leaves the refresh cadence to whoever runs the market.
- **When a formula needs the exact power, square.** For (1 + rate)ⁿ with a large n, do not multiply n times. Use repeated squaring instead: (1 + rate)⁸ is three squarings rather than seven multiplications, and in general about log₂(n) of them, each with checked math and floored the same way. This is **exponentiation by squaring**. It is the tool for a market that can sit untouched for a long stretch, where one catch-up update would otherwise treat months of interest as simple interest.

The rate itself is a policy choice; the arithmetic above only applies whatever rate the market sets, which for nearly every lending market is the kinked utilization curve the *Lending and Borrowing* chapter builds.

## What You Learnt

- Keep onchain amounts as integers: no floats near funds, every amount at a declared scale read from the mint, and fractions in fixed point. Fixed-point formats differ between programs, so read the scale of any number another program produced before using it.
- Multiply before divide, promote intermediates to u128, and check every operation with a named overflow error.
- Every division rounds against the user: floor what the program pays, ceil what the user owes, round once, and keep health checks conservative.
- Assert invariants after the math, and know the degenerate values that let an invariant hold in a dangerous state.
- Interest onchain compounds by approximation: simple interest at each refresh, or exponentiation by squaring where a single update must cover a long gap.

[^spl-lending]: Neodyme published the bug, the exploit, and the coordinated disclosure in December 2021, at [neodyme.io/en/blog/lending_disclosure](https://neodyme.io/en/blog/lending_disclosure/). The $2.6B is Neodyme's figure for the total value at risk across the forks, not a loss: the fix shipped before anyone else found it, as pull request 1883 to the Solana Program Library, at [github.com/solana-labs/solana-program-library/pull/1883](https://github.com/solana-labs/solana-program-library/pull/1883).

[^fixed-point-formats]: Each format is defined in its program's source: SPL token-lending's `WAD` in [github.com/solana-labs/solana-program-library/blob/master/token-lending/program/src/math/common.rs](https://github.com/solana-labs/solana-program-library/blob/master/token-lending/program/src/math/common.rs), spl-math's `PreciseNumber` in [github.com/solana-labs/solana-program-library/blob/master/libraries/math/src/precise_number.rs](https://github.com/solana-labs/solana-program-library/blob/master/libraries/math/src/precise_number.rs), and Kamino's `Fraction`, the `U68F60` type from the `fixed` crate, in [github.com/Kamino-Finance/klend/blob/master/programs/klend/src/utils/fraction.rs](https://github.com/Kamino-Finance/klend/blob/master/programs/klend/src/utils/fraction.rs). SPL token-lending keeps its general values in `Decimal`, a wad held in a 192-bit integer, in [github.com/solana-labs/solana-program-library/blob/master/token-lending/program/src/math/decimal.rs](https://github.com/solana-labs/solana-program-library/blob/master/token-lending/program/src/math/decimal.rs). All four were read on October 1, 2026.

[^wad-origin]: The name comes from DappHub's ds-math library, written for MakerDAO in 2017. The library is at [github.com/dapphub/ds-math](https://github.com/dapphub/ds-math), and the commit that brought `WAD` and `RAY` into it, on 29 March 2017, is at [github.com/dapphub/ds-math/commit/e4d8737b40](https://github.com/dapphub/ds-math/commit/e4d8737b40). DappHub announced the library, and said the types were made for MakerDAO, at [medium.com/dapphub/introducing-ds-math-an-innovative-safe-math-library-d58bc88313da](https://medium.com/dapphub/introducing-ds-math-an-innovative-safe-math-library-d58bc88313da). None of them says why the words were chosen.
