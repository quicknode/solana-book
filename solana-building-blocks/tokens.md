# Tokens Are Accounts: Mints Define Them, Token Accounts Hold Them

Assets on Solana are tokens, and tokens are nothing more than accounts with well-known shapes, managed by a token program.

## The Mint Account Defines the Token

The **mint account** is the token's definition: its total supply, its decimals, and its authorities. When this book says "USDC" or "BONK", the precise referent is a mint account, and passing the *right* mint is a validation problem every program chapter takes seriously.

## Token Accounts Hold Balances, and ATAs Make Them Findable

A **token account** holds one owner's balance of one token. The **associated token account** (ATA) is the canonical token account for a given wallet and mint, at an address anyone can derive from the pair: this is how a program knows where Alice's USDC lives without asking her, and how account constraints can verify that a supplied token account really is hers.

**[FIGURE: The token account triangle. A mint account (USDC) at the top; two wallets below, each with an ATA for that mint, the ATA addresses shown derived from wallet + mint; balances inside the token accounts, supply and decimals inside the mint.]**

## Decimals Define the Minor Unit

The mint's **decimals** set the **minor unit**, the raw integer everything actually calculates and transfers in: USDC has 6 decimals, so $10 moves as 10,000,000. Programs read decimals from the mint and never assume them, and transfers use `transfer_checked`, which fails unless the caller states the decimals the mint really has.

## Mint and Freeze Authority Are Finance Levers

Two authorities on the mint matter to financial products. The **mint authority** can create supply: it is how a fund issues shares and a stablecoin issues dollars, and in this book's programs it is usually a PDA, so issuance follows code, not a person. The **freeze authority** can freeze individual token accounts: the compliance lever behind regulated assets, and a fact to check before building on someone else's token.

## Token Extensions Change What a Transfer Means

Solana has two token programs: the **Classic Token Program** and the **Token Extensions Program**, which adds opt-in, per-mint features. Well-written programs support both through a common interface (Anchor's `token_interface`), constraining only that every account in a transaction agrees on which one it is using; every program in this book does so.

The extensions that matter for financial products: **transfer fees** (a cut of every transfer, taken by the mint itself), **transfer hooks** (a program of the issuer's choosing runs on every transfer, which enables allowlists and also means a transfer can execute foreign code, a fact the ordering section of The Adversary takes seriously), **confidential transfers** (amounts hidden onchain, visible to the parties and an auditor key), **permanent delegate** (an authority that can move any holder's tokens, a seizure power some regulated assets require), **interest-bearing** (a rate stamped on the mint so balances display accrual), and **non-transferable** (tokens bound to their holder). When you build on a token you did not issue, read its extensions first: several of them change what "I transferred X" means.

**[FIGURE: A transfer passing through the Token Extensions Program, with extension checkpoints along the arrow: a fee peeled off, a transfer hook invoking another program, the received amount landing smaller than the sent amount.]**
