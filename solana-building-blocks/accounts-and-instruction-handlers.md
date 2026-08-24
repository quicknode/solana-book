# Chapter 2: The Core Building Blocks of Solana

Nearly every generic blockchain introduction describes it as a "shared ledger". This is vague: shared how, and with whom? And most of what a program stores is not a balance at all, so it would never appear in a ledger anyway.

Solana - or more specifically, Solana mainnet and devnet - is better understood as **one giant computer that spans the world**. It stores data, it runs programs, and anyone on earth can use it. This chapter is a tour of that computer, taken the way every user takes it: as two people, Alice and Bob, paying each other.

## A User's Public Key Is Their Address

Meet Alice. Alice has a **key pair**: two mathematically linked keys. Her **private key** is kept secret, stored securely on her device, and is used to sign. The matching **public key** can be shared with everyone, and is used to check those signatures: a valid signature proves that the holder of the private key, and nobody else, produced it.

On Solana, as with most blockchains, the public key does double duty: it is also Alice's **address**, the identifier anyone can use to find her and transact with her. And "key" is not a metaphor: Solana public keys are points on a cryptographic curve, so this book draws the network exactly that way, as a curve with addresses sitting on it.

At Alice's address lives Alice's **account**: some data with an address. Her account holds a small balance of **SOL**, the network's native token, which pays the deposit on the space her account occupies (a mechanism called rent) and the fees on her future transactions. Anyone who knows Alice's address can look up her account, see that balance, and send her more SOL; what nobody can do without her private key is spend it.

![Alice's public key is her address, a point on the curve; her private key stays on her device.](figures/alice-on-the-curve.svg)

That drawing sets a convention this book keeps for every figure that follows. **A dot sitting on the curve is an address with a private key behind it**, so someone can sign for it. The figures never label those dots, because the dot's place on the curve already says it. Later you will meet addresses drawn *off* the curve, listed instead with the **seeds** (the inputs) they were derived from; those have no private key, and no one can sign for them directly.

> **Key pairs are random, and that is safe.** Nobody issues Alice her key pair: her device generates it from random bytes, with no registry to consult and no permission to ask. That only works because collisions are, in practice, impossible. A Solana private key is drawn from a space of 2^256 possibilities, a number on the order of the count of atoms in the observable universe. If every person on earth generated a billion key pairs per second, the expected wait before any two ever matched would still be billions of times the age of the universe. When this book says an address "belongs" to Alice, that is the entire basis of the claim: nobody else will ever roll her number.

## There Is More Than One Solana Computer

The curve in the figure is labeled **Solana devnet**, because there is more than one Solana computer. Each running instance is a **cluster**: the same software, a separate world.

| Cluster      | Purpose                                       | Assets have value?  | Where it runs                |
| ------------ | --------------------------------------------- | ------------------- | ---------------------------- |
| **mainnet**  | Production: where real financial products run | Yes                 | Globally                     |
| **devnet**   | Identical machinery for building and testing  | No: tokens are free | Globally                     |
| **localnet** | Development and fast test loops               | No                  | Locally, on your own machine |

There is also **testnet**, where future versions of the Solana software itself are tested before a release reaches mainnet. Other clusters are started up now and then to try out a single new feature. Those exist to test the network itself. Your own work happens almost entirely on localnet and devnet: localnet for the fast build-and-test loop, then devnet for a rehearsal on the same machinery real users will meet. Mainnet is where a finished program goes live. Assets there have real value, which is why a program should be thoroughly audited before it goes live there.

Each cluster is reached at a URL. Programs and wallets never talk to the network directly: they send transactions to an **RPC endpoint**, a server that holds the cluster's state and relays transactions into it. The endpoint URL is the one setting that decides which Solana computer your code is talking to, so moving work from localnet to devnet to mainnet is a change of configuration rather than of code. The Solana Foundation runs a public endpoint for each cluster, rate limited and meant for learning and light development; anything with real users runs against a dedicated endpoint from an RPC provider instead. Quicknode, this book's publisher, is one of several.

Alice's SOL is devnet SOL: think of it as the pretend money from a board game, which spends exactly like the real thing inside the game and buys nothing outside it. It cost her nothing: devnet SOL and devnet USDC are given away free, to any address that asks.[^faucets] Alice's address is the same on every cluster; the *account* at her address exists per cluster, and nothing in this book needs real money to work through.

## Receiving Needs No Signature, Spending Does

Meet Bob. Bob has his own key pair, and his public key is another point on the same curve. At Bob's address lives Bob's account, holding a small balance of SOL from the same faucet. To send something to Bob, Alice needs only his address; to spend whatever arrives there, Bob needs the private key that matches it. That asymmetry is the whole payment model: receiving needs no signature, spending does.

![Bob joins the curve: his public key is his address, alongside Alice's.](figures/alice-and-bob-on-the-curve.svg)

## Users Interact With Programs and Each Other by Sending Transactions

Alice wants to send Bob some SOL. The only way to change anything on this computer - move a balance, store data, anything - is to send it a **transaction**.

A transaction carries one or more **instructions**, and each instruction is addressed to an **onchain program**: the programs that run on this giant computer. Just like people, every program has its own address on the same curve:

- The **System Program** sits at a well-known address, and creates accounts and transfers SOL.
- The **Memo Program** sits at another, and writes notes into the transaction log.
- The programs in this book each get an address of their own the day you deploy them.

![Programs sit on the same curve as people: the System Program and the Memo Program each have an address, and each exposes its instruction handlers.](figures/programs-on-the-curve.svg)

An instruction names which of the program's **instruction handlers** to run (the onchain functions a program exposes), the accounts the handler may touch, and the arguments. Good financial design keeps the mapping strict: one handler, one state transition (deposit, settle, cancel, liquidate), so the handlers a program exposes are exactly the moves its state machine allows.

> **An instruction and an instruction handler are two different things.** They are the two halves of every call, and each has its own name:
>
> - An "instruction" is the input a transaction carries: which handler to run, which accounts it may touch, and the arguments.
> - An "instruction handler" is the onchain function that runs.
>
> Some material is loose about this and uses "instruction" for both. You will read "this program has five instructions" meaning five functions, and the interface file Anchor generates for a program lists its functions under `instructions`. Where you meet "instruction" and it plainly means a function, read it as "instruction handler".

Watch Alice run her first transaction. It carries two instructions: the first tells the System Program's `transfer()` handler to move 0.05 SOL from her account to Bob's, and the second tells the Memo Program to write "thanks" to the log.

The transfer instruction does not actually say 0.05 SOL. It says 50,000,000 **lamports**, SOL's **minor unit**: one billion lamports make one SOL, the way one hundred cents make one dollar. Balances are stored as, and calculated with, integers of lamports - the balance an explorer displays as 1 SOL is the integer 1,000,000,000 - and every asset in this book gets the same treatment. The *Arithmetic of Money* chapter builds the full discipline on this one idea.

> **Why "lamport"?** The unit is named for Leslie Lamport, the Turing Award-winning computer scientist whose work on time, ordering, and consensus in distributed systems underpins every blockchain, Solana included.

![Alice's transaction carries two instructions: a System Program transfer of lamports to Bob, and a memo that writes "thanks" to the log.](figures/alices-transaction.svg)

## A Transaction's Instructions Succeed or Fail Together

Alice's transaction executes atomically: every instruction succeeds, or the whole transaction never happened. If Alice's balance cannot cover the 50,000,000 lamports she wants to send Bob, the transfer fails, and the memo is never written either, even though the Memo Program itself had no complaint. If both instructions succeed, the state changes: Bob's account balance rises by 50,000,000 lamports, and the log says thanks. There is no partial state, no "the payment cleared but the delivery failed."

For financial software, atomicity is a primitive you design with. Settlement risk between steps simply does not exist inside a transaction: the escrow you will build moves Alice's payment and Bob's stock in one atomic unit, and no ordering of failures leaves one side paid and the other empty-handed. Sequencing turns from a race into a pattern: a lending market can require its price refresh in the same transaction as the action that depends on it, so "acting on stale state" is not a bug to chase but a transaction that cannot be built.

> **Flash loans are atomicity turned into credit.** A **flash loan** borrows in a transaction's first instruction, uses the money in the middle, and repays in the final instruction. If the repayment fails, the borrow itself is unwound: the lender risked nothing, so the loan needs no collateral. Whole categories of arbitrage and liquidation strategies exist only because transactions are all-or-nothing.

![A flash loan is atomicity turned into credit: four instructions across three programs commit together, or the failed repayment unwinds the borrow itself.](figures/atomic-transaction.svg)

The budget for all this is metered in **compute units** per transaction, and the meter shapes financial design directly. It is why the order book exchange later in this book credits balances instead of making one transfer per fill, and why work gets consolidated everywhere you look.

## Every Transaction Is Signed

One thing made Alice's transaction valid: before sending it, she signed it with her private key. The signature is cryptographic proof that the holder of whatever private key matches this public key authorized this exact transaction - not a similar one, not an edited one. Anyone can use the public key to verify that proof. You already use this primitive daily: your bank card has a private key on its chip, and every time you tap, that key produces a fresh proof that the card is genuine and issued by your bank.

The signature is also a grant of authority. By signing, Alice authorizes what the transaction does in her name:

- **Debit her accounts.** The `transfer()` handler may move her lamports because the account losing them belongs to a signer.
- **Pay the transaction fee**, the fraction of a cent the transaction costs, which comes out of her balance.
- **Let the programs it invokes change her accounts** in whatever way the instructions specify: create them, write to them, or close them.

That is why the transfer could debit Alice's account: she signed the transaction that carried it. It is also why Bob's balance rose without Bob doing anything - receiving requires no signature from the recipient - while nothing will ever leave his account until a transaction *he* signs asks for it.

Solana has a general word for a right held this way. An **authority** is the address whose signature a particular action requires: a program records that address in an account, and the handler checks that the transaction carries its signature before doing the work. The word is always paired with the action it governs, and each pairing is a separate power held by a separate address:

- A token's **mint authority** is the only address that may create new supply of it.
- That token's **freeze authority** is the only address that may freeze a holder's account.
- A program's **upgrade authority** is the only address that may replace the program's code.
- An exchange's **market authority** sets the market's parameters and collects its fee.

Different powers, one mechanism, and underneath all of them the same question: whose signature does this transaction carry?

> **What if funds need more than one person's approval?** A transaction can carry several signatures, so an instruction handler can require two, or ten, rather than one. For standing control of funds there is a **multisig**: an account that records a set of owners and how many of them must agree, and acts only once enough have. Anywhere this book names an authority (a mint authority, a market's fee authority, a program's upgrade authority), that authority can be a multisig rather than one person's wallet, and for anything holding real money it usually is.

A **wallet** is a key pair being used this way, with the private key stored somewhere safe. Stripped of its apps and branding, a saved wallet is startlingly small: a keypair file on disk, like the `id.json` file the Solana CLI creates, is an array of 64 numbers, the bytes of the two keys. Whoever has those bytes *is* that wallet, which is the entire custody problem in one sentence.

> **64 bytes, but only 32 are secret.** An `id.json` keypair file holds the 32-byte private key followed by the 32-byte public key. The second half is a convenience, not a necessity: the public key is mathematically derived from the private key, so software can recompute it from the first 32 bytes at any time. The private key is the only secret, and the only part that needs protecting.

## Accounts Store Data, Not Just SOL

Alice's account holds a balance and nothing else, and so does Bob's. That is the smallest an account gets. An account in full is some data with an address, and nearly all data on Solana lives in accounts: wallets, token holdings, program code, and every record a financial program keeps.[^state-compression] A financial program's whole ledger is a set of accounts.

In a program, the data is a Rust struct; on the chain, it is bytes, with a lamport balance and an **owner program** that can change this account: users (or other programs) invoke that program to modify the account. Alice's account is the simplest case: no data to speak of, a lamport balance that *is* her SOL, and the System Program as its owner, which is why it was the System Program's `transfer()` handler that moved her lamports to Bob.

![One account, dissected: an address, an owner program, a lamport balance, and data bytes that the owning program reads as a Rust struct.](figures/account-dissected.svg)

Every account holds a lamport deposit proportional to its size, called **rent**; an account funded to the **rent-exempt** minimum lives forever, and today an account cannot be created with less. The deposit is not a fee: close the account and the lamports come back. It is why part of Alice's balance is spoken for by the space her account occupies, and why a large account costs more to keep than a small one.

The programs themselves are stored the same way, and it takes more than one account to do it. Deploying a program writes its compiled code into an account of its own, separate from the address you call, which is why deploying costs rent in proportion to the size of the binary. Every piece of data the program manages (every market, offer, and balance) lives in its own account elsewhere again. A program is pure logic: it reads the accounts it is handed, checks them, and writes new values back, and the only way to change the state it manages is to run its instruction handlers. This split, logic in program accounts and state in data accounts, is what makes financial state easy to read: to know a market's condition you read its accounts, and to change it there are only the program's declared entry points.

> **A deployed program is two accounts, and briefly three.** Under Solana's upgradeable loader, the account at the program's address is a stub of 36 bytes: it is marked executable, and its data is nothing but the address of a second account. That second account, **ProgramData**, holds the compiled code, the slot the program was last deployed in, and the **upgrade authority** permitted to replace it. A third account, the **buffer**, holds the new code while a deploy or an upgrade is being written, and is closed once the write lands so its rent comes back. Newer loaders fold this arrangement back into a single account. What stays true across all of them is that a program's code is not the thing sitting at the address you call.

## Addresses Come in Three Kinds

Every account sits at a 32-byte **address**, usually shown base58-encoded. Addresses come in three kinds:

- **Public keys.** Alice's and Bob's wallet addresses are public keys: points on the curve, each with a private key that can sign for it.
- **PDAs** (program derived addresses). A PDA is computed from a program's address (its **program ID**) and some chosen seeds, and has no private key at all, so no signature for it can ever exist. PDAs can still own accounts, and the program that derived one can act as it by presenting the seeds; the PDAs chapter explains how, and why Solana keeps the word "sign" for something that involves no signature. The escrow program you will build in this book stores each offer at a PDA derived from the maker's address and an offer ID.
- **Built-in addresses.** The System Program, the two token programs, and the sysvars sit at addresses that were *chosen* rather than computed: somebody picked a readable byte string, and the runtime treats that exact address as the thing it names. There is no private key and no derivation to redo, so the address is a constant your program compares against. `SysvarC1ock11111111111111111111111111111111` is the Clock the Time chapter reads. Some of these byte strings happen to decode to points on the curve and some do not, and it buys nobody anything either way: no private key is known for any of them.

![Only the first has a private key behind it; the other two are derived, and nobody can use a private key to sign for them.](figures/address-types.svg)

Because addresses are how everything is found, financial programs lean on *derivable* addresses: put the market's pair, the user's key, or the offer's ID into the derivation, and anyone can compute where the account must be, no lookup table required.

## Users Use the Token Program to Send Tokens to Each Other

A week later it is Bob's turn to pay. He owes Alice twenty-five dollars, and dollars on Solana typically mean **USDC**, the most popular **stablecoin**: a token that tracks the dollar one for one.

SOL is the network's **native token**, the asset it understands without any program's help. Every other token is defined by a program instead, and is formally an **SPL token**, after the Solana Program Library the original token program shipped in. Most people simply call all of them tokens, and so does this book. Each distinct token is identified by its **mint**, the account that is the asset's identity onchain, and the Tokens chapter covers mints properly.

Bob's SOL lives in his own account, but his USDC does not: a token balance lives in a **token account** of its own. The one holding a given wallet's balance of a given token sits at an address anyone can derive from the two. Bob does not need to ask Alice where her USDC lives. His wallet computes where her account must be, and sends the tokens there. The Tokens chapter covers token accounts properly.

So Bob signs a transaction carrying one instruction: the **Token Program**'s `transfer()` handler, moving 25 USDC from his USDC account to Alice's. The instruction says 25,000,000, because USDC's minor unit is a millionth, the same integer discipline as lamports. Bob's signature is what authorizes the debit, exactly as Alice's authorized hers: the Token Program checks that the account being debited belongs to Bob, and that Bob signed. Alice's USDC balance rises from 975 to 1,000 with no signature from her.

![Each token account’s address is derived from its owner, the token program and the mint, so nobody chose it.](figures/bobs-usdc-transaction.svg)

## Instructions Supply the Accounts, Instruction Handlers Check Them

Look once more at Bob's transfer instruction: it names every account it touches - Bob's USDC account, Alice's USDC account, and Bob as the signing owner. Every instruction declares its accounts up front like this, which is what lets the runtime execute non-overlapping transactions in parallel. The consequence that shapes this whole book: programs do not look accounts up. Instructions supply the accounts as arguments, and instruction handlers check them, because every account a caller hands in is a claim to verify. The Token Program did exactly that when it checked that the debited account was Bob's; the validation discipline in Financial Programming Concepts in Solana exists because of this one design fact.

## What You Learnt

Two payments toured every building block the rest of the book uses:

- A **key pair**'s public key is an address, and at an address lives an **account**: a user's holds their balance of **SOL**, stored as an integer of **lamports**, its minor unit.
- **Every transaction is signed.** The signature proves the holder of the private key authorized the transaction, and it is what allows the transaction to debit the signer's accounts and pay its fee: all authority reduces to whose signature a transaction carries.
- A transaction bundles **instructions**, each addressed to a program's **instruction handler**, and they succeed or fail together: atomicity is a primitive financial software designs with.
- Accounts store data as well as balances: bytes at an address, with a lamport balance and an owner program that users invoke to change them. A deployed program takes accounts of its own, and the state it manages lives in accounts separate again.
- Space is paid for with a **rent** deposit proportional to the account's size, and it is a deposit rather than a fee: closing the account returns it.
- Addresses come in three kinds: **public keys**, which private keys sign for; **PDAs**, which have no key, where the deriving program "signs" by presenting the seeds; and **built-in addresses**, chosen rather than computed, with neither a key nor seeds.
- Instructions supply the accounts as arguments; instruction handlers check them.

[^faucets]: The `solana airdrop` command sends devnet SOL, as does the faucet at [faucet.quicknode.com/solana](https://faucet.quicknode.com/solana). Circle's faucet at [faucet.circle.com](https://faucet.circle.com) does the same for devnet USDC.

[^state-compression]: The "nearly" is State Compression, a technique for storing bulk data offchain with onchain proofs. None of the financial state in this book uses it.
