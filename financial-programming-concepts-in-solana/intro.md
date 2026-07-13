# Chapter 6: Financial Programming Concepts in Solana

Solana Building Blocks covered the platform. This part covers the money: everything financial you will ever build reduces to calculating with it, bringing facts about it onchain, defending it, and operating a program that holds it. All of it applies to every financial product in this book, starting with one framing idea that shapes them all.

## Financial Software Is a State Machine, and Every State Needs an Exit

Every financial product in this book is a small number of states and the legal transitions between them. An escrow offer is open, then taken or canceled. A bet is placed, then paid, refunded, or closed. An order is open, partially filled, filled, or canceled. A loan is healthy, unhealthy, repaid, or liquidated. Before writing any handler, draw this machine: name the states, name every legal transition, and check that nothing is missing.

The design rules fall straight out of the drawing:

- **One instruction handler, one transition.** `take_offer` moves an offer from open to taken and does nothing else. Handlers that perform two transitions, or half of one, are where partial-state bugs live.
- **Make the state explicit.** A status enum on the account, or, often better, the account's own existence: the betting market's bet account closes when the position ends, so "already claimed" is not a flag that can desynchronize but an account that is gone.
- **Guard every transition by state, not just by signer.** Betting on a settled event, canceling a filled order, and liquidating a healthy loan must fail because the *state* forbids them, with an error that names the rule.
- **Every state needs an exit, for every participant's money.** This is the rule that finds missing requirements. An escrow with no cancel handler strands the maker's tokens the day nobody takes the offer. A betting market with no cancel-and-refund path strands every stake the day the event is called off. Walk each state and ask: how does each party's money leave from here? If any state has no answer, the program has a stranded-funds bug that no amount of correct arithmetic will fix.
- **Terminal states drain and close.** An exit is not finished until the vault is empty, the accounts are closed, and the rent is back with whoever paid it.

The rent deposits from Solana Building Blocks are where this rule meets real money: whoever paid an account's rent gets the deposit back on every path (take, cancel, claim, refund), and a program that leaves fragments of state behind on some paths has a slow leak of other people's lamports. An account that can never close is a deposit stranded forever, so for every account your program creates, name the handler that eventually closes it; the escrow's tests assert the maker's lamports round-trip exactly, and yours should too.

Hold a program's state machine in your head and the rest of this part slots into place: the arithmetic governs what the transitions compute, offchain truth governs which transitions the outside world may trigger, the adversary attacks the transitions you forgot to guard, and testing means driving the machine down every path, especially the exits.
