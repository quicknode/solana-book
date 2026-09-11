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

**The margins are O'Reilly's, near enough.** An animal book at 7 x 9.19in carries a text block of about 5.2 x 7.4in: 0.85 to 0.9in inside, 0.95 to 1in outside, 0.8in above the text with the running head at about 0.5in, and 1in below with the folio at about 0.6in. On the slightly larger KDP trim, 1in sides and a 1in bottom give a 5.44 x 7.89in block that is the same share of the page. They also clear KDP's gutter requirement, 0.75in for a book of 151 to 500 pages, with room for the binding to eat.

The measure that leaves, 5.44in of 10pt type, runs to about 90 characters. That is long by the usual rule of thumb, and it is what O'Reilly's own pages run to at the same type size; the book was 11pt on 0.85in margins until it was measured against one, and at 81 characters a line with 38 lines a page it read as a larger, looser page than the shelf it sits on.

Margins are symmetric rather than mirrored, where O'Reilly's outside margin is a tenth of an inch wider than the inside. If the interior is ever sent to a printer that wants a larger inside margin than outside, that is a `@page :left` and `@page :right` pair, and the gutter number above is where it starts.

**Every page is cropped to the trim after printing, because Chromium's sheet is bigger than the one asked for.** A 7.44 x 9.69in page is 535.68 x 697.68pt, and Chromium prints 535.92 x 697.92: it rounds the sheet up to the next 1/300in dot. The extra dot cannot be avoided from the page description — the size comes out the same written in `in`, `pt`, `px`, `mm` or `q`, asked for a hundredth of a point smaller, or passed to `page.pdf()` as an explicit width and height instead of through `preferCSSPageSize`. Chromium anchors the content at the top left, so the slack lands on the right and at the bottom, where on a white interior page it is invisible and on the cover it read as a white band down two edges of the art. `build-pdf.mjs` sets each page's MediaBox and CropBox back to the trim, keeping the top-left corner, which both removes the band and makes the file's page size the one this document states. A build whose sheet comes out *smaller* than the trim fails rather than cropping, because that is a page size nobody asked for.

The cover art is drawn a point past the trim on every side so that rounding in Chromium's paint of the image cannot leave a white hairline inside the crop, and the cover's paged.js sheet is widened to match, because that sheet's clip rounds its right edge down by a fraction of a point and would reinstate the hairline there. Only the width is widened: a taller sheet spills the art past the bottom of the cover and onto the top of the title page, which is a hairline of cover black along three edges of page two rather than a clean page.

## Type

| Role | Face | Size |
| --- | --- | --- |
| Body | Gelasio (bundled in `assets/fonts/`) | 10pt / 1.38, so 13.8pt leading |
| Headings | Denim INK (bundled in `assets/fonts/`) | 28pt part, 24pt chapter, 14pt section, 11pt italic sub-section |
| Code and addresses | DejaVu Sans Mono (bundled in `assets/fonts/`) | 0.85em, so 8.5pt |
| Figures | Gelasio, with DejaVu Sans Mono for handler names | 4.3-9pt, see below |
| Figure captions | Body face, italic | 9pt |
| Footnotes | Body face | 8pt |
| Running heads | Gelasio italic | 8pt |
| Folio | Gelasio | 9pt |

**The sizes are O'Reilly's.** Their technical books set Minion Pro at about 10pt on 13pt, with code around 8.5pt, captions and footnotes at 8 to 9pt, running heads at 8pt, and sans-serif headings from the mid-20s for a chapter title down to 12pt for the smallest. Point size alone does not carry across faces: Gelasio's x-height is 0.48 of the em where Minion's is 0.43, so 10pt Gelasio reads like 11pt Minion, a shade larger than an O'Reilly page rather than smaller. The book was 11pt until it was measured against one, when it turned out to read like 12pt Minion, with 38 lines a page against O'Reilly's 42.

**Every face is bundled, so a build is identical on any machine.** This used not to be true: the body asked for Charter and fell back to Georgia, and the figures asked for Georgia and fell back to whatever generic serif the machine had. Two machines produced two different books, and `check-figure-geometry.mjs` measured clearances against a face the printed book would never use — which is how a coin mark sitting on top of a label passed the check.

Gelasio is metrically compatible with Georgia, which is what the figures were drawn against, so pinning it kept every figure's geometry as designed. It is [OFL](https://openfontlicense.org/), as is DejaVu Sans Mono; both licences sit beside the fonts in `assets/fonts/`. Denim INK is licensed to Quicknode.

**Bundle static instances, not variable fonts.** Chromium's print-to-PDF silently drops a variable font and falls back to a system serif, with no warning and no error — the PDF simply comes out in the wrong face. Gelasio ships as a variable font; the four static instances are what this build embeds. If a face is ever swapped, check the result with `/BaseFont` in the PDF rather than trusting the page.

## Justification and Hyphenation

**Body text is justified, with automatic hyphenation.** The two go together: justification without hyphenation opens rivers of white space between words, because the only way to fill a line is to stretch its spaces. Hyphenation gives the line breaker somewhere else to give.

**Headings are set ragged right and never hyphenated.** A heading is short enough that justifying it would stretch two or three words across the measure, and a broken word in a heading reads as a typo.

Figure captions and table cells are ragged right for the same reason: they are short, and a justified caption of one line is a caption with holes in it.

## Running Heads and Folios

The header carries two items: the book's title on the left, the current chapter's title on the right, both 8pt Gelasio italic in grey. That is the conventional pair, and it is all that fits. At this measure a third box wraps both of them onto two lines, which is why the prerelease marker sits in the footer at bottom left instead, with the folio centered. A build carrying `REVIEWER_NAME` fills the third footer box, bottom right, with that name and the short hash of the commit it was built from, so a single leaf out of an advance copy still says whose it is and which revision of the text it shows. The hash carries a `-dirty` suffix when the working tree had uncommitted changes, because that text matches no commit exactly. Unstamped builds leave that box empty.

Headers and folios are suppressed on the cover, the title page, chapter openers (headers only), part titles, and the blank versos paged.js inserts. The reviewer stamp follows the folio: present wherever the folio is, absent from the cover and the blanks.

## Structure

The title page opens on a right-hand page: page one when the book is built without the cover, page three when it is built with it, the blank page between them being the reverse of the cover. A part title opens on a right-hand page, alone in the upper third of an otherwise empty page, and the reverse of that page is left blank so the part's first chapter also opens on a right-hand page. Every chapter opens on a right-hand page too, which is how a reader flipping through finds where one ends and the next begins. Paged.js fills the verso it skips with a blank page, so the rule costs about one page for every two chapters: eight, at the current chapter count. Front-matter placeholders are exempt, because they share one flow until they have real content.

The title page and every part and chapter opening are checked against their page numbers after layout, and the build fails naming any that landed on a left-hand page. It prints the number it checked on success, because a selector that stopped matching would otherwise leave a check that passes without testing anything.

Page one of the PDF is page one of the flow, so odd page numbers are right-hand pages whether or not the cover is included. The recto break rules re-resolve either way.

## Figures

Every figure is an SVG, inlined into the build so the HTML has no external assets, and set to the full 5.44in measure. Figures do not break across pages. Most are drawn on a 640-unit canvas, which puts a unit at 0.612pt, so a 7-unit label prints at 4.3pt: smaller than anything else in the book, and smaller than O'Reilly's figure labels, which rarely go under 7pt. That is a property of the drawings, not of the page, and the fix is in the figures. The conventions the drawings themselves follow live in the companion AI plugin's `DIAGRAMS.md`, and `scripts/check-figure-geometry.mjs` enforces the mechanically checkable ones.

## Cover

The cover is authored separately as a print-ready PDF at `assets/cover.pdf` and rasterized into the build at 300dpi. Vector covers rendered unreliably through the PDF pipeline, so the page the book carries is deliberately raster.

Its art is 744 x 969, an aspect of 0.7678, which is the page's exactly, so nothing is stretched. That the two match is the whole requirement on the file: `.cover img` pins both dimensions, so art of any other proportion is squashed to fit rather than fitted inside the page, and the squash is silent. Absolute size does not matter, because the build scales page one to 2232 pixels wide whatever the MediaBox says; only the ratio does.

The drawing is vector throughout and its type is outlined, so the file embeds no fonts and nothing in it depends on a face being found at build time. The 300dpi rasterization is the only thing that limits it. An export from Figma carrying a layer blur, a non-normal blend mode, or a placed photograph would not have that property, because Figma flattens those regions to bitmap at frame resolution and its PDF export has no scale multiplier; such an export needs its frame scaled to 2232 x 2907 first, so the flattened parts land at 300dpi.

**The press cover is a separate export, sized by `npm run resize-cover`.** A file going to KDP wraps the whole book: 0.125in bleed + 7.44in back cover + spine + 7.44in front cover + 0.125in bleed wide, and 9.69 + 0.25in tall. The spine is the interior page count times KDP's per-page thickness (0.002252in for white paper, 0.0025in for cream), so at 257 pages on white the target is 15.709 x 9.94in with a 0.579in spine. None of that belongs in `assets/cover.pdf`, which is the front cover at trim and nothing else.

`npm run resize-cover -- <wraparound-export.pdf> [--pages N] [--paper white|cream]` rescales the Figma export of the full wrap to that exact size, filling the target and cropping overflow symmetrically into the bleed. Page count is read from the built book unless `--pages` is passed; pass the count of the file actually uploaded as the interior (a `NO_COVER=1` interior is one page shorter than the built book). The script also measures the spine the art was drawn for, by aligning trim heights and taking the width left over after two covers and two bleeds, and warns when that disagrees with the real spine: the art then bleeds onto or short of the true spine edges by half the difference per side, and spine text rides off-center by the same amount. A warning means the rescale is good enough for a proof and the production cover should be re-exported from a Figma frame drawn for the frozen page count (1 px = 1 pt: 15.709 x 9.94in is a 1131 x 716 px frame).

## US Letter

`--size letter` builds the same manuscript at 8.5 x 11in with 1.1in side margins, and writes it to a filename carrying the size so it cannot overwrite the print build. It is for reading on screen and for running a draft off an office printer, where Letter is the paper in the tray.

It is not a book size and is not what gets printed. Letter's margins leave a 6.3in measure, about 100 characters of 10pt type, which is longer than a reader tracks comfortably, and print on demand costs more per unit at that trim. The page count differs too: 222 pages against 259, because the larger page carries more.

## Building It

```
npm install
npm run build-pdf                          # print size, into build/
npm run build-pdf -- --size letter         # US Letter
NO_COVER=1 npm run build-pdf               # interior only
REVIEWER_NAME="..." npm run build-pdf      # advance copy: name and commit hash on the title page and every folio
npm run build-pdf -- out.pdf               # explicit output path
npm run build-pdf -- --help                # the switches, from the script itself
npm run preview -- <name> "<phrase>"       # rasterize one page to check it
```

An unrecognized switch, a `--size` with no value or an unknown one, and more than one output path all print the usage and exit nonzero, rather than taking the stray argument for a filename.

The switches compose: `NO_COVER=1 npm run build-pdf -- --size letter` is the cover-less Letter build.

The build needs a Chromium binary, found at `/opt/pw-browsers/chromium` or wherever `CHROMIUM_PATH` points.

At the time of writing the manuscript runs to **259 pages** with the cover, which puts it in KDP's 151 to 300 page band for gutter purposes. Every figure is drawn, so that number will move with editing rather than with artwork.
