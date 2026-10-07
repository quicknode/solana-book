# Chapter 3: Tokens

Every asset on Solana except SOL is a **token**, held in a token account (an account formatted in a particular way to hold a token balance) that a token program manages.[^tokens-xyz] The tokens in this book include: 

- stablecoins like USDC
- equities like NVDAx, SPCXx, and TSLAx[^tokenized-equity-volume]
- the share tokens the book's own programs mint

## Every Distinct Token Has Its Own Mint

Each kind of token is defined by its own **mint account**. 

- `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` defines USDC on mainnet[^usdc-address]
- `Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh` defines NVDAx on mainnet[^nvdax-address]
- The share mint the *Managed Fund* chapter's `initialize_fund()` creates defines that fund's shares

A mint is not itself a token: it is the account a token comes from, and no amount of anything is held in the mint.

Two tokens are the same asset if they come from the same mint address, and different assets if they do not. Anyone can create a mint whose name and symbol say "USDC", so the mint address identifies the asset and the name and symbol do not. Instruction handlers are given account addresses as arguments, and must check that any mint account address matches the expected value, so that the asset is the one it claims to be. 

## A Mint Is a Factory, and the Mint Authority Is Its Boss

A mint does not just describe a type of token; it manufactures it. New tokens come into existence only when the mint's mint authority signs an instruction to the Token Program's `mint_to()` (or `mint_to_checked()`) handler. The supply counter rises and the new tokens land in a token account. Destroying tokens needs no mint authority: any holder can burn their own tokens with `burn()` (or `burn_checked()`), signing as the owner of the token account that holds them, and the supply falls.

As well as the current total supply, the mint account also stores the token's decimals (how many decimal places a major unit has) and its authorities. 

The mint authority is the boss of that factory. It can be a person's wallet (they can mint at will: fine for a test token, alarming for a token people rely on), a multisig (minting takes a quorum), or a PDA. Every mint this book's programs create has a PDA as its mint authority, so new shares are minted only by those programs' handlers, never by a person. Those mints are each lending reserve's share mint, the fund's share mint, and the liquidity providers' share mints in the *Constant-Product AMM* and *Perpetual Futures* chapters. The authority can also be handed over, or renounced by setting it to none, after which nothing more can be minted. Many tokens explicitly advertise a fixed supply, and disabling the mint authority is how it is enforced.

A token can also stand for one unique thing. Give the mint 0 decimals, mint a single unit, and make sure nobody can mint another: the result is a **non-fungible token**, or NFT, and the one token account holding it records who owns that thing. It could be a ticket to a particular seat, a property deed, or a bond certificate with its own serial number. So each NFT has a mint of its own: a collection of 10,000 NFTs made this way is 10,000 mints, not one mint that issued 10,000 tokens.

![ACME is the stock of a fictional company, issued on the Token Extensions Program, the successor to the Token Program named above; both are covered below.](figures/mint-factory.svg)

## Token Accounts Hold Tokens

A token account holds one owner's balance of a particular type of token, and its data records three facts: 

- which type of token (determined by the mint)
- the account owner
- how much of the token that owner has

> **A token account's "owner" is not its owner program.** Every account has an owner program, and for a token account that is always the token program: the only program that can change its bytes. The **owner** recorded in a token account's data is something else: the address that can move its tokens. Alice is the owner of her USDC account, and the Token Program moves USDC out of it only when Alice signs (or a **delegate** she has approved, up to the amount she approved). Solana's own tools use "owner" for both. In this book, when an address "owns" a token account or "holds" its tokens, it means the second: that address is the token account's owner, and its signature is what moves the tokens. The figures label this field `authority`, because a program's vault is owned by a PDA and the book calls that PDA the vault's authority.

The **associated token account** (ATA) is the canonical token account for a given wallet and mint, at a PDA of the **Associated Token Program**, derived from three seeds: the owner's address, the token program that manages the mint, and the mint. Put in Alice's address, the token program, and the USDC mint, and out comes the address of Alice's USDC account; put in Bob's, and out comes his. This is how a wallet finds Alice's USDC account from her address, and how a program can check that a token account an instruction supplies really is hers.

An ATA lives at a PDA, so it sits off the curve with no private key, and no signature for the address itself can ever exist. That does not stop Alice spending her USDC: she is the token account's owner, and her signature is what moves it. The *PDAs* chapter explains the mechanism.

![](figures/token-accounts-off-the-curve.svg)

Not every token account is an ATA. **A token account can live at any address**, and the vaults this book's programs hold funds in are token accounts controlled by the programs themselves. Some are ATAs of a program-derived address (the escrow's vault is the ATA of the offer PDA), and others are token accounts at PDAs of the program itself (the order book's three vaults are derived from the market).

![](figures/token-accounts-and-atas.svg)

## Decimals Define the Minor Unit

The mint's **decimals** set the minor unit, the raw integers that programs use to calculate and transfer assets: with USDC's 6 decimals, $10 moves as 10,000,000. Read decimals from the mint and never assume them, and transfer with `transfer_checked()`, which fails unless the caller states the decimals the mint really has. Every program in this book does both.

## The Freeze Authority Can Freeze Any Holder's Account

The mint's other authority is the freeze authority, which can freeze and thaw individual token accounts: a frozen account can neither send nor receive. It is the compliance mechanism behind regulated assets (sanctions, court orders, fraud response), and it applies to holders one at a time, not to the token as a whole. Before building on someone else's token, check both authorities: who can mint, and who can freeze.

## Two Token Programs: Classic and Token Extensions

Solana has two token programs. The **Classic Token Program** is the original, and most tokens in circulation use it. The **Token Extensions Program** is its successor: the same core instructions and accounts, plus opt-in, per-mint features. Well-written programs support both through a common interface (like Anchor's `token_interface`), and require that every token account in one instruction uses the same token program. Every program in this book works that way. The Token Program named so far is the Classic one.

| Extension | What it does | What it means for your program |
| --- | --- | --- |
| **transfer fees** | A cut is withheld on every transfer, for the issuer to collect | Send 100 and 99 arrives: "I transferred X" no longer delivers X |
| **transfer hooks** | A program of the issuer's choosing runs on every transfer | Enables allowlists, and means a transfer can execute foreign code (a hook cannot call back into your program; the *Adversary* chapter's ordering section says why) |
| **confidential transfers** | Amounts are hidden onchain | Balances are visible only to the parties and whoever holds the auditor's private key |
| **permanent delegate** | An authority can move any holder's tokens | A seizure power some regulated assets require |
| **interest-bearing** | A rate is stored in the mint | Balances display accrual without the supply changing |
| **non-transferable** | Tokens are bound to their holder | For credentials and vesting, not payments |
| **default account state** | New token accounts start frozen until the freeze authority thaws them | Enables allowlists: a vault your program creates cannot send or receive until the issuer approves it |
| **pausable** | An authority can stop every transfer, mint, and burn of the token at once | While paused, every handler that moves the token fails, withdrawals included |
| **scaled UI amount** | A multiplier stored in the mint, which the issuer updates for stock splits and dividends | The displayed balance changes while the raw amount stays fixed: calculate in raw amounts |
| **metadata** | The name, symbol, and a link to more details, stored in the mint | Display only: the mint address still identifies the asset |

Stablecoin and tokenized-security issuers use most of these together: the Solana Foundation's Mosaic templates for both turn on default account state, pausable, permanent delegate, confidential transfers, and metadata, and the tokenized-security template adds permissioned burn (burning needs a designated authority's approval) and scaled UI amount.[^mosaic] Before building on a token you did not issue, check which extensions it uses: Solana Explorer lists them on the mint's page,[^solana-explorer] and the table's last column says what each one means for your program.

![](figures/transfer-using-transfer-fee-extension.svg)

## What You Learnt

- Every distinct token has its own **mint account**, and that account's address identifies the token, whatever name and symbol it shows.
- A token's **mint authority** and **freeze authority** say who can create supply and who can freeze a holder's account.
- **Token accounts hold tokens**: ATAs are the derivable canonical ones for an address, and program vaults can live anywhere the program chose.
- **Decimals** define the minor unit: read them from the mint, never assume them, and transfer with `transfer_checked()`.
- Solana has two token programs, the **Classic Token Program** and the **Token Extensions Program**. The extensions a mint uses change what a transfer of it does (a fee taken, the issuer's program run, any holder's tokens moved, the whole token paused), and Solana Explorer lists them.


[^usdc-address]: Circle, the USDC issuer, lists its mint addresses at [developers.circle.com/stablecoins/usdc-contract-addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses).
[^nvdax-address]: xStocks, the NVDAx issuer, lists its tokenized equities at [xstocks.fi/us/products](https://xstocks.fi/us/products).
[^tokenized-equity-volume]: Tokens tracking Tesla and Nvidia traded $631M and $380M on Solana in the twelve months to August 18, 2026, among the eight most traded tokenized equities on the chain, behind the S&P 500 token's $2.0B. Source: Allium, [allium.so/solana](https://allium.so/solana).
[^mosaic]: The templates and the extensions each one enables are listed at [github.com/solana-foundation/mosaic](https://github.com/solana-foundation/mosaic).
[^solana-explorer]: Solana Explorer is at [explorer.solana.com](https://explorer.solana.com). Search for a mint's address to open its page.
[^tokens-xyz]: [tokens.xyz](https://tokens.xyz) lists which assets are available as Solana tokens.
