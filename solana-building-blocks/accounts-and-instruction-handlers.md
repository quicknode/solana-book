# Clusters, Programs, Accounts and Handlers

Nearly every generic blockchain article describes blockchain as a "shared ledger". This is vague: to what extent does the "sharing" occur? And what about the vast majority of data that wouldn't appear in a traditional ledger?







Every Solana program is two halves: accounts that hold the data, and instruction handlers that change it. 

## Accounts Store Data

An **account** is some data with an address. 

In a program, the data is a Rust struct; on the chain, it is bytes, with a lamport balance and an owner program that alone may change it. All data on Solana lives in accounts, including every balance: wallets, token holdings, program code, and every record a financial program keeps. There is no other place for state to live, which is why a financial program's whole ledger is a set of accounts.

**[FIGURE: One account, dissected. A box showing its address, owner program, lamport balance, and data bytes, with the data bytes expanded into a labelled Rust struct (an escrow offer: maker, mints, wanted amount).]**

## Addresses Identify and Find Accounts

Every account sits at a 32-byte **address**, usually shown base58-encoded. Most addresses are public keys; the rest are PDAs, addresses derived from seeds that no private key controls (they get their own section). Because addresses are how everything is found, financial programs lean on *derivable* addresses: put the market's pair, the user's key, or the offer's id into the derivation, and anyone can compute where the account must be, no lookup table required.

## Programs Hold No State

A program is pure logic. It reads the accounts it is handed, checks them, and writes new values back; it stores nothing between calls. This split, all state in accounts and all logic in programs, is what makes financial state legible: to know a market's condition you read its accounts, and to change it there are only the program's declared entry points.

## Instruction Handlers Are the Only Legal State Changes

Those entry points are **instruction handlers**: the onchain functions a program exposes. The input each one processes is an **instruction**: which handler to run, the list of accounts it may touch, and the arguments. One word for two things confuses everyone, so this book always says "instruction handler" for the function and "instruction" for its input. Good financial design keeps the mapping strict: one handler, one state transition (deposit, settle, cancel, liquidate), so the program's API is the state machine's edge list.

**[FIGURE: An instruction arriving at a program. The instruction shown carrying its three parts (handler name, account list, arguments), the program routing it to one handler, and the handler reading and writing two of the listed accounts.]**

## Callers Supply the Accounts, So Programs Must Check Them

Every instruction declares up front which accounts it touches, which is what lets the runtime execute non-overlapping transactions in parallel. The consequence that shapes this whole book: programs do not look accounts up, callers hand accounts in, and every account a caller hands you is a claim to verify. The validation discipline in Financial Programming Concepts in Solana exists because of this one design fact.
