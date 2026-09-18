# Glossary

The vocabulary of this book, in one place: Solana's terms alongside the financial vocabulary this field uses daily but rarely defines. Terms are alphabetical, and each is a heading so you can link straight to it. Where a chapter explains a term at length, the definition says so.

### account

Some data with an [address](#address). In a program, the data is a Rust struct. Wallets, token balances, program code, and everything a program stores are all accounts; each also has a lamport balance and an owner program that may change it. Financial state is accounts.

### accumulation factor

See [borrow accumulation factor](#borrow-accumulation-factor).

### address

The 32-byte identifier of an account, usually shown base58-encoded. Most addresses are public keys; PDAs are addresses without private keys.

### adverse selection

A market maker's structural loss: the trades that find you when your quote is wrong are the trades you did not want. Even a fresh oracle trails the true price by seconds, and informed flow captures the difference. The *Prop AMM* chapter explains it at length.

### all-or-nothing

A fundraising rule under which contributions bind only if the full target is reached by the deadline; otherwise every contributor is refunded in full. The *Token Fundraiser* chapter builds it onchain.

### American option / European option

An American option may be exercised at any time up to its expiry; a European option only at expiry. The *Options* chapter builds the American kind, which needs one comparison against the clock rather than a window.

### arbitrage

Buying where an asset is cheap and selling where it is dear until the two prices meet. A constant-product pool does not know what its asset is worth; its price is only right because arbitrageurs have made it right, and the profit they take comes out of the pool's liquidity providers. See the *Constant-Product AMM* and *Prop AMM* chapters.

### ask

An order to sell at or above a stated price. The seller's side of an [order book](#order-book).

### associated token account (ATA)

The canonical token account for a given wallet and mint, at an address anyone can derive from three seeds: the owner's address, the token program that manages the mint, and the mint. ATAs are why a program can know where Alice's USDC lives without asking her.

### AUM (assets under management)

The total value a pool or fund controls, marked to market: on a perpetual futures venue, the LPs' liquidity minus traders' unrealized profit (or plus their unrealized loss). LP shares price against AUM so that entering and leaving the pool is fair at any instant. See the *Perpetual Futures* chapter.

### authority

The address whose signature a particular action requires. A program records the authority in an account, and the handler checks that the transaction carries its signature before acting. A mint authority may create supply, a freeze authority may freeze token accounts, an upgrade authority may replace a program's code, and a market authority may withdraw fees. Recording an authority and checking it is the core of access control in every chapter.

### auto-deleveraging (ADL)

A perpetual futures venue's last resort when a loss exceeds the collateral behind it and no insurance fund can cover the rest: the most profitable leveraged positions on the winning side are closed at the mark, paid out early, and their exposure retired. The *Perpetual Futures* chapter places it at the bottom of the loss waterfall.

### base token

The thing a market buys and sells (NVDAx), and the unit a **base amount** is denominated in: five NVDAx is a base amount. The base pairs against the [quote token](#quote-token), and the naming comes from FX, where a pair is written base/quote (EUR/USD) and the price is how many units of quote buy one unit of base. The word "base" is easy to misread: in that base/quote notation the base is the numerator, the value on top, not the denominator you might expect from "base."

### basis point (bps)

One hundredth of one percent; 10,000 basis points is 100%. The universal unit for fees and rates. A 25 bps fee is 0.25%.

### bid

An order to buy at or below a stated price. The buyer's side of an order book.

### blockhash

A recent block's hash, included in every transaction to bound its lifetime. When it expires, the transaction can never land.

### borrow accumulation factor

A single number per reserve that starts at 1.0 and only grows, compounding the borrow rate over elapsed slots. A borrower's live debt is their stored principal multiplied by it, so interest accrues for everyone without any loan being touched. The lending example calls the field `borrow_accumulation_factor`; see the *Lending and Borrowing* chapter.

### built-in address

An address chosen rather than computed: the System Program, the token programs, and the sysvars each sit at a fixed byte string the runtime treats as that thing. Neither a [public key](#address) somebody holds the private key for nor a [PDA](#pda-program-derived-address) derived from seeds, so a program uses it as a constant to compare against. Whether one happens to decode to a point on the ed25519 curve is an accident of the bytes and carries no meaning.

### bump

The extra byte found while deriving a PDA that pushes the result off the ed25519 curve. Programs store the bump at creation so later calls can rebuild the address cheaply.

### call

An [option](#option) giving its holder the right to buy the underlying at the [strike](#strike). Its writer's obligation is to sell, and the *Options* chapter's writer supplies the underlying asset to the program as collateral, which makes the call a [covered call](#covered-call).

### cash settlement

Settling a derivative by paying the difference between the market price and the contract's price in the quote token, USDC in this book, with the underlying never changing hands. It needs a price feed, and every check the *Offchain Truth* chapter describes. Compare [physical settlement](#physical-settlement).

### cash-secured put

A [put](#put) whose writer has supplied enough of the quote token, USDC here, to buy every share at the strike price, held by the program as collateral, so the writer cannot fail to pay if the holder exercises. The *Options* chapter's puts are all cash-secured.

### ceil (ceiling)

Rounding up to the next whole [minor unit](#minor-unit). The direction used for anything a user owes, so debts and fees never round down into a shortfall the program absorbs. The opposite of [floor](#floor). See [rounding](#rounding).

### checked arithmetic

Arithmetic that reports failure instead of producing a wrong answer: Rust's `checked_add`, `checked_sub`, `checked_mul` return nothing when the result will not fit, so the handler can fail with a named error. The alternative is [wrapping](#wrapping). Every operation on money in this book is checked.

### checks-effects-interactions

The ordering rule for instruction handlers: validate everything, then update your own state, and only then transfer tokens or call other programs, so re-entry or hostile sequencing finds the books already settled. See the *Adversary* chapter.

### close factor

In a lending market, the fraction of a debt one liquidation may repay (typically 50%). Turns liquidation into a correction rather than an execution. See the *Lending and Borrowing* chapter.

### cluster

One running instance of Solana: the same software, a separate world. Mainnet holds real value; devnet is identical machinery with free, valueless tokens for building and testing; localnet runs on your own machine; testnet is where the Solana software itself is tested. An account exists on one cluster, not all of them. Each is reached at an [RPC endpoint](#rpc-endpoint).

### collateral

Assets pledged to secure a loan, seizable on default or on breach of the liquidation threshold.

### commitment level

How sure the chain is of the transaction:

- `processed`: a leader executed the transaction and put it in a block, which can still vanish.
- `finalized`: the validators have voted the block final, and no fork can replace it.[^confirmed]

A program cannot see its own commitment, so the bot, crank, or backend reading the chain picks one; the *Operating Financial Software* chapter matches the level to how reversible the reaction is.

### compute unit

The metered unit of onchain execution. Every transaction runs against a compute budget, and the meter shapes financial design: consolidate work, credit balances instead of transferring on every fill, and treat compute cost as a design input.

### confidence interval

An oracle's own statement of its uncertainty: a price of $250 ± $8 is a different fact than $250 ± $0.10. Production programs should reject prices that are fresh but uncertain.

### counterparty

The party on the other side of your trade, and the one who owes you when you win. On an [order book](#order-book) the counterparty is another trader; in this book's pooled venues the program's pool is the counterparty to everyone at once, which is why the design is organized around the pool's solvency. See the *Perpetual Futures* chapter.

### covered

See [covered call](#covered-call).

### covered call

A [call](#call) whose writer has supplied the underlying asset to the program as collateral, so the shares the holder might buy are already in custody and the writer cannot fail to deliver them. The *Options* chapter's calls are all covered.

### CPI (cross-program invocation)

One program calling another onchain, such as any program calling the token program to move tokens. CPIs are how programs compose, and the trust boundary where composition gets dangerous.

### crank

A permissionless instruction handler that performs maintenance work nobody owns (settling funding, processing expiries), designed so anyone, typically a bot on a schedule, can turn the handle.

### critbit tree

A binary tree keyed on the first bit where entries differ. Used for order books because insertion never shifts other entries and walking it yields price-time priority for free. See the *Order Book Exchange* chapter.

### curator

In a fund, the authority that decides which assets may be held at all and which price feed prices each one, kept separate from the [manager](#manager) who picks the allocation. The split is what stops a manager listing a token they minted themselves, or pairing a real asset with a feed they control. See the *Vault Strategy* chapter.

### custody

Holding assets that belong to someone else. A program takes custody when tokens sit in a [vault](#vault) whose authority is its PDA. Balances are custody and state is truth: what the program owes is what its own accounts record, never what happens to be in the vault.

### decimals

The number of minor units in one major unit of a token, declared on the mint. USDC has 6, SOL has 9. Programs must read decimals, never assume them.

### degenerate value

A value at which a formula or a check stops meaning what it usually means, almost always zero or empty. An empty reserve makes K zero, so `new_k >= old_k` accepts every outcome; a price of zero or a negative [mantissa](#mantissa) means a broken feed; an offer with nothing in it is structurally valid and worthless. Guard each one explicitly rather than trusting the general check to catch it. See [invariant](#invariant).

### discretization

Representing a continuous quantity as discrete integer steps. Onchain money is discretized by construction: amounts are integers in [minor units](#minor-unit), so there is no such thing as half a lamport, and every division must decide what happens to the fraction the result cannot represent. See [dust](#dust) and the *Arithmetic of Money* chapter.

### discriminator

The 8 bytes Anchor writes at the start of an account's data identifying its type, so a program cannot be fed one kind of account where another belongs.

### drain

To empty an account by an attack: a vault, a pool, or a user's balance taken through a hole in the program rather than along a path its code intended. The word belongs to the attacker. A handler that legitimately moves a vault's whole balance out on its way to closing it empties the vault or pays it out. See the *Adversary* chapter.

### dust

Sub-unit remainders left over by integer division: a fraction smaller than one [minor unit](#minor-unit), worth nothing alone and worth taking a million transactions later. Who owns it is a [rounding](#rounding) decision. See the *Arithmetic of Money* chapter.

### epoch

A period of 432,000 slots over which a validator schedule holds, about a day at a 200 millisecond slot. Mostly relevant to staking; application logic usually counts slots.

### equity (position)

What a leveraged position is worth to its owner right now: collateral plus unrealized profit and loss, minus funding owed. Equity at or below the maintenance margin makes the position liquidatable.

### escrow

A neutral holder of funds that releases them only when agreed conditions are met. The first program in this book, and the pattern inside every other one.

### exercise

To use the right an [option](#option) grants: buy the underlying at the strike (a [call](#call)) or sell it there (a [put](#put)). In the *Options* chapter the holder may exercise while the clock is before `expiry`, and not after.

### expiry

The last moment an [option](#option) can be exercised. After it the writer reclaims whatever collateral was not taken. An expiry is a calendar date the parties agreed on, so the *Options* chapter measures it in wall-clock time.

### exponentiation by squaring

Computing (1 + r)ⁿ for large n in log₂(n) multiplications instead of n of them, each one checked and floored the same way. How to compound a rate over many elapsed slots in a single update. See [Newton's method (integer square root)](#newtons-method-integer-square-root) for roots, and the *Arithmetic of Money* chapter.

### faucet

A service that gives away free test tokens on devnet: SOL from the `solana airdrop` command or [faucet.quicknode.com/solana](https://faucet.quicknode.com/solana), USDC from Circle's faucet at [faucet.circle.com](https://faucet.circle.com). Faucets are why nothing in this book needs real money.

### finality

The point past which a block cannot be reorganized away and the transactions in it are the record. Solana reaches it when its validators have voted the block final; how long that takes is set by the network's consensus and moves when it does. See [commitment level](#commitment-level).

### fixed point

Representing fractions as scaled integers: 1.05 stored as 1,050,000,000,000,000,000 at 10^18 scale. How onchain programs do fractional math without floats. See [WAD](#wad).

### flash loan

A loan borrowed and repaid inside a single transaction, possible only because transactions are atomic: if the repayment fails, the borrow never happened.

### floor

Rounding down to the whole [minor unit](#minor-unit) below. The direction used for anything the program pays out, so withdrawals, winnings, and swap outputs never promise a fraction the program does not hold. The opposite of [ceil](#ceil-ceiling). See [rounding](#rounding) and [dust](#dust).

### funding rate

The periodic payment between longs and shorts on a perpetual futures market that tethers the perpetual's price to the index price.

### half-up

Rounding to the nearest whole unit with exact halves going up, which is what Rust's `round` does. Never used on money here: it rounds in the user's favor half the time, and a caller can size a deposit and withdrawal pair to collect that half repeatedly. The 2021 SPL token-lending bug was this. See [rounding](#rounding).

### halt

A stop in block production, which Solana prefers to running two conflicting histories. Slots do not advance during a halt and wall-clock time does, so a halt pulls the two clocks apart: the *Time* chapter covers what that does to accrual, freshness windows, and deadlines, and how the `LastRestartSlot` sysvar lets a program detect that one happened.

### health / health factor

A borrower's distance from liquidation: the value of their collateral, scaled by each asset's liquidation threshold, against the value of their debt. At or below the boundary, the position may be liquidated. See the *Lending and Borrowing* chapter.

### holder

The party who owns an [option](#option) and may [exercise](#exercise) it. A holder's loss is capped at the [premium](#premium) they paid. Compare [writer](#writer).

### impermanent loss

The gap between an LP position's value and what simply holding the tokens would be worth, caused by the pool mechanically selling the rising token. Realized only at withdrawal. See the *Constant-Product AMM* chapter.

### index

The lending field's word for a stored number that grows over time and that every claim on a pool is a multiple of. Aave's borrow index, Compound's borrow index, and Save's cumulative borrow rate are all one. This book calls the lending market's index the [borrow accumulation factor](#borrow-accumulation-factor), and the perpetual futures venue's `cumulative_funding` is another: a position's funding owed is its size times the change in that index since it opened.

### indexation

Advancing an [index](#index) for the time elapsed since it was last updated, which is how interest and funding accrue without any position being touched. A reviewer's word rather than the book's; the *Time* chapter covers how elapsed time is measured.

### inflation attack

The empty-pool exploit: a dust-sized first deposit, then a donation straight into the vault, inflates the value behind each early share so later depositors' shares round to nothing. Defenses include locked minimum liquidity, virtual shares, and state-tracked pool size. See the *Adversary* chapter.

### instruction

The input a transaction carries to a program: which handler to run, which accounts it may touch, and the arguments. Distinct from the function that processes it; see [instruction handler](#instruction-handler).

### instruction handler

The onchain function that processes an instruction. This book always says "instruction handler" for the function and "instruction" for its input, because tooling that uses one word for both confuses every newcomer. Most other material does use one word: "this program has five instructions" means five functions, and Anchor's generated interface file lists a program's functions under `instructions`. Read those as instruction handlers.

### insurance fund

Capital a venue sets aside to absorb losses larger than the collateral behind them, before those losses reach the liquidity providers. It does not make a venue lose less money; it names, before the loss happens, who pays for it. The tier above it is [auto-deleveraging](#auto-deleveraging-adl). See the *Perpetual Futures* chapter.

### invariant

A property that must hold before and after every state change: K must not decrease, the vault equals what the book owes, total in equals total out. Asserted in code after the math, not just assumed from it. An **invariant test** asserts one against generated inputs, and a model checker proves one over every possible input; the *Operating Financial Software* chapter sets how far to go by how much money the program will hold.

### inventory

The tokens a [market maker](#market-maker) holds and quotes against. A prop AMM prices from an oracle and fills out of inventory rather than off a curve, so its risk is the inventory's: it ends up holding whatever the flow sold it. See the *Prop AMM* chapter.

### K

The product of an AMM pool's two reserves. Constant within a trade, growing across deposits and fees. Its only job is to hold the two reserves in relation to each other.

### key pair

Two mathematically linked keys: a private key, kept secret, that signs messages, and a public key, shared freely, that proves who signed. All authority on Solana reduces to signatures from key pairs.

### kink

The bend in a lending reserve's interest rate curve, in this book at 80% [utilization](#utilization): below it the borrow rate climbs gently, above it steeply. The steep leg pushes borrowers to repay and pulls suppliers in with yield. See the *Lending and Borrowing* chapter.

### lamport

The minor unit of SOL: one billionth. Named for Leslie Lamport.

### lending market

A pooled borrow-lend venue: suppliers earn interest, borrowers pay it against collateral, liquidation keeps it solvent.

### leverage

Controlling more exposure than the collateral posted: a 5,000 USDC position over 1,000 USDC of collateral is 5x leverage. Leverage multiplies both the gain and the loss of every price move, which is why leveraged venues need margin and liquidation.

### limit order

An order with a price it refuses to cross: buy at or below, sell at or above.

### liquidation

Forcibly repaying an unhealthy loan out of its collateral, at a bonus, to keep the market solvent. Bounded by the close factor and priced by the liquidation bonus.

### liquidation threshold

The debt-to-collateral ratio at which a position becomes liquidatable. Always above the loan-to-value ratio, so there is a buffer between the most you may borrow and the point you can be seized.

### liquidity provider (LP)

Someone who deposits assets into a pool for traders to trade against, earning fees in exchange. An LP is a bet on volume, not on price direction.

### loan-to-value (LTV)

The fraction of collateral value that may be borrowed against it, e.g. 75%.

### long / short

The two directions a position can face: a long profits when the price rises, a short when it falls. On a perpetual futures venue the side is part of the position's identity, and the two sides pay each other through the [funding rate](#funding-rate). In a lending market a short is assembled by hand: borrow the asset, sell it, buy it back cheaper to repay.

### lot

The indivisible quantity unit of an order book market. Prices and quantities are stated in lots rather than raw minor units so the numbers stay human-readable regardless of the two mints' decimals. See the *Order Book Exchange* chapter.

### LP token

The receipt token minted to a liquidity provider, representing a proportional claim on a pool's reserves and accrued fees.

### maintenance margin

The minimum equity a leveraged position must keep, usually stated in basis points of its notional. Below it, the position may be liquidated by anyone.

### major unit

The human-scale denomination of an asset: the dollar, the SOL, the whole share. Contrast [minor unit](#minor-unit).

### maker / taker

The maker posted the resting order; the taker crossed the spread to hit it. Fills execute at the maker's posted price, and fee schedules usually distinguish the two roles.

### manager

In a fund, the authority that sets the allocation and earns the management fee, and that can do nothing else: no instruction handler gives them a path to the assets. What a careless manager can still cost depositors is churn, rebalancing that pays [slippage](#slippage) for nothing. See [curator](#curator) and the *Vault Strategy* chapter.

### mantissa

See [significand](#significand).

### mark price / index price

On a perpetual futures market, the index price is the oracle's statement of the asset's real-world price; the mark price is the venue's own price used for margin and liquidation.

### mark to market

Valuing a position or pool at current prices rather than at the prices it was entered at. Health checks, liquidation gates, and LP share pricing (see [AUM](#aum-assets-under-management)) all mark to market, because money moves on today's valuation.

### market maker

A party that quotes both a buy and a sell price and earns the spread between them. On an order book, makers rest orders; in a prop AMM, one firm is the standing maker for the whole venue.

### Memo Program

The program at a well-known address whose one job is writing a note into the transaction log. Alice's first transaction in this book pairs a transfer with a memo, which is how the book introduces multi-instruction atomicity.

### MEV

Maximal extractable value: profit taken by controlling transaction ordering, most visibly by sandwiching a pending trade. The reason every trade in this book carries a caller-side bound like minimum output. See the *Adversary* chapter.

### minor unit

The smallest denomination of an asset, and the raw integer programs actually calculate in: the cent, the lamport, the 10^-6 USDC. This book says minor unit, not "base unit."

### mint (account)

The onchain account that defines a type of token: its supply, decimals, and authorities. A mint is a token's factory, not a token itself, and holds no balance of anything; balances live in [token accounts](#token-account). Economic prose names the token ("Alice pays 25 USDC"); "mint" names the account, and is what an instruction is actually passed.

### multisig

An account that records a set of owners and how many must agree before it acts, used wherever one person holding a key is too much trust: a mint authority, a market's fee authority, a program's upgrade authority. A transaction can carry several signatures natively; a multisig is that idea made into standing policy.

### NAV (net asset value)

The total current value of everything a fund holds, computed from fresh prices. Share price is NAV divided by share supply.

### Newton's method (integer square root)

The iterative algorithm programs use to take a square root using only integers, converging in a few dozen loop iterations. AMMs use it to mint initial LP tokens as sqrt(x·y). See the *Constant-Product AMM* chapter.

### notional

The face value of a position, as opposed to the margin posted against it. Five NVDAx at $200 is $1,000 notional whatever the collateral behind it.

### obligation

A borrower's loan file in a lending market: their collateral deposits, their borrows, and the cached valuations health checks run against.

### open interest

The total notional of positions currently open on a market, usually tracked per side. A perpetual futures venue's funding direction and solvency reasoning both read it.

### option

The right, but not the obligation, to buy ([call](#call)) or sell ([put](#put)) an asset at a fixed price (the [strike](#strike)) before a fixed date (the [expiry](#expiry)), bought from a [writer](#writer) for a [premium](#premium). The *Options* chapter builds a venue for them.

### oracle

A service that publishes signed statements of offchain facts, most often prices, onchain. A consuming program checks where the publication came from, its freshness, and its confidence interval, as it validates any other input. Where a feed network is involved, the signature itself was verified by the oracle's own program before the fact ever reached the account you read.

### order book

The resting [bids](#bid) and [asks](#ask) for one market, best prices first, plus the matching engine that pairs them under [price-time priority](#price-time-priority). The traditional venue design, the one NYSE, NASDAQ and CME run, and the one an AMM replaces with a formula. See the *Order Book Exchange* chapter.

### parimutuel

A betting structure with no bookmaker: all stakes pool together, and winners split the losers' pool pro rata by stake. The odds are the pool. See the *Betting Market* chapter.

### PDA (program derived address)

An address computed from a program's ID and chosen seeds. A PDA is not a public key, so it has no private key, and no signature for it can ever exist. Only the deriving program can "sign" as it, by presenting the seeds for the runtime to recheck, which is what makes program-owned vaults trustworthy.

### perpetual future

A contract paying the price movement of an asset, long or short, with leverage and no expiry date; a funding rate tethers its price to the asset it tracks. The *Perpetual Futures* chapter builds one.

### phantom overflow

An overflow in the middle of a calculation whose final answer would have fit: `price * quantity` passes u64 before the division that brings it back down. A legal transaction is rejected or corrupted for a reason the result never justified. The fix is to promote to u128 before multiplying and narrow back with a checked conversion. See the *Arithmetic of Money* chapter.

### physical settlement

Settling a derivative by moving the asset itself: an exercised call hands the holder the underlying for the strike, and an exercised put hands the writer the underlying for the strike. No price is computed, so no oracle is read. The name predates blockchains, and nothing about it happens offchain: onchain, physical means the underlying token itself changes hands, where cash settlement moves only a price difference in the quote token. The *Options* chapter's venue settles physically. Compare [cash settlement](#cash-settlement).

### PnL (profit and loss)

What a position has gained or lost. While the position is open the figure is **unrealized PnL**, marked to market against the current price; closing the position realizes it. On the book's perpetual futures venue, PnL is size × price change ÷ entry price.

### premium

What the buyer of an [option](#option) pays its [writer](#writer) for the right, once, up front. It is the writer's whatever happens afterwards, and it is the most the [holder](#holder) can lose.

### price impact

How far your own trade moves the price it is executing against. A trade on a constant-product pool walks along the curve as it fills, so the average price paid is worse than the price quoted before it started, and the pool's [spot price](#spot-price) afterwards is where the next trade begins. It is what the formula charges for instant liquidity, and what a sandwich squeezes. Contrast [slippage](#slippage), which also covers the market moving before you land.

### price-time priority

The order-matching fairness rule: better-priced orders fill first, and among equal prices, earlier orders fill first.

### pro rata

In proportion to stake. Winners split a [parimutuel](#parimutuel) pool pro rata by what they bet, and shares are minted pro rata against the pool they join. The arithmetic is a ratio; the design question is which denominator to use, because the [inflation attack](#inflation-attack) skews it.

### program

Executable code deployed onchain; the thing this book builds. Called a "smart contract" on other chains.

### program ID

A program's address: the account instructions are addressed to. The compiled code itself lives in a separate account that this one points at. Every PDA is derived from a program ID plus seeds, so the ID is what ties a derived address back to the one program that can "sign" for it.

### ProgramData

The account holding a deployed program's compiled code, the slot it was last deployed in, and its upgrade authority. Under Solana's upgradeable loader the account at the program's address is only a 36-byte stub pointing here, so a deployed program occupies two accounts; newer loaders fold them back into one.

### proprietary AMM (prop AMM)

An automated market maker funded entirely by its operator's own capital and priced from an oracle plus a spread, with no liquidity providers, no pool shares, and no pricing curve. The dominant venue type by volume on Solana; the *Prop AMM* chapter builds one.

### protective put

A [put](#put) bought by someone who already holds the underlying, as insurance against its price falling below the [strike](#strike). Like fire insurance, it is meant to expire unused.

### put

An [option](#option) giving its holder the right to sell the underlying at the [strike](#strike). Its writer's obligation is to buy, and the *Options* chapter's writer supplies the program with enough of the quote token to buy every share at the strike price, which makes the put a [cash-secured put](#cash-secured-put).

### quote token

The thing a market states its prices in (USDC), and the unit a **quote amount** is denominated in: 1,000 USDC is a quote amount. The quote is the second half of the [base token](#base-token) pair, and is typically a more stable asset, usually a USD-backed stablecoin like USDC; you quote in the stable asset so the numbers mean dollars. A base amount times a price is a quote amount.

### rebalance

Trading a fund back toward its target weights after prices have moved it away. In this book's fund every leg routes through the same swap program at oracle-anchored minimums, so a rebalance cannot be dressed up as a withdrawal. See the *Vault Strategy* chapter.

### receipt

A per-participant account, usually a PDA, recording what the program owes one person: a contributor's amount, a bettor's stake. The program writes it for itself, and refunds and claims pay what the receipt records rather than what a vault happens to hold. Every receipt needs a closing path, or its rent deposit is stranded once the product it belonged to is gone.

### rent

The deposit an account holds to pay for its own storage. Rent-exempt accounts hold enough to stay forever; closing an account reclaims the deposit. Who fronts rent, and who gets it back on which path, is part of the design.

### reservation

On a perpetual futures pool, the liquidity pledged when a position opens as the most that position could ever be paid: profit is capped at it, liquidity providers cannot withdraw against it, and a position the pool cannot back is refused outright. Pre-funding every win is why the pool can never owe more than it holds. See the *Perpetual Futures* chapter.

### reserve

In a lending market, the per-asset pool: its liquidity vault, its share mint, its interest state, and its risk configuration.

### resting order

A limit order that did not match on arrival and now waits on the book, funded and cancelable.

### rounding

The decision every integer division makes about the remainder it cannot represent. Onchain this is policy rather than arithmetic: [floor](#floor) what the program pays out and [ceil](#ceil-ceiling) what the user owes, so the remainder always settles with the program. See [dust](#dust), [half-up](#half-up), and the *Arithmetic of Money* chapter.

### RPC endpoint

The URL a program or wallet sends its transactions to: a server holding a [cluster](#cluster)'s state and relaying transactions into it. The endpoint is what decides which cluster the code is talking to. The Solana Foundation's public endpoints are rate limited and meant for development; applications with real users buy a dedicated endpoint from an RPC provider.

### RWA (real-world asset)

A traditional asset represented as a token onchain: commodities, equities, real estate, and exotics. The stocks this book's markets trade (NVDAx, TSLAx, SPCXx) are RWAs. As of mid-2026, Solana is the most popular chain for RWA trading.

### sandwich

Wrapping someone's pending trade in two of your own: buy ahead of it to move the price against it, let it fill, then sell behind it. The classic [MEV](#mev) extraction on a public chain, and the reason every trade in this book carries a caller-side bound like a minimum output. See the *Adversary* chapter.

### saturating

What Rust's `saturating_add` and `saturating_mul` do when a result will not fit: clamp to the type's maximum or minimum and continue. Less silent than [wrapping](#wrapping) and still wrong on a balance, because the number returned is not the answer. Money uses [checked arithmetic](#checked-arithmetic).

### settlement

Paying out what a contract finally owes, and closing it. A betting market settles when the authority records the winning outcome and the losing pool is divided among the winners; a position settles when it closes and its [PnL](#pnl-profit-and-loss) becomes real balances. Before settlement the numbers are marks, not money.

### share

A token representing proportional ownership of a pool: of a lending reserve, of a fund's holdings, of anything with a NAV. Minted on the way in, burned on the way out, priced by dividing the pool by the supply.

### signer

An account whose private key signed the transaction. "Is this account a signer" is the first validation question in every instruction handler.

### significand

The digits of a number stated separately from its scale: a price feed holding significand 25,000,000 and exponent −5 means $250. Storing the two as integers is how oracle prices stay exact onchain; floating point packs the same two parts into one machine word, with the representation error that keeps floats away from money (see the *Arithmetic of Money* chapter). "Significand" is the preferred term because "[mantissa](#mantissa)" has a different meaning in mathematics (the fractional part of a logarithm), but some oracle operators say "mantissa" for the digits, with exactly the meaning given here.

### slippage

The difference between the price you expected and the price you got, caused by your own trade's impact or by the market moving first. Bounded by minimum-out parameters; unbounded slippage is what a [sandwich](#sandwich) takes.

### slot

Solana's basic unit of time: a window of 200 milliseconds in which a leader may produce a block. The network sets a target length and has shortened it before, so a slot count converts to seconds only at the slot length in force. Adversarial logic counts slots, not wall-clock time, because slot progression is guaranteed by the runtime while timestamps are validator-influenced.

### SOL

Solana's **native token**: the asset the network understands without any token program, used to pay transaction fees and to fund the rent deposit on every account. Denominated in [lamports](#lamport), a billionth of a SOL each. Every other token is an [SPL token](#spl-token).

### SPL token

Any token other than [SOL](#sol): one defined by a token program rather than by the network itself. The name comes from the Solana Program Library the original token program shipped in. Most people just say "token", and so does this book.

### spot price

What a pool quotes for a trade small enough to move nothing: the ratio of its two reserves. Every real fill comes in worse than the spot price by its own [price impact](#price-impact), and the spot price after a trade is where the next one starts.

### spread

The gap between the best bid and the best ask. On an order book it emerges from resting orders; in a prop AMM the operator sets it directly, and it is the venue's entire fee.

### stablecoin

A token designed to hold a fixed value, usually one dollar. The quote asset of nearly every market in this book.

### state compression

A technique for storing bulk data offchain with onchain proofs, used for things like very large NFT collections. It is the reason "nearly all", rather than "all", data on Solana lives in accounts; none of the financial state in this book uses it.

### strategy

The fund-shaped product: pooled deposits, a mandate fixing which assets may be held, a [manager](#manager) who sets the allocation, and shares priced against [NAV](#nav-net-asset-value). Distinct from a [vault](#vault), which in this book is only ever the token account the money sits in. See the *Vault Strategy* chapter.

### strike

The price at which an [option](#option) trades if its holder exercises. The *Options* chapter stores it as an amount of the quote token per contract rather than as a price, so every settlement is a multiplication with no division to round.

### System Program

The program at a well-known address that creates accounts and transfers SOL. Every wallet account is owned by it, and every account any program creates is born through it.

### sysvar

A system account the runtime itself keeps current, readable by any program: the Clock sysvar carries the slot and timestamp. Validating that a passed sysvar really is the sysvar matters; see the Wormhole War Story in the *Adversary* chapter.

### tick size

The minimum price increment of a market. Prices must land on a multiple of it, which keeps the book from fragmenting into dust price levels.

### token account

The account holding a wallet's balance of one specific token. Owned by the token program; controlled by its recorded authority.

### Token Extensions Program / Classic Token Program

Solana's two token programs. The Classic Token Program is the original; the Token Extensions Program adds per-mint features (transfer fees, transfer hooks, confidential transfers, and others). Well-written programs work with both through a common interface.

### transaction

A signed bundle of instructions that executes atomically: all of it lands or none of it does. The atomicity is a financial primitive; see [flash loan](#flash-loan).

### TWAP

A time-weighted average price: the average of a market's price over a window, used instead of the instantaneous price so a manipulator must hold a distortion for the whole window rather than rent it for one slot. See the *Adversary* chapter.

### underlying

The asset an [option](#option) or other derivative is about: what a [call](#call) buys and a [put](#put) sells at the [strike](#strike). It is short for the underlying asset, and every options market uses it as a noun on its own. In the *Options* chapter the underlying is NVDAx and the quote token is USDC.

### utilization

In a lending reserve, borrowed divided by total liquidity. The input to the interest rate curve: high utilization means the pool needs deposits, and rates rise.

### validator

A computer running the Solana software: it executes transactions, votes on blocks, and takes its turn as leader producing them. A validator reports the wall-clock timestamp the Clock [sysvar](#sysvar) carries, which is why adversarial logic counts [slots](#slot) instead, and enough validators building on a block is what gives it [finality](#finality).

### vault

A token account whose authority is a program's PDA, where a program holds funds mid-lifecycle. In this book, always the token account, never the whole product; the fund-shaped product is a [strategy](#strategy).

### WAD

A fixed-point convention: values scaled by 10^18, so 1.0 is stored as a 1 followed by eighteen zeros. The scale used for accumulation factors and rate math. Borrowed from the Ethereum blockchain, and now the usual word for 18-decimal fixed point on every chain, Solana included.

### wallet

A key pair used as an identity for holding and moving assets, with the private key stored safely. On disk, a key pair file is just 64 bytes; whoever holds them is the wallet. **Wallet software** is the tool that holds those keys, signs transactions with them, and shows the balances they control, whether a phone or desktop app or browser extension.

### wrapping

What a plain `+` or `*` does in a Rust release build when the result is too big for the type: it starts again from zero, so a `u64` one past the maximum becomes almost nothing. Silent, and catastrophic on a balance, which is why money uses [checked arithmetic](#checked-arithmetic) instead.

### writer

The party who sells an [option](#option): they receive the [premium](#premium) and take on the obligation to sell (a [call](#call)) or buy (a [put](#put)) at the strike if the holder exercises. In the *Options* chapter a writer supplies the whole of that obligation to the program before the option can be sold. Compare [holder](#holder).

### zero-copy

Reading and writing an account's bytes in place instead of deserializing the whole account on every instruction. How programs afford large accounts like a 180 KB order book.

[^confirmed]: A third state, `confirmed`, was available under the older Tower BFT mechanism that was replaced with Alpenglow: a block a supermajority of stake had voted for, which the network still permitted to lose. Alpenglow's first round of votes finalizes the block, so `confirmed` now means the same as `finalized`.
