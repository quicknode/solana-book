# Chapter 4: PDAs: How Solana Programs Store Data

A **program derived address** (PDA) is an address computed from a program's id and some chosen seeds, deliberately constructed to have no private key (a **bump** byte, chosen during derivation so the result lands off the curve where keys live, and usually stored so it never needs re-finding). Nobody can ever sign as a PDA with a key; the program whose id derived the address, and only it, can sign as the PDA inside its own instruction handlers by presenting the seeds.

PDAs are how Solana programs store data. Taken together, a program's PDAs behave like a **key/value store**: the seeds are the key, and the account's data is the value. ("Key" here means *identifier*, the same word a database would use; it has nothing to do with public or private keys.) Every program in this book keeps its state this way:

- The escrow stores each offer at `"offer"` + the maker's address + an id.
- The fundraiser stores its terms at `"fundraiser"` + the maker's address, and one receipt per backer at `"contributor"` + the fundraiser + the backer's address.
- The order book stores each market at `"market"` + the two mints.
- The lending market stores each borrower's loan file at `"obligation"` + the market + the borrower's address.
- The perpetual futures venue stores each position at `"position"` + the pool + the owner + the side.

That one mechanism does three jobs in every chapter of this book:

## Seeds Make Addresses Derivable

The market for a token pair, a user's position in it, and the offer with a given id all live at addresses anyone can compute from the seeds, so exactly one thing exists per key and nobody has to remember where anything is.

## Seeds Make Relationships Verifiable

An account that claims to be "the vault for this market" either derives from the market's seeds or it does not. Combined with stored addresses (`has_one`), derivation is how a program proves that the accounts a caller supplied belong together.

## PDA Authority Makes Custody Programmatic

A vault whose authority is a PDA is a vault whose funds move only along the code paths the program defines. When people say that "the program holds the funds", they mean that the funds are stored in a token account that the program controls, and that moving them means invoking the program's instruction handlers. That arrangement is the foundation of every escrow, pool, and market in the book.

![Seeds plus the program id derive an address off the curve, where no private key exists; only the program whose id derived it, presenting the same seeds, can sign as it.](figures/pda-derivation.svg)

> **Why seeds? Why a program does not simply get authority.** Readers arriving from Ethereum, where a contract authorizes actions just by being the caller, often ask why Solana bothers: the runtime knows which program is executing, so why not let a program move funds from any token account that names it as authority? Each part of the seed mechanism closes a real hole.
>
> The program's own address cannot hold the power, because a private key for it exists: program ids sit on the curve like any wallet, generated as key pairs at deployment, and nothing proves that key was destroyed. A PDA provably has no key, so the only path to signing as it is the deriving program's own instruction handlers.
>
> Seeds make authority **explicit instead of ambient**. A program that automatically wielded power over every account naming it would wield that power whenever it runs, whoever invoked it, for whatever reason, and the token program could only ever learn "this program is executing", never "this handler means to spend from this particular vault". Ambient authority is what turns a program into a **confused deputy**, an entity with power tricked into using it on an attacker's behalf; The Adversary examines the bug class in detail. With seeds, nothing is authorized by default: a handler presents the seeds of the one identity it wields, in the one instruction that wields it.
>
> And seeds partition the blast radius. A program as a single authority would hold one master key over everything it ever touched; seeds hand it thousands of narrow ones. The vault for one market is a different identity from the vault for another, so a code path signing with the first market's seeds cannot move the second's funds, even under a bug. (Derive a PDA from an empty seed list and the single "the program itself" identity reappears as a special case; seeds generalize one identity into as many as a program needs.)
>
> What remains is one rule for everyone: the token program checks only that **the authority signed**, identically for a wallet holding its private key and for a program presenting its seeds. Programs join the same rule people use rather than receiving a special one.

## Storage Is Paid For: Rent

Every account, PDA or otherwise, holds a lamport deposit proportional to its size, called **rent**; an account funded to the **rent-exempt** minimum lives forever, and today an account cannot be created with less. The deposit is not a fee: close the account and the lamports come back.

For financial software, rent is small but real money with a lifecycle, and the design rule is simple: whoever wants the account pays for it. The maker funds her offer account and vault; the taker funds his own token account if he never held that token. Rent burdens follow the party who chose to create the state, and every deposit should find its way home when its account closes; the state-machine chapter of Financial Programming Concepts in Solana turns those exits into a rule.

![The rent lifecycle: the maker funds the offer and vault at creation, both exits refund every lamport, and the crossed-out path is the stranded-deposit bug.](figures/rent-lifecycle.svg)

## What You Learnt

- A **PDA** is derived from a program's id and seeds, has no private key, and only the deriving program can sign as it.
- A program's PDAs form a **key/value store**: the seeds are the identifier, the account's data is the value.
- Seeds make addresses derivable and relationships verifiable, and PDA authority over a vault is what "the program holds the funds" means.
- Storage is paid for with a **rent** deposit that returns when the account closes, and whoever wants the account pays for it.
