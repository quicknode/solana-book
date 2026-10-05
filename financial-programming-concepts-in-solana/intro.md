# Chapter 6: State Machines

Every financial program shares one shape: a state machine in which every participant must be able to get their assets out of every state. Every account the program creates for a participant (an offer, a receipt, a bet, a position) is eventually closed, returning its rent deposit.

## Financial Software Is a State Machine

Every financial product in this book is a state machine.

- An escrow offer is open, then taken or canceled.
- A bet is placed, then paid, refunded, or closed.
- An order is open, partially filled, filled, or canceled.
- A loan is healthy or unhealthy; repaying and liquidating both move it back toward healthy.

Before writing any handler, draw this machine: name the states, name every legal transition, and check that nothing is missing.

The state drawing gives the design rules:

- **Give each transition its own instruction handler.** `take_offer()` moves an offer from open to taken and does nothing else. Handlers that perform two transitions, or half of one, create bugs.
- **Make the state explicit.** A `status` enum on the account, or, often better, the account's own existence: the betting market's `Bet` account closes when the position ends, so "already claimed" means the account is gone. Existence is better where the state is terminal, because a closed account cannot be claimed twice and holds no rent. A state inferred from other fields is worse than either; the *Betting Market* chapter shows why its event records a Draft status instead of reading one off an empty pool.
- **Check state, not just signers.** Betting on a settled event, canceling a filled order, and liquidating a healthy loan must fail because the *state* forbids them, with an error that names the rule.
- **Every participant must be able to get their assets out of every state.** If an escrow had no cancel handler, it would strand the maker's tokens if nobody took the offer. If a betting market had no cancel-and-refund path, it would strand every stake if the event was called off. Walk each state and ask: how do each party's assets leave from here? If any state has no answer, the program strands funds, and correct arithmetic will not fix that.
- **Ensure the handler that pays out the last of the vault's tokens also closes everything.** It should empty the vault, close the vault and the state accounts, and return each account's rent deposit to whoever paid it.

## Whoever Opens an Account Pays Its Rent, and Gets It Back

Whoever wants the account pays its deposit: the maker funds the offer account and the vault, and the taker funds their own token account if it does not exist yet. Closing the account refunds the deposit, as the *Core Building Blocks of Solana* chapter explains, and an account left open keeps someone else's lamports locked, so for every account your program creates, name the handler that closes it. The escrow program you will build in this book has tests asserting that the maker gets back exactly the lamports they paid, and yours should too.

![](figures/rent-lifecycle.svg)

## What You Learnt

- Every financial product is a small state machine: draw it before writing any handler, name every state and transition, and make sure every participant is able to get their assets out of every state.
- Give each transition its own handler, and check the account's state, not only who signed. Ensure the handler that pays out the last of the vault's tokens also closes the vault and the state accounts.
- Whoever opens an account pays its rent deposit and gets it back when the account closes; name the handler that closes every account your program creates.
