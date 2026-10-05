# Building Financial Software on Solana

The planning and manuscript repo for **Building Financial Software on Solana**, a long-lived fundamentals book in the tradition of *TCP/IP Illustrated*: the mental models, the math, and the adversary, for developers building financial software on Solana.

## Purpose

The book teaches the part of building financial software on Solana that doesn't change: how financial ideas become accounts and instruction handlers, how to calculate with money safely, how facts from outside the chain are verified on it, and how programs get attacked. Runnable, current code is deliberately not the book's job. It lives in the companion repository, where the tests run on every change.

The book's home is [solanabook.org](https://solanabook.org), which hosts the published chapters, the errata page (source: [ERRATA.md](ERRATA.md)), and links to both companions.

## Contents

- [TABLE-OF-CONTENTS.md](TABLE-OF-CONTENTS.md) - the linked table of contents
- [WRITING-PLAN.md](WRITING-PLAN.md) - the chapter template, generation pipeline, War Story register, review process, and milestones
- [REVIEWING.md](REVIEWING.md) - the reviewer-facing guide sent with advance copies
- One folder per section ([prelude/](prelude/), [solana-building-blocks/](solana-building-blocks/), [financial-programming-concepts-in-solana/](financial-programming-concepts-in-solana/), [building-financial-products-in-solana/](building-financial-products-in-solana/), [conclusion/](conclusion/), [appendices/](appendices/), [postlude/](postlude/)), one file per chapter, all drafted

## Companion projects

- [Solana Program Examples](https://github.com/quicknode/solana-program-examples) - the book's **companion repository**: the tested, CI-verified programs behind each program chapter
- [Solana Finance Claude Plugin](https://github.com/quicknode/solana-finance-claude-plugin) - the book's **companion AI plugin**: it distills this book's rules into a form AI coding tools apply, and its style guide is what the manuscript follows

## Building the PDF

`npm install` then `npm run build-pdf-digital` renders the whole manuscript, in table-of-contents order, as a single-column textbook PDF (serif type, running headers, page numbers, a contents page with page numbers) into `build/`. The page is 7.44 x 9.69in, the KDP standard trim closest in proportion to the 7 x 9.19in size technical books are usually printed at. Three builds share it: `build-pdf-digital` is the finished book for reading on screen, `build-pdf-paperback` the interior uploaded to KDP, and `build-pdf-draft -- --reviewer "<name>"` an advance copy stamped for one reviewer, which takes `--size letter` for a reviewer printing on an office printer. `npm run resize-cover` sizes the full-wrap cover export (`assets/cover-wrap.pdf`) to KDP's exact requirement, spine width included. [PRINT-SPECIFICATION.md](PRINT-SPECIFICATION.md) records the trim, margins, type, cover math, and the rest of the physical book. Requires a Chromium binary; the script uses `/opt/pw-browsers/chromium` or the `CHROMIUM_PATH` environment variable.

## Preparing for press

1. Export the full-wrap cover (back, spine and front, with bleed) from Figma as a PDF to `assets/cover-wrap.pdf`.
2. Build the interior without the cover page, without the clickable links that KDP would otherwise strip as non-printable markup, and without the prerelease draft markings, then resize the cover to KDP's exact size, spine width taken from the interior's page count:

   ```
   npm run build-pdf-paperback
   ```

   `npm run resize-cover` runs the second half alone, for cream paper (`-- --paper cream`) or a different page count (`-- --pages N`).

3. Upload both to Amazon KDP: `build/Building Financial Software on Solana (paperback interior).pdf` as the manuscript, and `build/cover-kdp-<pages>pp-white.pdf` as the cover.

## Status

Drafted: the Introduction, Solana Building Blocks, all of Financial Programming Concepts in Solana, every program chapter, and the Glossary. Every figure is drawn as SVG in the chapters' `figures/` directories. The dedication, acknowledgements, and technical reviewers page are drafted.

## License

The book's text and figures are [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); code samples are MIT; Quicknode brand assets and the cover are excluded. See [LICENSE.md](LICENSE.md).
