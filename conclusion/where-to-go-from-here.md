# Chapter 20: Where to Go From Here

Nine programs are behind you. An escrow that holds two strangers to one deal, and a perpetual futures venue that prices leverage continuously against an oracle, look like different species of software. They are not. Strip both of their subject matter and the same small machine is left standing, and the distance between them is mostly how much pressure that machine is under.

## One Pattern, Under Nine Kinds of Pressure

Every program in this book is built from the same six pieces.

**A data account holds the terms, and a separate vault holds the money.** The offer account records what the maker wants; the vault holds what the maker gave. The obligation records a borrower's debt; the reserve holds the liquidity. Keeping the promise separate from the property is what lets a program answer "who is owed what" without counting tokens, and it is why a stray transfer into a vault never unlocks anything.

**A PDA is the authority over the vault, so funds move only along code paths.** This is the entire content of the phrase "the program holds the funds". No key exists that could move that money by hand, which is a stronger guarantee than any promise an operator can make, and a heavier responsibility than any operator is used to carrying.

**One instruction handler performs one state transition.** Draw the states and the legal edges between them before writing anything, and the handler list falls out of the drawing. Handlers that do two transitions, or half of one, are where partial-state bugs live.

**Terms freeze when money commits.** The betting market copies the fee onto the event at creation; the fundraiser stamps its deadline before the first contribution. Whatever an operator can change, they cannot change it retroactively for money already inside.

**From every state, every participant must be able to get their money out.** This is the rule that finds missing requirements rather than missing code. Walk each state, ask how each party's money leaves from here, and any state without an answer is a stranded-funds bug that no amount of correct arithmetic will fix.

**Arithmetic runs in integers of minor units, multiplying before dividing, rounding against whoever could profit from the rounding.** A sub-unit leaked on every operation is not a rounding error once someone writes the loop.

Those six sentences are what this book was for. Frameworks will change under them, and they will keep being true.

## What You Can Build Now

You can take a financial product you understand in the real world and lay it out as accounts, handlers, and invariants, because you have watched that translation happen nine times with the seams left showing.

You can read somebody else's program and ask the questions that matter: which accounts are validated and which are trusted, who holds the authorities, what freezes at entry, and which state has no exit. That is the same checklist an auditor opens with.

You can work with an AI as a peer rather than an oracle. The companion AI skill will apply this book's rules to code your tools generate, and you can now tell when the output is wrong, which is the only thing that makes generated financial code safe to use.

You can reason about who earns what, and why anyone shows up. Every chapter named the operator's incentive and the user's, because a mechanism nobody is paid to run does not run.

And you can carry the responsibility that comes with all of it. Programs holding other people's money are not a place to find out whether an idea works.

## What This Book Left Out

Some things were left out on purpose, and knowing which is part of knowing the shape of the field.

**Staking and reward distribution** got no chapter of its own, though you have already met its core: the reward-per-token index inside the lending market and the parimutuel pool is the same accounting a staking program runs. What is missing is the operational half, the unbonding periods and the validator relationships.

**Vesting and streaming payments** are a natural next build and a genuinely good first project, because the state machine is small, the arithmetic is a straight line against the clock, and the failure modes are ones you have already met.

**Formal verification** appears here only as a taster. The escrow's proofs show what a machine-checked invariant looks like, but proving as a discipline, deciding what is worth proving and modelling the parts that cannot be executed symbolically, is a subject the size of this book.

**Governance** is deliberately absent. Every program here has an operator with a key, and the honest treatment of admin power is in Operating Financial Software. Replacing that key with a voting process is a real design problem and a different one.

**The interface** is absent too. Nothing in these pages covers wallets, transaction building, or the frontend, and a program with no interface reaches nobody.

## Build One, Then Have It Attacked

The gap between reading this book and being able to ship is one project wide, and it closes faster than you expect. Pick the smallest product you actually want to exist. Draw its state machine before you write a handler. Give every state an exit. Write the tests that drive the machine down every path, especially the exits, and the property tests that assert what must never change.

Then get a second opinion from somebody who was not in the room. Every wall in this book's failure-mode sections exists because someone's first opinion missed something, and an auditor is the cheapest adversary you will ever face, because that one writes you a report instead of a withdrawal.

Deploy to localnet, then devnet, and let mainnet be where a finished program goes live rather than where you find out whether it works.

## Corrections Are Welcome, and Expected

Long-lived technical books are not written once. They are corrected, edition after edition, by readers who found the sentence that was wrong.

The errata page and the companion repository are both at [thesolanabook.com](https://thesolanabook.com). If a number here does not match the code, if a mechanism has changed, or if an explanation left you stuck at exactly the wrong moment, that is worth reporting, and contributors are credited by name.

The account model has been stable since Solana launched. The arithmetic will not change. Neither will the desire of adversaries to take your assets. Build carefully, and the rest of it is detail.
