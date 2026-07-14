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

## The Kingmaker Index Snapshot

A snapshot of the [Solana Kingmaker index](https://solanakingmaker.com/) (999 accounts, tiers Kings > Royalty > Knights > Commoners > Peasants, ranked by amplification: retweets, quotes, reach, and how unprompted the engagement is) is saved at [research/solana-kingmaker-index-2026-07-14.csv](research/solana-kingmaker-index-2026-07-14.csv). Two rules for using it:

- **It measures amplification, not authority.** Dean is #209 and Armani Ferrante is #659, yet their blurbs carry more weight per word than most of the top 50. Use the index to tier *reach* (who amplifies a launch) and to spot people we would otherwise miss; never let it demote a domain authority off the review list. Neodyme is not in the index at all, and stays on the list.
- **Every name passes two filters**: not an RPC/node-infrastructure competitor (Helius, Triton, Syndica, Alchemy, Ankr, Chainstack, and their staff accounts; this rule excludes the index's #1, mert of Helius), and plausible that they would actually read a slice.

## Reviewer and Blurb Candidates

Kingmaker rank and tier annotated where the person or org appears in the snapshot.

| Candidate | Index | Why them | Suggested slice | The hook |
| --- | --- | --- | --- | --- |
| Anatoly Yakovenko (@toly) | #6 Kings | Solana co-founder; author of percolator | Perpetual Futures + Financial Programming Concepts intro | Chapter 19 builds a working miniature of percolator's three invariants |
| Lily Liu (@calilyliu) | #25 Kings | Foundation president; internet capital markets thesis | Introduction + the RWA framing | The book is the ICM thesis as an engineering text |
| Jacob Creech (@jacobvcreech) | #3 Kings | Foundation dev rel lead; third-highest amplifier in the ecosystem | Introduction + Building Blocks | The dev-education successor to Chase's old seat |
| Brianna Migliaccio (@b_migliaccio) | #10 Kings | Foundation dev rel, Rust educator; top-ten amplifier | Building Blocks (Ch 2-5) + The Arithmetic of Money | The Rust-facing foundation chapters reviewed by a Rust educator |
| Raj Gokal (@rajgokal) | #39 Royalty | Solana co-founder; reach | Introduction (blurb-tier) | Founder endorsement of the category's reference book |
| Kyle Samani (@KyleSamani) | #41 Royalty | Multicoin; wrote the original Solana investment thesis | Introduction + Why Build Financial Programs on Solana | The finance-side blurb: the thesis he wrote, as an engineering text |
| Chase Barker (@therealchaseeb) | #47 Royalty | Godfather of Solana dev education; already in Acknowledgements | Introduction + overall framing | Also the warm-intro broker for much of this table |
| Brennan Watt (@bw_solana) | #56 Royalty | Anza engineering | Building Blocks + Time | Slots, atomicity, and account claims checked at the source (alternates: Alessandro Decina #161, Andrew Fitzgerald #574) |
| Max Resnick (@MaxResnick) | #96 Royalty | Anza economist, market design | The Order Book Exchange + The Adversary's MEV section | Microstructure claims reviewed by a market designer |
| Mary Gooneratne (@marygooneratne) | #101 Royalty | Loopscale co-founder (Solana lending, org #59) | Lending and Borrowing | Production lending reviewed by a builder who is not a competitor's fork |
| Stepan Simkin (@SimkinStepan) | #99 Royalty | Squads (org #102) | Operating Financial Software | The admin-power chapter tells readers to ship multisig upgrade authority; Squads is that multisig |
| xStocks (org) | #53 Royalty | Issuer of the book's example equities (NVDAx, TSLAx, SPCXx style) | Tokens + the RWA framing | The book's asset universe, endorsed by its issuer |
| Kamino (Marius, @y2kappa) | org #18 Kings, Marius #176 Knights | Highest-ranked protocol in the index; lending + vaults | Lending and Borrowing + The Vault Strategy | Both chapters cite Kamino by name |
| Jupiter (@kashdhanda or devrel) | org #30 Kings, kash #195 Knights | Aggregator; Jupiter Perps | Prop AMM + Perpetual Futures | Both chapters cite Jupiter's designs |
| Dean (@deanmlittle) | #209 Knights, Blueshift org #88 Royalty | Solana internals educator | Building Blocks + Escrow | The foundation chapters need the harshest available reviewer |
| Noah (@redacted_noah) | #165 Knights | Token engineering at production scale | Tokens + Token Fundraiser + Lending | Token machinery reviewed by someone who shipped it at scale |
| Jarry Xiao (@jarxiao) | #184 Knights | Ellipsis Labs co-founder; built Phoenix (org #75 Royalty) | The Order Book Exchange + Prop AMM | The order book chapter cites Phoenix by name (alternate: Eugene Chen #585) |
| Drift (Cindy Leow, @cindyleowtt) | org #37 Royalty, Cindy #314 Commoners | Perps from the order-book side | Perpetual Futures + Offchain Truth | Chapter 19 explicitly contrasts pool-based design with Drift's |
| Lucas Bruder (@buffalu__) | #159 Knights | Jito | The Adversary (MEV and ordering) | The MEV section reviewed by the person whose infrastructure defines it |
| Armani Ferrante (@armaniferrante) | #659 Commoners | Created Anchor; Backpack | PDAs + Escrow + one program chapter | The book's programs are Anchor-first; authority, not amplification |
| Neodyme (founder or researcher) | not in index | Their research is the $2.6B rounding War Story | Arithmetic of Money + The Adversary + Operating | The book's security spine, reviewed by its primary source (index-present alternates: Ackee #552, Immunefi #789) |
| HumidiFi or Tessera | #227 / #421 Knights/Commoners | Prop AMM operators the chapter names | The Prop AMM | Lifinity (the credited pioneer) is not in the index; these two are |
| Switchboard (@switchboardxyz) | #603 Commoners | The oracle the book's examples mirror | Offchain Truth | The feed-parsing claims checked by the feed's own team (alternate: Pyth #544) |

## Launch Channels

- **thesolanabook.com**: early-access chapters, the errata page, and both companions, live before print. Rotating praise quotes as they arrive.
- **The public pre-print feedback loop** (WRITING-PLAN): early chapters released as posts; every correction credited. The community that corrects the book is the community that recommends it.
- **QuickNode channels**: blog, newsletter, and social for chapter releases; the book is the flagship of the content program, not a side project. (The index has @QuicknodeSolana at #135 and @Quicknode at #434; a chapter-release cadence is exactly the content that climbs it.)
- **Amplifier accounts, per the index**: Solana Developers (#4), SolanaFloor (#29), Solana Events (#5), Capital Markets (#9), and Tokens on Solana (#45) are the highest-leverage reposters of developer content; Solana中文/Solar (#32) for the Chinese-language ecosystem.
- **Conference alignment**: time the print release to a major Solana conference (Breakpoint or Accelerate), where reviewers and blurb-givers are physically present to amplify. Colosseum (#11) hackathons are a natural review-copy audience.
- **Podcasts and shows**: Lightspeed (#95), The Index (#131), Solana Ecosystem Call (#341), and Validated (#898) in launch month, pitched on the war stories and the "long-lived book" thesis rather than on promotion.
- **Education pipeline**: bootcamps, university blockchain clubs, and cohort programs (Turbin3 #612, Superteam network #16 plus regionals, the Solana Foundation bootcamp lineage the author taught through) get review copies for instructors.

## What Is Deliberately Not Here

Contact details, outreach status, and negotiation notes live in a private tracker. This file records strategy, which is safe to be public; the repo's license and the pre-print feedback loop assume readers wander in.
