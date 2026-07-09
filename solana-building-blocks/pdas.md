# PDAs

A **program derived address** (PDA) is an address computed from a program's id and some chosen seeds, deliberately constructed to have no private key (a stored **bump** byte pushes the result off the curve where keys live). Nobody can ever sign as a PDA with a key; the owning program, and only it, can sign as the PDA inside its own instruction handlers by presenting the seeds.

That one mechanism does three jobs in every chapter of this book:

## Seeds Make Addresses Derivable

The market for a token pair, a user's position in it, and the offer with a given id all live at addresses anyone can compute from the seeds, so exactly one thing exists per key and nobody has to remember where anything is.

## Seeds Make Relationships Verifiable

An account that claims to be "the vault for this market" either derives from the market's seeds or it does not. Combined with stored addresses (`has_one`), derivation is how a program proves that the accounts a caller supplied belong together.

## PDA Authority Makes Custody Programmatic

A vault whose authority is a PDA is a vault whose funds move only along the code paths the program defines. The phrase "the program holds the funds" means, precisely, this, and it is the foundation of every escrow, pool, and market in the book.

![Seeds plus the program id derive an address off the curve, where no private key exists; only the owning program, presenting the same seeds, can sign as it.](figures/pda-derivation.svg)
