# Chapter 9: The Adversary

The same half-dozen kinds of attack have drained onchain markets for a decade, on every chain and in every framework.

## Every Mistake Is Money Anyone Can Take

Financial software on a public chain faces a harsher threat model than most software. Every instruction handler can be called by anyone, under any name, for a fraction of a cent. Your compiled program is public, and often your source is too. A mispriced trade, a leaked minor unit, or an unchecked account is money, and it goes to whoever finds it first.

Three consequences follow:

- **Attacks are automated.** A flaw worth a cent per call is worth $10,000 to a script that calls it a million times. Judge every leak by what it pays when called as fast as the network allows.
- **Attackers see your transaction before it lands.** Anyone can try to get their transaction ordered before or after yours. A pending swap can be sandwiched: the attacker buys first to push the price against it, then sells after it. Any other profitable pending action can be copied and sent ahead of the original. The profit taken this way is called MEV, maximal extractable value. It is why every trade in this book carries a caller-side bound: a minimum output, or a maximum slippage. The program cannot know the state it will run against; it can only refuse to run against a state worse than the user accepted.
- **Attacks start at the extremes.** Zero amounts, empty pools, dust quantities, and exact thresholds are where comparisons flip and remainders round. Every attack below starts from one of them.

## Validation: Signers, Owners, and the Confused Deputy

The bug exploited most often on Solana is a program trusting an account it should have checked. The caller chooses which accounts an instruction runs against, so each account is only a claim until the program checks it against something it already trusts: a signature, an owner, a stored address, or a derivation.

There are four checks:

- Is the account that authorizes this action a **signer**?
- Is each account **owned** by the program that should own it, so its data can be believed?
- Does each account **match the one recorded** when the relationship was created? This is the **stored-address check**: the vault recorded on the market, the maker recorded on the offer.[^stored-address-per-framework]
- Is each PDA **derived** from the seeds it claims, with its stored bump?

Anchor's account constraints perform all four, and the program chapters use them on every account of every instruction.

A missing check lets the attacker **substitute** an account: pass a different account from the one the program expects. The classic form was named in 1988 as the **confused deputy**, a program with authority that is tricked into using it for someone else.[^confused-deputy] Your program is the deputy. It can sign for its vaults, and the attacker wants it to sign a transfer while reading the wrong accounts. The attacker passes their own account where the payment destination belongs. Or they pass a data account they created themselves, with the same layout as the real one and numbers of their choosing. Or they pass the fee vault where the user vault belongs: the two hold the same token under the same authority, and only a stored-address check tells them apart. That is why the order book checks every vault it is handed against the addresses its market recorded.

> **War Story: Cashio, $48M, 2022.** Cashio's stablecoin was minted against deposited collateral. The mint instruction handler validated its accounts as a chain, trusting each account because the one before it named it. One link, the collateral token's mint, was never checked against anything the program already knew. An attacker created a fake account for every link, ending the chain in a worthless token, and minted two billion CASH against collateral of no value. They kept about $48M after refunding the accounts under $100,000.[^cashio] Every chain of accounts has to start from an account the program derived or recorded itself.

> **War Story: Wormhole, $326M, 2022.** The Wormhole bridge accepted a "verify signatures" result account as proof that its guardians had approved a message. One handler created those accounts, and it was meant to be the only source. To check that the Instructions sysvar it was given was the real one, that handler called a deprecated function that never checked the account's address. The attacker passed a fake sysvar, got a verification account created from it, and presented that account as proof. They minted 120,000 wrapped ETH backed by nothing.[^wormhole] A program has to check a proof itself, against accounts it validated itself.

## The Empty Pool: Inflation and Donation Attacks

Every share-based pool (vault, LP pool, lending reserve) prices a share as the pool's value divided by the number of shares. That formula breaks down at the start, when both numbers are tiny, and the **inflation attack** exploits it. The attacker makes a tiny first deposit and receives a tiny number of shares. Then they *donate* assets straight into the pool's vault with an ordinary token transfer, without calling the deposit handler. The donation raises the value behind each of their few shares. The next depositor's shares are computed as deposit × shares outstanding ÷ pool value, floored. With the pool value enormous compared with the shares outstanding, that division floors to zero or close to it: the victim's deposit buys nothing, and it now belongs to the attacker's shares.

Take a pool that prices its shares from the token balance in its vault, as the book's vault strategy did before it chose a defense. The first deposit into an empty pool mints one share per minor unit. Every later deposit mints shares in proportion to the value it adds, so a deposit that doubles the pool's value doubles the share supply:

shares minted = floor(deposit × shares outstanding ÷ pool value)

The pool's value here is the USDC in its vault. USDC has six decimals, so a minor unit is a millionth of a dollar. Bob is about to make the first real deposit into a new pool, 1,000 USDC, and the attacker sees his transaction before it lands.

1. **The attacker deposits one minor unit**, 0.000001 USDC, through the deposit handler. The pool is empty, so the first deposit mints one-to-one: one share, against a vault holding one minor unit.
2. **The attacker sends 1,000 USDC straight to the vault** with an ordinary token transfer. Anyone can transfer tokens to any token account, and the deposit handler never ran, so the share supply is still one. The vault now holds 1,000.000001 USDC, and the one share is priced at all of it.
3. **Bob's deposit lands.** The formula takes his 1,000 USDC deposit, times the one share outstanding, divided by the pool's value of 1,000.000001 USDC: floor(1,000 × 1 ÷ 1,000.000001) = floor(0.999999999) = 0. The handler mints him nothing, moves his 1,000 USDC into the vault, and returns success. The vault holds 2,000.000001 USDC against one share, and that share is the attacker's. They put in 1,000.000001 USDC and can now withdraw 2,000.000001: all of Bob's deposit is theirs.

![No check failed at any step: the share formula floored Bob's 0.999999999 shares to zero, and the vault's one share is the attacker's.](figures/inflation-attack.svg)

The attack pays exactly what Bob deposited. A larger deposit loses less, but still loses. Had Bob deposited 1,500 USDC, he would have received floor(1,500 × 1 ÷ 1,000.000001) = floor(1.4999) = 1 share. The two shares would then split 2,500.000001 USDC, and Bob's 1,500 would have become 1,250. The fraction of a share that the floor drops stays in the vault, so it adds to the value of the shares that already exist. The attacker can leave the pool in this state and collect that fraction from every later depositor. Taking a whole deposit needs a donation at least as large as the deposit, so the usual form of the attack is front-running: the attacker sees a deposit pending, sizes the donation to match it, and gets both of their transactions ordered ahead of it.

Bob can protect his own deposit with a minimum-output bound. The vault strategy's deposit handler takes a `minimum_shares` argument and rejects with `SlippageTooHigh` when it would mint fewer shares. That protects only the depositors whose wallet or app sets the argument. The vault strategy keeps it, for a share price that moves between signing and landing, but does not rely on it. The defenses below are in the program, so they protect every depositor, and each one can be checked against the same numbers:

- **Lock some shares that no one owns.** On the first deposit, the program adds a fixed number of shares to the supply without minting them to anyone, so the supply never starts at dust. Say 100 shares are locked, the size of the AMM's `MINIMUM_LIQUIDITY` floor, and every formula counts them in the supply it divides by. The attacker's smallest position is then one share out of 101. Pricing each share at 1,000 USDC takes a donation of about 101,000 USDC, and 100 of every 101 units of it belong to shares nobody can withdraw. The attacker spends 101,000 USDC to zero out Bob's 1,000, then can withdraw only about 1,010 USDC.
- **Add virtual shares and virtual value to the formula.** The program adds a fixed number of shares to the supply and a fixed amount to the pool's value, but only inside the division, so it works normally even when no real shares exist. Say a million virtual shares and one virtual minor unit. The attacker's one-minor-unit deposit now buys a million shares, and the donation is split between their million and the virtual million. Bob's 1,000 USDC buys 1,999,999 shares, which redeem for 999.99975 USDC. The attacker's shares redeem for about 500 USDC, and the other half of the donation belongs to the virtual shares, which nobody can withdraw.
- **Ignore donations.** The program records the pool's size in its own state, as the lending market's `available_liquidity` and the vault strategy's recorded holdings do, rather than reading the vault's token balance. Step 2 then changes the vault's balance and nothing the handler reads. The pool is still one minor unit against one share, and Bob's deposit mints a share per minor unit as it should. The donated 1,000 USDC sits in the vault outside the program's accounting, lost to the attacker, and the lending example tests this with `raw_token_donation_does_not_inflate_exchange_rate`. The vault strategy's `test_donation_does_not_inflate_share_price` runs these exact numbers. A recorded size stops donations only while the attacker has no other way to raise it, and the *Perpetual Futures* chapter shows one: a provider who is also the pool's only trader can pay funding into it.
- **Require a large first deposit.** If the first deposit must be at least 100 USDC, the attacker's smallest position is 100,000,000 shares. Rounding Bob's 1,000 USDC down to nothing would then take a share price above 1,000 USDC, a vault holding a hundred billion dollars.

A program needs one of these four, chosen on purpose. The book's programs each name theirs: the AMM and the perpetual futures pool lock shares, and the lending market and the vault strategy ignore donations.

## A True Price Can Still Be a Manipulated Price

The checks in the *Offchain Truth* chapter (publisher, freshness, confidence) reject a price that is fake or stale. This attack gets past all of them. The price is real, fresh, and correctly signed, and it accurately reports a market the attacker has just pushed. Push a thin market's price up for one slot, and every program that reads it acts on it. Lending markets extend credit against collateral that looks more valuable than it is. Exchanges settle at a price nobody could trade at a minute later. Liquidations fire on positions that were healthy one slot before.

> **War Story: Mango Markets, $116M, 2022.** An attacker opened large perpetual positions in Mango's own thinly traded MNGO token. They then bought MNGO on the spot markets the oracle read from, pushing its price up more than thirteen-fold in about half an hour. The oracle reported the pushed price accurately. Mango's program used it to mark the attacker's positions as hugely profitable, and the attacker borrowed $116M of the platform's deposits against that unrealized profit and left.[^mango] The attacker described it as "a highly profitable trading strategy." No signature was forged and no account was substituted.

The defenses make manipulation expensive and slow:

- **Time-weight the price.** A **time-weighted average price** (TWAP) over several minutes forces the attacker to hold the pushed price for that long, paying arbitrageurs the whole time, instead of paying for one slot of it.
- **Act on the confidence interval.** When a thin market is being pushed, its oracle's confidence interval widens. A program that pauses borrowing or tightens limits when that happens takes away the profit.
- **Cap how much can move per window.** A limit on how much can be borrowed or withdrawn in each window forces the attacker to take the money over many slots, where people can see it happening and respond.
- **Do not lend more against a token than it would cost to move its market.** If pushing the price costs less than the loan the push unlocks, someone will eventually do it.

## A Rounding Error Repeated Enough Times Drains the Pool

The *Arithmetic of Money* chapter set the rounding rules: round against the user, floor once, and round debt up. This attack targets programs that do not follow them. Each rounding in the attacker's favor is worth less than a cent, so the attack repeats it thousands of times. It works best in an **empty or near-empty market**, where the attacker controls both numbers in the ratio and can choose the divisor that makes flooring give away the most.

> **War Story: the Hundred and Sonne drains, $7.4M and $20M.** Hundred Finance (2023) and Sonne Finance (2024) were both copies of the same lending design on EVM chains, and attackers drained both the same way. The attacker found or created a newly listed, empty market. They made a tiny deposit to mint a few shares, then donated a large sum to skew the exchange rate: the first two steps of the inflation attack. Then they redeemed shares in amounts chosen so the floored number of shares burned came out one short, again and again, until the pool was empty. An attacker drained Sonne a year after Hundred's post-mortem was published,[^hundred-sonne] because a copy of a program copies its arithmetic along with everything else.

The defense is to follow the rounding rules in the *Arithmetic of Money* chapter everywhere, and to write one kind of test: a **round-trip invariant test**. Deposit then immediately withdraw, or swap in then swap back, at hostile sizes (one minor unit, the whole pool, a prime number), and assert the caller never ends with more than they started with. The lending example's `deposit_redeem_round_trip_creates_no_value` is eleven lines, and it would have failed on both programs above.

## Ordering and Composability: CPI Trust Boundaries

A transaction can call your program, which calls another, which calls another. The flash loan in the *Core Building Blocks of Solana* chapter is built from programs calling programs. Each call is also a point where code you did not write runs: between your instructions in the same transaction, or inside a CPI your program makes.

The rule is **checks-effects-interactions**: validate everything, then update your own state, and only then call other programs or move tokens. The order book's settlement zeroes a user's claimed balance *before* the transfer. If the token transfer could call back into the program (token extensions can attach hooks to transfers), the second call would find the balance already spent. Solana's runtime forbids a program from being re-entered through another program. Only a program calling itself directly is allowed, and its depth is capped. Keep the order anyway, because it also protects against changes you cannot see yet: a callee upgraded tomorrow, a hook added to a mint next year, an instruction placed after yours in the same transaction.

Two more rules for these boundaries:

- **Validate what a CPI returns and what it was given.** Calling a program does not make the accounts it touched trustworthy. The vault strategy computes each swap's minimum output from the oracle, because the router it calls is outside its control.
- **Assume the instructions after yours are hostile.** Any invariant your program needs must hold at the end of *your* instruction, not at the end of the transaction, because the instructions after yours belong to someone else.

The *Arithmetic of Money* chapter's postcondition checks, such as re-checking K after the transfers land, follow the same rule: check your own state before anyone else's code runs.

## What You Learnt

- Every mistake on a public chain is money anyone can take: attacks are automated, anyone can get their transaction ordered around yours, and attacks start at the extremes of a range.
- Every supplied account is a claim to verify, and every chain of accounts must start from an account the program itself derived or recorded.
- A share-based pool needs a defense against the inflation attack built into the program: locked shares, virtual shares, a pool size kept in program state, or a large minimum first deposit.
- A true price can still be a manipulated price: time-weight it, act on the confidence interval, cap how much can move per window, and never lend more against a token than it would cost to move its market.
- A rounding error in the user's favor gets repeated until the pool is empty, and a round-trip invariant test catches it.
- Checks-effects-interactions at every boundary: your invariants must hold at the end of your own instruction, because the instructions after yours belong to someone else.

[^confused-deputy]: Norm Hardy named it in "The Confused Deputy (or why capabilities might have been invented)", ACM SIGOPS Operating Systems Review 22(4), October 1988, at [dl.acm.org/doi/10.1145/54289.871709](https://dl.acm.org/doi/10.1145/54289.871709).

[^cashio]: The fabricated account chain is taken apart at [rekt.news/cashio-rekt](https://rekt.news/cashio-rekt), which also carries the attacker's message announcing the refund. The team published no lasting post-mortem of its own. Gross figures near $52M appear elsewhere and count what the attacker drained before the refund.

[^wormhole]: Wormhole's own incident report is at [wormholecrypto.medium.com/wormhole-incident-report-02-02-22-ad9b8f21eec6](https://wormholecrypto.medium.com/wormhole-incident-report-02-02-22-ad9b8f21eec6), and the spoofed sysvar is taken apart at [rekt.news/wormhole-rekt](https://rekt.news/wormhole-rekt).

[^mango]: Both US regulators charged it, and their filings describe the trade in detail: the CFTC at [cftc.gov/PressRoom/PressReleases/8647-23](https://www.cftc.gov/PressRoom/PressReleases/8647-23), the SEC at [sec.gov/newsroom/press-releases/2023-13](https://www.sec.gov/newsroom/press-releases/2023-13). The phrase quoted above is the attacker's own, posted on 15 October 2022 at [x.com/avi_eisen/status/1581326197241180160](https://x.com/avi_eisen/status/1581326197241180160) and reproduced in the criminal complaint.

[^hundred-sonne]: Hundred Finance is written up at [halborn.com/blog/post/explained-the-hundred-finance-hack-april-2023](https://www.halborn.com/blog/post/explained-the-hundred-finance-hack-april-2023), and Sonne, under the name of the design both forked, at [blog.verichains.io/p/compound-v2-forked-vulnerability](https://blog.verichains.io/p/compound-v2-forked-vulnerability).

[^stored-address-per-framework]: Each framework implements the check in its own way, and the way changes between versions. In the companion repository, Anchor 2 puts `address = offer.maker` on the account being checked; Anchor 1 put `has_one = maker` on the account holding the record, and Quasar writes `has_one(maker)` there; the native version is an if-statement comparing the two addresses. The check is the same in all four.
