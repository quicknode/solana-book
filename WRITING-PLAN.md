# Writing Plan

How the manuscript gets produced, verified, reviewed, and kept alive. The table of contents lives in [TABLE-OF-CONTENTS.md](TABLE-OF-CONTENTS.md), and each chapter is a file under its section's folder. Within this document, chapters are referenced by name so reordering never breaks it; the manuscript's chapter titles carry sequential numbers ("Chapter 11: Escrow"), and the table of contents is the source of truth for the numbering.

## Principles

- The book prints the durable layer. Every code claim is verified against the companion repository before it lands: the skill's "grep before naming" rule, applied to a manuscript.
- Diagrams are the longest-lived medium. Every chapter budget includes them: account map, state machine, flow.
- Style is inherited wholesale from the [companion AI skill](https://github.com/quicknode/solana-finance-claude-plugin): onchain and offchain unhyphenated, "instruction handlers" for the functions and "instructions" for their input, "minor unit" not "base unit", one name per role enforced within each chapter, concrete two-asset examples, real handler names in lifecycle prose, persona-driven walkthroughs.
- Banned phrases, enforced by `scripts/lint-manuscript.mjs` (`npm run lint`) over the manuscript files: "the oracle problem", "instrument" (say "financial software" or "program"), the hyphenated chain words, and em-dashes. The lint also rejects negative framing of offchain truth (any "cannot verify the price" phrasing): the manuscript teaches the positive mechanism, verifying a signature from a trusted source.
- Nothing in the book disparages other Solana resources or projects. Where other content is referenced, it is as a neutral pointer, and preferably to a primary source (a project's own docs or repo) rather than to an aggregator or list.
- Chapter titles are numbered traditional short names: "Chapter 3: Tokens", "Chapter 11: Escrow", "Chapter 9: The Adversary". Headings *inside* a chapter carry the content, so a reader skimming only the headings learns the chapter's actual claims: "A Mint Is a Factory, and the Mint Authority Is Its Boss", not "Mint Authority"; "Carol's Ask Crosses Bob's Bid", not "Matching". No numbered headings.
- Cross-references in prose use chapter names ("the PDAs chapter", "The Adversary"), never numbers. Chapter numbers appear only in chapter titles and the table of contents, so renumbering never rewrites prose.
- Characters are introduced at the point they first act, never in a separate cast section.
- Boxouts (rendered as blockquotes) hold self-contained asides a reader can skip without losing the thread: War Stories, origin stories, and mechanism deep-dives like the flash-loan and keypair-collision boxes.
- Facts that form a grid go in a table (the cluster table, the token-extensions table, the rounding-direction table), not in a comma-packed paragraph.
- Plain language. Define things by what they concretely are, not by abstract category: an account is "some data - a Rust struct - with an address", never "the unit of state". If a definition would fit equally well in a book about a different subject, it is too vague. Prefer the short common word to the impressive one.
- Example assets are USDC and real-world assets: stocks like NVDAx, TSLAx, and SPCXx. Never meme tokens.
- Talk to readers, never about the book's construction. No sentences explaining why a chapter is organized, sized, or placed the way it is ("each section is short on purpose", "that is why it comes first"). If a sentence is addressed to the author, editor, or reviewer rather than the reader, delete it.
- Emphasis is meaningful. Titles of books and other works are italicized (*TCP/IP Illustrated*). Bold marks the load-bearing claim of a passage and canonical terms on first use ("the chain is the **platform**"). Use both wherever they help the reader, and never as decoration.
- The two companions have fixed names in the book's prose: solana-program-examples is "the companion repository" and solana-finance-claude-plugin is "the companion AI skill". Each is introduced once, with a link, in the Introduction; everywhere else the fixed name is used, never the repo name.

## The Program Chapter Template

Each program chapter runs the same eight beats:

- **Concept** - what this financial software does in the real world, with personas, real assets, and each party's incentive (the Introduction promises readers that admin and user incentives are discussed in every program chapter). Personas are introduced where they first act, not in a cast list.
- **Account model** - the accounts, their owners, their PDAs, with the account-relationship diagram.
- **Instruction handlers** - the lifecycle walked in prose, each handler named and explained at first use, each step followed by a diagram of what moved and what changed; no flat reference section.
- **The math** - the calculations, in minor units, with rounding directions stated.
- **The invariants** - what must hold before and after every handler.
- **The failure modes** - how this program gets attacked or bricked, with the inline War Story where an incident matches.
- **Testing considerations** - the property or scenario tests from the example's own suite that would catch each failure mode, described without dwelling on test libraries (the tooling is covered once, in Operating Financial Software).
- **What you learnt** - a closing summary of the concepts the chapter taught and the traditional-finance roles and processes the program replaced.

The two foundation chapters (Solana Building Blocks; Financial Programming Concepts in Solana) use a lighter per-section template: claim, mechanism, consequence, War Story where applicable, and a short "What You Learnt" list closing each chapter.

## Generation Pipeline (per chapter)

- Gather inputs: the example's program source, README, and tests from the [companion repository](https://github.com/quicknode/solana-program-examples); the relevant rules from the companion AI skill; War Story primary sources.
- Draft against the template.
- Verify: grep every named identifier against the repo; check every number against the source it came from; run the banned-phrase lint.
- List the figures the chapter needs. Figures are drawn later in a single visual pass so the visual language stays consistent.
- Review against the companion AI skill's rules and the Glossary.

## War Story Register

Each incident is researched from primary sources and placed inside the chapter named here:

- SPL token-lending rounding (about $2.6B at risk): the rounding section of The Arithmetic of Money
- Cashio ($52M, unvalidated account chain): the validation section of The Adversary
- Wormhole ($325M, bypassed signature verification): the validation section of The Adversary
- First-depositor inflation incidents (the ERC-4626 class): named incidents are the Hundred and Sonne stories below (their setup is the inflation attack); the empty-pool section of The Adversary teaches the class, and The Constant-Product AMM chapter teaches the locked-minimum defense without an incident box
- Mango Markets ($116M): the price-manipulation section of The Adversary
- The Hundred and Sonne precision drains: the precision-exploits section of The Adversary

## The Visual Language

The diagram conventions (account-relationship maps, state machines, token-movement flows, the War Story box) are production guidance, not reader content, so they live here rather than in an appendix. They are fixed during the single visual pass that draws every figure, and each convention is taught to the reader by the first figure that uses it, with a small legend on that figure. One consistent set of conventions across the whole book; no figure invents its own.

Conventions already settled, which the visual pass must preserve:

- **People are wallet rectangles, in the style of the Escrow account map**: a bordered rectangle with a face glyph, a bold left-aligned name title (role labels like "Alice (maker)" in program chapters, "Alice's Account" in the foundation chapters), and the person's SOL balance beneath. Lamport and token arrows that touch a person start or end at this rectangle's edge, never at a bare curve dot or a stick figure. Where a figure draws the cluster curve, the person also keeps a public-key dot on the curve, linked to the rectangle by a dashed line. Instruction handlers listed inside a program's rectangle are left-aligned, one per line.
- **Rounded corners mean accounts, and nothing else.** Every box that is not an account (transaction envelopes, instruction rows, the transaction log, state-machine states, seed chips, failed or hypothetical calls, offchain parties, annotation panels) draws with square corners, so a reader can tell at a glance what lives on the chain as an account and what does not.
- **Seeds are never drawn inside an account's rectangle**, because seeds are not part of the account struct. They are labeled near the small address circle that sits above or beside the account box.
- **A custom PDA's rectangle shows its struct as `key: value`, one field per line**, using the walkthrough's story values where the chapter has them.
- **Every walkthrough step ("Alice does X", "Bob does Y") is followed by a diagram** showing the token movements, account creations and closures, and value changes that step caused.

Steps currently missing their per-step diagram, to be drawn in the visual pass:

- Lending and Borrowing: Carol's short; Bob's repayment and collateral withdrawal.
- Perpetual Futures: Alice's `close_position` payout.
- The Prop AMM: Maria's `deposit_inventory` and `withdraw_inventory`.
- The Vault Strategy: Bob's deposit at the new share price.

## Reviewers, Feedback, and Editions

- **Named technical reviewers**: recruit respected Solana engineers early, so review happens per part rather than as one giant pass at the end. Their names fill the About the Technical Reviewers section. Visible peer review is part of how fundamentals titles earn their standing.
- **Public pre-print feedback loop**: release chapters early, as posts or an early-access build, collect corrections, and credit contributors in Acknowledgements. The community that corrects the book is the community that recommends it.
- **Errata and editions**: a public errata page from day one, and a stated edition cadence. The durable layer changes slowly, but "long-lived" is only credible if the maintenance process is visible.

## Milestones

- **Voice samples first** (drafted): the Introduction, Escrow, and The Order Book Exchange lock voice, depth, and template.
- The remaining program chapters, one per example, in table-of-contents order (all nine drafted: Escrow, Token Fundraiser, The Order Book Exchange, The Constant-Product AMM, The Prop AMM, The Betting Market, Lending and Borrowing, The Vault Strategy, Perpetual Futures).
- The two foundation chapters (Solana Building Blocks; Financial Programming Concepts in Solana), with technical reviewers engaged per chapter as each completes.
- The remaining appendices. The Glossary is drafted.
- The placeholder front-matter pages last.
- A single visual pass producing all diagrams in one consistent style.
- Public early-access release and errata page live before print.

## Future Chapters

Added if and when a matching example ships in the companion repository, keeping the one-chapter-per-tested-example rule:

- Staking and Rewards (reward-per-token accounting currently appears inside Lending and Borrowing, and The Betting Market)
- Vesting and streaming payments
- Formal proving (Kani), as its own section placed after the testing material: every companion example carries proofs, and proofs are the step after tests
