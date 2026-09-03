# Chapter 7: The Arithmetic of Money

Every bug class in this chapter has shipped in a real program, and the worst of them have drained real markets. The rules are few, and they follow from one fact: onchain money is integers.

## Money Is Integers: No Floats Near Funds

Every validator that executes your program must compute exactly the same result, or the network cannot agree on state, so a program's float operations are emulated in software rather than run on the hardware. That makes them slow. They also accumulate representation error (0.1 has no exact binary form) and round to nearest, a direction nobody chose. Money itself is discrete anyway; there is no such thing as half a lamport. Representing quantities as whole integer steps is called **discretization**. For money it is exact, because money really does come in whole units.

So the rule is: token amounts, prices, rates, and everything derived from them are integers, u64 for amounts and u128 for intermediate math. No `f32`, no `f64`, no `powf`, no library that uses them internally. When a calculation needs fractions, scale integers up instead, as the WADs and Lots section below describes. When it needs a square root or an exponential, compute it with integer iteration: Newton's method for the square root, which the *Constant-Product AMM* chapter runs for real, and exponentiation by squaring for a power, both covered later in this chapter. None of the programs in this book uses a float, and your programs should not either.

## Every Amount Is an Integer at a Declared Scale

Programs calculate in **minor units**, the smallest denomination of each token: the raw integer the token program actually moves. The **decimals** declared on each mint say how many minor units make one **major unit**: USDC has 6, so $10 is 10,000,000; TSLAx (Tesla stock) has 8, so a tenth of a share is also 10,000,000. The same integer means two different things, and three rules keep them straight:

- **Read decimals from the mint; never assume them.** Hard-coding 10^9 because SOL has 9 decimals is a bug that the first token with 6 decimals will expose.
- **Never mix scales in one calculation.** An amount in USDC minor units times a price per whole share is nonsense with a plausible magnitude, which is the hardest kind of bug to notice. Name variables with their unit and scale.
- **Use `transfer_checked()`**, which makes every transfer state the decimals it believes and fails if the mint disagrees.

## WADs and Lots

Two conventions build on minor units:

- Fractional values (interest rates, indexes, exchange rates) use **fixed point**: scale everything by a large constant, so 1.05 is stored as 1_050_000_000_000_000_000. The conventional constant is 10^18, and a value at that scale is called a **WAD**, a convention borrowed from the Ethereum blockchain. It has since become the usual word for 18-decimal fixed point on every chain, Solana included.

- Order books use **lots**: a market-level quantity unit chosen from the two mints' decimals so that prices read as human numbers regardless of how mismatched the mints are (the *Order Book Exchange* chapter shows examples of lots).

## Every Operation Is Checked

Use checked arithmetic everywhere: `checked_add`, `checked_mul`, `checked_sub`, with a named overflow error. A plain `+` or `*` in a Rust release build **wraps**: when the result is too big for the type, it starts again from zero, so a `u64` balance one lamport past the maximum becomes a balance of almost nothing instead of an error. Overflow checks can be turned on in the build profile, but a financial program should not depend on a build setting.

`saturating_*` clamps at the type's limit instead of failing, and that is right in one situation only: where the operand cannot go the wrong way by construction and the clamp is the answer you want. The programs in this book use it for a price feed's age, which floors at zero when the feed's slot is momentarily ahead of the local clock, and for the interest accrued since the last refresh, which cannot be negative because the factor only grows. On a value the accounting relies on it is worse than wrapping: `saturating_sub` turns 5 minus 10 into 0 rather than an error, so a debt that should have failed the calculation is recorded as no debt at all, and nothing anywhere reports a problem. The order book's fill accounting uses `checked_sub` there and says why in a comment: a silent clamp on the filled quantity would hide a remainder larger than the order, which is a bug the program must refuse rather than absorb.

## Multiply Before Divide, with Wider Intermediates

Integer division throws away the remainder, so every division destroys information. The rule that follows: **do all multiplication before any division, and divide exactly once.** `amount * share / total` is right; `amount / total * share` is wrong (the first division usually yields zero). When a formula seems to need two divisions, refactor until it needs one. Dividing once is also rounding once, which is why the errors never compound: there is only ever one remainder to lose.

Multiplying first creates the second problem: intermediates overflow. Two u64 values multiply into up to 128 bits, so `price * quantity` can overflow u64 even when the final result, after division, fits easily. This is **phantom overflow**: rejecting or corrupting a perfectly legal trade because the middle of the calculation was too big, not the answer. The fix is mechanical: promote to u128 (or a U256 type for chained multiplications) before multiplying, divide, then narrow back to u64 with an explicit checked conversion, so the only failure left is an amount too large to transfer.

Some formulas need more than the four operations. The classic is the AMM's first issuance of LP tokens, the square root of a product of two u64s: computed with **Newton's method** on integers, a five-line loop that starts high and converges in a few dozen iterations, flooring the result. The same holds for any real-valued function you need onchain: square roots, exponentials, and logs each become an integer iteration or approximation, and you pick one whose error you know the size and direction of.

## Rounding Is a Policy Decision

Integer division nearly always leaves a remainder, and that remainder is **dust**: a fraction smaller than one minor unit. One transaction's dust is worth nothing; a million transactions' dust is worth taking. So every division rounds one way, **against the user, in favor of the program.**

| What is being computed | Round | Examples |
| --- | --- | --- |
| What the program pays out | Down (floor) | Withdrawals, winnings, swap outputs, shares minted |
| What the user owes | Up (ceil) | Debt, fees |

Is this greedy? Keeping the dust in the pool is the only policy that holds up: the pool belongs to its depositors, so the remainder stays with everyone rather than leaking to whoever transacts most often. One minor unit of rounding in the user's favor is invisible in a test, and an attacker who can loop a transaction thousands of times turns it into a drain; the precision-exploit section of the *Adversary* chapter shows that attack succeeding in production.

> **War Story: the SPL token-lending rounding bug.** In 2021, security researchers at Neodyme found that the widely-forked SPL token-lending program rounded a conversion with `round`, to the nearest integer, instead of flooring it. Rounding half-up means rounding in the user's favor half the time, and a carefully-sized deposit-withdraw loop could keep a lending pool's rounding on the favorable side, extracting value on every pass. Roughly $2.6B across Solana lending markets was exposed.[^spl-lending] The fix that shipped was one word: `round` became `floor`.

### Safety Checks Round Against the User Too

The table covers money changing hands. The same direction applies to the numbers a program checks before it lets money move at all. A lending market floors collateral value and ceils debt, so a position always looks slightly worse than it is, never slightly better. A borrower is refused a loan they could just barely afford, rather than granted one they just barely cannot.

### A Ceiled Fee Is a Capped Fee

Rounding up must never make a fee larger than the amount it is charged on. The order book backs its ceiling division with a check that the fee never exceeds the gross. Fee *parameters* are bounded when they are written, too: the order book refuses a fee rate above 100%, and the vault strategy caps its manager's fee at 10%. No configuration can express a fee its program does not allow, so no manager can drain a fund by setting one.

### Ceiling Debt Is What "Paid in Full" Means Onchain

Debt is ceiled wherever the program computes it. Three guarantees follow:

- The pool never collects less than the interest that accrued.
- No schedule of tiny repayments can shave the debt.
- No sub-unit of debt is forgiven by rounding; it stays with the borrower.

Over-repayment clamps to the debt, so nobody is overcharged either.

## Invariants and Conservation: Assert After the Math

An **invariant** is a property that must hold before and after every state change, stated in code, checked at runtime. A check on the way in catches bad inputs; a check on the way out catches *your own bug*. The most useful invariants are conservation laws:

- **Total in equals total out.** Every minor unit locked into an escrow, order lock, or bet pool is accounted for on every exit path: paid out, refunded, or taken as fee, summing exactly.
- **The pool product must not decrease.** The AMM's x·y ≥ K check.
- **The vaults equal what the books owe.** Vault balances always cover the sum of every recorded obligation.

Check them **after the math, not just before.** The AMM re-checks its product after the transfers have actually landed, and that one check catches every bug above it that would overpay a user, including bugs in code that has not been written yet. The check costs a few hundred compute units; the drain it catches is unbounded.

One note from the same program: degenerate values like zero can make invariants hold even in dangerous situations. K is the product of the two reserves, so K is zero whenever either reserve is zero, even though the pool still holds every token of the other. In that state `new_k >= old_k` reads `new_k >= 0`, which every outcome satisfies, while the swap formula pays out the whole remaining reserve for any input at all. So the AMM guards the degenerate case directly, requiring both reserves positive before it prices anything.

## One Accumulation Factor Compounds Interest for Every Borrower

A lending market can have thousands of open loans, and every one of them owes more with each slot that passes. Written naively, interest is a loop: every slot, visit every loan and multiply its debt by one plus the rate. Onchain that loop cannot run: there is no transaction large enough to include every borrower's account. Even a crank working through the loans in batches would spend compute rewriting thousands of accounts to record interest nobody is collecting yet.

The **accumulation factor** removes the loop. Each market stores one fixed-point number that starts at 1.0 and grows by the current rate each time anyone touches the market:

```
new factor = old factor × (1 + rate per slot × elapsed slots)
```

Each loan stores only its principal, and a live debt is that principal multiplied by the current factor. One number moves instead of thousands, interest compounds across updates on its own, and no tokens move until someone repays or withdraws. The lending example calls the field `borrow_accumulation_factor`; the *Lending and Borrowing* chapter runs it.

That update is an approximation of compounding, and it is the one the lending market runs. The exact form exists for the day a formula needs it:

- **The everyday update approximates.** Multiplying by (1 + rate × elapsed slots) is simple interest over the interval. True compounding over n slots is (1 + rate)ⁿ, a power; the approximation is a multiply. The lending market grows `borrow_accumulation_factor` this way in `refresh_reserve()`, and every handler that moves money requires that refresh to have run first, so the intervals stay short. With a tiny per-slot rate and short intervals, the difference from true compounding is smaller than anything a borrower could measure.
- **When a formula needs the exact power, square.** For (1 + rate)ⁿ with a large n, do not multiply n times. Use repeated squaring instead: (1 + rate)⁸ is three squarings rather than seven multiplications, and in general about log₂(n) of them, each with checked math and floored the same way. This is **exponentiation by squaring**. No program in this book needs it, because the lending market refreshes often enough that the approximation stays closer than the rounding. It is the tool for a market that can sit untouched for a long stretch, where one catch-up update would otherwise treat months of interest as simple interest.

The rate itself is a policy choice; the arithmetic above only applies whatever rate the market sets. Nearly every lending market sets it the same way, though: as a function of **utilization**, the share of the pool that is lent out. The rate rises gently up to a target utilization and steeply beyond it, so a pool that is nearly drained pays depositors more and charges borrowers more until deposits come back or loans are repaid.

## What You Learnt

- Onchain money is integers: no floats near funds, every amount at a declared scale read from the mint, lots for order books and WADs for fractions.
- Multiply before divide, promote intermediates to u128, and check every operation with a named overflow error.
- Rounding is a policy decision: floor what the program pays, ceil what the user owes, round once, and keep health checks conservative.
- Assert invariants after the math, and know the degenerate values that let an invariant hold in a dangerous state.
- One accumulation factor compounds interest for every borrower at once, and rates rise with utilization as a pool drains, so borrowers repay and suppliers arrive.

[^spl-lending]: Neodyme published the bug, the exploit, and the coordinated disclosure in December 2021, at [neodyme.io/en/blog/lending_disclosure](https://neodyme.io/en/blog/lending_disclosure/). The $2.6B is the total value locked across the forks at the time, not a loss: the fix shipped before anyone else found it.
