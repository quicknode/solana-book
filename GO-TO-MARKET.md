# Go-to-Market

How the book reaches its readers: positioning, the testimonial engine, reviewer targeting, and launch channels. The review *process* (what reviewers do, how feedback lands) is [REVIEWING.md](REVIEWING.md); the editions and errata policy is in [WRITING-PLAN.md](WRITING-PLAN.md). Outreach status (who has been contacted, replies, dates) is tracked privately, not in this repo.

## Positioning

*Building Financial Software on Solana* is the durable reference for building financial products on Solana: the *TCP/IP Illustrated* of the category. It is not a tutorial for a framework release and it does not compete with docs; it teaches the layer that does not change. The audience, in order: Solana developers building financial products, finance-side engineers arriving at Solana, and auditors/reviewers who need the failure modes in one place. The companion repository and companion AI skill are part of the offer: the book teaches, the repo proves, the skill applies.

## The Testimonial Engine

Testimonials are the exhaust of technical review, not a separate campaign. The sequence:

1. **Invite with an assigned slice** matched to the person's expertise (their invitation names it; REVIEWING.md governs the rest). The invitation mentions, transparently and as optional, that we would love a printable line if the book earns it.
2. **They review, we credit.** Corrections land in Acknowledgements; reviewers are named in About the Technical Reviewers.
3. **The quote ask rides the thank-you.** After their feedback is in: a short note with two or three draft quote angles they may edit, replace, or decline, a 35-word cap, and exactly how they will be credited (name, title, project). Near-zero effort for them; their voice, not ours.

Rules for the praise page:

- **It should read like the ecosystem endorsing the book, not one clique.** Target one founder-tier name, one protocol builder per domain the book covers (order books, AMMs, perps, lending, funds), one security firm, and one educator.
- **Review before reach.** A quote from someone who read their slice beats a bigger name who skimmed the cover. Reach without review produces the weakest quotes.
- **Marquee names get the smallest slices**: the chapter that cites their own work, plus the Introduction, and a one-page "why this book exists". Warm intros over cold email, always.
- **Deadline**: quotes must be in hand before cover finalization, so the testimonial ask goes out with the review invitations, not after print planning starts.

## Reviewer and Blurb Candidates

The exclusion rule, applied before anything else: **no RPC or node-infrastructure providers** (Helius, Triton, Syndica, Alchemy, Ankr, Chainstack, and peers). They are QuickNode competitors, whatever their reach.

| Candidate | Why them | Suggested slice | The hook |
| --- | --- | --- | --- |
| Anatoly Yakovenko (Toly) | Solana co-founder; author of percolator | Perpetual Futures + Financial Programming Concepts intro | Chapter 19 builds a working miniature of percolator's three invariants |
| Raj Gokal | Solana co-founder; reach | Introduction (blurb-tier) | Founder endorsement of the category's reference book |
| Lily Liu | Solana Foundation president; internet capital markets thesis | Introduction + the RWA framing | The book is the ICM thesis as an engineering text |
| Chase Barker | Godfather of Solana dev education; already in Acknowledgements | Introduction + Building Blocks | Also the warm-intro broker for much of this table |
| Dean (Blueshift) | Solana internals educator | Building Blocks (Ch 2-5) + Escrow | The foundation chapters need the harshest available reviewer |
| Noah | Token engineering at production scale | Tokens + Token Fundraiser + Lending | Token machinery reviewed by someone who has shipped it at scale |
| Armani Ferrante | Created Anchor; Backpack | PDAs + Escrow + one program chapter | The book's programs are Anchor-first |
| Eugene Chen (Ellipsis Labs) | Built Phoenix | The Order Book Exchange + Prop AMM | The order book chapter cites Phoenix by name |
| Drift (e.g. Cindy Leow) | Perps from the order-book side | Perpetual Futures + Offchain Truth | Chapter 19 explicitly contrasts pool-based design with Drift's |
| Jupiter (devrel or founder) | Aggregator; Jupiter Perps | Prop AMM + Perpetual Futures | Both chapters cite Jupiter's designs |
| Neodyme (founder or researcher) | Their research is the $2.6B rounding War Story | The Arithmetic of Money + The Adversary + Operating | The book's security spine, reviewed by its primary source |
| Lifinity | Pioneered the prop AMM model | The Prop AMM | The chapter credits them as the pioneer |
| Kamino or Save engineer | Production lending markets | Lending and Borrowing + The Vault Strategy | Both chapters cite their products |
| Anza engineer | Runtime correctness | Building Blocks + Time | The claims about slots, atomicity, and accounts checked at the source |

Candidates surfaced from the [Solana Kingmaker index](https://solanakingmaker.com/) go through the same two filters before joining this table: not an infrastructure competitor, and plausible that they would actually read a slice. (The index is a live dashboard; it must be checked manually, and rankings shift.)

## Launch Channels

- **thesolanabook.com**: early-access chapters, the errata page, and both companions, live before print. Rotating praise quotes as they arrive.
- **The public pre-print feedback loop** (WRITING-PLAN): early chapters released as posts; every correction credited. The community that corrects the book is the community that recommends it.
- **QuickNode channels**: blog, newsletter, and social for chapter releases; the book is the flagship of the content program, not a side project.
- **Conference alignment**: time the print release to a major Solana conference (Breakpoint or Accelerate), where reviewers and blurb-givers are physically present to amplify.
- **Podcasts and shows**: the Solana developer circuit (e.g. Lightspeed, Validated, Solana Compass) in launch month, pitched on the war stories and the "long-lived book" thesis rather than on promotion.
- **Education pipeline**: bootcamps, university blockchain clubs, and cohort programs (the audiences the author already taught through the Solana Foundation bootcamp lineage) get review copies for instructors.

## What Is Deliberately Not Here

Contact details, outreach status, and negotiation notes live in a private tracker. This file records strategy, which is safe to be public; the repo's license and the pre-print feedback loop assume readers wander in.
