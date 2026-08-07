# Chapter 20: Where to Go From Here

Nine programs are behind you: an escrow, a fundraiser, a betting market, an order book, two automated market makers, a lending market, a vault, and a perpetual futures venue. Between them they cover the machinery most financial products are made of.

The Introduction promised a set of properties: markets that never close, settlement that is atomic and global, one set of accounts that every party reads, rules that run as instruction handlers, fees that ignore the size of the transfer, and distribution that arrives the moment a program is deployed. Those have stopped being reasons to consider a platform. They are materials you can now work with, on the world's most active blockchain.

What is left is deciding what to build with them.

## What You Can Build Now

You can take a financial product you understand in the real world and lay it out as accounts, handlers, and invariants, because you have already done it nine times.

You can read somebody else's program and ask the questions that matter: which accounts are validated and which are trusted, who holds the authorities, what freezes at entry, and which state has no exit. That is the same checklist an auditor opens with.

You can work with an AI as a peer rather than an oracle. The companion AI skill will apply this book's rules to code your tools generate, and you can now tell when the output is wrong, which is the only thing that makes generated financial code safe to use.

You can reason about who earns what, and why anyone shows up. Every chapter named the operator's incentive and the user's, because a mechanism nobody is paid to run does not run.

And you can carry the responsibility that comes with all of it. Programs holding other people's money are not a place to find out whether an idea works.

## The World Still Runs on Business Hours

Look away from the chain for a moment, at what the people around you deal with every week.

A payment sent on Friday evening arrives on Tuesday, because the rails carrying it keep office hours and observe public holidays. A café hands a percentage of every sale to the card networks and processors, and on a four dollar coffee the fixed part of that fee often costs more than the percentage does. Someone sending money to family abroad pays a rate set by which two countries they happen to be standing in, which the Introduction's World Bank figures put above twenty percent in thirteen corridors. Money in a savings account earns close to nothing while the same money is lent out at several times that, and the gap between the two is the bank's business rather than a price the depositor could shop for.

Businesses meet the same wall from the other side. A shop owner who wants a second location either sells a slice of the business to whoever is nearby with money, or borrows through an underwriting process built for loans ten times larger. A supplier delivers goods and waits sixty days for the invoice to be paid while their own payroll runs every two weeks. Someone holding shares who needs cash for a repair sells them, ending a position they wanted to keep and often creating a tax bill, because borrowing against a portfolio is a private-banking service with a minimum balance attached. Rents rise with the value of housing, and the people paying the rent own none of it.

Every one of these has the same shape: parties standing between two people who have business with each other, each taking a cut and adding a delay, and a set of hours during which the arrangement is awake at all. A program does not repeal underwriting, and it does not make a stranger's credit risk disappear. What it removes is the middleman whose entire function was holding the money and keeping the record, which is the function that a vault and an account already perform, for a fraction of a penny, at three in the morning on a Sunday.

## The Best Products Never Mention the Chain

Nobody in the paragraphs above wants a blockchain. They want their money on Saturday, a better rate, their shares kept, or their invoice paid this week. The onchain products that have found real users are the ones a user can describe without saying the word: dollars sent abroad that arrive in seconds, dollars held in an account outside the banking system they were born into.

So aim at consumers and businesses rather than at a crypto audience. In practice that means:

- Quote everything in dollars and in time. A rate, a limit, a settlement time. Never basis points, token symbols, or pool utilization.
- Keep keys and signing behind the product. Someone should be able to use it having never held a token deliberately, and never learn that they now do.
- Put the benefit on the front page in the user's own words: "get paid the day you invoice", "spend without selling your shares", "nobody can walk off with the pot".
- Say the risk in the same plain words. Liquidation is not a footnote for somebody spending against their shares, and a rate that comes from borrowers can fall when borrowing does.

## The Shape of a Product Worth Building

Products of this kind have been shipped already, several of them with real users and real money behind them. They are worth studying for their shape rather than copying line for line: each one names somebody specific, removes a cost or a delay that person never agreed to, and runs on machinery from a chapter of this book.

**An account that pays like a market and still wires like a bank.** A business keeping its balances in USDC settles with anyone else inside the system in seconds, at any hour, and earns a rate that comes from what borrowers pay rather than from what a bank has left over. It still needs an IBAN for the supplier who can only send a bank transfer, SWIFT for the ones abroad, and local rails for payroll, so the edges of the product are ordinary banking and the middle is a program. The rate is the *Lending and Borrowing* chapter and the pooled accounting is the *Vault Strategy* chapter. The hard parts are at the edges rather than in the middle: banking partners, the licences that let money cross between the two systems, and the checks a bank is required to run on both sides of every transfer.

**Savings that pay what borrowers pay.** The deposit side of the *Lending and Borrowing* chapter, with a balance, a rate, and a withdraw button in front of it and nothing else on the screen. The versions that hold up are the ones honest about the awkward case: when borrowing is high the reserve cannot pay every depositor out at once, and the app has to say so before anyone finds out the hard way.

**Spending against your shares instead of selling them.** Someone holding NVDAx who needs two thousand dollars can sell, ending a position they wanted to keep and in many countries creating a tax bill, or borrow against it and keep it. The second option is the *Lending and Borrowing* chapter in full: shares as collateral, a price from a feed as covered in the *Offchain Truth* chapter, and a liquidation path when the collateral falls. Around it sits a card, a spending limit, and a warning that arrives long before a liquidator does.

**A pot your friends collect when you skip a week.** Five friends stake fifty USDC each at the start of the month, and whoever misses their target forfeits a share to the ones who did not. That is the parimutuel pool of the *Betting Market* chapter: stakes in a vault, one settlement, winners split the pot, with the fact of who actually ran arriving the way every offchain fact does. Money in escrow is the oldest commitment device there is, and people go running when it is their own fifty in the pot.

**A savings club with no bookkeeper.** Tanda, susu, hui, chit fund, ROSCA: everyone pays a fixed amount in each month, one member takes the whole pot each round, and each member's turn comes once. Hundreds of millions of people run one, and the thing that goes wrong is always the organizer holding the pot between rounds. Contributions to a vault, the rotation as a state machine, the schedule against the clock as covered in the *Time* chapter, and the *Escrow* chapter's custody pattern underneath.

**A rent deposit that pays its interest to the tenant.** A month or two of rent sits for a year in the landlord's account or an agency's, earning for whoever holds it. In a vault neither party controls it can pay the tenant instead, and still be released to either side by the rules. The design work is the state where the two sides disagree about damage, and giving that state an exit for both of them.

**Money raised from the people who already buy from you.** A roaster who needs eighty thousand dollars for a second location can raise it from the customers who drink the coffee: all-or-nothing against a deadline, refunds if the target is missed, repayment as a share of revenue. That is the *Token Fundraiser* chapter almost unchanged, and what it displaces is a chain of intermediaries, each with a minimum size below which the call is not worth returning.

**Cash today for an invoice due in sixty days.** A supplier ships forty thousand dollars of goods on sixty-day terms and needs the money this week, so funders advance most of the face value and are repaid when the buyer pays. Pooling and interest come from the *Lending and Borrowing* chapter, repayment runs through escrow, and whether the invoice was really paid is an offchain fact, which makes the *Offchain Truth* chapter the one this product lives or dies on. The credit risk stays where it always was, on the buyer. What goes away is the underwriting time and the size floor.

**Pay that lands the day the work is signed off.** Contractors in five countries paid on approval rather than whenever a batch runs, in amounts where a percentage fee would have eaten the difference between countries. Streaming payments are the natural build and the best first project on this page: the state machine is small and the arithmetic is a straight line against the clock.

**Payouts with no claim to file.** A flight lands three hours late; a region gets no rain for a month. Where the fact is measurable and comes from a source both sides agreed on in advance, the payout is a rule instead of a claims department: a pool that pays a fixed amount when the measurement crosses a line. Pool accounting from the *Betting Market* chapter, measurement from the *Offchain Truth* chapter. This is insurance in all but name, and insurance is licensed nearly everywhere, which makes it the plainest case of a rule that covers this whole page: what a product legally is follows from what it does for people, never from what it is built on.

**Company cash that is not idle over the weekend.** Treasury that sits flat from Friday to Monday can sit in a vault instead, redeemable at a share price at any hour. The *Vault Strategy* chapter is the whole of the machinery, and who may change the mandate, and how fast, is the *Operating Financial Software* chapter's subject.

None of these is a specification, and rebuilding one because it appeared in a book is the weakest reason to build anything. Take the shape instead: somebody specific, a cost or a delay they never agreed to, and a state machine small enough to hold in your head.

## The Problems Nobody Has Solved Yet

The better ideas are in the places where the machinery exists and no product has landed.

**Rent that rises without you.** Rent tracks the housing market and a renter's savings do not, so every increase is a loss with nothing on the other side of it. Put a monthly amount into an asset that moves with the same market and part of the next rise pays for itself. The machinery is the *Vault Strategy* chapter, deposits and a share price and a basket held against target weights, priced as the *Offchain Truth* chapter describes. The reason nobody has shipped it is not the program: one city's rents and any tradable index of housing move together only loosely, and telling a renter their rent is covered when it might not be is worse than never building it. Whoever cracks this cracks it in the disclosure and the product design.

**Credit for people with no collateral to post.** Every program in this book lends against collateral worth more than the loan, because that is the only kind of credit a program can enforce by itself. The credit most people actually need is the other kind, and the things that make it work, an income record, a reputation, somewhere to take a defaulter, all live offchain. That makes it a problem where the program is the easy half, and it is the largest one on this list.

## What This Book Left Out

Some things were left out on purpose, and knowing which is part of knowing the shape of the field.

**Staking and reward distribution** got no chapter of its own, though you have already met its core: the reward-per-token index inside the lending market and the parimutuel pool is the same accounting a staking program runs. What is missing is the operational half, the unbonding periods and the validator relationships.

**Vesting and streaming payments** have no chapter of their own, and the pay-on-approval product above is the argument for making one your first build.

**Formal verification** appears here only as a taster. The escrow's proofs show what a machine-checked invariant looks like, but proving as a discipline, deciding what is worth proving and modelling the parts that cannot be executed symbolically, is a subject the size of this book.

**Governance** is deliberately absent. Every program here has an operator with a key, and the honest treatment of admin power is in the *Operating Financial Software* chapter. Replacing that key with a voting process is a real design problem and a different one.

**The interface** is absent too. Nothing in these pages covers wallets, signing, transaction building, or the screen someone actually taps. An elegant, well-designed interface is what makes people adopt a financial product and keep using it, and it deserves as much of your attention as the program behind it.

## Build One, Then Have It Attacked

The gap between reading this book and shipping is one project wide, and it closes faster than you expect. Pick the smallest product you actually want to exist, for a person you can name. Draw its state machine before you write a handler. Give every state an exit, so every participant can get their money out from wherever the program stops. Write the tests that drive the machine down every path, especially the exits, and the property tests that assert what must never change.

Then get a second opinion from somebody who was not in the room. Every wall in this book's failure-mode sections exists because someone's first opinion missed something, and an auditor hunts the same holes an attacker would, then hands you the list instead of draining the program.

Deploy to localnet, then devnet, and let mainnet be where a finished program goes live rather than where you find out whether it works.

Nine programs in, the machinery is no longer the hard part. Choosing whose problem to solve is. Find someone whose money is stuck behind a weekend, or leaking a percentage nobody asked them to agree to, and build the thing they would use without ever wondering what it runs on.
