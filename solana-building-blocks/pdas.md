# Chapter 4: PDAs: How Solana Programs Store Data

You have been using PDAs since the *Tokens* chapter. Every wallet's token balance in this book lives in an associated token account, and nobody ever generated that account's address: the Associated Token Program computes it from three seeds:

- the owner's address
- the mint
- the token program that manages the mint

As a result:

- Anyone can recompute this address, so a program can find Alice's USDC without asking her where it is.
- A token account address either derives from Alice's address and the USDC mint or it does not, so a program handed the wrong address can reject it.
- No private key exists for the result, so tokens can only leave the account via the program that owns the token account.

These rules apply to any **program derived address**, or PDA. A PDA is an address computed from a program's ID and some chosen seeds, the inputs to the derivation. The derivation deliberately produces an address with no private key: PDA generation tries one extra byte after another, called the **bump**, until the result lands off the curve where public keys live.  Only the program whose ID derived the address can "sign" as the PDA - note that what "sign" really means gets its own boxout below.

**PDAs are how Solana programs store data.** The Associated Token Program made chose to use those seeds to suit its task: find where a wallet's balance of a given token lives. Every other program choosen its own seeds based on it's own needs and gets the same three properties. A program's PDAs behave like a **key/value store**: the seeds are the key, and the account's data is the value.[^key-meaning] Every program in this book keeps its state this way:

- The escrow stores each offer at an address made from `"offer"` + the maker's address + an ID.
- The fundraiser stores its terms at an address made from `"fundraiser"` + the maker's address, and one receipt per backer at an address made from `"contributor"` + the fundraiser + the backer's address.
- The order book stores each market at an address made from `"market"` + the two mints.
- The lending market stores each borrower's loan file at an address made from `"obligation"` + the market + the borrower's address.
- The perpetual futures venue stores each position at an address made from `"position"` + the pool + the owner + the side.

![Every program in this book stores its records this way: the seeds are the key, the struct inside is the value, and one key shape holds as many records as the program needs.](figures/pda-key-value-store.svg)

Each of those three jobs again, in the general form every chapter of this book uses:

## Seeds Make Data Findable

The market for a token pair, a user's position in it, and the offer with a given ID all live at addresses anyone can compute from the seeds, so exactly one thing exists per key and nobody has to remember where anything is.

## Seeds Make Relationships Verifiable

An account that claims to be "the vault for this market" either derives from the market's seeds or it does not. Combined with stored addresses (`has_one`), derivation is how a program proves that the accounts a caller supplied belong together.

## PDA Authority Makes Custody Programmatic

A vault whose authority is a PDA is a vault whose funds move only along the code paths the program defines. When people say that "the program holds the funds", they mean that the funds are stored in a token account that the program controls, and that moving them means invoking the program's instruction handlers. That arrangement is the foundation of every escrow, pool, and market in the book.

> **"Signing" with a PDA is not cryptographic signing.** No digital signature is ever produced for a PDA, because there is no private key to produce one; nothing like the cryptographic proof behind Alice's and Bob's transactions exists here. This book still says "sign with the PDA", because that is how Solana itself uses the word, in the runtime and in every library you will touch. When you read about "signing for a PDA", here or anywhere else, translate it to something plainer: the program specifies the seeds of the PDA that controls the token account, the runtime recomputes the derivation, and the movement is allowed.

![Seeds plus the program ID derive an address off the curve, where no private key exists; only the program whose ID derived it can "sign" as it, and presenting the same seeds is the entire act.](figures/pda-derivation.svg)

## What You Learnt

- A **PDA** is derived from a program's ID and seeds and has no private key; only the deriving program can "sign" as it, by presenting the seeds.
- The associated token accounts you already use are PDAs of the Associated Token Program, and a program's own records work the same way with seeds it chooses.
- A program's PDAs form a **key/value store**: the seeds are the identifier, the account's data is the value.
- Seeds make data findable and relationships verifiable, and PDA authority over a vault is what "the program holds the funds" means.

[^key-meaning]: "Key" here means *identifier*, the same word a database would use. It has nothing to do with public or private keys.
