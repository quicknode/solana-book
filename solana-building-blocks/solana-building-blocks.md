# Solana Building Blocks

Everything Solana-mechanical the rest of the book stands on, in one chapter, so the program chapters never stop to explain the platform. Each section is short on purpose: as deep as a builder of financial products needs, and no deeper.

## Money Lives in Accounts, Logic Lives in Instruction Handlers

An **account** is some data with an address. In a program, the data is a Rust struct; on the chain, it is bytes at a 32-byte address, with a lamport balance and an owner program that alone may change it. Everything on Solana is an account: wallets, token balances, program code, and every record a financial program keeps. There is no other place for state to live.

Programs are the opposite: pure logic, no storage of their own. A program reads the accounts it is handed, checks them, and writes new values back. The functions that do this are **instruction handlers**, and the input each one processes is an **instruction**: which handler to run, the list of accounts it may touch, and the arguments. (One word for two things confuses everyone, so this book always says "instruction handler" for the function and "instruction" for its input.) A financial program is exactly this: accounts as the ledger, instruction handlers as the only legal ways to change it, one handler per state transition.

Every instruction declares its accounts up front, which is what lets the runtime execute non-overlapping transactions in parallel, and is why callers hand programs their accounts rather than programs looking things up. That one design fact drives most of the validation discipline in this book: everything a caller hands you is a claim to check.

## Tokens: Mints, Token Accounts, and Minor Units

Assets on Solana are tokens, and three account types carry them. The **mint account** defines a token: its total supply, its decimals, and its authorities. A **token account** holds one owner's balance of one token. And the **associated token account** (ATA) is the canonical token account for a given wallet and mint, at an address anyone can derive from the pair, which is how a program knows where Alice's USDC lives without asking her.

The mint's **decimals** define the **minor unit**, the raw integer everything actually calculates and transfers in: USDC has 6 decimals, so $10 moves as 10,000,000. Programs read decimals from the mint and never assume them, and transfers use `transfer_checked`, which fails unless the caller states the decimals the mint really has.

Two authorities on the mint matter to finance. The **mint authority** can create supply: it is how a fund issues shares and how a stablecoin issues dollars, and in this book's programs it is usually a PDA, so issuance follows code, not a person. The **freeze authority** can freeze individual token accounts: the compliance lever behind regulated assets, and a fact to check before building on someone else's token.

## The Token Extensions That Matter for Finance

Solana has two token programs: the **Classic Token Program** and the **Token Extensions Program**, which adds opt-in, per-mint features. Well-written programs support both through a common interface (Anchor's `token_interface`), constraining only that every account in a transaction agrees on which one it is using; every program in this book does so.

The extensions that matter for financial products: **transfer fees** (a cut of every transfer, taken by the mint itself), **transfer hooks** (a program of the issuer's choosing runs on every transfer, which enables allowlists and also means a transfer can execute foreign code, a fact the ordering section of The Adversary takes seriously), **confidential transfers** (amounts hidden onchain, visible to the parties and an auditor key), **permanent delegate** (an authority that can move any holder's tokens, a seizure power some regulated assets require), **interest-bearing** (a rate stamped on the mint so balances display accrual), and **non-transferable** (tokens bound to their holder). When you build on a token you did not issue, read its extensions first: several of them change what "I transferred X" means.

## PDAs: Addresses a Program Can Sign For

A **program derived address** (PDA) is an address computed from a program's id and some chosen seeds, deliberately constructed to have no private key (a stored **bump** byte pushes the result off the curve where keys live). Nobody can ever sign as a PDA with a key; the owning program, and only it, can sign as the PDA inside its own instruction handlers by presenting the seeds.

That one mechanism does three jobs in every chapter of this book. It makes addresses **derivable**: the market for a token pair, a user's position in it, the offer with a given id all live at addresses anyone can compute, so one thing exists per key and nobody has to remember where. It makes relationships **verifiable**: an account that claims to be "the vault for this market" either derives from the market's seeds or it does not. And it makes custody **programmatic**: a vault whose authority is a PDA is a vault whose funds move only along the code paths the program defines. The phrase "the program holds the funds" means, precisely, this.

## Rent and the Account Lifecycle

Storage is paid for. Every account holds a lamport deposit proportional to its size, called **rent**; hold enough and the account is **rent-exempt** and lives forever. The deposit is not a fee: close the account and the lamports come back.

For financial software, rent is small but real money with a lifecycle, and the design questions are always the same. Who pays to create each account? (The party who wanted it: the maker funds her offer and vault, the taker funds his own token account.) Who gets the deposit back, on which path? (Whoever paid, on every exit.) And does every account someone paid for have a path to being closed? An account that can never be closed is someone's deposit stranded forever, and a program that leaves fragments of state behind on some paths has a slow leak of other people's lamports. Terminal states drain and close; the state-machine section of Financial Programming Concepts makes that a rule.

## One Transaction, All or Nothing: Atomicity, Flash Loans, and Composed Settlement

A Solana transaction is a signed bundle of instructions, possibly addressed to several different programs, and it executes atomically: every instruction succeeds, or the whole transaction never happened. There is no partial state, no "the payment cleared but the delivery failed."

For financial software this is not plumbing; it is a primitive you design with. Settlement risk between steps simply does not exist inside a transaction: the escrow's `take_offer` moves Bob's payment and Alice's goods in one atomic unit, and no ordering of failures leaves one side paid and the other empty-handed. Multi-program compositions inherit the same guarantee, which is what makes a **flash loan** possible: borrow in instruction one, use the money, repay in the final instruction, and if repayment fails the borrow itself is unwound. And prerequisite sequencing becomes a pattern instead of a race: the lending market requires its price refresh in the same transaction as the action that depends on it, so "acting on stale state" is not a bug to chase but a transaction that cannot be built.

The budget for all this is metered in **compute units** per transaction, and the meter shapes financial design directly: it is why the order book credits balances instead of making one transfer per fill, and why work gets consolidated everywhere you look. Compute cost is a design input, not an afterthought.

## Time Onchain: Slots for Adversarial Logic, Timestamps for Humans

Solana has two clocks. The **slot** counts block opportunities, roughly 400ms apart, and its progression is guaranteed by the runtime: slots only go up, at a rate nobody can meaningfully bend. The **unix timestamp**, read from the same Clock sysvar, is validator-reported wall time: right to within a few seconds, and exactly as trustworthy as that sentence sounds.

The rule: **anything an adversary would profit from bending is measured in slots.** Price staleness, auction deadlines, expiry windows: all slots. Timestamps are for humans and for long horizons, where a few seconds of slack is noise: display, record-keeping, and rates accrued over months (the vault strategy's annual management fee accrues by timestamp, because seconds of drift against a year is nothing; the lending market's per-slot interest does not). Choose the clock by asking who benefits from the error.

## Cranks: Incentivized Automation for Work Nobody Owns

Some work in a financial product has no natural caller. Funding payments must settle, expired offers must process, unhealthy loans must liquidate, and no user has a reason to pay for any of it. The onchain pattern is the **crank**: an instruction handler that anyone may call, safe to call at any time, so that keeping the machine turning is a permissionless job rather than an operator's promise.

Designing a good crank is three properties. **Permissionless**: the handler checks state, not identity; if the work is valid, anyone's signature will do. **Idempotent and quiet**: calling it when there is nothing to do succeeds as a no-op (the order book's fee withdrawal exits cleanly when the vault is empty) so a bot on a schedule never needs babysitting. **Paid, if you need it reliable**: the strongest cranks carry their own incentive, and the lending market's liquidation is the canonical example: Dave is not a volunteer, he is a crank operator earning the liquidation bonus, and the market stays solvent precisely because that job pays. If your design has work that must happen and nobody is paid to do it, you have found a bug in your incentives, not your code.
