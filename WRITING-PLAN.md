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

- **The cluster curve is the part of the ball-shaped Ed25519 curve near X=0 — flat at the top-left, sloping gently down and to the right — and nothing crosses it.** Canonical path `M 0,36 Q 400,36 640,116`: monotone, never drooping down in the middle and never raising up in the middle (no domes). The gentle slope leaves room beneath the right side of the curve for the rightmost column and empty space in the top-right corner, where all titles go (cluster label right-aligned, e.g. `x="628" y="24"`). Every on-curve address dot (each person, each mint, the program) sits on the curve by the shared placement formula; every box hangs below with its top clearing the curve at the box's right edge by ≥6px. A mint's small box sits in the open top-right region (or the strip above the flat left), its dot on the curve beneath it. No arrow or leader line ever crosses the curve. The curve is the heaviest stroke in the figure (`stroke-width="3.5"`); token arrows and everything else stay visibly lighter.
- **No arrow or leader passes through a label.** A label sitting on its own arrow's path is the most common defect after re-anchoring; the white halo cannot hide a stroke crossing a word. Labels sit beside their arrows, never on them.
- **Struct boxes show real fields; text never escapes a box.** Every `key: value` line in a data-PDA box is a verbatim field from the chapter's struct definition with the story's value; notes that aren't fields are italic annotations. All text keeps ≥6px padding inside its rect — shrink the field/handler font in a crowded box rather than letting text touch or cross the border.
- **Accounts stack in columns beneath their owner's dot.** A person's column reads top to bottom: wallet, their token account(s), their per-program user account, their bets/orders/positions. Program-wide accounts stack beneath the program's dot: program box, config, event/market/pool PDA, outcomes/reserves, vaults. Box top positions stay fixed across every figure in a chapter.
- **People are wallet rectangles**: a bordered rectangle with a head-and-shoulders glyph, a bold left-aligned name title (role labels like "Alice (maker)" in program chapters, "Alice's Account" in the foundation chapters), and the person's SOL balance beneath. Lamport and token arrows that touch a person start or end at this rectangle's edge, never at a bare curve dot or a stick figure. Instruction handlers listed inside a program's rectangle are left-aligned, one per line, always with parens: `place_bet()`.
- **Each account box carries its kind's icon** beside the title, from the fixed vocabulary: head-and-shoulders person for wallets, piggy bank for token accounts and vaults, gear for programs, table for data-struct PDAs, a columned mint building for mints. One vocabulary book-wide; the exact glyph paths live in the finance skill's DIAGRAMS.md.
- **Rounded corners mean accounts, and nothing else.** Every box that is not an account (transaction envelopes, instruction rows, the transaction log, state-machine states, seed chips, failed or hypothetical calls, offchain parties, annotation panels) draws with square corners, so a reader can tell at a glance what lives on the chain as an account and what does not.
- **Address dots have white centers, on-curve and off-curve alike**: `fill="#fff" stroke="#111" stroke-width="2"`. Beside every dot, the words `PUBLIC KEY` for an on-curve address, or the word `SEEDS` followed by the actual seed list (`SEEDS: "OFFER" + MAKER'S ADDRESS + ID`) for a PDA or ATA. The label carries the on-curve/off-curve distinction; the dots themselves are identical.
- **Seeds are never drawn inside an account's rectangle**, because seeds are not part of the account struct. They are labeled near the small address circle that sits above or beside the account box.
- **A custom PDA's rectangle shows its struct as `key: value`, one field per line**, using the walkthrough's story values where the chapter has them.
- **Every walkthrough step ("Alice does X", "Bob does Y") is followed by a diagram** showing the token movements, account creations and closures, and value changes that step caused.
- **Per-step diagrams show the program's whole account picture, fading what the step doesn't touch down to its heading.** The chapter's account map fixes the column layout; each step figure reuses those positions. Accounts the step reads or writes draw at full ink; every untouched account is wrapped in `<g opacity="0.3">` and reduced to icon plus title — no struct fields, no balances. One fade level, `0.3`. Accounts that don't exist yet at that point in the story are omitted, not faded.
- **One accent green, on the step's action only.** The palette is ink on paper plus `#1e7a3c`, reserved for the invoked handler line, token-movement arrows with their coins and amount labels, and NEW badges. Accented marks are also the boldest, so figures read identically in greyscale print; no second hue anywhere.
- **Token movement arrows carry coins.** A solid accent arrow with a bold accent amount label and a small coin glyph (two overlapping white-filled circles with a currency mark) at its midpoint. Lamport, rent, and authority relationships stay dashed grey with no coins and no accent, so a reader scanning for value transfer follows the green.
- **Handler names carry parens in prose too**: `settle_event()` invokes, `event` is an account, `total_pool` is a field. Test names stay bare.

Steps currently missing their per-step diagram, to be drawn in the visual pass:

- Lending and Borrowing: Carol's short; Bob's repayment and collateral withdrawal.
- Perpetual Futures: Alice's `close_position` payout.
- The Prop AMM: Maria's `deposit_inventory` and `withdraw_inventory`.
- The Vault Strategy: Bob's deposit at the new share price.

## Reviewers, Feedback, and Editions

- **Named technical reviewers**: recruit respected Solana engineers early, so review happens per part rather than as one giant pass at the end. Their names fill the About the Technical Reviewers section. Visible peer review is part of how fundamentals titles earn their standing.
- **Public pre-print feedback loop**: release chapters early, as posts or an early-access build, collect corrections, and credit contributors in Acknowledgements.
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
