# Chapter 20: Where to Go From Here

Nine programs are behind you: an escrow, a fundraiser, a betting market, an order book, two automated market makers, a lending market, a vault, and a perpetual futures venue. Between them they cover the machinery most financial products are made of.

The Introduction promised a set of properties: markets that never close, settlement that is atomic and global, one set of accounts that every party reads, rules that run as instruction handlers, fees that ignore the size of the transfer, and distribution that arrives the moment a program is deployed. Those have stopped being reasons to consider a platform. They are materials you can now work with, on the world's most active blockchain.

What is left is deciding what to build with them.

## What You Can Build Now

You can take a financial product you understand in the real world and lay it out as accounts, handlers, and invariants, because you have watched that translation happen nine times with the seams left showing.

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
- Put the benefit on the front page in the user's own words: "get paid the day you invoice", "spend without selling your shares", "everyone gets their turn".
- Say the risk in the same plain words. Liquidation is not a footnote for somebody spending against their shares, and a rate that comes from borrowers can fall when borrowing does.
- Assume the person will never read your program. That is what the audit, the tests, and the invariants are for.

## What to Build for Consumers

**A savings account whose interest comes from real borrowers.** You have already built the machinery, in the *Lending and Borrowing* chapter: depositors fund a reserve, borrowers pay interest on what they draw, and an index credits each depositor a share of it continuously. A consumer product puts a balance, a rate, and a withdraw button in front of that and nothing else. The design work left is the honest part: what happens when borrowing is high and the reserve cannot pay every depositor out at once, and how you say so on screen before anyone finds out the hard way.

**A card that spends against your shares instead of selling them.** Someone holding NVDAx who needs two thousand dollars today has two options: sell, which ends the position and in many countries creates a tax event, or apply for a portfolio loan somewhere with a minimum balance. The mechanism for the third option is the *Lending and Borrowing* chapter in full: shares posted as collateral, a borrow against them, a price from a feed as covered in the *Offchain Truth* chapter, and a liquidation path when the collateral falls. The product around it is a spending limit, a repayment, and a warning that arrives long before a liquidator does.

**A fitness pot your friends collect when you miss a week.** Five friends stake fifty USDC each at the start of the month, and whoever misses their target forfeits a share to the ones who did not. That is the parimutuel pool of the *Betting Market* chapter, with the stakes in a vault, one settlement, and the winners splitting the pot, and the fact of who ran reaches the program the way every offchain fact does. What makes it a consumer product rather than a bet is what it is for: money held in escrow is the oldest commitment device there is, and people go running when it is their own fifty USDC in the pot.

**A savings club that needs no bookkeeper.** Tanda, susu, hui, chit fund, ROSCA: a group pays a fixed amount in every month, one member takes the whole pot each round, everyone gets one turn. Hundreds of millions of people run one, and the failure mode is always the same person, the organizer holding the pot between rounds. Contributions go to a vault, the rotation is a state machine, the schedule runs against the clock as covered in the *Time* chapter, and the pot goes where the rules say. The custody pattern is the *Escrow* chapter's.

**A rent deposit that pays its interest to the tenant.** A month or two of rent sits for a year in an account belonging to the landlord or the agency, and whatever it earns stays there. Held instead in a vault neither party controls, it can be released to either side by the rules and pay its interest to the tenant. The custody is escrow; the design work is the state where the two parties disagree about damage, and giving that state an exit for both of them.

**A way for renters to hold a piece of what they pay rent to.** Rent tracks the housing market and a renter's savings usually do not, so every increase is a loss with no offsetting gain. A product that puts a monthly amount into an asset moving with the same market means part of the next rise pays for itself. The machinery is the *Vault Strategy* chapter: deposits, a share price, a basket held against target weights, with prices arriving as the *Offchain Truth* chapter describes. Take the caveat seriously, because it is the product: a hedge whose correlation is weak is a bet, and telling a renter it offsets their rent when it might not is worse than not building it.

**Payouts that arrive without a claim.** A flight lands three hours late. A region gets no rain for a month. Where the fact is measurable and comes from a source both sides agreed on in advance, the payout can be a rule rather than a claims department: a pool that pays a fixed amount when the measurement crosses a line, priced by what the pool took in. The pool accounting is the *Betting Market* chapter and the measurement is the *Offchain Truth* chapter. This is insurance in all but name, and insurance is licensed nearly everywhere, which makes it the clearest case of a rule that covers everything in this section: what a product legally is follows from what it does for people, never from what it is built on.

## What to Build for Businesses

**Money raised from the people who already buy from you.** A coffee roaster who needs eighty thousand dollars for a second location can raise it from the customers who drink the coffee, all-or-nothing against a deadline, with every contribution refundable if the target is missed and repayment made as a share of revenue. That is the *Token Fundraiser* chapter almost unchanged. What it replaces is the chain of intermediaries between a small business and anyone willing to fund it, each of which has a minimum size below which it is not worth their time.

**Invoice financing for suppliers too small for a bank to answer.** A supplier ships forty thousand dollars of goods on sixty-day terms and needs the money this week. Funders advance most of the face value now and are repaid when the buyer pays. The pooling and the interest accounting are the *Lending and Borrowing* chapter, the repayment path is escrow, and whether the invoice was actually paid is an offchain fact, which makes the *Offchain Truth* chapter the one this product lives or dies on. The credit risk stays exactly where it always was, on the buyer. What goes away is two weeks of underwriting on a receivable and the size threshold below which nobody returns the call.

**Payroll and supplier payments that settle while everyone sleeps.** Contractors in five countries paid on the day their work is signed off rather than on the day a batch runs, in amounts where a percentage fee would have eaten the difference between countries. Streaming payments are the natural build here, and they are the best first project in this section: the state machine is small and the arithmetic is a straight line against the clock.

**A treasury that is not idle over the weekend.** Company cash that sits flat from Friday to Monday can sit in a vault instead, redeemable at a share price any hour, invested in whatever the mandate allows. The *Vault Strategy* chapter is the whole of it, and the operator questions it raises about who can change the mandate and how fast are covered in the *Operating Financial Software* chapter.

**Escrow for marketplaces that currently ask both sides to trust them.** Any platform where a buyer pays before a seller delivers is running an escrow by hand, with the platform's own bank account as the vault and its goodwill as the guarantee. The *Escrow* chapter replaces the goodwill with a program, and the marketplace keeps the part it is actually good at, which is matching the two sides and handling the argument when delivery is disputed.

## What This Book Left Out

Some things were left out on purpose, and knowing which is part of knowing the shape of the field.

**Staking and reward distribution** got no chapter of its own, though you have already met its core: the reward-per-token index inside the lending market and the parimutuel pool is the same accounting a staking program runs. What is missing is the operational half, the unbonding periods and the validator relationships.

**Vesting and streaming payments** are a natural next build, for the reasons the payroll product above gives.

**Formal verification** appears here only as a taster. The escrow's proofs show what a machine-checked invariant looks like, but proving as a discipline, deciding what is worth proving and modelling the parts that cannot be executed symbolically, is a subject the size of this book.

**Governance** is deliberately absent. Every program here has an operator with a key, and the honest treatment of admin power is in the *Operating Financial Software* chapter. Replacing that key with a voting process is a real design problem and a different one.

**The interface** is absent too, and for the products in this chapter it is where most of the work is. Nothing in these pages covers wallets, signing, transaction building, or the screen someone actually taps, and a program reachable only through a command line reaches nobody in the paragraphs above.

## Build One, Then Have It Attacked

The gap between reading this book and shipping is one project wide, and it closes faster than you expect. Pick the smallest product you actually want to exist, for a person you can name. Draw its state machine before you write a handler. Give every state an exit, so every participant can get their money out from wherever the program stops. Write the tests that drive the machine down every path, especially the exits, and the property tests that assert what must never change.

Then get a second opinion from somebody who was not in the room. Every wall in this book's failure-mode sections exists because someone's first opinion missed something, and an auditor hunts the same holes an attacker would, then hands you the list instead of draining the program.

Deploy to localnet, then devnet, and let mainnet be where a finished program goes live rather than where you find out whether it works.

Nine programs in, the machinery is no longer the hard part. Choosing whose problem to solve is. Find someone whose money is stuck behind a weekend, or leaking a percentage nobody asked them to agree to, and build the thing they would use without ever wondering what it runs on.
