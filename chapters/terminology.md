# Appendix: Terminology

The vocabulary of this book, in one place: Solana's own terms (the [solana.com terminology reference](https://solana.com/docs/references/terminology) is the canonical source for those) alongside the financial vocabulary this field uses daily but rarely defines. Terms are alphabetical. Where a chapter treats a term at length, the definition says so.

**account.** The unit of state on Solana. Everything is an account: wallets, token balances, program code, and every piece of data a program stores. An account has an address, an owner (a program), a lamport balance, and data bytes. Financial state is accounts; this is the first idea in the book.

**address.** The 32-byte identifier of an account, usually shown base58-encoded. Most addresses are public keys; PDAs are addresses without private keys.

**ask.** An order to sell at or above a stated price. The seller's side of an order book.

**associated token account (ATA).** The canonical token account for a given wallet and mint, at an address anyone can derive from the two. ATAs are why a program can know where Alice's USDC lives without asking her.

**authority.** The key or account with the right to perform an action: a mint authority may create supply, a freeze authority may freeze token accounts, a market authority may withdraw fees. Recording the authority and verifying it on the way out is the core of access control in every chapter.

**base token / quote token.** The pair every market trades. The base is the thing bought and sold (NVDAx); the quote is the thing prices are stated in (USDC). You quote in the stable asset so the numbers mean dollars.

**basis point (bps).** One hundredth of one percent; 10,000 basis points is 100%. The universal unit for fees and rates. A 25 bps fee is 0.25%.

**bid.** An order to buy at or below a stated price. The buyer's side of an order book.

**blockhash.** A recent block's hash, included in every transaction to bound its lifetime. When it expires, the transaction can never land.

**bump.** The extra byte found while deriving a PDA that pushes the result off the ed25519 curve. Programs store the bump at creation so later calls can rebuild the address cheaply.

**close factor.** In a lending market, the fraction of a debt one liquidation may repay (typically 50%). Turns liquidation into a correction rather than an execution. See the Lending and Borrowing chapter.

**collateral.** Assets pledged to secure a loan, seizable on default or on breach of the liquidation threshold.

**confidence interval.** An oracle's own statement of its uncertainty: a price of $250 ± $8 is a different fact than $250 ± $0.10. Production programs should reject prices that are fresh but uncertain.

**CPI (cross-program invocation).** One program calling another onchain, such as any program calling the token program to move tokens. CPIs are how programs compose, and the trust boundary where composition gets dangerous.

**crank.** A permissionless instruction handler that performs maintenance work nobody owns (settling funding, processing expiries), designed so anyone, typically a bot on a schedule, can turn the handle.

**critbit tree.** A binary tree keyed on the first bit where entries differ. Used for order books because insertion never shifts other entries and walking it yields price-time priority for free. See the Order Book Exchange chapter.

**cumulative interest index.** A single monotonically growing number per reserve that starts at 1.0 and compounds the interest rate over time. Debts are stored scaled by the index at borrow time, so one multiplication accrues interest for every borrower at once. See the Lending and Borrowing chapter.

**decimals.** The number of minor units in one major unit of a token, declared on the mint. USDC has 6, SOL has 9. Programs must read decimals, never assume them.

**discriminator.** The 8 bytes Anchor writes at the start of an account's data identifying its type, so a program cannot be fed one kind of account where another belongs.

**dust.** Sub-unit remainders left over by integer division. Rounding policy decides who owns it; the correct answer is the program, never whoever transacts most often.

**epoch.** A period of roughly two days (432,000 slots) over which a validator schedule holds. Mostly relevant to staking; application logic usually counts slots.

**escrow.** A neutral holder of funds that releases them only when agreed conditions are met. The first program in this book, and the pattern inside every other one.

**fixed point.** Representing fractions as scaled integers: 1.05 stored as 1,050,000,000,000,000,000 at 10^18 scale. How onchain programs do fractional math without floats. See WAD.

**flash loan.** A loan borrowed and repaid inside a single transaction, possible only because transactions are atomic: if the repayment fails, the borrow never happened.

**funding rate.** The periodic payment between longs and shorts on a perpetual futures market that tethers the perpetual's price to the index price.

**impermanent loss.** The gap between an LP position's value and what simply holding the tokens would be worth, caused by the pool mechanically selling the rising token. Realized only at withdrawal. See the Constant-Product AMM chapter.

**instruction.** The input a transaction carries to a program: which handler to run, which accounts it may touch, and the arguments. Distinct from the function that processes it; see instruction handler.

**instruction handler.** The onchain function that processes an instruction. This book always says "instruction handler" for the function and "instruction" for its input, because tooling that uses one word for both confuses every newcomer.

**invariant.** A property that must hold before and after every state change: K must not decrease, the vault equals what the book owes, total in equals total out. Asserted in code after the math, not just assumed from it.

**K.** The product of an AMM pool's two reserves. Constant within a trade, growing across deposits and fees. Its only job is to hold the two reserves in relation to each other.

**lamport.** The minor unit of SOL: one billionth. Named for Leslie Lamport.

**lending market.** A pooled borrow-lend venue: suppliers earn interest, borrowers pay it against collateral, liquidation keeps it solvent.

**limit order.** An order with a price it refuses to cross: buy at or below, sell at or above.

**liquidation.** Forcibly repaying an unhealthy loan out of its collateral, at a bonus, to keep the market solvent. Bounded by the close factor and priced by the liquidation bonus.

**liquidation threshold.** The debt-to-collateral ratio at which a position becomes liquidatable. Always above the loan-to-value ratio, so there is a buffer between the most you may borrow and the point you can be seized.

**liquidity provider (LP).** Someone who deposits assets into a pool for traders to trade against, earning fees in exchange. An LP is a bet on volume, not on price direction.

**loan-to-value (LTV).** The fraction of collateral value that may be borrowed against it, e.g. 75%.

**lot.** The indivisible quantity unit of an order book market. Prices and quantities are stated in lots rather than raw minor units so the numbers stay human-readable regardless of the two mints' decimals. See the Order Book Exchange chapter.

**LP token.** The receipt token minted to a liquidity provider, representing a proportional claim on a pool's reserves and accrued fees.

**major unit.** The human-scale denomination of an asset: the dollar, the SOL, the whole share. Contrast minor unit.

**maker / taker.** The maker posted the resting order; the taker crossed the spread to hit it. Fills execute at the maker's posted price, and fee schedules usually distinguish the two roles.

**mark price / index price.** On a perpetual futures market, the index price is the oracle's statement of the asset's real-world price; the mark price is the venue's own price used for margin and liquidation.

**minor unit.** The smallest denomination of an asset, and the raw integer programs actually calculate in: the cent, the lamport, the 10^-6 USDC. This book says minor unit, not "base unit."

**mint (account).** The onchain account that defines a token: its supply, decimals, and authorities. In economic prose this book says "token"; "mint account" appears when describing what gets passed to an instruction.

**NAV (net asset value).** The total current value of everything a fund holds, computed from fresh prices. Share price is NAV divided by share supply.

**Newton's method (integer square root).** The iterative algorithm programs use to take a square root using only integers, converging in a few loop iterations. AMMs use it to mint initial LP tokens as sqrt(x·y). See the Constant-Product AMM chapter.

**notional.** The face value of a position, as opposed to the margin posted against it. Five NVDAx at $200 is $1,000 notional whatever the collateral behind it.

**obligation.** A borrower's loan file in a lending market: their collateral deposits, their borrows, and the cached valuations health checks run against.

**oracle.** A service that publishes signed statements of offchain facts, most often prices, onchain. A program verifies the publisher's signature, the freshness, and the confidence interval, exactly as it validates any other input.

**parimutuel.** A betting structure with no bookmaker: all stakes pool together, and winners split the losers' pool pro rata by stake. The odds are the pool. See the Betting Market chapter.

**PDA (program derived address).** An address computed from a program's id and chosen seeds, with no private key. Only the owning program can sign as it, which is what makes program-owned vaults trustworthy.

**price-time priority.** The order-matching fairness rule: better-priced orders fill first, and among equal prices, earlier orders fill first.

**program.** Executable code deployed onchain; the thing this book builds. Called a "smart contract" on other chains.

**rent.** The deposit an account holds to pay for its own storage. Rent-exempt accounts hold enough to stay forever; closing an account reclaims the deposit. Who fronts rent, and who gets it back on which path, is real money design.

**reserve.** In a lending market, the per-asset pool: its liquidity vault, its share mint, its interest state, and its risk configuration.

**resting order.** A limit order that did not match on arrival and now waits on the book, funded and cancellable.

**share.** A token representing proportional ownership of a pool: of a lending reserve, of a fund's holdings, of anything with a NAV. Minted on the way in, burned on the way out, priced by dividing the pool by the supply.

**signer.** An account whose private key signed the transaction. "Is this account a signer" is the first validation question in every instruction handler.

**slippage.** The difference between the price you expected and the price you got, caused by your own trade's impact or by the market moving first. Bounded by minimum-out parameters; unbounded slippage is what sandwich attackers eat.

**slot.** Solana's basic unit of time, roughly 400ms, in which a leader may produce a block. Adversarial logic counts slots, not wall-clock time, because slot progression is guaranteed by the runtime while timestamps are validator-influenced.

**spread.** The gap between the best bid and the best ask.

**stablecoin.** A token designed to hold a fixed value, usually one dollar. The quote asset of nearly every market in this book.

**tick size.** The minimum price increment of a market. Prices must land on a multiple of it, which keeps the book from fragmenting into dust price levels.

**token account.** The account holding a wallet's balance of one specific token. Owned by the token program; controlled by its recorded authority.

**Token Extensions Program / Classic Token Program.** Solana's two token programs. The Classic Token Program is the original; the Token Extensions Program adds per-mint features (transfer fees, transfer hooks, confidential transfers, and others). Well-written programs work with both through a common interface.

**transaction.** A signed bundle of instructions that executes atomically: all of it lands or none of it does. The atomicity is a financial primitive; see flash loan.

**utilization.** In a lending reserve, borrowed divided by total liquidity. The input to the interest rate curve: high utilization means the pool is begging for deposits and rates rise.

**vault.** A token account owned by a program (usually by a PDA), where a program holds funds mid-lifecycle. In this book, always the token account, never the whole product; the fund-shaped product is a strategy.

**WAD.** A fixed-point convention: values scaled by 10^18, so 1.0 is stored as a 1 followed by eighteen zeros. The scale used for interest indexes and rate math.

**zero-copy.** Reading and writing an account's bytes in place instead of deserializing the whole account on every instruction. How programs afford large accounts like a 180 KB order book.
