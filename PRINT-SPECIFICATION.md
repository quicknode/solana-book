# Print Specification

The physical book: its trim, its type, and why each number is what it is. Everything here is produced by `scripts/build-pdf.mjs`, which is the implementation; this file is the intent, so the two are changed together.

## Trim Size

**7.44 x 9.69 in (189 x 246 mm).**

Technical books are usually printed at 7 x 9.19in (178 x 233mm): O'Reilly's animal books, and, near enough, Manning at 7.38 x 9.25 and Addison-Wesley's *TCP/IP Illustrated* at 7 x 9.25. That is the shelf this book belongs on.

Amazon KDP does not offer 7 x 9.19. Of the trims it does offer, 7.44 x 9.69 is the closest in proportion: 0.768 against 0.762, a difference nobody can see. The alternatives were 7 x 10, which matches the width exactly but reads as a leaner, taller book, and 7.5 x 9.25, which matches the height but is half an inch wider and reads squarer.

The book was previously built at US Letter, 8.5 x 11in. Letter is a printer-paper size rather than a book size: it reads as a manual, it costs more per unit in print on demand, and at 6.3in of measure the lines ran past the length a reader can comfortably track.

`PAGE_SIZES` in `scripts/build-pdf.mjs` holds the trim and its margins. The page box, the cover's display size, the resolution the cover is rasterized at, and the figure width all derive from the entry the build selects, so a size is one object rather than numbers scattered through the CSS.

## The Page

| | |
| --- | --- |
| Trim | 7.44 x 9.69 in |
| Margins | 0.8in top, 1in sides, 1in bottom |
| Text block | 5.44 x 7.89 in |
| Measure | about 90 characters, 41 lines |

**The margins are O'Reilly's, near enough.** An animal book at 7 x 9.19in carries a text block of about 5.2 x 7.4in: 0.85 to 0.9in inside, 0.95 to 1in outside, 0.8in above the text with the running head at about 0.5in, and 1in below with the folio at about 0.6in. On the slightly larger KDP trim, 1in sides and a 1in bottom give a 5.44 x 7.89in block that is the same share of the page. They also clear KDP's inside-margin requirement, 0.625in for a book of 301 to 500 pages (KDP's table, read October 5, 2026), with room for the binding to eat.

The measure that leaves, 5.44in of 10pt type, runs to about 90 characters. That is long by the usual rule of thumb, and it is what O'Reilly's own pages run to at the same type size; the book was 11pt on 0.85in margins until it was measured against one, and at 81 characters a line with 38 lines a page it read as a larger, looser page than the shelf it sits on.

Margins are symmetric rather than mirrored, where O'Reilly's outside margin is a tenth of an inch wider than the inside. If the interior is ever sent to a printer that wants a larger inside margin than outside, that is a `@page :left` and `@page :right` pair, and the gutter number above is where it starts.

**Every page is cropped to the trim after printing, because Chromium's sheet is bigger than the one asked for.** A 7.44 x 9.69in page is 535.68 x 697.68pt, and Chromium prints 535.92 x 697.92: one 1/300in dot more than asked for in each direction, even though the trim is already a whole number of dots. The extra dot cannot be avoided from the page description: the size comes out the same written in `in`, `pt`, `px`, `mm` or `q`, asked for a hundredth of a point smaller, or passed to `page.pdf()` as an explicit width and height instead of through `preferCSSPageSize`. Chromium anchors the content at the top left, so the slack lands on the right and at the bottom, where on a white interior page it is invisible and on the cover it read as a white band down two edges of the art. `build-pdf.mjs` sets each page's MediaBox and CropBox back to the trim, keeping the top-left corner, which both removes the band and makes the file's page size the one this document states. A build whose sheet comes out *smaller* than the trim fails rather than cropping, because that is a page size nobody asked for.

The cover art is drawn a point past the trim on every side so that rounding in Chromium's paint of the image cannot leave a white hairline inside the crop, and the cover's paged.js sheet is widened to match, because that sheet's clip rounds its right edge down by a fraction of a point and would reinstate the hairline there. Only the width is widened: a taller sheet spills the art past the bottom of the cover and onto the top of the title page, which is a hairline of cover black along three edges of page two rather than a clean page.

## Type

| Role | Face | Size |
| --- | --- | --- |
| Body | Gelasio (bundled in `assets/fonts/`) | 10pt / 1.38, so 13.8pt leading |
| Headings | Denim INK (bundled in `assets/fonts/`) | 28pt part, 24pt chapter, 14pt section, 11pt italic sub-section |
| Code and addresses | DejaVu Sans Mono (bundled in `assets/fonts/`) | 0.85em, so 8.5pt |
| Figures | Denim INK, with DejaVu Sans Mono for handler names, seed lists and addresses | 4.3-9pt, see below |
| Figure captions | Body face, italic | 9pt |
| Footnotes | Body face | 8pt |
| Running heads | Gelasio italic | 8pt |
| Folio | Gelasio | 9pt |

**The sizes are O'Reilly's.** Their technical books set Minion Pro at about 10pt on 13pt, with code around 8.5pt, captions and footnotes at 8 to 9pt, running heads at 8pt, and sans-serif headings from the mid-20s for a chapter title down to 12pt for the smallest. Point size alone does not carry across faces: Gelasio's x-height is 0.48 of the em where Minion's is 0.43, so 10pt Gelasio reads like 11pt Minion, a shade larger than an O'Reilly page rather than smaller. At its earlier 11pt, the book read like 12pt Minion.

**Every face is pinned, so a build is identical on any machine.** This used not to be true: the body asked for Charter and fell back to Georgia, and the figures asked for Georgia and fell back to whatever generic serif the machine had. Two machines produced two different books, and `check-figure-geometry.mjs` measured clearances against a face the printed book would never use, which is how a coin mark sitting on top of a label passed the check.

Gelasio, DejaVu Sans Mono and Denim INK are bundled in `assets/fonts/`. Gelasio is [OFL](https://openfontlicense.org/) and DejaVu Sans Mono is under the permissive DejaVu Fonts License; both licenses sit beside the fonts. Denim INK is licensed to Quicknode.

The figures were drawn against Georgia and moved to Denim INK, the heading face, for legibility at figure sizes; the sans is a shade wider, and the geometry check confirmed every label still clears its box. Seed lists and built-in addresses, at seven units the smallest text in the book, are DejaVu Sans Mono, a monospace whose letters stay apart where a serif's small capitals blurred.

**Bundle static instances, not variable fonts.** Chromium's print-to-PDF silently drops a variable font and falls back to a system serif, with no warning and no error: the PDF simply comes out in the wrong face. Gelasio ships as a variable font; the four static instances are what this build embeds. If a face is ever swapped, check the result with `/BaseFont` in the PDF rather than trusting the page.

## Justification and Hyphenation

**Body text is justified, with automatic hyphenation.** The two go together: justification without hyphenation opens rivers of white space between words, because the only way to fill a line is to stretch its spaces. Hyphenation gives the line breaker somewhere else to give.

**Headings are set ragged right and never hyphenated.** A heading is short enough that justifying it would stretch two or three words across the measure, and a broken word in a heading reads as a typo.

Figure captions and table cells are ragged right for the same reason: they are short, and a justified caption of one line is a caption with holes in it.

## Running Heads and Folios

The header carries two items: the book's title on the left, the current chapter's title on the right, both 8pt Gelasio italic in grey. That is the conventional pair, and it is all that fits. At this measure a third box wraps both of them onto two lines, which is why the prerelease marker sits in the footer at bottom left instead, with the folio centered. A draft, which always carries `--reviewer`, fills the third footer box, bottom right, with that name and the short hash of the commit it was built from, so a single leaf out of an advance copy still says whose it is and which revision of the text it shows. The hash carries a `-dirty` suffix when the working tree had uncommitted changes, because that text matches no commit exactly. Final builds leave that box empty.

Headers and folios are suppressed on the cover, the title page, chapter openers (headers only), part titles, and the blank versos paged.js inserts. The reviewer stamp follows the folio: present wherever the folio is, absent from the cover and the blanks.

## Structure

The title page opens on a right-hand page: page one when the book is built without the cover, page three when it is built with it, the blank page between them being the reverse of the cover. A part title opens on a right-hand page, alone in the upper third of an otherwise empty page, and the reverse of that page is left blank so the part's first chapter also opens on a right-hand page. Every chapter opens on a right-hand page too, which is how a reader flipping through finds where one ends and the next begins. Paged.js fills the verso it skips with a blank page, so the rule costs a page whenever the section before ends on a right-hand page: eleven before chapters and part titles in the October 7, 2026 build, a count that moves as chapters grow. Front-matter placeholders are exempt, because they share one flow until they have real content.

The title page and every part and chapter opening are checked against their page numbers after layout, and the build fails naming any that landed on a left-hand page. It prints the number it checked on success, because a selector that stopped matching would otherwise leave a check that passes without testing anything.

Page one of the PDF is page one of the flow, so odd page numbers are right-hand pages whether or not the cover is included. The recto break rules re-resolve either way.

## Figures

Every figure is an SVG, inlined into the build so the HTML has no external assets, and set to the full 5.44in measure. Figures do not break across pages. Most are drawn on a 640-unit canvas, which puts a unit at 0.612pt, so a 7-unit label prints at 4.3pt: smaller than anything else in the book, and smaller than O'Reilly's figure labels, which rarely go under 7pt. That is a property of the drawings, not of the page, and the fix is in the figures. The conventions the drawings themselves follow live in the companion AI plugin's `DIAGRAMS.md`, and `scripts/check-figure-geometry.mjs` enforces the mechanically checkable ones.

## Cover

The cover is authored separately as a print-ready PDF at `assets/cover.pdf` and rasterized into the build at 300dpi. Vector covers rendered unreliably through the PDF pipeline, so the page the book carries is deliberately raster.

Its art is 744 x 969, an aspect of 0.7678, which is the page's exactly, so nothing is stretched. That the two match is the whole requirement on the file: `.cover img` pins both dimensions, so art of any other proportion is squashed to fit rather than fitted inside the page, and the squash is silent. Absolute size does not matter, because the build scales page one to 2232 pixels wide whatever the MediaBox says; only the ratio does.

The drawing is vector throughout and its type is outlined, so the file embeds no fonts and nothing in it depends on a face being found at build time. The 300dpi rasterization is the only thing that limits it. An export from Figma carrying a layer blur, a non-normal blend mode, or a placed photograph would not have that property, because Figma flattens those regions to bitmap at frame resolution and its PDF export has no scale multiplier; such an export needs its frame scaled to 2232 x 2907 first, so the flattened parts land at 300dpi.

**The press cover is a separate export, sized by `npm run resize-cover`.** A file going to KDP wraps the whole book: 0.125in bleed + 7.44in back cover + spine + 7.44in front cover + 0.125in bleed wide, and 9.69 + 0.25in tall. The spine is the interior page count times KDP's per-page thickness (0.002252in for white paper, 0.0025in for cream), so at 313 interior pages on white (the digital edition's 315 less the cover and its blank reverse) the target is 15.835 x 9.94in with a 0.705in spine. None of that belongs in `assets/cover.pdf`, which is the front cover at trim and nothing else.

`npm run resize-cover` rescales the Figma export of the full wrap, kept at `assets/cover-wrap.pdf` (another path can be passed as an argument, `--pages N`, `--paper white|cream` and `--out <file>` as options; the output defaults to `build/cover-kdp-<pages>pp-<paper>.pdf`), to that exact size, filling the target and cropping overflow symmetrically into the bleed. Page count is read from the paperback interior, the file actually uploaded, unless `--pages` is passed. `npm run build-pdf-paperback` runs it straight after building that interior, so the two always agree; run it alone to pass `--paper cream` or `--pages`. The script also measures the spine the art was drawn for, by aligning trim heights and taking the width left over after two covers and two bleeds, and warns when that disagrees with the real spine: the art then bleeds onto or short of the true spine edges by half the difference per side, and spine text rides off-center by the same amount. A warning means the rescale is good enough for a proof and the production cover should be re-exported from a Figma frame drawn for the frozen page count (1 px = 1 pt: 15.835 x 9.94in is a 1140 x 716 px frame).

## US Letter

`--size letter` builds the same manuscript at 8.5 x 11in with 1.1in side margins, and writes it to a filename carrying the size so it cannot overwrite a build at the trim. It is for reading on screen and for running a draft off an office printer, where Letter is the paper in the tray.

It is not a book size and is not what gets printed. Letter's margins leave a 6.3in measure, about 100 characters of 10pt type, which is longer than a reader tracks comfortably, and print on demand costs more per unit at that trim. The page count differs too: 273 pages against 315, because the larger page carries more.

## Building It

```
npm install
npm run build-pdf-digital                  # the finished book for screens: cover and links, no draft markings
npm run build-pdf-paperback                # the KDP upload: the interior (no cover, no links, no draft markings), then the cover sized to it
npm run build-pdf-website-preview          # the free sample for the website: every page before Part I, then a closing page asking for an email address
npm run build-pdf-draft -- --reviewer "..."   # advance copy: name and commit hash on the title page and every folio
npm run build-pdf-draft -- --reviewer "..." --size letter   # the same at US Letter
npm run build-pdf-digital -- out.pdf       # explicit output path
npm run build-pdf-digital -- --help        # the switches, from the script itself
npm run preview -- <name> "<phrase>"       # rasterize the page of the digital edition carrying the phrase
npm run preview -- <name> --chapter escrow # rasterize every page of one chapter, matched by file name or title
npm run preview -- <name> --chapter escrow --pdf "build/Building Financial Software on Solana (paperback interior).pdf"   # the same from another build
```

An unrecognized switch, a `--size` or `--reviewer` with no value or an unknown size, and more than one output path all print the usage and exit nonzero, rather than taking the stray argument for a filename. So does a draft with no `--reviewer`, since a review copy nobody can trace is the one the stamp exists to prevent, and a final build with one, since a review copy is not final.

Each build writes its own file in `build/`: the digital edition is `Building Financial Software on Solana.pdf`, and every other build adds a label, `(paperback interior)`, `(draft, <reviewer>)` or `(letter)`, so one build never overwrites another. `build-pdf-website-preview` builds the digital edition, then writes `(website preview)`: that edition's own pages up to the Part I title page (the cover, the front matter, the contents and the Introduction), followed by a page inviting the reader to ask for the whole book. The cut is found by the part title's text, so it moves with the front matter. Contents and cross-reference links to pages the preview leaves out are removed rather than left pointing nowhere. Beside each PDF goes a page map of the same name ending `.pages.json`, listing each chapter's file, title, and first and last page; `npm run preview -- --chapter` reads it, so a chapter preview breaks pages exactly where that build does. Previews land in `build/` as `<name>-p<page>.png`. The three scripts set `FINAL=1`, `NO_COVER=1` and `NO_LINKS=1` for `scripts/build-pdf.mjs`, and those still compose by hand for an unusual combination: `FINAL=1 NO_COVER=1 node scripts/build-pdf.mjs --size letter` is a cover-less final Letter build.

**The interior uploaded to KDP carries no links.** A link in a PDF is an annotation laid over the page rather than ink on it, and KDP removes every one it finds, then reports each page it removed one from as "non-printable markup" to be checked: every table of contents page, and every page with a cross-reference or an address. Nothing printed changes when they go, because every address is printed in full after its link text, but the report cannot say so. `NO_LINKS=1` builds the file without them, and without the named destinations the internal links pointed at, so KDP has nothing to remove. Every other build keeps them, for reading on screen.

The build and the preview need a Chromium binary, found at `CHROMIUM_PATH` if set, otherwise at `/opt/pw-browsers/chromium`, otherwise at `/opt/homebrew/bin/chromium` (`brew install chromium` on a Mac).

At the time of writing the manuscript runs to **315 pages** with the cover, which puts it in KDP's 301 to 500 page band for gutter purposes, whose 0.625in minimum the 1in inside margin clears. Every figure is drawn, so that number will move with editing rather than with artwork.
