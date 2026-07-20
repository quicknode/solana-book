# Chapter 2: The Core Building Blocks of Solana

Nearly every generic blockchain introduction describes it as a "shared ledger". This is vague: to what extent does the "sharing" occur? And what about the vast majority of program data, beyond account balances, that wouldn't appear in a traditional ledger?

Solana - or more specifically, Solana mainnet and devnet - is better understood as **one giant computer that spans the world**. It stores data, it runs programs, and anyone on earth can use it. This chapter is a tour of that computer, and it starts with the thing everything else hangs off: a key pair.

## Public Keys Are Addresses

Meet Alice. Alice has a **key pair**: two mathematically linked keys. Her **private key** is kept secret, stored securely on her device, and is used to sign messages. The matching **public key** can be shared with everyone, and is used to prove that a message was signed by whoever holds the private key. Alice also holds a small balance of **SOL**, Solana's native token: it pays for the space her account uses on the network, and for the fees on her future transactions.

On Solana, as with most blockchain, the public key does double duty: it is also Alice's **address**, the identifier anyone can use to transact with her. And "key" is not a metaphor: Solana public keys are points on a cryptographic curve, so this book draws the network exactly that way, as a curve with addresses sitting on it.

![Alice's public key is her address, a point on the curve; her private key stays on her device.](figures/alice-on-the-curve.svg)

> **Key pairs are random, and that is safe.** Nobody issues Alice her key pair: her device generates it from random bytes, with no registry to consult and no permission to ask. That only works because collisions are, in practice, impossible. A Solana private key is drawn from a space of 2^256 possibilities, a number on the order of the count of atoms in the observable universe. If every person on earth generated a billion key pairs per second, the expected wait before any two ever matched would still be billions of times the age of the universe. When this book says an address "belongs" to Alice, that is the entire basis of the claim: nobody else will ever roll her number.

## There Is More Than One Solana Computer

The curve in the figure is labeled **Solana Devnet**, because there is more than one Solana computer. Each running instance is a **cluster**: the same software, a separate world.

| Cluster      | Purpose                                       | Assets have value?  | Where it runs                |
| ------------ | --------------------------------------------- | ------------------- | ---------------------------- |
| **mainnet**  | Production: where real financial products run | Yes                 | Globally                     |
| **devnet**   | Identical machinery for building and testing  | No: tokens are free | Globally                     |
| **localnet** | Development and fast test loops               | No                  | Locally, on your own machine |

Test tokens on devnet are free. The `solana airdrop` command, or the faucet at [faucet.solana.com](https://faucet.solana.com), sends free devnet SOL to any address, and Circle's faucet at [faucet.circle.com](https://faucet.circle.com) does the same for devnet USDC. The curve and Alice's address are the same everywhere; the _account_ at her address exists per cluster, and nothing in this book needs real money to work through.

## Every Transaction Includes a Signed Message

You already use digital signatures daily: your bank card has a private key on its chip, and every time you tap, that key produces a fresh cryptographic proof that the card is genuine and issued by your bank. Solana runs on the same primitive. Every transaction includes a signed message, and everything the rest of this book calls "authority" (who may move these funds, who may settle this market) ultimately reduces to one question: whose signature does this transaction carry?

A **wallet** is a key pair being used this way, with the private key stored somewhere safe. Stripped of its apps and branding, a saved wallet is startlingly small: a keypair file on disk, like the `id.json` file the Solana CLI creates, is an array of 64 numbers, the bytes of the two keys. Whoever has those bytes _is_ that wallet, which is the entire custody problem in one sentence.

> **64 bytes, but only 32 are secret.** An `id.json` keypair file holds the 32-byte private key followed by the 32-byte public key. The second half is a convenience, not a necessity: the public key is mathematically derived from the private key, so software can recompute it from the first 32 bytes at any time. The private key is the only secret, and the only part that needs protecting.

## Bob Has an Address Too

Meet Bob. Bob has his own key pair, and his public key is another point on the same curve. To send something to Bob, Alice needs only his address; to spend whatever arrives there, Bob needs the private key that matches it. That asymmetry is the whole payment model: receiving is public, spending is signed.

![Bob joins the curve: his public key is his address, alongside Alice's.](figures/alice-and-bob-on-the-curve.svg)

## Accounts Store Data

An **account** is some data with an address.

Nearly all data on Solana lives in accounts, including every balance: wallets, token holdings, program code, and every record a financial program keeps. (The "nearly" is State Compression, a technique for storing bulk data offchain with onchain proofs; none of the financial state in this book uses it.) A financial program's whole ledger is a set of accounts.

In a program, the data is a Rust struct; on the chain, it is bytes, with a lamport balance and an **owner program** that can change this account: users (or other programs) invoke that program to modify the account. At Alice's address lives Alice's account, and its lamport balance _is_ her SOL: the small balance she keeps there pays the deposit on the space the account occupies, and funds the fees on her future transactions.

![One account, dissected: an address, an owner program, a lamport balance, and data bytes that the owning program reads as a Rust struct.](figures/account-dissected.svg)

## Addresses Identify and Find Accounts

Every account sits at a 32-byte **address**, usually shown base58-encoded. Addresses come in two kinds:

- **Public keys.** Alice's and Bob's wallet addresses are public keys: points on the curve, each with a private key that can sign for it.
- **PDAs** (program derived addresses). A PDA is computed from a program's id and some chosen **seeds**, and has no private key at all; the program that derived it signs for it instead. The escrow program you will build in this book stores each offer at a PDA derived from the maker's address and an offer id. PDAs get their own chapter.

![Two kinds of address: public keys sit on the curve, each with a private key that signs for it; PDAs sit off the curve, derived from a program id and seeds, with no private key.](figures/address-types.svg)

Because addresses are how everything is found, financial programs lean on _derivable_ addresses: put the market's pair, the user's key, or the offer's id into the derivation, and anyone can compute where the account must be, no lookup table required.

## What Is SOL?

**SOL** is the native token of the Solana network, the asset Alice's small balance is denominated in. It does two jobs every user meets immediately: it pays the deposit that reserves an account's storage space (the mechanism, called rent, is covered with PDAs later in this part), and it pays **transaction fees**, the fraction of a cent each transaction costs. Everything else on Solana is a token defined by a program; SOL is the one asset the network itself understands.

## Lamports Are SOL's Minor Unit

Anyone handling money online, on a blockchain or on a credit card rail, works in **minor units**: the small money alongside the big money, cents to the dollar, pence to the pound. SOL has the **lamport**: one billion lamports make one SOL. The balance an explorer displays as 1 SOL is stored as, and calculated with, the integer 1,000,000,000. Every asset in this book gets the same treatment, and The Arithmetic of Money builds the full discipline on this one idea.

> **Why "lamport"?** The unit is named for Leslie Lamport, the Turing Award-winning computer scientist whose work on time, ordering, and consensus in distributed systems underpins every blockchain, Solana included.

## Programs Live at Addresses Too

The programs that run on this giant computer are called **onchain programs**, and just like people, every program has its own address: another point on the same curve. The **System Program** sits at a well-known address and creates accounts and transfers SOL; the **Memo Program** sits at another and writes notes into the transaction log; the escrow you will build in this book gets an address of its own the day you deploy it. Compiled programs, like everything else, are stored in accounts.

![Programs sit on the same curve as people: the System Program and the Memo Program each have an address, and each exposes its instruction handlers.](figures/programs-on-the-curve.svg)

## Deployed Programs and Their State Are Separate

A program is pure logic: it reads the accounts it is handed, checks them, and writes new values back. The executable program and the state it manages live in separate accounts. Deploying a program stores its compiled code at the program's address; every piece of data the program manages (every market, offer, and balance) lives in its own account elsewhere. To change that state, users (and other programs) run the program's instruction handlers. This split, logic in program accounts and state in data accounts, is what makes financial state legible: to know a market's condition you read its accounts, and to change it there are only the program's declared entry points.

## Instruction Handlers Change State

Those entry points are **instruction handlers**: the onchain functions a program exposes. The input each one processes is an **instruction**: which handler to run, the list of accounts it may touch, and the arguments. One word for two things confuses everyone, so this book always says "instruction handler" for the function and "instruction" for its input.

A **transaction** bundles one or more instructions, possibly to different programs, and runs them as a unit. Watch Alice run her first one. It carries two instructions: the first tells the System Program to send some lamports to Bob's address, and the second tells the Memo Program to write "thanks" to the log. Alice signs the transaction with her private key, and that single signature authorizes both instructions.

![Alice's transaction carries two instructions: a System Program transfer of lamports to Bob, and a memo that writes "thanks" to the log.](figures/alices-transaction.svg)

## Instructions Are Atomic

Alice's transaction executes atomically: every instruction succeeds, or the whole transaction never happened. If Alice's balance cannot cover the lamports she wants to send Bob, the transfer fails, and the memo is never written either, even though the Memo Program itself had no complaint. If both instructions succeed, the state changes: Bob's balance rises, and the log says thanks. There is no partial state, no "the payment cleared but the delivery failed."

For financial software this is not plumbing; it is a primitive you design with. Settlement risk between steps simply does not exist inside a transaction: the escrow you will build moves Alice's payment and Bob's stock in one atomic unit, and no ordering of failures leaves one side paid and the other empty-handed. Sequencing turns from a race into a pattern: a lending market can require its price refresh in the same transaction as the action that depends on it, so "acting on stale state" is not a bug to chase but a transaction that cannot be built.

> **Flash loans are atomicity turned into credit.** A **flash loan** borrows in a transaction's first instruction, uses the money in the middle, and repays in the final instruction. If the repayment fails, the borrow itself is unwound: the lender risked nothing, so the loan needs no collateral. Whole categories of arbitrage and liquidation strategies exist only because transactions are all-or-nothing.

![A flash loan is atomicity turned into credit: three instructions across two programs commit together, or the failed repayment unwinds the borrow itself.](figures/atomic-transaction.svg)

The budget for all this is metered in **compute units** per transaction, and the meter shapes financial design directly: it is why the order book exchange later in this book credits balances instead of making one transfer per fill, and why work gets consolidated everywhere you look. Compute cost is a design input, not an afterthought.

## Instructions Supply the Accounts, Instruction Handlers Check Them

Every instruction declares up front which accounts it touches, which is what lets the runtime execute non-overlapping transactions in parallel. The consequence that shapes this whole book: programs do not look accounts up. Instructions supply the accounts as arguments, and instruction handlers check them, because every account a caller hands in is a claim to verify. The validation discipline in Financial Programming Concepts in Solana exists because of this one design fact.

## What You Learnt

The rest of the book builds on this chapter's tour:

- A **key pair**'s public key is an address, and every transaction includes a signed message: all authority reduces to whose signature a transaction carries.
- Nearly all data lives in **accounts**: bytes at an address, with a lamport balance and an owner program that users invoke to change it.
- Addresses come in two kinds: **public keys**, which private keys sign for, and **PDAs**, which programs sign for.
- **SOL** pays for account storage and transaction fees, and programs calculate in its minor unit, the **lamport**.
- Deployed programs and their state live in separate accounts, and **instruction handlers** are how state changes.
- **Transactions are atomic**: every instruction succeeds or nothing happened, which is a primitive financial software designs with.
- Instructions supply the accounts as arguments; instruction handlers check them.
