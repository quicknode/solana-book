# Building Financial Software on Solana

The planning and manuscript repo for **Building Financial Software on Solana**, a long-lived fundamentals book in the tradition of *TCP/IP Illustrated*: the mental models, the math, and the adversary, for developers building financial software on Solana.

## Purpose

The book teaches the durable layer of building financial software on Solana: how financial ideas become accounts and instruction handlers, how to calculate with money safely, how facts from outside the chain are verified on it, and how programs get attacked. Runnable, current code is deliberately not the book's job. It lives in the companion repository, where CI keeps it honest.

The book's home is [thesolanabook.com](https://thesolanabook.com), which hosts the published chapters, the errata page (source: [ERRATA.md](ERRATA.md)), and links to both companions.

## Contents

- [TABLE-OF-CONTENTS.md](TABLE-OF-CONTENTS.md) - the linked table of contents
- [WRITING-PLAN.md](WRITING-PLAN.md) - the chapter template, generation pipeline, War Story register, review process, and milestones
- [REVIEWING.md](REVIEWING.md) - the reviewer-facing guide sent with advance copies
- One folder per section ([prelude/](prelude/), [solana-building-blocks/](solana-building-blocks/), [financial-programming-concepts-in-solana/](financial-programming-concepts-in-solana/), [building-financial-products-in-solana/](building-financial-products-in-solana/), [appendices/](appendices/)), one file per chapter; drafted chapters have full text, the rest are skeletons marked "not yet drafted"

## Companion projects

- [Solana Program Examples](https://github.com/quicknode/solana-program-examples) - the book's **companion repository**: the tested, CI-verified programs that each program chapter walks through
- [Solana Finance Claude Plugin](https://github.com/quicknode/solana-finance-claude-plugin) - the book's **companion AI skill**: its rules are what the book distills, and its style guide is what the manuscript follows

## Building the PDF

`npm install` then `npm run build-pdf` renders the whole manuscript, in table-of-contents order, as a two-column, letter-size textbook PDF (serif type, running headers, page numbers, a contents page with page numbers) into `build/`. Requires a Chromium binary; the script uses `/opt/pw-browsers/chromium` or the `CHROMIUM_PATH` environment variable.

## Status

Drafted: the Introduction, Solana Building Blocks, all of Financial Programming Concepts in Solana, every program chapter, and the Glossary. Program chapters carry figure placeholders awaiting the visual pass. The dedication, acknowledgements, and author bio are placeholders until the book is complete.

## License

The book's text and figures are [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); code samples are MIT; Quicknode brand assets and the cover are excluded. See [LICENSE.md](LICENSE.md).
