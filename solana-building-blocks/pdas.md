# Chapter 4: PDAs: How Solana Programs Store Data

A **program derived address** (PDA) is an address computed from a program's ID and some chosen seeds, deliberately constructed to have no private key (a **bump** byte, chosen during derivation so the result lands off the curve where keys live, and usually stored so it never needs re-finding). Nobody can ever sign as a PDA with a key, because there is no key, and no digital signature is ever produced. Solana keeps the word "sign" anyway: inside its own instruction handlers, the program whose ID derived the address, and only it, "signs" as the PDA by presenting the seeds, and the runtime, recomputing the derivation, grants the PDA signer status.

PDAs are how Solana programs store data. Taken together, a program's PDAs behave like a **key/value store**: the seeds are the key, and the account's data is the value. ("Key" here means *identifier*, the same word a database would use; it has nothing to do with public or private keys.) Every program in this book keeps its state this way:

- The escrow stores each offer at `"offer"` + the maker's address + an ID.
- The fundraiser stores its terms at `"fundraiser"` + the maker's address, and one receipt per backer at `"contributor"` + the fundraiser + the backer's address.
- The order book stores each market at `"market"` + the two mints.
- The lending market stores each borrower's loan file at `"obligation"` + the market + the borrower's address.
- The perpetual futures venue stores each position at `"position"` + the pool + the owner + the side.

That one mechanism does three jobs in every chapter of this book:

## Seeds Make Addresses Derivable

The market for a token pair, a user's position in it, and the offer with a given ID all live at addresses anyone can compute from the seeds, so exactly one thing exists per key and nobody has to remember where anything is.

## Seeds Make Relationships Verifiable

An account that claims to be "the vault for this market" either derives from the market's seeds or it does not. Combined with stored addresses (`has_one`), derivation is how a program proves that the accounts a caller supplied belong together.

## PDA Authority Makes Custody Programmatic

A vault whose authority is a PDA is a vault whose funds move only along the code paths the program defines. When people say that "the program holds the funds", they mean that the funds are stored in a token account that the program controls, and that moving them means invoking the program's instruction handlers. That arrangement is the foundation of every escrow, pool, and market in the book.

![Seeds plus the program ID derive an address off the curve, where no private key exists; only the program whose ID derived it can "sign" as it, and presenting the same seeds is the entire act.](figures/pda-derivation.svg)

## Storage Is Paid For: Rent

Every account, PDA or otherwise, holds a lamport deposit proportional to its size, called **rent**; an account funded to the **rent-exempt** minimum lives forever, and today an account cannot be created with less. The deposit is not a fee: close the account and the lamports come back.

For financial software, rent is small but real money with a lifecycle, and the design rule is simple: whoever wants the account pays for it. The maker funds her offer account and vault; the taker funds his own token account if he never held that token. Rent burdens follow the party who chose to create the state, and every deposit should find its way home when its account closes; the state-machine chapter of Financial Programming Concepts in Solana turns those exits into a rule.

![The rent lifecycle: the maker funds the offer and vault at creation, both exits refund every lamport, and the crossed-out path is the stranded-deposit bug.](figures/rent-lifecycle.svg)

## What You Learnt

- A **PDA** is derived from a program's ID and seeds and has no private key; only the deriving program can "sign" as it, by presenting the seeds.
- A program's PDAs form a **key/value store**: the seeds are the identifier, the account's data is the value.
- Seeds make addresses derivable and relationships verifiable, and PDA authority over a vault is what "the program holds the funds" means.
- Storage is paid for with a **rent** deposit that returns when the account closes, and whoever wants the account pays for it.
