# Solana Building Blocks

Not yet drafted. This chapter is everything Solana-mechanical that the rest of the book stands on, consolidated in one place so the program chapters never stop to explain the platform. Planned sections:

## Money Lives in Accounts, Logic Lives in Instruction Handlers

The account model as a data model: financial state is accounts, programs are stateless logic, and every state change is an instruction handler invocation. Why this is different from contract storage, and why it suits financial software.

## Tokens: Mints, Token Accounts, and Minor Units

The asset layer. Mint accounts control supply; token accounts hold balances; associated token accounts make addresses derivable; decimals define the minor unit every program actually calculates in. Mint authority and freeze authority as the levers of issuance and compliance.

## The Token Extensions That Matter for Finance

Transfer fees, transfer hooks, confidential transfers, permanent delegate, interest-bearing, and non-transferable: what each does, and when financial software needs it. Writing code that works with both the Classic Token Program and the Token Extensions Program.

## PDAs: Addresses a Program Can Sign For

Deterministic addresses from seeds; recording who may move funds and verifying it on the way out; why a vault owned by a PDA is the foundation of every program in this book.

## Rent and the Account Lifecycle

Rent exemption, account growth, closing accounts and reclaiming deposits. Stranded-funds bugs and why every account someone paid to create needs a path to being closed.

## One Transaction, All or Nothing: Atomicity, Flash Loans, and Composed Settlement

A Solana transaction either fully happens or fully does not, and that atomicity is itself a financial primitive: flash loans, atomic pay-and-settle across programs, and multi-step settlements with no counterparty risk between the steps.

## Time Onchain: Slots for Adversarial Logic, Timestamps for Humans

Slots versus unix timestamps, what each can and cannot promise, and why deadlines that adversaries care about are counted in slots.

## Cranks: Incentivized Automation for Work Nobody Owns

Funding settlement, expiry processing, order matching: work that must happen but that no user has a reason to pay for. Permissionless crank instruction handlers, incentives for turning the handle, and designing handlers to be safely callable on a schedule.
