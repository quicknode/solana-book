# Clusters, Programs, Accounts and Handlers

Nearly every generic blockchain article describes blockchain as a "shared ledger". This is vague: to what extent does the "sharing" occur? And what about the vast majority of data that wouldn't appear in a traditional ledger?

Solana is better understood as **one giant computer that spans the world**. It stores data, it runs programs, and anyone on earth can use it. This chapter is a tour of that computer: where it runs, how identity and permission work on it, where its data lives, and the one legal way anything ever changes.

## A Cluster Is One Instance of the Giant Computer

There is more than one Solana. Each running instance is a **cluster**: the same software, a separate world. **Mainnet** is the one you have heard of, where everything has real value. **Devnet** is identical machinery where tokens are free from a faucet and nothing has value, which makes it the right place to learn and test against real network behaviour. **Localnet** runs on your own machine: private, instant, and disposable, for development. An account that exists on one cluster does not exist on the others, and nothing in this book needs real money to work through.

**[FIGURE: Three clusters as three separate globes labelled mainnet ("real value"), devnet ("free tokens, no value"), and localnet ("your machine"), each running the same programs but holding different accounts.]**

## Key Pairs Sign, and Signatures Prove

You cannot talk about crypto without talking about cryptography, and the piece that matters is the **digital signature**. A **key pair** is two mathematically linked keys. The **private key** must be kept secret, stored safely on your device, and is used to sign messages. The **public key** can be shared with everyone, and is used to prove that a message was signed by whoever holds the private key.

You already use digital signatures daily: your bank card has a private key on its chip, and every time you tap, that key produces a fresh signature so the terminal can prove the card is genuine and issued by your bank. Solana runs on the same primitive. Every action is a signed message, and everything the rest of this book calls "authority" (who may move these funds, who may settle this market) ultimately reduces to one question: whose signature does this instruction carry?

**[FIGURE: A key pair. The private key on Alice's device signing a message; the public key, shared with the world, verifying the signature; a bank card tap shown as the everyday analogue.]**

## Public Keys Are Addresses

Alice has a key pair. Her public key does double duty: it is also her **address**, the identifier anyone can use to transact with her. When Bob sends 10 SOL to Alice, he sends it to her public key. Nothing more is needed: to receive, you only need an address; to spend what arrived, you need the private key that matches it.

A **wallet** is a key pair being used this way, with the private key stored somewhere safe. Stripped of its apps and branding, a saved wallet is startlingly small: a keypair file on disk is an array of 64 numbers, the bytes of the two keys. Whoever has those bytes *is* that wallet, which is the entire custody problem in one sentence.

## Accounts Store Data

An **account** is some data with an address.

In a program, the data is a Rust struct; on the chain, it is bytes, with a lamport balance and an owner program that alone may change it. All data on Solana lives in accounts, including every balance: wallets, token holdings, program code, and every record a financial program keeps. There is no other place for state to live, which is why a financial program's whole ledger is a set of accounts.

**[FIGURE: One account, dissected. A box showing its address, owner program, lamport balance, and data bytes, with the data bytes expanded into a labelled Rust struct (an escrow offer: maker, mints, wanted amount).]**

## Addresses Identify and Find Accounts

Every account sits at a 32-byte **address**, usually shown base58-encoded. Most addresses are public keys; the rest are PDAs, addresses derived from seeds that no private key controls (they get their own section). Because addresses are how everything is found, financial programs lean on *derivable* addresses: put the market's pair, the user's key, or the offer's id into the derivation, and anyone can compute where the account must be, no lookup table required.

## Lamports Are SOL's Minor Unit

Anyone handling money online, on a blockchain or on a credit card rail, works in **minor units**: the small money alongside the big money, cents to the dollar, pence to the pound. Solana's native token SOL has the **lamport**: one billion lamports make one SOL. The balance an explorer displays as 1 SOL is stored, and calculated with, as the integer 1,000,000,000. Every asset in this book gets the same treatment, and The Arithmetic of Money builds the full discipline on this one idea.

## Programs Live at Addresses Too

The programs that run on this giant computer are called **onchain programs**, and just like people, every program has its own address. The **System Program** sits at a well-known address and creates accounts and transfers SOL; the memo program sits at another and writes notes into the transaction log; the escrow you will build in this book gets an address of its own the day you deploy it. Program code is itself stored in accounts, because there is nowhere else for anything to live.

## Programs Hold No State

A program is pure logic. It reads the accounts it is handed, checks them, and writes new values back; it stores nothing between calls. This split, all state in accounts and all logic in programs, is what makes financial state legible: to know a market's condition you read its accounts, and to change it there are only the program's declared entry points.

## Instruction Handlers Are the Only Legal State Changes

Those entry points are **instruction handlers**: the onchain functions a program exposes. The input each one processes is an **instruction**: which handler to run, the list of accounts it may touch, and the arguments. One word for two things confuses everyone, so this book always says "instruction handler" for the function and "instruction" for its input. Good financial design keeps the mapping strict: one handler, one state transition (deposit, settle, cancel, liquidate), so the program's API is the state machine's edge list.

A **transaction** bundles one or more instructions, possibly to different programs, and runs them as a unit. The classic first example: one transaction carrying two instructions, a System Program transfer that sends SOL from Bob to Alice, and a memo instruction that writes a note to the log. If both instructions succeed, the changes are written to the chain; if either fails, nothing happens at all. That all-or-nothing behaviour is load-bearing for financial software, and the atomicity section takes it further.

**[FIGURE: One transaction containing two instructions to two different programs: a System Program transfer moving SOL from Bob to Alice, and a memo instruction writing to the log; both landing together as a single committed change.]**

## Callers Supply the Accounts, So Programs Must Check Them

Every instruction declares up front which accounts it touches, which is what lets the runtime execute non-overlapping transactions in parallel. The consequence that shapes this whole book: programs do not look accounts up, callers hand accounts in, and every account a caller hands you is a claim to verify. The validation discipline in Financial Programming Concepts in Solana exists because of this one design fact.
