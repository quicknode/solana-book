# Tokens

Assets on Solana are tokens, and tokens are nothing more than accounts with well-known shapes, managed by a token program.

## Every Distinct Token Is a Distinct Mint

Each kind of token is defined by its own **mint account**. USDC is one mint; NVDAx is another; the shares a fund issues are a third. Two tokens are the same asset exactly when they come from the same mint address, and *only* then: anyone can create a mint whose name and symbol say "USDC", so the address is the identity and the label is decoration. When this book says "USDC" or "NVDAx", the precise referent is a mint account, and passing the *right* mint is a validation problem every program chapter takes seriously.

The mint account records the token's definition: its current total supply, its decimals, and its authorities.

## A Mint Is a Factory, and the Mint Authority Is Its Boss

A mint does not just describe a token; it manufactures it. New tokens come into existence when, and only when, the mint's **mint authority** signs a mint instruction: the supply counter rises and the new tokens land in a token account. Burning does the reverse. Nothing else in the system can create or destroy a single unit.

The mint authority is the boss of that factory, and who holds the role is the first question to ask about any token. It can be a person's wallet (they can print at will: fine for a test token, alarming for money), a multisig (printing takes a quorum), or a PDA, which is how this book's programs use it: the lending market's share mint and the fund's share mint are run by program-owned addresses, so issuance follows code, not a person. The authority can also be handed over, or renounced entirely by setting it to none, which fixes the supply forever; that is what a token means when it claims no more can ever exist.

![The mint is a factory: new tokens exist only when the mint authority signs, burning reverses it, and an authority set to none seals the supply forever.](figures/mint-factory.svg)

## Token Accounts Hold Balances, and ATAs Make Them Findable

A **token account** holds one owner's balance of one token. The **associated token account** (ATA) is the canonical token account for a given wallet and mint, at an address anyone can derive from the two (plus the token program that manages the mint): this is how a program knows where Alice's USDC lives without asking her, and how account constraints can verify that a supplied token account really is hers. ATAs are also the first **PDAs** you meet on Solana: derived addresses that sit off the curve, with no private key. The PDAs chapter explains the mechanism.

![Alice's and Bob's USDC stores are the first PDAs you meet: derived from owner and mint, they sit off the curve, with no private key.](figures/token-accounts-off-the-curve.svg)

## Decimals Define the Minor Unit

The mint's **decimals** set the **minor unit**, the raw integer everything actually calculates and transfers in: USDC has 6 decimals, so $10 moves as 10,000,000. Programs read decimals from the mint and never assume them, and transfers use `transfer_checked`, which fails unless the caller states the decimals the mint really has.

## The Freeze Authority Can Stop Any Holder Cold

The mint's other lever is the **freeze authority**, which can freeze and thaw individual token accounts: a frozen account can neither send nor receive. It is the compliance mechanism behind regulated assets (sanctions, court orders, fraud response), and it applies to holders one at a time, not to the token as a whole. Before building on someone else's token, check both authorities: who can print, and who can freeze, is the token's real constitution.

## Token Extensions Change What a Transfer Means

Solana has two token programs: the **Classic Token Program** and the **Token Extensions Program**, which adds opt-in, per-mint features. Well-written programs support both through a common interface (Anchor's `token_interface`), constraining only that every account in a transaction agrees on which one it is using; every program in this book does so.

The extensions that matter for financial products: **transfer fees** (a cut withheld on every transfer, for the issuer to collect), **transfer hooks** (a program of the issuer's choosing runs on every transfer, which enables allowlists and also means a transfer can execute foreign code, a fact the ordering section of The Adversary takes seriously), **confidential transfers** (amounts hidden onchain, visible to the parties and an auditor key), **permanent delegate** (an authority that can move any holder's tokens, a seizure power some regulated assets require), **interest-bearing** (a rate stamped on the mint so balances display accrual), and **non-transferable** (tokens bound to their holder). When you build on a token you did not issue, read its extensions first: several of them change what "I transferred X" means.

![A transfer through the Token Extensions Program: a fee peeled off, a transfer hook running the issuer's program, and 99 arriving where 100 was sent.](figures/transfer-through-extensions.svg)
