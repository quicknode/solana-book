# Chapter 9: The Adversary

The same half-dozen attack classes have drained onchain markets for a decade, on every chain and in every framework, and they will drain the next decade's markets too.

## Every Mistake Is a Bounty, Claimable by Anyone

Deploying financial software on a public chain means accepting a threat model no other kind of software faces. Every instruction handler is callable by anyone on earth, pseudonymously, for a fraction of a cent. Your source, or at least the compiled program, is public. And every mistake is a bounty: a mispriced trade, a leaked minor unit, or an unchecked account is money, claimable by the first person to notice.

Three consequences follow:

- **Attacks are industrialized.** A flaw worth a cent per call meets a loop that calls it a million times. Nothing is too small to steal; judge every leak by what it pays at full throughput.
- **Attackers see your transaction before it lands.** Ordering on a public chain is contestable: a pending swap can be sandwiched (front-run to move the price against it, then back-run to profit), and any profitable pending action can be copied and raced. This is MEV, extractable value from ordering, and it is why every trade in this book carries a caller-side bound: minimum output, maximum slippage. The program cannot promise the state it will execute against; it can only refuse to execute against a state worse than the user accepted.
- **The boundary values are where the money is.** Zero amounts, empty pools, dust quantities, exact thresholds: attacks land at the edges of your ranges, because that is where comparisons flip and remainders round. Every class below started as an edge case.

## Validation: Signers, Owners, and the Confused Deputy

The most exploited bug class in Solana's history is not exotic math; it is a program believing an account it should have checked. Callers supply the accounts an instruction runs against, so *every* account is a claim, and validation is the act of checking each claim against something the program already trusts: a signature, an owner, a stored address, a derivation.

The full checklist is short:

- Is the account that authorizes this action a **signer**?
- Is each account **owned** by the program that should own it, so its data can be believed?
- Does each account **match the one recorded** when the relationship was created? This is the `has_one` pattern: the vault recorded on the market, the maker recorded on the offer.
- Is each PDA **derived** from the seeds it claims, with its stored bump?

Anchor's constraints express all four declaratively, and the program chapters use them on every account of every instruction.

The attack that punishes a missing check is **substitution**, and its classic form has a name from the 1988 security literature: the **confused deputy**, an entity with authority tricked into using it on an attacker's behalf.[^confused-deputy] Your program is the deputy: it holds the vault keys, and the attacker's goal is to make it sign a transfer while looking at the wrong accounts. The attacker passes their own account where the payment destination belongs, or passes a lookalike data account they fabricated, full of numbers the program will trust. Or they pass the fee vault where the user vault belongs: the two hold the same mint under the same authority, and only a stored-address check tells them apart, which is why the order book's `has_one` constraints exist.

> **War Story: Cashio, $48M, 2022.** Cashio's stablecoin was minted against deposited collateral, and the mint instruction handler validated its accounts in a chain: this account is trusted because that one vouches for it. One link, the collateral token's mint data, went unvalidated: the "root of trust" account was never checked against anything the program knew. An attacker fabricated the whole chain, ending it in a worthless token, deposited nothing of value, and minted two billion CASH against it, keeping about $48M after refunding the accounts under $100,000.[^cashio] Every link in an account chain must end in something the program itself derived or recorded.

> **War Story: Wormhole, $326M, 2022.** The Wormhole bridge accepted a "verify signatures" result account as proof that guardians had approved a message. The instruction handler that created such accounts was meant to be the only source, but the check that the sysvar account passed to verification was the *real* sysvar used a deprecated, spoofable pattern. The attacker fabricated the verification account, presented it as proof, and minted 120,000 wrapped ETH backed by nothing.[^wormhole] A proof must be checked by the program consuming it, against accounts it validated itself.

## The Empty Pool: Inflation and Donation Attacks

Every share-based pool (vault, LP pool, lending reserve) prices shares as pool value divided by share supply, and that formula has a degenerate zone: the beginning, when both numbers are tiny. The **inflation attack** exploits it. The attacker makes the first deposit, minuscule, receiving a minuscule share supply. Then they *donate* assets straight into the pool's vault with an ordinary token transfer, never touching the deposit handler, which inflates the value behind each of their few shares. The next depositor's shares are computed as deposit × shares outstanding ÷ pool value, floored, and with pool value enormous relative to shares outstanding the division floors to zero, or nearly: the victim's deposit buys nothing, and the attacker's shares absorb it.

Run it with numbers, against a pool priced the way the vault strategy prices its shares. The first deposit into an empty pool mints one share per minor unit. Every later deposit mints shares in proportion to the value it adds, so a deposit that doubles the pool's value doubles the share supply:

shares minted = floor(deposit × shares outstanding ÷ pool value)

The pool's value here is the USDC in its vault. USDC has six decimals, so a minor unit is a millionth of a dollar. Bob is about to make the first real deposit into a new pool, 1,000 USDC, and the attacker sees his transaction before it lands.

1. **The attacker deposits one minor unit**, 0.000001 USDC, through the deposit handler. The pool is empty, so the first deposit mints one-to-one: one share, against a vault holding one minor unit.
2. **The attacker sends 1,000 USDC straight to the vault** with an ordinary token transfer. Anyone can transfer tokens to any token account, and the deposit handler never ran, so the share supply is still one. The vault now holds 1,000.000001 USDC, and the one share is priced at all of it.
3. **Bob's deposit lands.** The formula takes his 1,000 USDC deposit, times the one share outstanding, divided by the pool's value of 1,000.000001 USDC: floor(1,000 × 1 ÷ 1,000.000001) = floor(0.999999999) = 0. The handler mints him nothing, moves his 1,000 USDC into the vault, and returns success. The vault holds 2,000.000001 USDC against one share, and the attacker holds the share.

![No check failed at any step: the share formula floored Bob's 0.999999999 shares to zero, and the vault's one share is the attacker's.](figures/inflation-attack.svg)

The attacker put in 1,000.000001 USDC and can withdraw 2,000.000001, so the attack pays exactly what Bob deposited. A larger deposit does not escape it and only shrinks the take. Had Bob deposited 1,500 USDC, he would have received floor(1,500 × 1 ÷ 1,000.000001) = floor(1.4999) = 1 share. The two shares would then split 2,500.000001 USDC, and Bob's 1,500 would have become 1,250. Whatever the floor drops is not destroyed; it lands on the shares that already exist. The attacker can leave the trap set and collect that fraction from every later depositor, but the full take needs a donation at least as large as the deposit it swallows. That is why the classic form is front-running: the attacker sizes the donation against a deposit they can see pending, and lands both moves ahead of it.

The caller-side bound from the ordering discussion above protects Bob's transaction, if he set it: the vault strategy's deposit handler takes a `minimum_shares` argument and rejects with `SlippageTooHigh` when the mint would fall short. That is a defense the client supplies, so a pool whose safety depends on every client supplying it is relying on circumstance. The program-level defenses each close the degenerate zone itself, and each can be checked against the numbers above:

- **Lock a minimum liquidity** that is never minted to anyone, as the AMM does with its `MINIMUM_LIQUIDITY` floor of 100 minor units, so share supply can never be dust-sized relative to the pool. The attacker's smallest position is now one share against 100 locked ones. Pricing that share at 1,000 USDC takes a donation of about 101,000 USDC, and 100 of every 101 units of it belong to shares nobody can ever withdraw. The attacker spends 101,000 USDC to take Bob's 1,000, and can withdraw about 1,010 of it.
- **Use virtual shares and virtual assets**: add a constant to both sides of the exchange-rate division, so the division still behaves when the real supply is zero. Give the pool a million virtual shares and one virtual minor unit. The attacker's dust deposit now buys a million shares, the donation is split between their million and the virtual million, and Bob's 1,000 USDC buys 1,999,996 shares that redeem for 999.9995 USDC. The attacker's shares redeem for about 500 USDC; the other half of their donation belongs to the virtual shares, which is to say to nobody.
- **Make donations inert**: track pool size in program state (the lending market's `available_liquidity`) rather than reading the vault's token balance, so tokens pushed into the vault sideways do not count. Step 2 then changes the vault's balance and nothing the handler reads: the pool is still one minor unit against one share, and Bob's deposit mints a share per minor unit as it should. The donated 1,000 USDC sits in the vault outside the accounting, the attacker's loss, and the lending example pins this with `raw_token_donation_does_not_inflate_exchange_rate`.
- **Require a meaningful first deposit.** If the first deposit must be at least 100 USDC, the attacker's smallest position is 100,000,000 shares, and rounding Bob's 1,000 USDC down to nothing would take a share price above 1,000 USDC, a vault holding a hundred billion dollars.

One of these, deliberately chosen, is enough; the programs to worry about are the ones that rely on circumstance instead of a named defense, and the book's own vault strategy is one of them.

## A True Price Can Still Be a Manipulated Price

Everything in the *Offchain Truth* chapter assumed the fact was true, and its checks (publisher, freshness, confidence) defend against *fake* facts. This class is different: the fact is real, fresh, and correctly verified, and it is an accurate report of a market the attacker just manipulated. Push a thin market's price up for one slot, and every program consuming that price acts faithfully on it: lending markets extend credit against inflated collateral, exchanges settle at fantasy prices, liquidations fire on positions that were healthy a block ago.

> **War Story: Mango Markets, $116M, 2022.** An attacker opened large perpetual positions in Mango's own thinly-traded MNGO token, then bought MNGO aggressively on the spot markets the oracle read from, moving the price up more than thirteen-fold in about half an hour. The oracle reported the manipulated price accurately. Mango's risk engine, believing it, marked the attacker's positions massively profitable, and the attacker borrowed $116M of the platform's deposits against that unrealized profit and left.[^mango] The attacker described it as "a highly profitable trading strategy," and in the program's terms they were not wrong: no signature was forged and no account spoofed. The input was true, and the market behind it had been manipulated.

The defenses are about making price manipulation expensive and slow. **Time-weight the price**: a **time-weighted average price** (TWAP) over minutes forces the attacker to hold the manipulation, at cost, against arbitrage, instead of renting one block of it. **Respect the confidence interval**: a manipulated thin market shows its stress as widened confidence, and a consumer that degrades (pausing borrows, tightening limits) when confidence widens closes the profitable window. **Bound per-block state change**: caps on how much can be borrowed or withdrawn per window turn a one-shot drain into a multi-block campaign that defenders can see. And the bluntest: **do not build leverage on a market thinner than the credit it collateralizes.** If the cost of moving the price is less than what the move unlocks, that trade will eventually be made.

## A Rounding Error Becomes a Drain Once Someone Finds the Loop

The *Arithmetic of Money* chapter set the policy: round against the user, floor once, ceil debt. This class is what happens to programs that did not. Each favorable rounding is under a cent. The exploit is the loop, and the loop works best in an **empty or near-empty market**, where the attacker controls both sides of the ratio and can shape the divisor to maximize what flooring forgives.

> **War Story: the Hundred and Sonne drains, $7.4M and $20M.** Hundred Finance (2023) and Sonne Finance (2024), both forks of the same lending design on EVM chains, fell to the same sequence. Find or create a freshly-listed, empty market; make a tiny deposit to mint dust-level shares; donate a large sum to skew the exchange rate (the inflation setup). Then exploit the rate calculation's rounding direction, redeeming shares sized so the floored share-burn undercounted by one, repeatedly, until the pool drained. Two lending markets, a year apart, with the first post-mortem public the whole time:[^hundred-sonne] exploit classes recur because the underlying arithmetic ships again in every fork.

The defense is the *Arithmetic of Money* chapter applied without exception, plus one test-suite habit: a **round-trip invariant test**. Deposit then immediately withdraw, swap in then swap back, at adversarial sizes (one minor unit, pool-sized, prime-numbered), and assert the caller never ends with more than they started. The lending example's `deposit_redeem_round_trip_creates_no_value` is eleven lines, and it is the test that would have failed on both programs above.

## Ordering and Composability: CPI Trust Boundaries

A transaction can invoke your program, which invokes another, which invokes another. Programs calling programs is what the flash loan in the *Core Building Blocks of Solana* chapter was built from. Every such composition is also a trust boundary: mid-transaction, between your instructions, or inside a CPI you make, code you did not write gets to run.

The rule is **checks-effects-interactions**: validate everything, then update your own state, and only then call out to other programs or move tokens. The order book's settlement zeroes a user's claimed balance *before* the transfer, so even if the token transfer could re-enter (token extensions can attach hooks to transfers), a re-entrant call finds the balance already spent. Solana's runtime forbids re-entering a program through another program, the pattern behind many EVM exploits; only direct self-recursion is allowed, and its depth is capped. The ordering is still worth keeping, because it also defends against what you cannot see coming: a callee that is upgraded tomorrow, a hook added to a mint next year, an instruction sequenced after yours in the same transaction.

Two more boundary rules:

- **Validate what a CPI returns and what it was given.** Calling a program does not make the accounts it touched trustworthy; the vault strategy computes each swap's minimum output from the oracle because the router it calls is outside its trust boundary.
- **Assume hostile sequencing.** Any invariant your program needs must hold at the end of *your* instruction, not at the end of the transaction, because the instructions after yours belong to someone else.

The postcondition asserts from the *Arithmetic of Money* chapter (re-check K after the transfers land) are the same rule: your state, checked, before anyone else's code runs.

## What You Learnt

- Every mistake on a public chain is a bounty: attacks are industrialized, ordering is contestable, and the boundary values are where the money is.
- Every supplied account is a claim to verify, and every trust chain must terminate in something the program itself derived or recorded.
- Empty pools need a named defense against inflation attacks, and a rounding leak becomes a drain once someone finds the loop.
- A true price can still be a manipulated price: time-weight it, respect the confidence interval, bound per-block change, and never build leverage on a market thinner than the credit it collateralizes.
- Checks-effects-interactions at every boundary: your invariants must hold at the end of your own instruction, because the instructions after yours belong to someone else.

[^confused-deputy]: Norm Hardy named it in "The Confused Deputy (or why capabilities might have been invented)", ACM SIGOPS Operating Systems Review 22(4), October 1988, at [dl.acm.org/doi/10.1145/54289.871709](https://dl.acm.org/doi/10.1145/54289.871709).

[^cashio]: The fabricated account chain is taken apart at [rekt.news/cashio-rekt](https://rekt.news/cashio-rekt), which also carries the attacker's message announcing the refund. The team published no lasting post-mortem of its own. Gross figures near $52M appear elsewhere and count what was drained before the refund.

[^wormhole]: Wormhole's own incident report is at [wormholecrypto.medium.com/wormhole-incident-report-02-02-22-ad9b8f21eec6](https://wormholecrypto.medium.com/wormhole-incident-report-02-02-22-ad9b8f21eec6), and the spoofed sysvar is taken apart at [rekt.news/wormhole-rekt](https://rekt.news/wormhole-rekt).

[^mango]: Both US regulators charged it, and their filings describe the trade in detail: the CFTC at [cftc.gov/PressRoom/PressReleases/8647-23](https://www.cftc.gov/PressRoom/PressReleases/8647-23), the SEC at [sec.gov/newsroom/press-releases/2023-13](https://www.sec.gov/newsroom/press-releases/2023-13). The phrase quoted above is the attacker's own, posted on 15 October 2022 at [x.com/avi_eisen/status/1581326197241180160](https://x.com/avi_eisen/status/1581326197241180160) and reproduced in the criminal complaint.

[^hundred-sonne]: Hundred Finance is written up at [halborn.com/blog/post/explained-the-hundred-finance-hack-april-2023](https://www.halborn.com/blog/post/explained-the-hundred-finance-hack-april-2023), and Sonne, under the name of the design both forked, at [blog.verichains.io/p/compound-v2-forked-vulnerability](https://blog.verichains.io/p/compound-v2-forked-vulnerability).
