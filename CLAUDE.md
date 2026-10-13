# Working in this repository

## Verify before pushing

Three commands, all of which must pass:

```
npm run lint                        # banned phrases, heading rules, figure and chapter-reference rules
node scripts/check-figure-geometry.mjs   # renders every SVG in Chromium: text overlap, arrowheads, coin marks
npm run build-pdf-digital           # the whole book; on success prints only the output path and the trim crop
```

The first two also run in GitHub Actions on every pull request and every push to `main`
(`.github/workflows/checks.yml`), so a pull request that fails them says so on its own page. The build
does not run there, so run it yourself. The build reads the finished PDF back and fails if a straight
quote printed outside the code face, which is the one check on the typographic quotes that does not
trust the build's own conversion.

To look at a page or a chapter, build the book and render it to PNG rather than paging through the PDF:
`npm run preview -- <name> "<phrase>"` renders the page carrying a phrase, and
`npm run preview -- <name> --chapter <file name or title>` renders every page of one chapter, as
`build/<name>-p<page>.png`. Both read the digital edition unless `--pdf <file>` names another build, and
the pages are the book's own, broken where the build breaks them.

`node scripts/check-figure-bands.mjs` reports horizontal dead space in the figures — the hole a
deletion leaves when the columns around it stay put. It is advisory, not a gate: it over-reports on
figures whose content is a curve rather than boxes, so each hit needs a look. Run it after removing
anything from a figure.

`npm run measure-slot-drift` reads block times from an RPC node (testnet by default, `--rpc` for another)
and prints the average slot length, the drift from the 200 ms target, the hours a week of slots runs
long, and the skip rate. Those are the figures the *Time* chapter's slot drift placeholders wait on;
cite the network and the date with any number taken from it.

`npm run resize-cover` sizes the full-wrap cover export (`assets/cover-wrap.pdf`) for KDP; the math and
the workflow are in `PRINT-SPECIFICATION.md` under Cover.

## A merged PR's branch is dead

**Never push new commits to a branch whose PR has merged.** The push succeeds, GitHub shows the
commits on the closed PR, and the work silently never reaches `main` because nobody merges a closed
PR twice. This has happened here; do not repeat it.

Every new piece of work after a merge starts on a fresh branch off `origin/main` and gets its own PR.
Before pushing anywhere, check whether the branch's PR has already merged; if it has, cherry-pick onto
a fresh branch instead.

## Stacked pull requests

A stacked PR is one whose base is another PR's branch rather than `main`. They have stranded work here
twice, and the failure is silent: GitHub reports every PR in the stack as merged while none of the
content reaches `main`.

The mechanism: once the parent PR merges, its branch is dead. Merging the child into that dead branch
puts the work somewhere nobody will merge from again. A grandchild stacked on the child inherits the
same fate.

**Retarget the child onto `main` as soon as the parent merges, and before merging the child.** Do not
merge a PR whose base branch has already merged.

**After any merge, verify the work actually landed** rather than trusting the merged badge:

```
git fetch origin --prune
git merge-base --is-ancestor origin/<branch> origin/main && echo "landed" || echo "STRANDED"
```

Prefer a flat PR off `main` whenever the work is separable. Stack only when the child genuinely cannot
be reviewed or built without the parent.

## Claude is not an author of this book

Two things put a name in GitHub's contributor list, and an assistant belongs in neither.

The first is the commit's own author field, which is the one that matters and the one most easily
missed. A Claude Code session is configured as `Claude <noreply@anthropic.com>` unless it is told
otherwise, so every commit it makes is authored by an assistant no matter how the message is worded.
Before committing, check `git config user.email` and set it to the author's own.

The second is a `Co-Authored-By` trailer naming an assistant, which GitHub reads as a second author.
Claude Code adds one by default. Leave it off.

Nothing else is the problem. A `Claude-Session` trailer, or a "generated with Claude Code" line on a
pull request description, says how a change was produced rather than who wrote the book, and those are
welcome to stay.

Both defaults come from Claude Code's own configuration rather than from anything in this repository,
so a session working here will do both unless told otherwise. This is where it is told. The history has
already been rewritten once to take them out; do not put them back.

## Naming things the companion repository owns

Prose must never name a field, function, or error that does not exist in
`quicknode/solana-program-examples`. When renaming an identifier, the companion repository changes
first and this repository follows, so the book never describes a name that was never shipped. Grep both
repositories before and after: no occurrence of the old name should survive here, and every new name
should resolve to a real definition there.

## A flaw in a companion program is fixed there, not described here

When writing or reviewing a chapter turns up a defect in the program it describes (an attack it is
still open to, like a donation that inflates the share price; a resource that can fill up and wedge
it, like an order book with no eviction handler; a participant with no reason to take part), the
deliverable is a pull request to `quicknode/solana-program-examples`, not a paragraph in the book.

- The fix goes into the program with a test that runs the attack, or fills the resource, and asserts
  the program now holds. Run the program's tests before opening the PR.
- The book follows the fix, as it does for renames: the chapter describes the defense and names the test
  that proves it, and never describes a defense that has not shipped. If the book change cannot wait,
  leave the chapter silent on the point until the example PR merges; do not write the warning in the
  meantime.
- No "known limitations" paragraph, no "a production version would add", no "left as an exercise".
  `scripts/lint-manuscript.mjs` rejects those phrasings, but the rule covers any wording that tells the
  reader about a flaw the program still has.
- Teaching an attack class stays: the *Adversary* chapter's empty-pool section works because every
  program it names defends against the attack and has a test that runs it.
- Ask before fixing only when the fix needs a decision the author has to make, such as a change of
  economic design or a choice between two defenses. Bring the proposed fix with the question.

The general form of this rule is in the companion AI plugin's `SUMMARIZING-PROGRAMS.md`, under *Fix a
flawed program - don't document the flaw*.

## Writing

`WRITING-PLAN.md` holds the house style and the conventions the linter enforces. Read it before editing
prose.

It is deliberately partial. Style is inherited from the
[companion AI plugin](https://github.com/quicknode/solana-finance-claude-plugin), which holds every rule
that would apply to any Solana finance writing; `WRITING-PLAN.md` adds only what is specific to this
book, and `scripts/lint-manuscript.mjs` enforces some but not all of the plugin's rules. Without the
plugin's rules you are working from half the style guide.

Where Claude Code supports plugins, install it at the Claude Code prompt (not the shell) with
`/plugin marketplace add quicknode/solana-finance-claude-plugin`. That command is unavailable in some
environments, including the VS Code panel; there, read the plugin's rules from its repository before
editing prose. The figure conventions live there too, in `DIAGRAMS.md`, which is the source of truth
for anything `scripts/check-figure-geometry.mjs` checks.
