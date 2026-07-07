# Accounts Pay a Rent Deposit, and Closing Refunds It

Storage is paid for. Every account holds a lamport deposit proportional to its size, called **rent**; hold enough and the account is **rent-exempt** and lives forever. The deposit is not a fee: close the account and the lamports come back.

For financial software, rent is small but real money with a lifecycle, and the design questions are always the same:

## Whoever Wants the Account Pays for It

The maker funds her offer account and vault; the taker funds his own token account if he never held that token. Rent burdens follow the party who chose to create the state.

## Every Exit Returns the Deposit

Whoever paid gets the deposit back, on every path: take, cancel, claim, refund. The escrow's tests assert the maker's lamports round-trip exactly, and yours should too.

## An Account That Cannot Close Is a Stranded Deposit

Does every account someone paid for have a path to being closed? A program that leaves fragments of state behind on some paths has a slow leak of other people's lamports, and an account that can never close is a deposit stranded forever. Terminal states drain and close; the state-machine section of Financial Programming Concepts in Solana makes that a rule.

**[FIGURE: The rent lifecycle of one escrow offer. Maker's lamports flowing into the offer account and vault at creation; the same lamports flowing back to the maker on both exits (taken, cancelled); a crossed-out third path where a missing close handler leaves the deposit stuck.]**
