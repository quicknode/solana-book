# Chapter 7: The Arithmetic of Money

Every bug class in this chapter has drained a real market. The rules are few, and none of them will ever change, because they follow from one fact: onchain money is integers.

## Money Is Integers: No Floats Near Funds

Every validator that executes your program must compute exactly the same result, or the network cannot agree on state. Floating-point math puts that at risk: results can vary with hardware, compiler flags, and operation order, and floats accumulate representation error (0.1 has no exact binary form). Money itself is discrete anyway; there is no such thing as half a lamport. Representing quantities as whole integer steps is called **discretization**, and for money it is not a compromise but the honest representation.

So the rule is absolute: token amounts, prices, rates, and everything derived from them are integers, u64 for amounts and u128 for intermediate math. No `f32`, no `f64`, no `powf`, no library that smuggles them in. When a calculation needs fractions, scale integers up instead (see fixed point, below). When it needs a square root or an exponential, compute it with integer iteration (see the AMM and interest sections). The program chapters contain not one float between them, and yours should not either.

## Every Amount Is an Integer at a Declared Scale

Programs calculate in **minor units**, the smallest denomination of each token: the raw integer the token program actually moves. The **decimals** declared on each mint say how many minor units make one **major unit**: USDC has 6, so $10 is 10,000,000; TSLAx (Tesla stock) has 8, so a tenth of a share is also 10,000,000. Identical integers, entirely different meanings. Three rules keep them straight:

- **Read decimals from the mint; never assume them.** Hard-coding `10^9` because SOL has 9 decimals is a bug waiting for the first token that has 6.
- **Never mix scales in one calculation.** An amount in USDC minor units times a price per whole share is nonsense with a plausible magnitude, the worst kind of wrong. Name variables with their unit and scale.
- **Use `transfer_checked()`**, which makes every transfer state the decimals it believes and fails if the mint disagrees.

## Lots and WADs

Two conventions build on minor units.

Order books use **lots**: a market-level quantity unit chosen from the two mints' decimals so that prices read as human numbers regardless of how mismatched the mints are (the Order Book chapter shows the construction).

Fractional values (interest rates, indexes, exchange rates) use **fixed point**: scale everything by a large constant, so 1.05 is stored as 1_050_000_000_000_000_000. The conventional constant is 10^18, and a value at that scale is called a **WAD**; the name comes from Ethereum's DappHub and MakerDAO convention, a "wad" as in a wad of bills, and it has become the standard word for 18-decimal fixed point on every chain. The scale is chosen large enough that the smallest value you care about (one slot's interest) does not truncate to zero, and small enough that intermediates stay inside u128.

## Multiply Before Divide, with Wider Intermediates

Integer division throws away the remainder, so every division destroys information. The rule that follows: **do all multiplication before any division, and divide exactly once.** `amount * share / total` is right; `amount / total * share` is catastrophically wrong (the first division usually yields zero). When a formula seems to need two divisions, refactor until it needs one.

Multiplying first creates the second problem: intermediates overflow. Two u64 values multiply into up to 128 bits, so `price * quantity` can overflow u64 even when the final result, after division, fits easily. This is **phantom overflow**: rejecting or corrupting a perfectly legal trade because the middle of the calculation was too big, not the answer. The fix is mechanical: promote to u128 (or a U256 type for chained multiplications) before multiplying, divide, then narrow back to u64 with an explicit checked conversion, so the only failure mode left is an amount genuinely too large to transfer.

And everywhere, use checked arithmetic: `checked_add`, `checked_mul`, `checked_sub`, with a named overflow error. Rust release builds wrap silently on plain operators unless overflow checks are enabled; a financial program never gambles on that. Reserve `saturating_*` for cosmetic paths; on a value the accounting relies on, a silent clamp is a correctness bug wearing a seatbelt.

Some formulas need more than the four operations. The classic is the AMM's first issuance of LP tokens, the square root of a product of two u64s: computed with **Newton's method** on integers, a five-line loop that starts high and converges in a few dozen iterations, flooring the result. The lesson generalizes: any real-valued function you need onchain (square roots, exponentials, logs) becomes an integer iteration or approximation with a known, bounded, directionally-controlled error.

## Rounding Is a Policy Decision

Every integer division rounds, so every division is a decision about who gets the remainder. Make it deliberately, in one direction: **against the user, in favor of the program.**

| What is being computed | Round | Examples |
| --- | --- | --- |
| What the program pays out | Down (floor) | Withdrawals, winnings, swap outputs, shares minted |
| What the user owes | Up (ceil) | Debt, fees |

The dust stays in the pool, where it belongs to everyone, rather than leaking to whoever transacts most often.

This is not stinginess; it is the only stable policy. One minor unit of rounding in the user's favor is invisible in a test and industrial at scale: an attacker who can loop a transaction thousands of times turns a sub-cent leak into a drain, and the precision-exploit section of The Adversary shows exactly that attack succeeding in production.

> **War Story: the SPL token-lending rounding bug.** In 2021, security researchers at Neodyme found that the widely-forked SPL token-lending program rounded a conversion with `round`, to the nearest integer, instead of flooring it. Rounding half-up means rounding in the user's favor half the time, and a carefully-sized deposit-withdraw loop could keep a lending pool's rounding on the favorable side, extracting value on every pass. Roughly $2.6B across Solana lending markets was exposed. The fix that shipped was one word: `round` became `floor`. The lesson is the whole section: rounding direction is not a detail, it is a security boundary, and "closest" is never the answer for money.

Four corollaries. First, round *once*: floor a value once at the end, not at every intermediate step, or errors compound (this is multiply-before-divide again). Second, when health and safety checks are involved, round so the check is conservative: a lending market floors collateral value and ceils debt, so a position always looks slightly worse than it is, never slightly better. Third, **a ceiled fee is a capped fee**: rounding up must never turn a fee into more than the amount it is charged on (the order book backs its ceiling division with a check that the fee never exceeds the gross), and fee *parameters* are bounded at write time, so no configuration can express a fee above 100% and no manager fee can drain a fund by setting alone. Fourth, **ceiling debt is what "interest is paid in full" means onchain**: the pool never collects less than the interest that accrued, no schedule of tiny repayments can shave it, and no sub-unit of debt is ever forgiven by rounding, while over-repayment clamps to the debt so nobody is overcharged either.

## Invariants and Conservation: Assert After the Math

An **invariant** is a property that must hold before and after every state change, stated in code, checked at runtime. The great ones are conservation laws:

- **Total in equals total out.** Every minor unit locked into an escrow, order lock, or bet pool is accounted for on every exit path: paid out, refunded, or taken as fee, summing exactly. Nothing evaporates; nothing appears.
- **The pool product must not decrease.** The AMM's x·y ≥ K check.
- **The vaults equal what the books owe.** Vault balances always cover the sum of every recorded obligation.

The discipline that makes invariants worth having: **assert after the math, not just before.** Preconditions catch bad inputs; a postcondition catches *your own bug*. The AMM re-checks its product after the transfers have actually landed, and that single line catches every "I computed the output wrong and overpaid" mistake in the file, including the ones in code that has not been written yet. When an invariant check costs a few hundred compute units and the alternative is an unbounded drain, the check is free.

One warning from the same file: an invariant that can hold vacuously is not an invariant. `new_k >= old_k` passes trivially when `old_k` is zero, which is why the empty pool needs its own explicit guard. Know the degenerate values of every property you assert.

## One Index Compounds Interest for Every Borrower at Once

Interest is multiplication repeated over time, and the naive implementation, looping over every borrower every slot, is impossible onchain. The standard solution is the **cumulative index**: one fixed-point number per market that starts at 1.0 and grows by the current rate each time anyone touches the market. New index = old index × (1 + rate per slot × elapsed slots). A debt is stored divided by the index at borrow time, and its live value is that scaled figure times the current index. One multiplication serves every borrower simultaneously, interest compounds across updates automatically, and no tokens move until someone actually repays or withdraws. The Lending chapter runs this machine in production; the same shape prices any share of a growing pool.

Two numerical points complete the picture. Compounding per slot with a simple multiply is a **binomial approximation** of continuous compounding: (1 + r)ⁿ expanded to first order per step. Updated frequently, the error is negligible and always in a known direction; the tradeoff is a few compute units per update against exactness nobody can measure. And when a formula needs (1 + r)ⁿ for large n in one step, compute it by **exponentiation by squaring**: n multiplications become log₂(n), each one checked, each one floored consistently.

Rates themselves are policy, not arithmetic, but one curve recurs everywhere: rates that rise with **utilization**, gently to a target and steeply past it, so a pool that is nearly drained pays depositors more and charges borrowers more until balance returns. Fifteen lines of integer math, doing a central bank's job.

## What You Learnt

- Onchain money is integers: no floats near funds, every amount at a declared scale read from the mint, lots for order books and WADs for fractions.
- Multiply before divide, promote intermediates to u128, and check every operation with a named overflow error.
- Rounding is a policy decision: floor what the program pays, ceil what the user owes, round once, and keep health checks conservative.
- Assert invariants after the math, and know the degenerate values where an invariant can hold vacuously.
- One cumulative index compounds interest for every borrower at once, and a utilization curve is monetary policy in fifteen lines of integer math.
