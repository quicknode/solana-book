# The Core Building Blocks of Solana

Nearly every generic blockchain article describes blockchain as a "shared ledger". This is vague: to what extent does the "sharing" occur? And what about the vast majority of data that wouldn't appear in a traditional ledger?

Solana is better understood as **one giant computer that spans the world**. It stores data, it runs programs, and anyone on earth can use it. This chapter is a tour of that computer, and it starts with the thing everything else hangs off: a public key.

## Public Keys Are Addresses

Meet Alice. Alice has a **key pair**: two mathematically linked keys. Her **private key** is kept secret, stored securely on her device, and is used to sign messages. Her **public key** can be shared with everyone, and is used to prove that a message was signed by whoever holds the private key.

On Solana, the public key does double duty: it is also Alice's **address**, the identifier anyone can use to transact with her. And "key" is not a metaphor: Solana public keys are points on a cryptographic curve, so this book draws the network exactly that way, as a curve with addresses sitting on it.

![Alice's public key is her address, a point on the curve; her private key stays on her device.](figures/alice-on-the-curve.svg)

The curve in the figure is labeled **Solana Devnet**, because there is more than one Solana. Each running instance is a **cluster**: **mainnet** is where everything has real value; **devnet** is identical machinery where tokens are free and nothing has value, which makes it the right place to learn; **localnet** runs on your own machine for development. The curve and Alice's address are the same everywhere; the *account* at her address exists per cluster, and nothing in this book needs real money to work through.

You already use digital signatures daily: your bank card has a private key on its chip, and every time you tap, that key produces a fresh cryptographic proof that the card is genuine and issued by your bank. Solana runs on the same primitive. Every action is a signed message, and everything the rest of this book calls "authority" (who may move these funds, who may settle this market) ultimately reduces to one question: whose signature does this instruction carry?

A **wallet** is a key pair being used this way, with the private key stored somewhere safe. Stripped of its apps and branding, a saved wallet is startlingly small: a keypair file on disk is an array of 64 numbers, the bytes of the two keys. Whoever has those bytes *is* that wallet, which is the entire custody problem in one sentence.

## Bob Has an Address Too

Meet Bob. Bob has his own key pair, and his public key is another point on the same curve. To send something to Bob, Alice needs only his address; to spend whatever arrives there, Bob needs the private key that matches it. That asymmetry is the whole payment model: receiving is public, spending is signed.

![Bob joins the curve: his public key is his address, alongside Alice's.](figures/alice-and-bob-on-the-curve.svg)

## Accounts Store Data

An **account** is some data with an address.

In a program, the data is a Rust struct; on the chain, it is bytes, with a lamport balance and an owner program that alone may change it. At Alice's address lives Alice's account, and its lamport balance *is* her SOL. All data on Solana lives in accounts, including every balance: wallets, token holdings, program code, and every record a financial program keeps. There is no other place for state to live, which is why a financial program's whole ledger is a set of accounts.

![One account, dissected: an address, an owner program, a lamport balance, and data bytes that the owning program reads as a Rust struct.](figures/account-dissected.svg)

## Addresses Identify and Find Accounts

Every account sits at a 32-byte **address**, usually shown base58-encoded. Addresses come in two kinds: public keys, and PDAs, addresses derived from seeds that no private key controls (they get their own chapter). Because addresses are how everything is found, financial programs lean on *derivable* addresses: put the market's pair, the user's key, or the offer's id into the derivation, and anyone can compute where the account must be, no lookup table required.

## Lamports Are SOL's Minor Unit

Anyone handling money online, on a blockchain or on a credit card rail, works in **minor units**: the small money alongside the big money, cents to the dollar, pence to the pound. Solana's native token SOL has the **lamport**: one billion lamports make one SOL. The balance an explorer displays as 1 SOL is stored as, and calculated with, the integer 1,000,000,000. Every asset in this book gets the same treatment, and The Arithmetic of Money builds the full discipline on this one idea.

## Programs Live at Addresses Too

The programs that run on this giant computer are called **onchain programs**, and just like people, every program has its own address: another point on the same curve. The **System Program** sits at a well-known address and creates accounts and transfers SOL; the Memo Program sits at another and writes notes into the transaction log; the escrow you will build in this book gets an address of its own the day you deploy it. Program code is itself stored in accounts, because there is nowhere else for anything to live.

![Programs sit on the same curve as people: the System Program and the Memo Program each have an address, and each exposes its instruction handlers.](figures/programs-on-the-curve.svg)

## Programs Hold No State

A program is pure logic. It reads the accounts it is handed, checks them, and writes new values back; it stores nothing between calls. This split, all state in accounts and all logic in programs, is what makes financial state legible: to know a market's condition you read its accounts, and to change it there are only the program's declared entry points.

## Instruction Handlers Are the Only Legal State Changes

Those entry points are **instruction handlers**: the onchain functions a program exposes. The input each one processes is an **instruction**: which handler to run, the list of accounts it may touch, and the arguments. One word for two things confuses everyone, so this book always says "instruction handler" for the function and "instruction" for its input. Good financial design keeps the mapping strict: one handler, one state transition (deposit, settle, cancel, liquidate), so the program's API is the state machine's edge list.

A **transaction** bundles one or more instructions, possibly to different programs, and runs them as a unit. Watch Alice run her first one. It carries two instructions: the first tells the System Program to send some lamports to Bob's address, and the second tells the Memo Program to write "thanks" to the log. Alice signs the transaction with her private key, and that single signature authorizes both instructions.

![Alice's transaction carries two instructions: a System Program transfer of lamports to Bob, and a memo that writes "thanks" to the log.](figures/alices-transaction.svg)

If both instructions succeed, the changes are written to the chain: Bob's balance rises, and the log says thanks. If either fails, nothing happens at all. That all-or-nothing behavior is load-bearing for financial software, and the Atomicity chapter takes it further.

## Callers Supply the Accounts, So Programs Must Check Them

Every instruction declares up front which accounts it touches, which is what lets the runtime execute non-overlapping transactions in parallel. The consequence that shapes this whole book: programs do not look accounts up, callers hand accounts in, and every account a caller hands you is a claim to verify. The validation discipline in Financial Programming Concepts in Solana exists because of this one design fact.
