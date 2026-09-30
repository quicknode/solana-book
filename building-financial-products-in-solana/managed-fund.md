# Chapter 18: The Managed Fund

A **managed fund** is the onchain equivalent of a mutual fund. A list of approved assets, a fund manager who picks the allocation, investors who deposit and receive shares, a management fee for the manager's expertise. Symmetry and Kamino are popular platforms for managed funds on Solana. The program lives at `finance/managed-fund` in the companion repository, and its story trades stocks: TSLAx and NVDAx, quoted in USDC.

In a traditional fund, "the manager cannot run off with client assets" is enforced by custodians, auditors, and courts. Here it is enforced by the program: **the manager can change the allocation and earn the fee, and can do nothing else.** No instruction in the program moves a vault's tokens to the manager.

> **Also called a vault strategy.** Solana platforms often sell this product as a *vault* or a *vault strategy*, and the companion repository called its example `vault-strategy` before it took the finance name. This book uses the finance name because "vault" already means something here. On Solana, a **vault** is a token account owned by a program, and that is how every chapter uses the word. So **the product is the fund, and the token accounts are its vaults.** Nor is it an index fund, though the two look alike: an index fund's weights follow a published index with no manager choosing them, and here a manager chooses them.

## A Curator Decides What Managers May Touch at All

Two different people hold power in this program, and their separation is its first security decision. Victor runs the registry: he is not a fund manager, but the curator who decides which assets managers may invest in at all, and which Pyth price feed the program reads for each. He operates the platform the funds live on, and his business is his reputation for funds not failing, so vetting feeds is his product. Maria, the fund manager you will meet shortly, gets to pick allocations only from what Victor has approved.

Victor runs `initialize_registry()` once, creating the **registry**: the curator record at the root of an approved-asset set. The registry holds no list; the account stores only the curator's authority. Victor then runs `approve_asset()` for each asset he vets, and each call creates an **`ApprovedAsset`** account at a PDA derived from the registry and the asset's mint (seeds: `"approved_asset"`, the registry, the mint), binding that mint to its official Pyth price feed. An asset is approved if it has an `ApprovedAsset` account, and not approved if it does not. Victor vets which assets and which feeds are safe, so a manager cannot list a token they minted themselves, and cannot pair a real asset with a price feed they control. When Maria later adds an asset to her fund, the feed address is copied out of the `ApprovedAsset` account; the manager never supplies a price feed.

The approved set is stocks, bonds, whatever investors actually want. It cannot include the manager's own token: `add_asset()` checks approval by deriving the `ApprovedAsset` address for the mint it is handed, so adding an unapproved asset fails because the account does not exist (checked by `test_add_asset_rejects_unapproved`).

![](figures/fund-registry.svg)

## The Manager Creates the Fund and Sets the Weights

Maria is the fund manager: she creates the fund, sets the weights, rebalances, and earns the fee. She runs `initialize_fund()` with index 0, her fee of 100 basis points (1%), a `max_slippage_bps` of 100, and the swap router the fund will trade through. The fee is capped at 10%. It is collected by dilution (below), so an uncapped fee would let a manager drain the fund *by configuration*, and `initialize_fund()` rejects a higher fee with `FeeTooHigh`.

The slippage tolerance is capped at 10% too. It sets how far below the oracle price the swaps in a deposit or a rebalance may fill, so an uncapped tolerance would let a manager sell the fund's assets far below what they are worth. `initialize_fund()` rejects a higher tolerance with `SlippageConfigTooHigh`.

She then runs `add_asset()` twice: TSLAx at 4,000 basis points, NVDAx at 6,000. Weights may not overflow 100% (`WeightOverflow`), and **nobody can deposit until the weights sum to exactly 100%** (`FundNotFullyAllocated`). A deposit into this fund is always fully invested, immediately, at target weights. There is no idle-cash mode, no "the manager will get to it." Maria can change weights later with `set_weight()`, and only Maria: `set_weight()` requires the fund's `manager` to sign, and `test_set_weight_rejects_non_manager` checks that anyone else is refused.

![](figures/fund-create.svg)

Financial state on Solana is accounts, and Maria's three transactions created the seven the fund needs.

The **fund** account (PDA seeds: `"fund"`, an index) records the `manager`, the `registry` it is bound to, its `fee_bps` and `max_slippage_bps`, the `swap_router` it is allowed to trade through, its running `total_shares` and `total_weight_bps`, and `last_fee_accrual_timestamp` for the fee clock. It also records `usdc_holdings` and `asset_holdings`, the amounts the program has counted into its vaults. The **share mint** lives at a PDA (seeds: `"share_mint"`, the fund) with the fund PDA as mint authority: shares only come into existence when the program's own math says so. The fund PDA is also the authority of a **USDC vault**, which every deposit passes through on its way into the basket.

Each basket asset gets an **asset config** account (PDA seeds: `"asset"`, the fund, an index byte) recording its mint, its feed (copied from its `ApprovedAsset` account), its weight in basis points, and its **vault**, a token account whose authority is the fund PDA. The fund holds up to `MAX_ASSETS` (16), and the cap is not about storage. A deposit has to reference every asset's accounts at once, five per asset, so a full basket runs to 94 accounts. That fits inside Solana's account-lock limit, but it is far past what a legacy transaction can hold, so clients of big baskets send v0 transactions with an address lookup table.

Every handler that computes the fund's value walks indexes 0 through `asset_count` and refuses to run if any account is missing (`IncompleteAssetAccounts`), so a caller cannot leave an asset out and understate the fund's value. A retired asset (weight set to zero) keeps its index forever rather than being reused, so the contiguous range the valuation loop depends on stays intact.

## A Deposit Makes the Program Acquire Assets

Alice invests from the standard wallet of one SOL and 1,000 USDC. She runs `deposit()` with 900 USDC and a `minimum_shares` floor. The handler does three jobs in one transaction, and the order is what makes it safe.

**First it values the fund.** It walks every asset: reads the holding the program has recorded for that vault, loads the Pyth price, and accumulates value in u128 as amount × price ÷ 10^8, multiply before divide. The price load rejects a feed that is not the one recorded in the asset config, a price that is not positive, a price older than 60 seconds, or a price posted before the cluster's last restart. The recorded USDC is added to the total. That total is the **net asset value**, the NAV. The program keeps these records itself and updates them with what each transfer actually moves; the failure-modes section says why it never values the fund from its vaults' token balances. On the fund's first deposit the NAV is zero and shares are minted one-to-one: Alice's 900 USDC becomes 900 shares.

**Then it deploys the USDC at the weights.** 40% of 900, $360, buys TSLAx at $250: 1.44 TSLAx into the TSLAx vault. 60%, $540, buys NVDAx at $180: exactly 3 NVDAx. The swaps run through the router fixed at fund creation (the example ships a mock router standing in for Jupiter; a router that is not the configured one is rejected, checked by `test_deposit_rejects_unregistered_router`), and the fund PDA signs. The handler measures what each swap moved on the vaults and adds it to the recorded holdings. A swap that returns none of its asset refuses the whole deposit (`DepositTooSmall`).

**And the program, not the manager, decides the acceptable price.** For each leg, the handler computes the expected output *from the oracle price* and floors it by the fund's slippage tolerance: the swap may return at most 1% less than the feed says it should, or the whole deposit reverts. A manager cannot approve a bad fill, because the minimum is never theirs to supply. **When an untrusted party routes the trade, the acceptable outcome must be computed from a price source they do not control.**

![](figures/fund-deposit.svg)

## The Market Moves and the Manager Rebalances

NVDAx climbs from $180 to $200. The fund is now worth $960, so each share is worth about $1.07, and nothing needs to happen for that to be true. The program does not store a share price; each deposit divides the NAV, valued from the feeds at that moment, by the share supply.

But the weights have drifted: NVDAx's gain pushed it to 62.5% of the fund against a 60% target. This is Maria's job. She runs `rebalance()`, which sells the over-weighted asset for USDC and buys the under-weighted one: 0.12 NVDAx sold for $24, $24 of TSLAx bought, both legs through the fixed router, both legs floored by oracle-anchored minimums as deposits are. The weights return to 40/60. The tokens moved between fund-owned vaults, through the approved router, at oracle-checked prices, and nowhere near Maria.

![](figures/fund-rebalance.svg)

## A Later Investor Buys In at the New Price

Bob, the second investor, deposits 480 USDC of his standard wallet. He is not early, and the share math prices that in: shares = deposit × total shares ÷ NAV, floored, with the NAV valued from the recorded holdings. With 900 shares outstanding against a $960 NAV, his 480 buys 450 shares, not 480. Alice's early position is not diluted by his arrival, and the test suite checks the fairness directly (`test_deposit_fair_pricing`). His USDC deploys 40/60 at current prices, same as hers, same slippage floor.

## The Manager's Fee Arrives by Dilution

Traditional funds sell assets to pay the management fee. This program does what large onchain fund products do instead: it **mints new shares to the manager**, so the fee is paid by diluting every holder proportionally, with no asset ever sold. `collect_fees()` computes shares owed as total shares × fee rate × elapsed time over a year, from the fund's fee clock: at 1% with 1,350 shares outstanding and a year elapsed, 13.5 new shares to Maria. The instruction is deliberately callable by anyone (the fee accrues by time, not by the manager's diligence in claiming it), and the fee rate itself has no setter: it is fixed at fund creation, so the deal investors joined under cannot be worsened. The *Betting Market* chapter stored each event's fee when the event was created, for the same reason.

![](figures/fund-fee-dilution.svg)

## Withdrawing In Kind

Alice takes profit with `withdraw()`, burning her 900 shares. The program does not sell anything to pay her: it transfers to her **her proportional slice of every vault, in kind**. That is her share of the recorded holdings in the USDC vault, the TSLAx vault (about 1.5), and the NVDAx vault (about 2.8), each amount floored, each destination account verified to be hers and of the right mint (`InvalidRecipient`). The share count is reduced before any token moves (checks-effects-interactions, as in every chapter), and her `min_usdc_out` floor protects the USDC leg (`test_withdraw_rejects_slippage`).

She entered with $900, rode NVIDIA up, paid Maria 1% by dilution, and left with about $950 of assets. Bob still holds 450 shares, unrealized. Maria holds 13.5 shares, about $14, for managing the fund. Victor took no fee on any of it. What he earned is what his platform sells: a track record of funds whose managers cannot take the assets.

![No price account appears here: every leg is a proportion of a vault balance, not a quote.](figures/fund-withdraw-in-kind.svg)

## The Math: One Valuation Loop, Floors Toward the Fund

Every formula in the program is a proportion, and they all round the same way. Shares minted: deposit × supply ÷ NAV, floored. Withdrawal legs: recorded holding × shares ÷ supply, floored per asset, with each payout subtracted from the record. Fee shares: supply × rate × time over a year, floored. Deployment per leg: deposit × weight ÷ 10,000, floored. All u128 intermediates, all multiply-before-divide, remainders staying with the fund rather than the transactor. The one multiplication that is not a proportion is the valuation itself, amount × price at the feed's 10^8 precision, and the share price is right only if that line runs over every asset, on every deposit, with a fresh price.

## The Invariants: Assets Stay in the Fund's Vaults

- From first deposit to last withdrawal, assets live only in fund-owned vaults. No instruction handler transfers vault tokens to the manager; the fee path mints shares and touches no vault.
- Deposits are accepted only at 100% allocation, and every deposit is fully deployed in the same transaction.
- NAV computations include every asset index or refuse to run.
- Share supply changes only through `deposit()`, `withdraw()`, and `collect_fees()`, and `total_shares` moves before the corresponding CPIs.
- Every swap leg, deposit or rebalance, clears at no worse than the oracle price minus the configured tolerance, through the router fixed at creation.
- Every share price and every payout comes from the recorded holdings, never from a vault's token balance. The recorded holdings never exceed the balances, and they equal them unless someone has transferred tokens in directly.

## The Failure Modes: The Manager, the Feed, and the First Deposit

- **The manager is the threat model**, and the program treats them as such: assets only from Victor's list, feeds only from Victor's entries, swaps only through the fixed router, minimums only from the oracle, fee capped and immutable. No handler sends vault tokens to them. What remains to a careless manager is churn: pointless rebalancing that pays market slippage. That hurts depositors but pays the manager nothing, and the program cannot tell a pointless rebalance from a useful one. Aligning *that* incentive is what the fee-on-assets structure is for.
- **Every number in the fund depends on the feed.** A stale price is refused (`StalePriceFeed`, 60-second window), as is a non-positive price (`NegativePrice`) and a substituted feed account (`InvalidPriceFeed`), so no deposit, withdrawal, or rebalance runs on a bad price. A price posted at or before the cluster's last restart is refused too (`PricePredatesRestart`). After a halt the timestamp trails real time, so a price from before the halt can still look under a minute old, and the *Time* chapter explains why. What this example does not check is the feed's confidence interval; a production fund should, and the *Offchain Truth* chapter explains what confidence means and why "fresh but uncertain" is its own failure mode.
- **Donations are ignored, which closes the inflation attack.** Anyone can transfer tokens straight into a vault. A program that valued the fund from its vaults' balances would let a one-minor-unit first deposit and a donation price one share above the next deposit, rounding it to zero shares. This program values the fund from `usdc_holdings` and `asset_holdings`, so a donation changes a balance and nothing the handlers read. Run the *Adversary* chapter's numbers against it: after the attacker's one minor unit and 1,000 USDC donation, the next depositor's 1,000 USDC still buys 1,000 shares. The donation stays in the vault, and no withdrawal ever pays it out. `rebalance` cannot sell or spend donated tokens either (`InsufficientHoldings`).
- **A deposit too small to buy anything is refused.** Ignoring donations leaves one gap: a deposit so small that a swap takes its USDC and returns none of the asset. It would mint shares against a fund recorded as worth nothing, and every later deposit would then divide by zero, so it fails with `DepositTooSmall`. The `minimum_shares` argument remains for what neither check covers, a share price that moved between signing and landing. The empty-pool section of the *Adversary* chapter compares this defense with the others.
- **Partial baskets are refused**, on deposit, withdrawal, and valuation alike (`IncompleteAssetAccounts`): an attacker who could get the fund valued without its best-performing vault could buy shares at a discount.

## Testing Considerations

The suite (with hand-built Pyth price-update accounts injected so prices are deterministic) covers the full lifecycle end to end (`test_full_lifecycle`). It then checks each rule separately. Under-allocated funds refuse deposits, unapproved assets refuse listing, weight overflows refuse, the 17th asset refuses, and non-managers cannot set weights. Unregistered routers refuse, slippage floors reject on deposit and withdrawal, incomplete account lists refuse, and later depositors pay fair NAV. `test_full_lifecycle` checks after every step that the recorded holdings equal the vaults' balances. `test_donation_does_not_inflate_share_price` runs the *Adversary* chapter's attack and checks that the victim gets exactly the shares they would have got without the donation. `test_deposit_rejects_leg_that_buys_nothing` and `test_rebalance_cannot_spend_donated_usdc` test the other two checks. `test_deposit_rejects_price_from_before_restart` simulates a halt, checks that a deposit is refused while the prices predate the restart, and checks that it goes through once Pyth posts again. The pattern to copy is the price injection: valuation code cannot be tested with prices you cannot control, so the harness makes the feed a fixture and then moves it deliberately.

## What You Learnt from Building the Managed Fund

A mutual fund needs a custodian, a compliance officer, a fee schedule in a prospectus, and an auditor checking that the manager's trades match the mandate. This chapter needed a registry account, a weight sum that must hit 10,000, a fee constant with no setter, and a slippage floor computed from a feed the manager cannot choose.

The managed fund added five concepts:

- **The manager as the threat model.** The invariant every program in this book keeps: no instruction handler, under any parameters, moves user deposits to the operator. Rebalancing moves tokens between program-owned vaults; the fee path mints shares and touches no vault.
- **A curator separate from a manager.** Victor's approved-asset set binds each asset to its official feed, so a manager can neither list their own token nor pair a real asset with a feed they control.
- **Oracle-anchored minimums.** When an untrusted party routes the trade, the acceptable outcome must be computed from a price source they do not control.
- **NAV as the share price, from the program's own records.** Value every holding with a fresh feed or refuse to run; a valuation that skips an asset lets a depositor buy shares for less than they are worth. A valuation read off token balances can be moved by anyone who transfers tokens in, so value what the program recorded.
- **Fees by dilution, at a rate fixed at creation.** The fee mints shares against everyone proportionally, accrues by time rather than the manager's diligence, and has no setter, so the deal investors joined under cannot be worsened.

In the *Options* chapter we will build a program that takes no credit risk at all. A writer posts the whole of what they might owe before the option is sold, so there is no margin, no liquidator, and no oracle, and you will see how much simpler the program is for it. The *Perpetual Futures* chapter then closes the book with a program that needs all of it at once: vaults, shares, oracles, funding, margin, and liquidation.
