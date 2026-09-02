# Chapter 7: The Arithmetic of Money

Every bug class in this chapter has drained a real market. The rules are few, and they follow from one fact: onchain money is integers.

## Money Is Integers: No Floats Near Funds

Every validator that executes your program must compute exactly the same result, or the network cannot agree on state. Floating-point math puts that at risk, and Solana itself is removing floats from its consensus-critical calculations for that reason.[^runtime-floats] Inside a program, float operations are emulated in software, so they are slow; they accumulate representation error (0.1 has no exact binary form); and they round to nearest, a direction nobody chose. Money itself is discrete anyway; there is no such thing as half a lamport. Representing quantities as whole integer steps is called **discretization**. For money it is exact, because money really does come in whole units.

So the rule is: token amounts, prices, rates, and everything derived from them are integers, u64 for amounts and u128 for intermediate math. No `f32`, no `f64`, no `powf`, no library that smuggles them in. When a calculation needs fractions, scale integers up instead (see fixed point, below). When it needs a square root or an exponential, compute it with integer iteration (see the AMM and interest sections). None of the programs in this book uses a float, and yours should not either.

## Every Amount Is an Integer at a Declared Scale

Programs calculate in **minor units**, the smallest denomination of each token: the raw integer the token program actually moves. The **decimals** declared on each mint say how many minor units make one **major unit**: USDC has 6, so $10 is 10,000,000; TSLAx (Tesla stock) has 8, so a tenth of a share is also 10,000,000. The same integer means two different things, and three rules keep them straight:

- **Read decimals from the mint; never assume them.** Hard-coding `10^9` because SOL has 9 decimals is a bug waiting for the first token that has 6.
- **Never mix scales in one calculation.** An amount in USDC minor units times a price per whole share is nonsense with a plausible magnitude, which is the hardest kind of bug to notice. Name variables with their unit and scale.
- **Use `transfer_checked()`**, which makes every transfer state the decimals it believes and fails if the mint disagrees.

## Lots and WADs

Two conventions build on minor units.

Order books use **lots**: a market-level quantity unit chosen from the two mints' decimals so that prices read as human numbers regardless of how mismatched the mints are (the *Order Book Exchange* chapter shows the construction).

Fractional values (interest rates, indexes, exchange rates) use **fixed point**: scale everything by a large constant, so 1.05 is stored as 1_050_000_000_000_000_000. The conventional constant is 10^18, and a value at that scale is called a **WAD**. The convention is borrowed from Ethereum, where DappHub's `ds-math` library introduced it and MakerDAO made it standard; 18 decimals because that is what Ether and most ERC-20 tokens use. It has since become the usual word for 18-decimal fixed point on every chain, Solana included. The scale is chosen large enough that the smallest value you care about (one slot's interest) does not truncate to zero, and small enough that intermediates stay inside u128.

## Multiply Before Divide, with Wider Intermediates

Integer division throws away the remainder, so every division destroys information. The rule that follows: **do all multiplication before any division, and divide exactly once.** `amount * share / total` is right; `amount / total * share` is wrong (the first division usually yields zero). When a formula seems to need two divisions, refactor until it needs one. Dividing once is also rounding once, which is why the errors never compound: there is only ever one remainder to lose.

Multiplying first creates the second problem: intermediates overflow. Two u64 values multiply into up to 128 bits, so `price * quantity` can overflow u64 even when the final result, after division, fits easily. This is **phantom overflow**: rejecting or corrupting a perfectly legal trade because the middle of the calculation was too big, not the answer. The fix is mechanical: promote to u128 (or a U256 type for chained multiplications) before multiplying, divide, then narrow back to u64 with an explicit checked conversion, so the only failure left is an amount too large to transfer.

And everywhere, use checked arithmetic: `checked_add`, `checked_mul`, `checked_sub`, with a named overflow error. A plain `+` or `*` in a Rust release build **wraps**: when the result is too big for the type, it starts again from zero, so a `u64` balance one lamport past the maximum becomes a balance of almost nothing instead of an error. Overflow checks can be turned on in the build profile, but a financial program should not depend on a build setting. Reserve `saturating_*` for cosmetic paths. On a value the accounting relies on it is worse than wrapping: `saturating_sub` turns 5 minus 10 into 0 rather than an error, so a debt that should have failed the calculation is recorded as no debt at all, and nothing anywhere reports a problem.

Some formulas need more than the four operations. The classic is the AMM's first issuance of LP tokens, the square root of a product of two u64s: computed with **Newton's method** on integers, a five-line loop that starts high and converges in a few dozen iterations, flooring the result. The same holds for any real-valued function you need onchain (square roots, exponentials, logs) becomes an integer iteration or approximation, and you pick one whose error you know the size and the direction of.

## Rounding Is a Policy Decision

Every integer division rounds, so every division is a decision about who gets the remainder. Make it deliberately, in one direction: **against the user, in favor of the program.**

| What is being computed | Round | Examples |
| --- | --- | --- |
| What the program pays out | Down (floor) | Withdrawals, winnings, swap outputs, shares minted |
| What the user owes | Up (ceil) | Debt, fees |

Integer division nearly always leaves a remainder, and that remainder is **dust**: a sliver smaller than one minor unit of anything, worth nothing on its own and worth a great deal a million transactions later. The dust stays in the pool, where it belongs to everyone, rather than leaking to whoever transacts most often.

Keeping the dust in the pool is the only policy that holds up. One minor unit of rounding in the user's favor is invisible in a test and a drain at scale. An attacker who can loop a transaction thousands of times turns a sub-cent leak into a drain, and the precision-exploit section of the *Adversary* chapter shows that attack succeeding in production.

> **War Story: the SPL token-lending rounding bug.** In 2021, security researchers at Neodyme found that the widely-forked SPL token-lending program rounded a conversion with `round`, to the nearest integer, instead of flooring it. Rounding half-up means rounding in the user's favor half the time, and a carefully-sized deposit-withdraw loop could keep a lending pool's rounding on the favorable side, extracting value on every pass. Roughly $2.6B across Solana lending markets was exposed.[^spl-lending] The fix that shipped was one word: `round` became `floor`.

### Safety Checks Round Against the User Too

The table covers money changing hands. The same direction applies to the numbers a program checks before it lets money move at all. A lending market floors collateral value and ceils debt, so a position always looks slightly worse than it is, never slightly better. A borrower is refused a loan they could just barely afford, rather than granted one they just barely cannot.

### A Ceiled Fee Is a Capped Fee

Rounding up must never make a fee larger than the amount it is charged on. The order book backs its ceiling division with a check that the fee never exceeds the gross. Fee *parameters* are bounded when they are written, too, so no configuration can express a fee above 100% and no manager can drain a fund by setting one.

### Ceiling Debt Is What "Paid in Full" Means Onchain

The pool never collects less than the interest that accrued, no schedule of tiny repayments can shave it, and no sub-unit of debt is ever forgiven by rounding. Over-repayment clamps to the debt, so nobody is overcharged either.

## Invariants and Conservation: Assert After the Math

An **invariant** is a property that must hold before and after every state change, stated in code, checked at runtime. The most useful ones are conservation laws:

- **Total in equals total out.** Every minor unit locked into an escrow, order lock, or bet pool is accounted for on every exit path: paid out, refunded, or taken as fee, summing exactly.
- **The pool product must not decrease.** The AMM's x·y ≥ K check.
- **The vaults equal what the books owe.** Vault balances always cover the sum of every recorded obligation.

Check them **after the math, not just before.** A check on the way in catches bad inputs; a check on the way out catches *your own bug*. The AMM re-checks its product after the transfers have actually landed, and that one check catches every bug above it that would overpay a user, including bugs in code that has not been written yet. The check costs a few hundred compute units, and the bug it catches is an unbounded drain.

One warning from the same file: an invariant can hold vacuously. `new_k >= old_k` passes trivially when `old_k` is zero, which is why the empty pool needs its own explicit guard. Know the degenerate values of every property you assert.

## One Accumulation Factor Compounds Interest for Every Borrower

Interest is multiplication repeated over time, and the naive implementation, looping over every borrower every slot, is impossible onchain. The standard solution is the **accumulation factor**: one fixed-point number per market that starts at 1.0 and grows by the current rate each time anyone touches the market. New factor = old factor × (1 + rate per slot × elapsed slots). Instead of updating every debt, the market stores each borrower's principal and grows the one shared factor; a live debt is that principal multiplied by the current factor. Interest compounds across updates automatically, and no tokens move until someone actually repays or withdraws. The lending example calls the field `borrow_accumulation_factor`. The *Lending and Borrowing* chapter runs it, and the same shape prices any share of a growing pool.

Two details of the arithmetic:

- Compounding per slot with a simple multiply is a **binomial approximation** of continuous compounding: (1 + r)ⁿ expanded to first order per step. Updated frequently, the error is negligible and always in a known direction; the tradeoff is a few compute units per update against exactness nobody can measure.
- When a formula needs (1 + r)ⁿ for large n in one step, compute it by **exponentiation by squaring**: n multiplications become log₂(n), each one checked, each one floored consistently.

Rates themselves are policy, not arithmetic, but one curve shows up everywhere: rates that rise with **utilization**, gently to a target and steeply past it, so a pool that is nearly drained pays depositors more and charges borrowers more until balance returns.

## What You Learnt

- Onchain money is integers: no floats near funds, every amount at a declared scale read from the mint, lots for order books and WADs for fractions.
- Multiply before divide, promote intermediates to u128, and check every operation with a named overflow error.
- Rounding is a policy decision: floor what the program pays, ceil what the user owes, round once, and keep health checks conservative.
- Assert invariants after the math, and know the degenerate values where an invariant can hold vacuously.
- One accumulation factor compounds interest for every borrower at once, and a utilization curve raises rates as a pool drains, so borrowers repay and suppliers arrive.

[^runtime-floats]: [SIMD-0391](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0391-replace-stake-program-floating-point.md) replaced the floating-point arithmetic in the Stake Program's warmup and cooldown logic with fixed point, and Anza announced in September 2026 that it had been live on mainnet since epoch 1026. [SIMD-0607](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0607-remove-runtime-float-ops.md), accepted as a draft the same month, does the same for the runtime's inflation reward and rent calculations, because those values "must be computed identically by all validator clients, without relying on IEEE-754 behavior".

[^spl-lending]: Neodyme published the bug, the exploit, and the coordinated disclosure in December 2021, at [neodyme.io/en/blog/lending_disclosure](https://neodyme.io/en/blog/lending_disclosure/). The $2.6B is the total value locked across the forks at the time, not a loss: the fix shipped before anyone else found it.
