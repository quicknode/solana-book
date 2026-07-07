# Writing Plan

How the manuscript gets produced, verified, reviewed, and kept alive. The table of contents lives in [OUTLINE.md](OUTLINE.md). Chapters are referenced by name, not number, so renumbering never breaks this document.

## Principles

- The book prints the durable layer. Every code claim is verified against the companion repo before it lands: the skill's "grep before naming" rule, applied to a manuscript.
- Diagrams are the longest-lived medium. Every chapter budget includes them: account map, state machine, flow.
- Style is inherited wholesale from the [Solana Finance plugin skill](https://github.com/quicknode/solana-finance-claude-plugin): onchain and offchain unhyphenated, "instruction handlers" for the functions and "instructions" for their input, "minor unit" not "base unit", one name per role enforced within each chapter, concrete two-asset examples, real handler names in lifecycle prose, persona-driven walkthroughs.
- Banned phrases, enforced by a lint script over the manuscript files: "the oracle problem", "instrument" (say "financial software" or "program"), the hyphenated chain words, and em-dashes. The lint also rejects negative framing of offchain truth (any "cannot verify the price" phrasing): the manuscript teaches the positive mechanism, verifying a signature from a trusted source.
- Nothing in the book disparages other Solana resources or projects. Where other content is referenced, it is as a neutral pointer.

## The Chapter Template (Part V)

Each Part V chapter runs the same seven beats:

- **Concept** - what this financial software does in the real world, cast with personas and real assets.
- **Account model** - the accounts, their owners, their PDAs, with the account-relationship diagram.
- **Instruction handlers** - the lifecycle walked in prose, each handler named and explained at first use; no flat reference section.
- **The math** - the calculations, in minor units, with rounding directions stated.
- **The invariants** - what must hold before and after every handler.
- **The failure modes** - how this program gets attacked or bricked, with the inline War Story where an incident matches.
- **The test that catches the bug** - the property or scenario test from the example's own test suite that would have caught each failure mode.

Concept chapters (Parts I through IV, and VI) use a lighter template: claim, mechanism, consequence, War Story where applicable.

## Generation Pipeline (per chapter)

- Gather inputs: the example's program source, README, and tests from [Solana Program Examples](https://github.com/quicknode/solana-program-examples); the relevant skill rules; War Story primary sources.
- Draft against the template.
- Verify: grep every named identifier against the repo; check every number against the source it came from; run the banned-phrase lint.
- List the figures the chapter needs. Figures are drawn later in a single visual pass so the visual language stays consistent.
- Review against the Invariant Checklist and the Terminology appendix.

## War Story Register

Each incident is researched from primary sources and placed inside the chapter named here:

- SPL token-lending rounding (about $2.6B at risk): Rounding Is a Policy Decision
- Cashio ($52M, unvalidated account chain): Validation: Signers, Owners, and the Confused Deputy
- Wormhole ($325M, bypassed signature verification): Validation: Signers, Owners, and the Confused Deputy
- First-depositor inflation incidents (the ERC-4626 class): The Empty Pool, and Vaults and Share Accounting
- Mango Markets ($116M): Price Manipulation
- The Hundred and Sonne precision drains: Rounding and Precision Exploits
- Crema Finance ($8.8M, tick-account forgery): Validation or The Constant-Product AMM, decided during drafting

## Reviewers, Feedback, and Editions

- **Named technical reviewers**: recruit respected Solana engineers early, so review happens per part rather than as one giant pass at the end. Their names fill the About the Technical Reviewers section. Visible peer review is part of how fundamentals titles earn their standing.
- **Public pre-print feedback loop**: release chapters early, as posts or an early-access build, collect corrections, and credit contributors in Acknowledgements. The community that corrects the book is the community that recommends it.
- **Errata and editions**: a public errata page from day one, and a stated edition cadence. The durable layer changes slowly, but "long-lived" is only credible if the maintenance process is visible.

## Milestones

- **Voice samples first**: Rounding Is a Policy Decision and Escrow drafted in full, to lock voice, depth, and template before anything else.
- Part II (The Arithmetic of Money) complete.
- Part V (The Financial Software) complete, one chapter per example, in outline order.
- Parts I, III, and IV, with technical reviewers engaged per part as each completes.
- Part VI and the Appendices. The Invariant Checklist is nearly free: it distills the existing skill.
- How to Use This Book, the author bio, and the placeholder pages last.
- A single visual pass producing all diagrams in one consistent style.
- Public early-access release and errata page live before print.

## Future Chapters

Added if and when a matching example ships in the companion repo, keeping the one-chapter-per-tested-example rule:

- Staking and Rewards (reward-per-token accounting currently appears inside Lending and Borrowing, and The Betting Market)
- Vesting and streaming payments
