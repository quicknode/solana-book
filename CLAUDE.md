# Working in this repository

## Verify before pushing

Three commands, all of which must pass:

```
npm run lint                        # banned phrases, heading rules, figure and chapter-reference rules
node scripts/check-figure-geometry.mjs   # renders every SVG in Chromium: text overlap, arrowheads, coin marks
npm run build-pdf                   # the whole book, and the page count is a useful smell test
```

`npm run preview -- <chapter> "<phrase>"` renders a single chapter around a phrase, which is faster than
building the book when checking one edit.

`node scripts/check-figure-bands.mjs` reports horizontal dead space in the figures — the hole a
deletion leaves when the columns around it stay put. It is advisory, not a gate: it over-reports on
figures whose content is a curve rather than boxes, so each hit needs a look. Run it after removing
anything from a figure.

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

## Naming things the companion repository owns

Prose must never name a field, function, or error that does not exist in
`quicknode/solana-program-examples`. When renaming an identifier, the companion repository changes
first and this repository follows, so the book never describes a name that was never shipped. Grep both
repositories before and after: no occurrence of the old name should survive here, and every new name
should resolve to a real definition there.

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
