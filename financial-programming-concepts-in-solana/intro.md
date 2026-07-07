# Financial Programming Concepts in Solana

Not yet drafted. The opening of the money-specific half of the book's foundations, built around one framing idea:

## Financial Software Is a State Machine, and Every State Needs an Exit

Created, funded, settled, cancelled, liquidated: every financial program in this book is a set of states and the legal transitions between them. Model the states explicitly, make every transition an instruction handler, and give every state an exit, so no path strands anyone's funds. An open offer can be taken or cancelled; an open bet pays out, refunds, or closes; a loan repays or liquidates. The chapters that follow this one supply the arithmetic, the trust model, the threat model, and the operating discipline that make those state machines safe to run with real money.
