# Go-to-Market

How the book reaches its readers: positioning, reviewer targeting, and launch channels. The review *process* (what reviewers do, how feedback lands) is [REVIEWING.md](REVIEWING.md); the editions and errata policy is in [WRITING-PLAN.md](WRITING-PLAN.md). Outreach status (who has been contacted, replies, dates) is tracked privately, not in this repo.

## Positioning

*Building Financial Software on Solana* is the durable reference for building financial products on Solana: the *TCP/IP Illustrated* of the category. It is not a tutorial for a framework release and it does not compete with docs; it teaches the layer that does not change. The audience, in order: Solana developers building financial products, finance-side engineers arriving at Solana, and auditors/reviewers who need the failure modes in one place. The companion repository and companion AI skill are part of the offer: the book teaches, the repo proves, the skill applies.

## Reviewer Targeting

Reviewers come from named people, never organizations: an org account cannot read three chapters. Where the candidate table lists a company, it is a placeholder for a person at that company who must be identified before any invitation goes out. Reviewer coverage should span the ecosystem, not one clique: one founder-tier name, one protocol builder per domain the book covers (order books, AMMs, perps, lending, funds), one named security researcher, and one educator. Marquee names get the smallest slices: the chapter that cites their own work, plus the Introduction, and a one-page "why this book exists". Warm intros over cold email, always.

## The Kingmaker Index Snapshot

A snapshot of the [Solana Kingmaker index](https://solanakingmaker.com/) (999 accounts, tiers Kings > Royalty > Knights > Commoners > Peasants, ranked by amplification: retweets, quotes, reach, and how unprompted the engagement is) is saved at [research/solana-kingmaker-index-2026-07-14.csv](research/solana-kingmaker-index-2026-07-14.csv). Two rules for using it:

- **It measures amplification, not authority.** Dean is #209 and Armani Ferrante is #659, yet their reviews carry more weight per word than most of the top 50. Use the index to tier *reach* (who amplifies a launch) and to spot people we would otherwise miss; never let it demote a domain authority off the review list. Neodyme is not in the index at all, and stays on the list.
- **Every name passes two filters**: not an RPC/node-infrastructure competitor (Helius, Triton, Syndica, Alchemy, Ankr, Chainstack, and their staff accounts; this rule excludes the index's #1, mert of Helius), and plausible that they would actually read a slice.

## Reviewer Candidates

Kingmaker rank and tier annotated where the person or org appears in the snapshot.

| Candidate | Index | Why them | Suggested slice | The hook |
| --- | --- | --- | --- | --- |
| Anatoly Yakovenko (@toly) | #6 Kings | Solana co-founder; author of percolator | Perpetual Futures + Financial Programming Concepts intro | Chapter 19 builds a working miniature of percolator's three invariants |
| Lily Liu (@calilyliu) | #25 Kings | Foundation president; internet capital markets thesis | Introduction + the RWA framing | The book is the ICM thesis as an engineering text |
| Jacob Creech (@jacobvcreech) | #3 Kings | Foundation dev rel lead; third-highest amplifier in the ecosystem | Introduction + Building Blocks | The dev-education successor to Chase's old seat |
| Brianna Migliaccio (@b_migliaccio) | #10 Kings | Foundation dev rel, Rust educator; top-ten amplifier | Building Blocks (Ch 2-5) + The Arithmetic of Money | The Rust-facing foundation chapters reviewed by a Rust educator |
| Raj Gokal (@rajgokal) | #39 Royalty | Solana co-founder; reach | Introduction | A founder's read of the category's reference book |
| Kyle Samani (@KyleSamani) | #41 Royalty | Multicoin; wrote the original Solana investment thesis | Introduction + Why Build Financial Programs on Solana | The finance-side read: the thesis he wrote, as an engineering text |
| Chase Barker (@therealchaseeb) | #47 Royalty | Godfather of Solana dev education; already in Acknowledgements | Introduction + overall framing | Also the warm-intro broker for much of this table |
| Brennan Watt (@bw_solana) | #56 Royalty | Anza engineering | Building Blocks + Time | Slots, atomicity, and account claims checked at the source (alternates: Alessandro Decina #161, Andrew Fitzgerald #574) |
| Max Resnick (@MaxResnick) | #96 Royalty | Anza economist, market design | The Order Book Exchange + The Adversary's MEV section | Microstructure claims reviewed by a market designer |
| Mary Gooneratne (@marygooneratne) | #101 Royalty | Loopscale co-founder (Solana lending, org #59) | Lending and Borrowing | Production lending reviewed by a builder who is not a competitor's fork |
| Stepan Simkin (@SimkinStepan) | #99 Royalty | Squads (org #102) | Operating Financial Software | The admin-power chapter tells readers to ship multisig upgrade authority; Squads is that multisig |
| Person TBD at Backed/xStocks | org #53 Royalty | Issuer of the book's example equities (NVDAx, TSLAx, SPCXx style) | Tokens + the RWA framing | The book's asset universe, reviewed by a named person at its issuer; identify the individual before inviting |
| Marius Ciubotariu (@y2kappa, Kamino) | #176 Knights (org #18 Kings) | Kamino is the highest-ranked protocol in the index; lending + vaults | Lending and Borrowing + The Vault Strategy | Both chapters cite Kamino by name |
| Kash Dhanda (@kashdhanda, Jupiter) | #195 Knights (org #30 Kings) | Aggregator; Jupiter Perps | Prop AMM + Perpetual Futures | Both chapters cite Jupiter's designs |
| Dean (@deanmlittle, Blueshift) | #209 Knights (org #88 Royalty) | Solana internals educator | Building Blocks + Escrow | The foundation chapters need the harshest available reviewer |
| Noah (@redacted_noah) | #165 Knights | Token engineering at production scale | Tokens + Token Fundraiser + Lending | Token machinery reviewed by someone who shipped it at scale |
| Jarry Xiao (@jarxiao, Ellipsis Labs) | #184 Knights (Phoenix org #75) | Ellipsis co-founder; built Phoenix | The Order Book Exchange + Prop AMM | The order book chapter cites Phoenix by name (alternate person: Eugene Chen #585) |
| Cindy Leow (@cindyleowtt, Drift) | #314 Commoners (org #37 Royalty) | Perps from the order-book side | Perpetual Futures + Offchain Truth | Chapter 19 explicitly contrasts pool-based design with Drift's |
| Lucas Bruder (@buffalu__, Jito) | #159 Knights | Jito | The Adversary (MEV and ordering) | The MEV section reviewed by the person whose infrastructure defines it |
| Armani Ferrante (@armaniferrante) | #659 Commoners | Created Anchor; Backpack | PDAs + Escrow + one program chapter | The book's programs are Anchor-first; authority, not amplification |
| Person TBD at Neodyme | not in index | Their research is the $2.6B rounding War Story | Arithmetic of Money + The Adversary + Operating | The book's security spine, reviewed by a named researcher at its primary source (alternate: a named auditor at Ackee, org #552) |
| Person TBD at HumidiFi or Tessera | orgs #227 / #421 | Prop AMM operators the chapter names | The Prop AMM | Lifinity (the credited pioneer) is not in the index; a named operator at either firm works |
| Person TBD at Switchboard | org #603 | The oracle the book's examples mirror | Offchain Truth | The feed-parsing claims checked by a named engineer on the feed's own team (alternate: a named person at Pyth, org #544) |

## Launch Channels

- **thesolanabook.com**: early-access chapters, the errata page, and both companions, live before print.
- **The public pre-print feedback loop** (WRITING-PLAN): early chapters released as posts; every correction credited.
- **QuickNode channels**: blog, newsletter, and social for chapter releases; the book is the flagship of the content program, not a side project. (The index has @QuicknodeSolana at #135 and @Quicknode at #434; a chapter-release cadence is exactly the content that climbs it.)
- **Amplifier accounts, per the index**: Solana Developers (#4), SolanaFloor (#29), Solana Events (#5), Capital Markets (#9), and Tokens on Solana (#45) are the highest-leverage reposters of developer content; Solana中文/Solar (#32) for the Chinese-language ecosystem.
- **Conference alignment**: time the print release to a major Solana conference (Breakpoint or Accelerate), where reviewers are physically present to amplify. Colosseum (#11) hackathons are a natural review-copy audience.
- **Podcasts and shows**: Lightspeed (#95), The Index (#131), Solana Ecosystem Call (#341), and Validated (#898) in launch month, pitched on the war stories and the "long-lived book" thesis rather than on promotion.
- **Education pipeline**: bootcamps, university blockchain clubs, and cohort programs (Turbin3 #612, Superteam network #16 plus regionals, the Solana Foundation bootcamp lineage the author taught through) get review copies for instructors.

## What Is Deliberately Not Here

Contact details, outreach status, and negotiation notes live in a private tracker. This file records strategy, which is safe to be public; the repo's license and the pre-print feedback loop assume readers wander in.
