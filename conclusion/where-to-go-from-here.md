# Chapter 21: Where to Go From Here

The Introduction promised settlement that is atomic and global, one set of accounts every party reads, fees that ignore the amount, markets that never close, rules that run as instruction handlers, assets of every kind, and distribution the moment a program is deployed. You have now built programs that rely on each of those, and what is left is choosing what to build next.

## What You Can Build Now

You can take a financial product you understand in the real world and lay it out as accounts, handlers, and invariants, because you have watched it done ten times.

You can read somebody else's program and ask the right questions:

- Which accounts does it check, and which does it trust?
- Who holds each authority, and what can they move?
- Once funds go in, can anyone freeze them, and what releases them?
- What happens at the edges: an empty pool, a zero amount, the last second before a deadline?
- Which way does each division round, and can any multiplication overflow?
- Can every participant get their assets out of every state?

An auditor starts with the same questions and goes much further.

You can iterate with an AI as a peer: the companion AI plugin applies this book's rules to generated code, and you can now see when that output is wrong before it holds anyone's assets.

You can reason about who earns what, and why anyone takes part. Every program chapter said what its operator and its users each get from it, and said plainly when a program has no operator at all.

You can take responsibility for a program once it holds other people's assets: the *Operating Financial Software* chapter covers testing its edges, waiting for finality, limiting what its admin can do, auditing it with a verified build, and monitoring it after launch.

## The World Still Runs on Business Hours

Look away from the chain for a moment, at what the people around you deal with every week.

A café hands a percentage of every sale to the card networks and processors, and on a four dollar coffee the fixed part of that fee often costs more than the percentage does. Someone sending money to family abroad pays a rate set by which two countries they happen to be standing in, which in some corridors is more than 20%.[^remittance-corridors] A savings deposit earns close to nothing while the bank lends it out at a higher rate and keeps the difference. And the payment behind each of them settles only on a banking day: a transfer sent on Friday evening arrives on Monday, or on Tuesday after a public holiday.

Every one of these has the same structure: parties standing between two people who have business with each other, each taking a cut and adding a delay, and a set of hours during which the arrangement operates at all. A program does not remove the need for underwriting, and it does not make a stranger's credit risk disappear. What it removes is the intermediary whose job was holding the funds and keeping the record, which a vault and an account already do, for a fraction of a cent, at three in the morning on a Sunday.

## The Best Products Never Mention the Chain

The café owner, the sender, and the saver do not want a blockchain. They want to keep what they send, and a better rate on what they save. The onchain products that have found real users are the ones a user can describe without saying the word: dollars sent abroad that arrive in seconds, dollars held in an account outside the banking system of the country they live in.

So aim at consumers and businesses rather than at a crypto audience. In practice that means:

- Quote everything in dollars and in time, whether it is a rate, a limit, or a settlement time, never in basis points, token symbols, or pool utilization.
- Keep private keys and signing behind the product. Someone should be able to use it having never downloaded wallet software or held a token deliberately, and never learn that they now hold one.
- Put the benefit on the front page in the user's own words: "get paid the day you invoice", "spend without selling your shares", "nobody can walk off with the pot".
- Say the risk in the same plain words. Somebody spending against their shares needs liquidation explained on the first screen, and a rate that comes from borrowers can fall when borrowing does.

## Products That Remove a Cost or a Delay

**An account that pays like a market and still handles traditional wires.** A business keeping its balances in USDC settles with anyone else inside the system in seconds, at any hour, and earns a rate that comes from what borrowers pay rather than from what a bank has left over. It still needs an IBAN for the supplier who can only receive a bank transfer, SWIFT for the ones abroad, and local rails for payroll. The product moves at the speed of the legacy system where it has to, and settles instantly everywhere else. The rate comes from the lending market the *Lending and Borrowing* chapter builds, and the pooled accounting from the *Managed Fund* chapter. The hard parts are not in the program: banking partners, the licenses that let dollars cross between the two systems, and the checks a bank is required to run on both sides of every transfer.

**Savings that earn what borrowers pay, less the market's cut.** The deposit side of the *Lending and Borrowing* chapter, with a balance, a rate, and a withdraw button in front of it and nothing else on the screen. State first that deposits earn interest because they are lent out, so when most of the pool is on loan, the cash left in the reserve may not cover a withdrawal until borrowers repay. A depositor should read that on the screen before they deposit, not learn it from a refused withdrawal.

**Spending against your shares instead of selling them.** Someone holding NVDAx who needs two thousand dollars can sell, ending a position they wanted to keep and in many countries creating a tax bill, or borrow against it and keep it. The second option uses the whole lending market the *Lending and Borrowing* chapter builds: shares as collateral, a price from a price feed as covered in the *Offchain Truth* chapter, and a liquidation path when the collateral falls. Around it sits a card, a spending limit, and a warning that arrives long before a liquidator does.

**A pot your friends collect when you skip a week.** Five friends stake fifty USDC each at the start of the month, and whoever misses their target loses their stake to the ones who did not. The *Betting Market* chapter's parimutuel pool settles one winning outcome per event, so extend it to settle several at once: stakes in a vault, one settlement, winners split the pot. Who ran is an offchain fact, signed by someone the program trusts, as the *Offchain Truth* chapter covers.

**A savings club with no bookkeeper.** Everyone pays a fixed amount in each month, one member takes the whole pot each round, and each member's turn comes once. People in many countries run one, under a different name in each. It is a tanda in Mexico, a susu in West Africa and the Caribbean, a hui in China and Vietnam, and a chit fund in India. Economists call all of them a rotating savings and credit association, or ROSCA.[^rosca-scope] A program can hold the pot and run the rotation, but it cannot make a member who has already been paid keep contributing. That still needs collateral, or the social pressure the organizer supplied. Build it from contributions paid into a vault, the rotation as a state machine, deadlines against the clock as the *Time* chapter describes, and the *Escrow* chapter's vault with a PDA as its authority.

**A rental deposit that pays its interest to the tenant.** In most places, a month or two of rent sits for a year in the landlord's account or an agency's, earning for whoever holds it. Held in a vault that neither party controls, the deposit can earn interest for the tenant instead, and still be released to either side when the lease ends. Design the state where the two sides disagree about damage first, and give it a handler that releases the deposit, so it cannot be stuck there.

**Money raised from the people who already buy from you.** A roaster who needs eighty thousand dollars for a second location can raise it from the customers who drink the coffee: all-or-nothing against a deadline, refunds if the target is missed, repayment as a share of revenue. The *Fundraiser* chapter's program handles the raise almost unchanged, and the revenue share is new work. It displaces the bank and the lender repaid from a share of revenue, each with a minimum deal size below which it will not take the work.

**Cash today for an invoice due in sixty days.** A supplier ships forty thousand dollars of goods on sixty-day terms and needs the money this week, so funders advance most of the face value and are repaid when the buyer pays. Pooling and interest come from the *Lending and Borrowing* chapter, repayment runs through escrow, and whether the invoice was paid is an offchain fact, which makes the *Offchain Truth* chapter the one this product depends on most. The credit risk stays where it always was, on the buyer. What goes away is the size floor: a program costs the same to run for a 4,000-dollar invoice as a 400,000-dollar one.

**Pay that arrives the day the work is signed off.** A contractor in another country is usually paid when the next batch runs, and the cross-border transfer can take a large percentage of their pay before it arrives. Paid on approval, for a flat fee of a fraction of a cent, they receive their pay sooner and keep nearly all of it. The client funds a vault when the work is agreed, as the *Escrow* chapter's maker does, and a handler the client signs releases it to the contractor.

**Payouts with no claim to file.** A flight lands three hours late; a region gets no rain for a month. Where the fact is measurable and comes from a source both sides agreed on in advance, the payout is a rule instead of a claims department: a pool that pays a fixed amount when the measurement crosses a line. Build the pool from the *Betting Market* chapter's accounting and take the measurement as the *Offchain Truth* chapter describes. This is insurance, and regulators classify a product by what it does rather than by what it is built on.

**Company cash that can move over the weekend.** Treasury cash that cannot be moved or redeemed from Friday evening to Monday morning can be held in a managed fund instead, and withdrawn at any hour as the holder's share of each asset the fund holds. The *Managed Fund* chapter builds that program, with a manager who may change the allocation and a curator who limits what it may hold, and the *Operating Financial Software* chapter sets the limits on an operator's power.

## The Problems Nobody Has Solved Yet

Two problems remain open: one where the program exists and no product has shipped, and one where no program can do the job alone.

**Savings that rise with your rent.** Rent tracks the housing market and a renter's savings do not, so every increase is a loss with no offsetting gain. Put a monthly amount into an asset that moves with the same market, and the asset's gain covers part of the next rise. The *Managed Fund* chapter's program has the parts: it takes deposits, issues shares at a share price, and holds a basket against target weights, priced as the *Offchain Truth* chapter describes. One city's rents and any tradable index of housing move together only loosely, and a renter told their rent is covered when it might not be is worse off than one never offered the product. The work is in the disclosure and the product design: saying how much of the next rise the asset is likely to cover, and how much it might not.

**Credit for people with no collateral to post.** The one lending program in this book lends only against collateral worth more than the loan, because that is the only kind of credit a program can enforce by itself. The credit most people need is the other kind, and the things that make it work, an income record, a reputation, somewhere to take a defaulter, all live offchain.

## What This Book Left Out

**The interface** was left out because it is ordinary application development. Nothing in these pages covers the screen someone taps, or the wallet connection, signing, and transaction building behind it, and all of that has libraries, examples, and plenty of people who already do it well. A good interface is what makes people adopt a financial product and keep using it, so give it as much care as the program. The program is the part this book can teach, and it has built ten of them.

**Ecosystem projects** already do several jobs a financial product needs that this book did not build. There are projects for proof of personhood, multisig wallets to hold upgrade and admin authority, services that convert between bank deposits and stablecoins, and crank turners that call your maintenance handlers on a schedule. Each has its own coding conventions and technology, so learn each one from its own documentation. The *Fundraiser* chapter covers why a product would check personhood, the *Operating Financial Software* chapter why upgrade authority belongs to a multisig, and the *Lending and Borrowing* chapter what a crank does.

**Reward distribution** got no chapter of its own, because the book already builds it twice. The accumulation factor in the *Lending and Borrowing* chapter and the proportional payout in the *Betting Market* chapter are the same accounting that pays liquidity incentives, revenue share to token holders, or a return for locking a token up.

**Vesting and streaming payments** have no chapter of their own.

**Governance** is absent. Most programs here have an operator with a private key, and admin power is explained in the *Operating Financial Software* chapter. Replacing that private key with a voting process is a separate design problem.

## Build One, Then Have It Audited

Pick the smallest product you want to exist, for a person you can name. Draw its state machine before you write a handler. Make sure every participant can get their assets out of every state the program can stop in. Write the tests that drive the machine down every path, especially the ones that pay tokens out, and the invariant tests that assert what must never change.

Then have it audited by at least one reviewer who did not work on it.

Find out how it holds up on devnet, and when you and your reviewers are satisfied, deploy to mainnet.

Find someone whose money is stuck behind a weekend, or losing a percentage to fees nobody asked them to agree to, and build the financial app they would use without ever wondering what it runs on.

New chapters, corrections, and editions are announced at @QuicknodeSolana on X, which is also the fastest way to ask a question or suggest what the next edition should cover.[^follow-quicknode-solana]


[^remittance-corridors]: The Introduction's note on remittance costs gives how many corridors charge this much, and the World Bank source for them.

[^rosca-scope]: The World Bank's Global Findex measures informal saving-club membership country by country, at [globalfindex.worldbank.org](https://globalfindex.worldbank.org). The practice is commonest where formal bank accounts are least available.

[^follow-quicknode-solana]: [x.com/QuicknodeSolana](https://x.com/QuicknodeSolana).
