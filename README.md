# Building Financial Software on Solana

The planning and manuscript repo for **Building Financial Software on Solana**, a long-lived fundamentals book in the tradition of TCP/IP Illustrated: the mental models, the math, and the adversary, for developers building financial software on Solana.

## Purpose

The book teaches the durable layer of building financial software on Solana: how financial ideas become accounts and instruction handlers, how to calculate with money safely, how facts from outside the chain are verified on it, and how programs get attacked. Runnable, current code is deliberately not the book's job. It lives in the companion repo, where CI keeps it honest.

## Contents

- [TABLE-OF-CONTENTS.md](TABLE-OF-CONTENTS.md) - the linked table of contents
- [WRITING-PLAN.md](WRITING-PLAN.md) - the chapter template, generation pipeline, War Story register, review process, and milestones
- [chapters/](chapters/) - one file per chapter, front-matter section, and appendix; drafted chapters have full text, the rest are skeletons marked "not yet drafted"

## Companion projects

- [Solana Program Examples](https://github.com/quicknode/solana-program-examples) - the tested, CI-verified programs that each program chapter walks through
- [Solana Finance Claude Plugin](https://github.com/quicknode/solana-finance-claude-plugin) - the skill whose rules the book distills and whose style guide the manuscript follows

## Status

Drafted: How to Use This Book, Escrow, The Order Book Exchange, The Constant-Product AMM, Vaults (vault strategy), Lending and Borrowing, The Betting Market, the Terminology appendix, and the author bio. Program chapters carry figure placeholders awaiting the visual pass. Skeletons only: Solana Building Blocks, Financial Programming Concepts in Solana, Token Fundraiser, Perpetual Futures, the Invariant Checklist, and The Visual Language.
