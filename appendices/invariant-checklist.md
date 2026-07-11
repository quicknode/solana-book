# The Invariant Checklist

The whole book's rules on one page, for the moment before you ship. Every line names the chapter that earns it. Walk the list against your program; any line you cannot check off is a finding, not a footnote.

## The money

- **All amounts are integers in minor units**, at scales read from the mint, never assumed. (The Arithmetic of Money)
- **Every arithmetic operation is checked**; overflow maps to a named error, and intermediates that can exceed u64 run in u128. (The Arithmetic of Money)
- **Multiply before divide**, and divide as late and as few times as possible. (The Arithmetic of Money)
- **Every division's rounding direction is chosen, stated, and rounds against the caller**: floor what the program pays out, ceil what the program is owed. Dust accrues to the pool, never to whoever calls most often. (The Arithmetic of Money)
- **Token conservation holds after every handler**: tokens in equal tokens out plus tokens held, and the tests assert it. A round-trip (deposit then withdraw, swap in then swap back) never creates value. (The Arithmetic of Money; The Adversary)
- **The core value invariant is asserted after the math, not assumed from it**: K may not fall after the transfers land, a fill's output may not exceed its input's value at the oracle price. The check exists to catch the refactor that breaks a rounding direction. (The Constant-Product AMM; The Prop AMM)

## The accounts

- **Every account a caller supplies is validated**: signers are signers, owners are the expected programs, stored addresses match (`has_one`), and every PDA re-derives from its seeds and stored bump. (The Adversary)
- **Every trust chain terminates in something the program itself derived or recorded.** A chain of accounts that vouch for each other proves nothing. (The Adversary)
- **State the program wrote is the truth; token balances are just custody.** No gate that unlocks money reads a balance someone else can inflate by donation. (Token Fundraiser; The Constant-Product AMM)
- **Vault authorities are PDAs**, so funds move only along code paths, and every outbound transfer is signed with seeds the program controls. (PDAs; Escrow)

## The state machine

- **One instruction handler, one transition**, guarded by state, not just by signer, with an error that names the rule. (Financial Programming Concepts in Solana)
- **Every state has an exit for every participant's money**, including the failure paths and including the operator's own accounts. (Financial Programming Concepts in Solana; Token Fundraiser)
- **Terminal states drain and close**: vault empty, accounts closed, rent returned to whoever paid it. For every account the program creates, name the handler that eventually closes it. (Rent; Token Fundraiser)
- **Effects before interactions**: state updates commit before token transfers or CPIs, so re-entry and hostile sequencing find the books already settled. (The Adversary; The Order Book Exchange)

## The outside world

- **Every offchain fact is verified on arrival**: the publisher's identity, the freshness (in slots where the consumer chooses the clock), the confidence interval, and the decimal scale, pinned at setup. A stale price is not an inconvenience; it is a free option for whoever notices first. (Offchain Truth; The Prop AMM; Perpetual Futures)
- **A true price can still be a purchased price**: leverage is never built on a market thinner than the credit it collateralizes, and consumers degrade when confidence widens. (The Adversary)
- **Time uses the right clock**: slots where an adversary profits from bending time, timestamps only for humans and long horizons. (Time)
- **Work with no natural caller has a crank**: permissionless, idempotent, quiet on no-op, and paid if it must be reliable. Check what happens when the incentive stops paying. (Cranks; Perpetual Futures)

## The empty pool and the edges

- **The first deposit is defended by a named mechanism**: locked minimum liquidity, virtual shares, state-tracked pool size, or a minimum deposit, chosen deliberately. (The Adversary; The Constant-Product AMM)
- **Boundaries are tested on both sides**, with nonzero asymmetric values: zero amounts, dust, exact thresholds, and full-pool extremes are where comparisons flip and remainders round. (The Adversary; the test suites throughout)
- **Every trade and withdrawal carries a caller-side bound** (minimum out, acceptable price) and fails with a slippage error instead of filling at a surprise. (The Adversary; Perpetual Futures)

## The operator

- **Admin power is specified like an oracle**: what the key can do, what it can never do, and what happens if it goes rogue or silent. Terms users joined under (fees, weights) are snapshotted or immutable. (Operating Financial Software; The Betting Market)
- **Every participant has an incentive, including the operator and the maintainers.** A job nobody is paid to do is a bug in the incentives. (Cranks; every program chapter's cast)
- **The tests drive every path through the program's own handlers**, assert balances and decoded state rather than transaction success, and give every failure mode a test whose name says what it refuses to allow. (Operating Financial Software; every program chapter)

If all of that holds, you are ready for the step this book keeps repeating: **get a second-opinion audit before mainnet.** The checklist finds the failure classes this book teaches; the auditor finds the ones it doesn't.
