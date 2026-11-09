# Glossary

### account

Some data with an [address](#address). In a program, the data is a Rust struct. Wallets, token balances, program code, and everything a program stores are all accounts. Each also has a lamport balance and an owner program that may change it.

### accumulation factor

See [borrow accumulation factor](#borrow-accumulation-factor).

### address

The 32-byte identifier of an account, usually shown base58-encoded. An address is one of three kinds:

- a public key, which has a matching private key
- a [PDA](#pda-program-derived-address), derived from seeds, which has no private key
- a [built-in address](#built-in-address), chosen rather than computed, which has no private key either

### adverse selection

The loss a market maker takes when a trader who knows the price has moved fills the quote before it is updated. See [informed flow](#informed-flow) and the *Prop AMM* chapter.

### aggregator

See [swap router](#swap-router).

### all-or-nothing

A fundraising rule: contributions are kept only if the raise reaches its full target by the deadline. Otherwise every contributor is refunded in full. The *Fundraiser* chapter builds it onchain.

### Alpenglow

Solana's consensus mechanism, which replaced Tower BFT. Under it the [commitment levels](#commitment-level) a client asks for are `processed` and `finalized`. See the *Operating Financial Software* chapter.

### American option / European option

An American option's holder may exercise it at any time before its expiry. A European option's holder may exercise it only at expiry. The *Options* chapter builds the American kind.

### AMM (automated market maker)

A venue that fills each trade at once against tokens the venue holds, not against resting orders. A formula or an oracle sets the price. The *Constant-Product AMM* chapter builds the kind that prices from a formula over its two [reserves](#reserve). The *Prop AMM* chapter builds the kind that prices from an oracle. See [constant-product AMM](#constant-product-amm) and [proprietary AMM](#proprietary-amm-prop-amm).

### Anchor

A framework for writing Solana programs in Rust. A program declares the checks each account must pass as constraints. Anchor generates the code that runs those checks, and also the [discriminator](#discriminator) and the [IDL](#idl). The companion repository ships the program behind each program chapter in Anchor 1, Anchor 2, and Quasar versions. See the *Adversary* chapter for the checks.

### arbitrage

Buying an asset where its price is lower and selling it where its price is higher, until the two prices meet. See the *Constant-Product AMM* and *Prop AMM* chapters.

### ask

An order to sell at or above a stated price. The seller's side of an [order book](#order-book).

### asset

Something of value a participant owns and a program can hold for them, such as USDC or a stock like NVDAx or TSLAx. Assets on Solana are represented as [tokens](#token). The book says "assets" where no single token is meant, as in "every participant must be able to get their assets out of every state". See [RWA](#rwa-real-world-asset).

### associated token account (ATA)

The standard token account for one wallet and one mint. Anyone can derive its address from three seeds: the owner's address, the token program that manages the mint, and the mint.

### AUM (assets under management)

The total value a pool or fund controls, marked to market. On a perpetual futures venue it is the LPs' liquidity minus traders' unrealized profit, or plus their unrealized loss. See the *Perpetual Futures* chapter.

### authority

The address whose signature a particular action requires. A program records the authority in an account, and the handler checks that the transaction carries its signature before acting. A mint authority may create supply, a freeze authority may freeze token accounts, an upgrade authority may replace a program's code, and a market authority may withdraw fees.

### auto-deleveraging (ADL)

A perpetual futures venue's last resort when a loss is larger than the collateral behind it and no insurance fund can cover the rest. The venue closes the most profitable leveraged positions on the winning side at the current price, pays them out early, and retires their exposure. The *Perpetual Futures* chapter's program uses a [haircut](#haircut) instead.

### base

See [base token](#base-token).

### base token

The thing a market buys and sells (NVDAx), and the unit a **base amount** is denominated in: five NVDAx is a base amount. It is the first token of a [pair](#pair) written base/quote. It is the unit being priced, not the unit of the price: a price on NVDAx/USDC is how many USDC, the [quote token](#quote-token), buy one NVDAx.

### basis point (bps)

One hundredth of one percent. 10,000 basis points is 100%. A 25 bps fee is 0.25%.

### bid

An order to buy at or below a stated price. The buyer's side of an order book.

### block

A batch of transactions that one [leader](#leader) produces for its [slot](#slot). Each block is built on the block before it, called its parent.

### borrow accumulation factor

One number per reserve that starts at 1.0 and only grows. It grows by the borrow rate over the seconds elapsed, which approximates compounding. A borrower's live debt is their stored principal multiplied by the factor, so interest accrues for everyone without the program updating any loan. The lending example calls the field `borrow_accumulation_factor`. See the *Lending and Borrowing* chapter.

### built-in address

An address chosen rather than computed. The System Program, the sysvars, and the few other programs built into the validator each sit at a fixed byte string that the runtime treats as that thing. It is not a [public key](#address) somebody holds the private key for, and it is not a [PDA](#pda-program-derived-address) derived from seeds, so a program uses it as a constant to compare against.

### bump

The extra byte found while deriving a PDA that pushes the result off the ed25519 curve. Programs store the bump at creation so later calls can rebuild the address without searching for the bump again.

### call

An [option](#option) giving its holder the right to buy the underlying at the [strike](#strike). Its writer's obligation is to sell. See [covered call](#covered-call).

### cash settlement

Settling a derivative by paying the difference between the market price and the contract's price. The payment is in the quote token, USDC in this book, and the underlying never changes hands. Compare [physical settlement](#physical-settlement).

### cash-secured put

A [put](#put) whose writer has supplied enough of the quote token, USDC here, to buy every share at the strike price. The program holds it as collateral, so the writer cannot fail to pay if the holder exercises. The *Options* chapter's puts are all cash-secured.

### ceil (ceiling)

Rounding up to the next whole [minor unit](#minor-unit). The lending market rounds a borrower's debt up, and this book's programs round up every fee a user pays, so neither rounds down into a shortfall the program absorbs. A split of a fee already collected may round down, as the perpetual futures venue's insurance-fund cut does, because either direction keeps the whole fee with the program. The opposite of [floor](#floor). See [rounding](#rounding).

### checked arithmetic

Arithmetic that reports failure instead of producing a wrong answer. Rust's `checked_add`, `checked_sub`, `checked_mul` return nothing when the result will not fit, so the handler can fail with a named error. The alternative is [wrapping](#wrapping).

### close factor

In a lending market, the fraction of a debt one liquidation may repay (typically 50%). See the *Lending and Borrowing* chapter.

### cluster

One running instance of Solana: the same software, with its own separate set of accounts.

- **Mainnet** holds real value.
- **Devnet** runs the same software as mainnet, with free, valueless tokens, for building and testing.
- **Localnet** runs on your own machine.
- **Testnet** is where the Solana software itself is tested.

An account exists on one cluster, not all of them. Each is reached at an [RPC endpoint](#rpc-endpoint).

### collateral

Assets a borrower pledges to secure a loan. They can be seized if the borrower defaults or the loan crosses the liquidation threshold.

### commitment level

How sure the chain is of the transaction:

- `processed`: a leader executed the transaction and put it in a block, which can still vanish.
- `finalized`: the validators have voted the block final, and no fork can replace it.[^confirmed]

See the *Operating Financial Software* chapter.

### compute unit

The metered unit of onchain execution. Every transaction runs against a compute budget.

### confidence interval

An oracle's own statement of its uncertainty: a price of $250 ± $8 is a different fact than $250 ± $0.10.

### confused deputy

A program with authority that an attacker tricks into using it for someone else, usually by passing a different account from the one the program expects. Checking each account's signer, owner, [stored address](#stored-address-check), and PDA derivation stops it. See the *Adversary* chapter.

### constant-product AMM

An [AMM](#amm-automated-market-maker) that prices each trade so the product of its two [reserves](#reserve), [K](#k), stays the same while the trade is priced: output = taxed_input × other_reserve ÷ (this_reserve + taxed_input). See the *Constant-Product AMM* chapter.

### counterparty

The party on the other side of your trade, and the one who owes you when you win. On an [order book](#order-book) the counterparty is another trader. In this book's pooled venues the program's pool is the counterparty to everyone at once. See the *Perpetual Futures* chapter.

### covered

See [covered call](#covered-call).

### covered call

A [call](#call) whose writer has supplied the underlying asset to the program as collateral. The program already holds the shares the holder might buy, so the writer cannot fail to deliver them. The *Options* chapter's calls are all covered.

### CPI (cross-program invocation)

One program calling another onchain, such as any program calling the token program to move tokens.

### crank

A permissionless instruction handler that does maintenance work nobody owns, such as accruing a lending reserve's interest or refreshing a borrower's collateral value. Anyone can call it. Each client can call it in its own transaction before its own instruction, as the lending market's clients do, or a bot can call it on a schedule. See the *Lending and Borrowing* chapter.

### critbit tree

A binary tree keyed on the first bit where entries differ. Used for order books. See the *Order Book Exchange* chapter.

### crypto

The industry built on blockchains such as Solana. It is not an asset class. The assets traded on it are stocks such as NVDAx, commodities such as gold, derivatives such as the perpetual futures in this book, and native tokens such as SOL, each held onchain as a [token](#token).

### curator

In a fund, the authority that decides which assets the fund may hold at all and which price feed prices each one. It is kept separate from the [manager](#manager), who picks the allocation. See the *Managed Fund* chapter.

### custody

Holding assets that belong to someone else. A program takes custody when tokens sit in a [vault](#vault) whose authority is its PDA.

### decimals

The number of decimal places in one major unit of a token, declared on the mint. USDC has 6, so a dollar is 1,000,000 [minor units](#minor-unit). SOL has 9.

### deficit

On a perpetual futures venue, the loss beyond a liquidated position's collateral. The *Perpetual Futures* chapter's program pays it from the insurance fund first, and from the LPs' liquidity only after the fund is empty.

### degenerate value

A value at which a formula or a check stops meaning what it usually means, almost always zero or empty. An AMM reserve of zero lets the [K](#k) check pass without testing anything (the *Constant-Product AMM* chapter). A price of zero or below means a broken price feed (the *Offchain Truth* chapter). `make_offer()` refuses an escrow offer with nothing on one side, with `ZeroAmount`. See [invariant](#invariant).

### delegate

An address a token account's owner has approved to move that account's tokens, up to the amount approved. See [permanent delegate](#permanent-delegate) and the *Tokens* chapter.

### discriminator

The 8 bytes Anchor writes at the start of an account's data to identify its type, so nobody can pass a program one kind of account where another belongs.

### drain

To empty an account by an attack. The attacker takes a vault, a pool, or a user's balance through a flaw in the program, not along a path its code intended. This book uses the word only for an attack. A handler that legitimately moves a vault's whole balance out on its way to closing it "empties" the vault or "pays it out". See the *Adversary* chapter.

### dust

The remainder that integer division leaves: a fraction smaller than one [minor unit](#minor-unit). Who owns it is a [rounding](#rounding) decision. See the *Arithmetic of Money* chapter. Also, loosely, an amount too small to matter: a contribution under one major unit, or a first deposit of a few minor units.

### epoch

A period of 432,000 slots, a day at the 200-millisecond target. The schedule of [leaders](#leader) is drawn for each epoch, and some changes to the network, such as a new slot length, take effect only when a new epoch begins.

### equity (position)

What a leveraged position is worth to its owner right now: collateral plus unrealized profit and loss, minus funding owed. Equity at or below the maintenance margin makes the position liquidatable.

### escrow

A neutral holder of funds that releases them only when agreed conditions are met. The first program in this book.

### eviction

What an order book does when a side is full and a better order arrives. It removes the worst resting order on that side, the lowest bid or the highest ask, and refunds it to make room. See the *Order Book Exchange* chapter.

### exercise

To use the right an [option](#option) grants: buy the underlying at the strike (a [call](#call)) or sell it there (a [put](#put)). In the *Options* chapter the holder may exercise while the clock is before `expiry`, and not at or after it.

### expiry

The moment an [option](#option)'s right ends: the holder may exercise before it, and not at or after it. From then on the writer reclaims whatever collateral was not taken.

### exponentiation by squaring

Computing (1 + r)ⁿ, a per-second rate r compounded over n seconds, in log₂(n) multiplications instead of n of them. A program can then compound a rate over any number of elapsed seconds in a single update. Each multiplication is checked and rounded up, so the result is never below the exact power. See [Newton's method (integer square root)](#newtons-method-integer-square-root) for roots, and the *Arithmetic of Money* chapter.

### faucet

A service that gives away free devnet tokens. The *Core Building Blocks of Solana* chapter names two.

### feature

A change to the network that is built into the validator software but switched off, then turned on across the network at the start of an [epoch](#epoch).

### finality

The point after which no fork can replace a block, and the transactions in it are the record. Solana reaches it when its validators have voted the block final. The network's consensus sets how long that takes, and the time changes when the consensus does. See [commitment level](#commitment-level).

### fixed point

Representing fractions as scaled integers: 1.05 stored as 1,050,000,000,000,000,000 at 10^18 scale. Onchain programs do fractional math this way, without floats. See [wad](#wad).

### flash loan

A loan borrowed and repaid inside a single transaction. It is possible only because transactions are atomic: if the repayment fails, the borrow never happened.

### floor

Rounding down to the whole [minor unit](#minor-unit) below. Programs round down anything they pay out, so withdrawals, winnings, and swap outputs never pay a fraction the program does not hold. The opposite of [ceil](#ceil-ceiling). See [rounding](#rounding) and [dust](#dust).

### fork

One of two competing chains, formed when validators briefly build on different blocks. The network settles on one, and a program only ever runs on one. A transaction in a block on the losing fork vanishes, which is what the [commitment levels](#commitment-level) describe.

### freshness window

The oldest a price may be before a program refuses it. Each program that reads the [price feed](#price-feed) sets the window, counted in the unit the price feed stamped, slots or seconds. A price older than the window is **stale**. See the *Time* chapter.

### funding rate

The periodic payment on a perpetual futures venue: the heavier side pays it and the lighter side receives it. On most venues the two sides pay each other and the payment keeps the perpetual's price close to the asset it tracks. In the *Perpetual Futures* chapter's program the pool stands between them: the heavier side pays the pool, the pool pays the lighter side at the same rate, and the difference pays the pool for carrying the net exposure.

### haircut

On a perpetual futures pool, the fraction of a winner's profit the pool pays when it cannot pay every winner in full. The fraction is what the pool holds to pay profits, divided by what traders are owed, capped at 1. Every winner who closes is paid the same fraction, so no early closer is paid in full while the rest go unpaid. See the *Perpetual Futures* chapter.

### half-up

Rounding to the nearest whole unit with exact halves going up, which is what Rust's `round` does. This book never uses it on amounts. See [rounding](#rounding).

### halt

A stop in block production. A halt comes from a fault such as a bug in the validator software, and ends when the validators restart the chain together. During a halt slots do not advance but wall-clock time does, so the two clocks no longer agree. The *Time* chapter covers what that does to accrual, freshness windows, and deadlines, and how the `LastRestartSlot` sysvar lets a program detect that a halt happened.

### health

How far a borrower is from liquidation: the value of their collateral, scaled by each asset's liquidation threshold, compared with the value of their debt. Past the boundary, the position may be liquidated. See the *Lending and Borrowing* chapter.

### holder

The party who owns an [option](#option) and may [exercise](#exercise) it. A holder's loss is capped at the [premium](#premium) they paid. Compare [writer](#writer).

### IDL

A program's interface definition: the file Anchor generates listing every [instruction handler](#instruction-handler) and the accounts each one takes. Clients build instructions from it and monitors decode them with it. See the *Operating Financial Software* chapter.

### impermanent loss

The gap between an LP position's value and what the tokens would be worth if the LP had held them. The pool causes it by mechanically selling the token whose price is rising. The LP realizes it only at withdrawal. See the *Constant-Product AMM* chapter.

### in the money / out of the money

An option worth exercising is **in the money**: a call whose underlying trades above the [strike](#strike), or a put whose underlying trades below it. One that is not is **out of the money**. See the *Options* chapter.

### index

The word used in lending for a stored number that accumulates over time. Every claim on a pool is a multiple of it. Save's cumulative borrow rate is one. This book calls the lending market's index the [borrow accumulation factor](#borrow-accumulation-factor), and the perpetual futures venue's `cumulative_funding` is another. That one rises while longs are heavier and falls while shorts are. A position's funding owed is its size times the change in that index since the position opened.

### inflation attack

An exploit of an empty pool. The attacker makes a dust-sized first deposit, then donates straight into the vault. That inflates the value behind each early share, so later depositors' shares round to nothing. See the *Adversary* chapter.

### informed flow

Trades from someone who knows where the price is about to move, such as an arbitrage bot that has seen the price change on another venue before a market maker's quote has caught up. "Informed" says nothing about how experienced the trader is. Its opposite is uninformed flow: people who trade because they want the asset. The *Prop AMM* chapter covers it with [adverse selection](#adverse-selection) and [segmenting flow](#segmenting-flow).

### initial margin

The minimum collateral a leveraged position needs to open, usually stated in basis points of its notional. It sets the maximum leverage: a 10% initial margin is 10x. It sits above the [maintenance margin](#maintenance-margin), so a new position has room to move before it can be liquidated. See the *Perpetual Futures* chapter.

### instruction

The input a transaction carries to a program: which handler to run, which accounts it may touch, and the arguments. It is not the function that processes it. See [instruction handler](#instruction-handler).

### instruction handler

The onchain function that processes an instruction. This book always says "instruction handler" for the function and "instruction" for its input. Most other material uses one word for both, and Anchor's generated interface file lists a program's functions under `instructions`. Read those as instruction handlers.

### insurance fund

Capital a venue sets aside, usually from a share of its fees, to absorb losses larger than the collateral behind them before those losses reach the liquidity providers. What the fund cannot cover is taken from the liquidity providers, then from winners by a [haircut](#haircut) or [auto-deleveraging](#auto-deleveraging-adl). See the *Perpetual Futures* chapter.

### invariant

A condition that must hold before and after every state change: a pool's [K](#k) must not decrease across a swap, the vault covers what the book owes, total in equals total out. An **invariant test** asserts one after every state change, at whatever values the test chooses, and a model checker checks one against every possible value. See the *Arithmetic of Money* chapter, and the *Operating Financial Software* chapter for invariant tests.

### inventory

The tokens a [market maker](#market-maker) holds and quotes against. A prop AMM prices from an oracle and fills from its inventory, not from a pricing curve. See the *Prop AMM* chapter.

### junior

See [senior / junior](#senior--junior).

### K

The product of an AMM pool's two reserves. It stays constant while a trade is priced, grows with deposits and fees, and shrinks with withdrawals.

### key pair

Two mathematically linked keys: a private key, kept secret, that signs messages, and a public key, shared freely, that proves who signed.

### kink

The bend in a lending reserve's interest rate curve, in this book at 80% [utilization](#utilization). Below it the borrow rate rises slowly, and above it steeply. See the *Lending and Borrowing* chapter.

### lamport

The minor unit of SOL: one billionth. Named for Leslie Lamport.

### leader

The [validator](#validator) assigned to produce the [block](#block) for a [slot](#slot). The schedule of leaders is drawn before each [epoch](#epoch), with each validator's share of slots in proportion to its stake. A leader chooses which transactions go in its block and in what order, and writes the time the next block reads as its [Unix timestamp](#unix-timestamp).

### lending market

A venue that pools lending and borrowing: suppliers earn interest, borrowers pay it against collateral, and liquidation keeps the market solvent.

### leverage

Controlling more exposure than the collateral posted: a 5,000 USDC position over 1,000 USDC of collateral is 5x leverage. Leverage multiplies both the gain and the loss of every price move. The maximum leverage a venue allows is one over its [initial margin](#initial-margin).

### limit order

An order with a price limit: it buys at or below that price, or sells at or above it.

### liquidation

Forcibly reducing or closing a loan or position whose collateral no longer covers it safely. Whoever does it is paid for the work. In the *Lending and Borrowing* chapter the liquidator repays part of an unhealthy loan and takes some of its collateral at a [bonus](#liquidation-bonus), and the [close factor](#close-factor) caps how much one call repays. In the *Perpetual Futures* chapter the liquidator closes the whole position once its equity is at or below the [maintenance margin](#maintenance-margin), and is paid a fee from that equity.

### liquidation bonus

The discount a liquidator receives on the collateral they seize, which pays them for repaying an unhealthy loan. The *Lending and Borrowing* chapter's market sets it at 5% per reserve.

### liquidation threshold

The debt-to-collateral ratio at which a position becomes liquidatable. It is never below the loan-to-value ratio.

### liquidity provider (LP)

Someone who deposits assets into a pool for traders to trade against, earning the pool's fees on an AMM, or the traders' net losses and funding on the perpetual futures venue.

### loader

The Solana program invoked when someone deploys a program. It writes the new program's compiled code into accounts of its own. See the *Core Building Blocks of Solana* chapter.

### loan-to-value (LTV)

The fraction of collateral value that may be borrowed against it, for example 75%.

### long / short

The two directions a position can face: a long profits when the price rises, a short when it falls. On a perpetual futures venue the side is one of the position account's PDA seeds, so a trader holds at most one long and one short per market. The heavier side pays the [funding rate](#funding-rate) and the lighter side receives it.

### lot

The unit of quantity on an order book market, which cannot be split. Prices and quantities are stated in lots rather than raw minor units. See the *Order Book Exchange* chapter.

### LP token

The receipt token minted to a liquidity provider, representing a proportional claim on a pool's reserves and accrued fees.

### maintenance margin

The minimum equity a leveraged position must keep, usually stated in basis points of its notional. At or below it, anyone may liquidate the position. It is lower than the [initial margin](#initial-margin) needed to open the position. See the *Perpetual Futures* chapter.

### major unit

The unit of an asset that people count in: the dollar, the SOL, the whole share. Contrast [minor unit](#minor-unit).

### maker / taker

The maker creates an offer, an order, or a raise and sets its terms. The taker accepts those terms as they stand. In the *Escrow* chapter the maker opens an offer and the taker fills it whole. The *Fundraiser* chapter's maker opens a raise and has no taker. On an [order book](#order-book) the maker posted the resting order and the taker crossed the spread to hit it. Fills execute at the maker's posted price, and fee schedules usually distinguish the two roles.

### managed fund

The onchain equivalent of a mutual fund: pooled deposits, a mandate fixing which assets may be held, a [manager](#manager) who sets the allocation, and shares priced against [NAV](#nav-net-asset-value). Some Solana platforms call it a "vault", which in this book is only ever the token account the deposits sit in (see [vault](#vault)). See the *Managed Fund* chapter.

### manager

In a fund, the authority that sets the allocation and earns the management fee. No instruction handler pays a vault's tokens to the manager. The manager gets only what their fee shares redeem through `withdraw()`, the same as any holder's shares. See [curator](#curator) and the *Managed Fund* chapter.

### mantissa

The digits of a price stated separately from its exponent: a price feed holding mantissa 25,000,000 at exponent −5 means $250. The *Lending and Borrowing* chapter's price feed account stores one as `price_mantissa`.

### margin

Collateral posted against an obligation or a leveraged position. Traditional options venues let a writer post only a fraction of the obligation as margin. The *Options* chapter's writers post all of it. For the perpetual futures sense, see [initial margin](#initial-margin) and [maintenance margin](#maintenance-margin).

### mark to market

Valuing a position or pool at current prices rather than at the prices it was entered at.

### market maker

A party that quotes both a buy and a sell price and earns the spread between them. On an order book, makers rest orders. In a prop AMM, one firm is the standing maker for the whole venue.

### Memo Program

The program at a well-known address whose one job is writing a note into the transaction log.

### MEV

Maximal extractable value: profit taken by controlling transaction ordering, most visibly by sandwiching a pending trade. See the *Adversary* chapter.

### minor unit

The smallest unit of an asset, and the integer that programs calculate in: the cent, the lamport, the 10^-6 USDC.

### mint (account)

The onchain account that defines a type of token: its supply, decimals, and authorities. A mint is a token's factory, not a token itself, and holds no balance of anything. Balances live in [token accounts](#token-account). Economic prose names the token ("Alice pays 25 USDC"). "Mint" names the account, and is what an instruction is passed.

### model checking

Handing a function to a model checker like Kani, which tries every possible value of the function's inputs and either reports that an invariant holds for all of them or returns the values that break it. See the *Operating Financial Software* chapter.

### multisig

A program that records a set of owners and how many of them must approve, and signs only once enough have. It is used wherever one person holding a private key is too much trust: a mint authority, a market authority, a program's upgrade authority.

### NAV (net asset value)

The total current value of everything a fund holds, computed from fresh prices. Share price is NAV divided by share supply.

### Newton's method (integer square root)

The iterative algorithm programs use to take a square root using only integers. It converges within seventy loop iterations for any product of two u64s. AMMs use it to mint initial LP tokens as the square root of the two reserves' product. See the *Arithmetic of Money* chapter.

### NFT (non-fungible token)

A token that stands for one unique thing, such as a ticket to a particular seat, a deed to a property, or a work of art. Its mint has 0 decimals, so it cannot be split into fractions, and a supply of one, so it is unique. Nobody can mint another. Each NFT has its own mint. See the *Tokens* chapter.

### notional

The face value of a position, as opposed to the margin posted against it. Five NVDAx at $200 is $1,000 notional whatever the collateral behind it.

### obligation

A borrower's loan file in a lending market: their collateral deposits, their borrows, and the cached valuations health checks run against.

### offchain

Outside the blockchain: a bank balance, a match result, a price on an exchange. An offchain fact reaches a program signed by someone the program trusts. The opposite is [onchain](#onchain). See the *Offchain Truth* chapter.

### onchain

Stored or executed on the blockchain itself: an account's data, a program's code, a transaction's effects. The opposite is [offchain](#offchain). Spelled as one word, like "online".

### open interest

The total notional of positions currently open on a market, usually tracked per side.

### open source

Software released under a license that meets the [Open Source Definition](https://opensource.org/osd), which requires, among other things, that anyone may read, modify and redistribute the source code. Publishing the source is not enough on its own: code whose license forbids modifying or redistributing it is not open source.

### option

The right, but not the obligation, to buy ([call](#call)) or sell ([put](#put)) an asset at a fixed price (the [strike](#strike)) before a fixed date (the [expiry](#expiry)), bought from a [writer](#writer) for a [premium](#premium). The *Options* chapter builds a venue for them.

### oracle

A service that publishes signed statements of offchain facts, most often prices, onchain. See the *Offchain Truth* chapter.

### order book

The resting [bids](#bid) and [asks](#ask) for one market, best prices first, plus the matching engine that pairs them under [price-time priority](#price-time-priority). The traditional venue design, the one NYSE, NASDAQ and CME run. See the *Order Book Exchange* chapter.

### pair

Two tokens a market trades against each other, written base/quote with the [base token](#base-token) first and the [quote token](#quote-token) second: NVDAx/USDC. The notation comes from FX, where EUR/USD is the price of one euro in dollars, and it reads the same way here: the price of NVDAx/USDC is how many USDC one NVDAx costs.

### parimutuel

A betting structure with no bookmaker: all stakes pool together, and winners split the losers' pool in proportion to their stakes. See the *Betting Market* chapter.

### PDA (program derived address)

An address computed from a program's ID and chosen seeds. A PDA is not a public key, so it has no private key, and no signature for it can ever exist. Only the deriving program can "sign" as it, by presenting the seeds for the runtime to recheck.

### permanent delegate

A Token Extensions mint feature that names an authority able to move any holder's tokens of that mint. Some regulated assets require this power to seize tokens. See the *Tokens* chapter.

### perpetual future

A contract paying the price movement of an asset, long or short, with leverage and no expiry date. A [funding rate](#funding-rate) charges whichever side is heavier. The *Perpetual Futures* chapter builds one.

### phantom overflow

An overflow in the middle of a calculation whose final answer would have fit: `price * quantity` is too big for a u64 before the division brings it back down. See the *Arithmetic of Money* chapter.

### physical settlement

Settling a derivative by moving the asset itself, so no price is computed and no oracle is read. The name is older than blockchains, and nothing about it happens offchain: the underlying token itself changes hands at the strike. The *Options* chapter's venue settles physically. Compare [cash settlement](#cash-settlement).

### PnL (profit and loss)

What a position has gained or lost. While the position is open the figure is **unrealized PnL**, marked to market against the current price; closing the position realizes it. On the book's perpetual futures venue, PnL is size × price change ÷ entry price.

### premium

What the buyer of an [option](#option) pays its [writer](#writer) for the right, once, up front. The writer keeps it, less the venue's fee, whatever happens afterwards. It is the most the [holder](#holder) can lose.

### price feed

An account that a publisher keeps updated with a price and the time it published it, read by programs that value assets. See the *Time* chapter for how fresh a price must be, and the *Offchain Truth* chapter for whether its source can be trusted. Contrast [oracle](#oracle), the service that publishes it.

### price impact

How far your own trade moves the price it is executing against. A trade on a constant-product pool moves along the curve as it fills, so the average price paid is worse than the price quoted before it started. The pool's [spot price](#spot-price) afterwards is where the next trade begins. Contrast [slippage](#slippage), which also covers the market moving before your trade executes.

### price-time priority

The order-matching fairness rule: better-priced orders fill first, and among equal prices, earlier orders fill first.

### principal

The amount lent or borrowed, before any interest. A lending program stores each loan's principal divided by the [borrow accumulation factor](#borrow-accumulation-factor) at the time of borrowing, and computes the live debt by multiplying it by the current factor.

### priority fee

An extra fee per [compute unit](#compute-unit) that a transaction may add to be processed sooner, paid on every unit the transaction requests. See the *Core Building Blocks of Solana* chapter.

### profit warm-up

On a perpetual futures pool, the number of slots a position must be open before its profit can be taken. A trader who pushes the oracle to a false price cannot open a position and take the profit before the price has had that long to correct. Losses are not delayed. See the *Perpetual Futures* chapter.

### program

Executable code deployed onchain, which is what this book builds. Called a "smart contract" on other chains.

### program ID

A program's address. Instructions are addressed to that account.

### proof of personhood

Evidence, issued by a service outside the program, that a participant is a unique human rather than one of many wallets held by the same person. A program that requires it can defend against a [Sybil attack](#sybil-attack). The *Fundraiser* chapter explains where it fits.

### proprietary AMM (prop AMM)

An automated market maker funded entirely by its operator's own capital and priced from an oracle plus a spread, with no liquidity providers, no pool shares, and no pricing curve. Among the highest-volume venue types on Solana. The *Prop AMM* chapter names the firms and builds one.

### protective put

A [put](#put) bought by someone who already holds the underlying, as insurance against its price falling below the [strike](#strike).

### put

An [option](#option) giving its holder the right to sell the underlying at the [strike](#strike). Its writer's obligation is to buy; see [cash-secured put](#cash-secured-put).

### Pyth

A [price feed](#price-feed) network that aggregates many independent publishers into one signed price with a [confidence interval](#confidence-interval). **Pyth Core** updates are signed by a multisig of five private keys Pyth holds, and anyone can post one to Solana for the [Pyth Receiver program](#pyth-receiver-program) to verify. **Pyth Pro**, the paid low-latency product, signs each price with a single private key, and the client carries the signed message into its own transaction. See the *Offchain Truth* chapter.

### Pyth Receiver program

The program that verifies a Pyth Core update's signatures and writes a `PriceUpdateV2` account it owns, which other programs read. See the *Offchain Truth* chapter.

### quote

See [quote token](#quote-token).

### quote token

The thing a market states its prices in (USDC), and the unit a **quote amount** is denominated in: 1,000 USDC is a quote amount. It is the second token of a [pair](#pair) written base/quote, and prices, payments and fees on the pair are stated in it. The quote is usually a USD-backed stablecoin like USDC, so the numbers mean dollars. A base amount times a price is a quote amount.

### rebalance

Trading a fund back toward its target weights after prices have moved it away. See the *Managed Fund* chapter.

### receipt

A per-participant account, usually at a PDA, recording what the program owes one person: a contributor's amount, a bettor's stake. The program writes it for itself, and refunds and claims pay what the receipt records not what a vault holds.

### rent

The deposit an account holds to pay for its own storage. An account funded to the **rent-exempt** minimum stays until it is closed, and an account cannot be created with less today. Closing an account reclaims the deposit.

### reserve

In an AMM, one of the two token balances a pool prices from. In a lending market, the per-asset pool: its liquidity vault, its share mint, its interest state, and its risk configuration.

### reserve factor

The share of the interest borrowers pay that a lending market keeps for its operator. The rest goes to suppliers. The *Lending and Borrowing* chapter's market sets it at 10% on every reserve.

### resting order

A limit order that did not match on arrival and now waits on the book, funded and cancelable.

### rounding

What an integer division does with the remainder it cannot represent. Onchain the program chooses the direction as a policy: [floor](#floor) what the program pays out and [ceil](#ceil-ceiling) what the user owes, so the remainder stays with the program. See [dust](#dust), [half-up](#half-up), and the *Arithmetic of Money* chapter.

### RPC endpoint

The URL an app or wallet sends its transactions to: a server holding a [cluster](#cluster)'s state and relaying transactions into it. The endpoint decides which cluster the code talks to.

### RWA (real-world asset)

A traditional [asset](#asset) represented as a [token](#token) onchain: commodities, equities, real estate, and exotics. The stocks this book's markets trade (NVDAx, TSLAx, SPCXx) are RWAs. "RWA" groups very different things together, so it is usually clearer to name the asset class instead: stocks, Treasury bills, gold.

### sandwich

Wrapping someone's pending trade in two of your own: buy ahead of it to move the price against it, let it fill, then sell behind it. A form of [MEV](#mev). See the *Adversary* chapter.

### saturating

What `saturating_sub` (and its `_add` and `_mul` siblings) does when a result will not fit: it clamps the result to the type's limit and continues. That is right for a price feed's age and for interest that cannot be negative. On a balance it records a wrong number and reports nothing, which the *Arithmetic of Money* chapter calls worse than [wrapping](#wrapping). Compare [checked arithmetic](#checked-arithmetic).

### seed

One of the inputs a program combines with its program ID to derive a [PDA](#pda-program-derived-address). The seeds work like the lookup key of a database's key/value store, which is a different thing from a private or public key. The PDA is the address that lookup leads to. See the *PDAs* chapter.

### segmenting flow

A market maker quoting different spreads to different flow: tighter for flow it believes is uninformed, wider or none for flow it believes is [informed](#informed-flow). The *Prop AMM* chapter covers it as a defense against adverse selection.

### self-liquidation

A borrower liquidating their own obligation. The *Lending and Borrowing* chapter's market allows it while the obligation is unhealthy (`owner_can_liquidate_their_own_obligation`).

### senior / junior

The order in which claims on a pool are paid. On the *Perpetual Futures* chapter's venue a trader's collateral is **senior**: it comes back, less losses and fees. Their profit is **junior**: it is paid only as far as the pool holds the tokens to pay it. See [haircut](#haircut).

### settlement

Paying out what a contract finally owes, and closing it. A betting market settles when the admin records the winning outcome and the losing pool is divided among the winners. A position settles when it closes and its [PnL](#pnl-profit-and-loss) becomes real balances.

### share

A token representing proportional ownership of a pool: of a lending reserve, of a fund's holdings, of anything with a NAV. The program mints shares on deposit, burns them on withdrawal, and prices them by dividing the pool by the supply.

### signer

An address that signed the transaction: a public key whose private key produced a signature, or a [PDA](#pda-program-derived-address) its program signed for by presenting the seeds.

### size ladder

A prop AMM's quote as a set of tiers, each a size at a spread, so the unit price rises with the size taken. The *Prop AMM* chapter contrasts it with the single flat quote its program makes.

### slippage

The difference between the price you expected and the price you got, caused by your own trade's impact or by the market moving first.

### slot

Solana's unit of block production: a window in which one [leader](#leader) may produce a [block](#block). The network sets a target length, 200 milliseconds at the time of writing, and has shortened it before, so a slot count converts to seconds only at the slot length in force. A slot whose block does not arrive in time is skipped: the count moves on and that slot has no block.

### SOL

Solana's **native token**: the asset the network understands without any token program, used to pay transaction fees and to fund the rent deposit on every account. Denominated in [lamports](#lamport), a billionth of a SOL each. Every other token is an [SPL token](#spl-token).

### Solana

A public blockchain: a network of validators that run programs and keep a shared record of every account. Programs on it hold and move [tokens](#token), and a transaction costs a fraction of a cent whatever it moves. Solana is not an asset: its native token, [SOL](#sol), is the asset. Nor is Solana an organization. Many organizations work on Solana.

### SPL token

Any token other than [SOL](#sol): one defined by a token program rather than by the network itself. The name comes from the Solana Program Library the original token program shipped in. Most people just say "token", and so does this book.

### spot price

The price a pool quotes for a trade too small to move it: the ratio of its two reserves.

### spread

The gap between the best bid and the best ask. On an order book it comes from the resting orders. A market maker **charges a spread** when it quotes its own prices around the one it takes as fair, and a prop AMM's spread is its entire fee. The *Prop AMM* chapter's `spread_bps` is a half-spread: the ask is the oracle price plus it, and the bid is the oracle price minus it.

### stablecoin

A token designed to hold a fixed value, usually one dollar. The quote asset of nearly every market in this book.

### state compression

A technique for storing bulk data offchain with onchain proofs, used for things like very large NFT collections.

### state machine

A set of states and the handlers that move an account between them, such as an offer that is open and then taken or canceled. Every financial program in this book is one, and every participant must be able to get their assets out of every state. See the *State Machines* chapter.

### stored-address check

Checking that an account a handler receives is the one recorded when the relationship was created, such as the vault recorded on a market or the maker recorded on an offer. See the *Adversary* chapter.

### strike

The price at which the [underlying](#underlying) changes hands if the holder [exercises](#exercise): what a [call](#call)'s holder pays per share, or a [put](#put)'s holder receives.

### swap router

A program that takes a swap and fills it across one or more trading venues (AMMs, order books, prop AMMs), choosing the route that returns the most. Also called an aggregator. Jupiter is a swap router on Solana. A program that trades on its users' behalf calls a router rather than a single venue. The *Managed Fund* chapter's fund does, and the companion repository ships a mock router in Jupiter's place.

### Sybil attack

One person acting as many participants by creating many wallets, to get past a limit meant to apply per person, such as a cap on what each contributor may give. A program sees only public keys, so it needs [proof of personhood](#proof-of-personhood) from outside to stop one. The *Fundraiser* chapter explains why counting wallets cannot show how many people took part.

### System Program

The program at the [built-in address](#built-in-address) `11111111111111111111111111111111` that creates accounts and transfers SOL. Every wallet account is owned by it, and every account any program creates is created through it.

### sysvar

A system account that the runtime keeps up to date and any program can read: the Clock sysvar carries the slot and timestamp.

### tick size

The minimum price increment of a market. Prices must land on a multiple of it.

### token

A unit of an [asset](#asset) on Solana. [SOL](#sol) is Solana's **native token**, used to pay transaction fees, and every account holds it directly as [lamports](#lamport). All other tokens, such as USDC and NVDAx, are [SPL tokens](#spl-token): each type is defined by a [mint](#mint-account), and a wallet's balance of it is held in a [token account](#token-account). Two tokens from the same mint are the same asset. Tokens from different mints are different assets, whatever their names and symbols say. Amounts are integers in [minor units](#minor-unit).

### token account

The account holding a wallet's balance of one specific token. The token program owns it, and its recorded authority controls it.

### Token Extensions Program / Classic Token Program

Solana's two token programs. The Classic Token Program is the original. The Token Extensions Program adds per-mint features (transfer fees, transfer hooks, confidential transfers, and others).

### transaction

A signed bundle of instructions that executes atomically: all of it lands or none of it does. See [flash loan](#flash-loan).

### TWAP

A time-weighted average price: the average of a market's price over a window, used instead of the current price so that a manipulator must hold a false price for the whole window, not for one slot. See the *Adversary* chapter, and the *Perpetual Futures* chapter for a program that keeps its own average of an oracle's price and refuses trades at prices too far from it.

### underlying

The asset an [option](#option) or other derivative is about: what a [call](#call) buys and a [put](#put) sells at the [strike](#strike). It is short for "underlying asset", and every options market uses it as a noun on its own. In the *Options* chapter the underlying is NVDAx and the quote token is USDC.

### underwater

Said of a loan or leveraged position past its liquidation line: an unhealthy lending obligation, or a perpetual position whose equity is at or below the [maintenance margin](#maintenance-margin). See [liquidation](#liquidation).

### Unix timestamp

The wall-clock time in the Clock [sysvar](#sysvar), in whole seconds. The previous block's [leader](#leader) writes it, within a range the network checks against that block's parent, so it is usually within a second or two of real time. One leader chose the value. See the *Time* chapter.

### unsettled balance

An amount an exchange owes a trader, recorded as a counter on the trader's account rather than paid out at each fill. The trader claims it later with `settle_funds()`, which pays out each token's balance in one transfer however many fills built it up. See the *Order Book Exchange* chapter.

### utilization

In a lending reserve, borrowed divided by available plus borrowed. The input to the interest rate curve: high utilization means the pool needs deposits, and rates rise.

### validator

A computer running the Solana software: it executes transactions, votes on blocks, and takes its turn as leader producing them. A block reaches [finality](#finality) when enough stake has voted for it.

### vault

A token account whose authority is a program's PDA, where a program holds funds during its lifecycle. In this book the word always means the token account, never the whole product. The product that works like a fund is a [managed fund](#managed-fund).

### verified build

A program built in a container that produces the same bytes from the same source every time, so anyone can rebuild a commit and check that the result matches the program deployed onchain. See the *Operating Financial Software* chapter.

### wad

A fixed-point convention: values scaled by 10^18, so 1.0 is stored as a 1 followed by eighteen zeros. One of several scales in use; see the *Arithmetic of Money* chapter.

### wallet

A key pair used as an identity for holding and moving assets, with the private key stored safely. On disk, a key pair file is 64 bytes, and whoever holds them is the wallet. **Wallet software** is the tool that holds the private keys, signs transactions with them, and shows the balances they control, whether a phone or desktop app or browser extension.

### wrapping

What a plain `+` or `*` does when the result is too big for the type, in a Rust release build that has not set `overflow-checks`: it starts again from zero, so a `u64` one past the maximum becomes zero. The companion programs do set it, so there a plain `+` fails the transaction instead. Compare [checked arithmetic](#checked-arithmetic).

### writer

The party who creates an [option](#option) and sells the right it carries. In finance terminology, creating an option is called "writing" it. The writer receives the [premium](#premium) and takes on the obligation to sell (a [call](#call)) or buy (a [put](#put)) at the strike if the holder exercises. In the *Options* chapter a writer deposits everything they may have to deliver with the program before the option can be sold. Compare [holder](#holder).

### zero-copy

Reading and writing an account's bytes in place instead of deserializing the whole account on every instruction. Programs use large accounts this way, such as a 180 KB order book.

[^confirmed]: `confirmed` was a third level under Tower BFT, the consensus mechanism Alpenglow replaced. Under Alpenglow, `confirmed` means the same as `finalized`. The *Operating Financial Software* chapter's note gives the source.
