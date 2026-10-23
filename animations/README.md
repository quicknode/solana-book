# Animated figures

A chapter's figures, stepped through on screen: press a key and the next thing the program does happens.
Accounts are created, fields change, and tokens travel along their arrows. Every step is drawn in the book's
own figure vocabulary (`DIAGRAMS.md` in the companion plugin), with the chapter figures' columns, so the
screen version and the printed figures show the same map.

The screen has no print limits, so a scene is drawn on a 16:9 canvas (1120 by 630 units). The extra width
puts every public-key account, mints included, beneath the one cluster curve. Colours live in `THEME` at
the top of `engine.js`. Each step has a title, with its caption in the frame beneath.

There is a talk for every program in Part II, each a directory named for its chapter:

| Directory | Chapter | Program |
| --- | --- | --- |
| `escrow/` | 11 Escrow | `finance/escrow` |
| `fundraiser/` | 12 The Fundraiser | `finance/fundraiser` |
| `betting-market/` | 13 The Betting Market | `finance/betting-market` |
| `order-book/` | 14 The Order Book Exchange | `finance/order-book` |
| `constant-product-amm/` | 15 The Constant-Product AMM | `finance/token-swap` |
| `prop-amm/` | 16 The Prop AMM | `finance/prop-amm` |
| `lending/` | 17 Lending and Borrowing | `finance/lending` |
| `managed-fund/` | 18 The Managed Fund | `finance/managed-fund` |
| `options/` | 19 Options | `finance/options` |
| `perpetual-futures/` | 20 Perpetual Futures | `finance/perpetual-futures` |

`index.html` here links to every talk. Open a talk's own `index.html` in a browser. No build step and no server: it runs straight from disk. A talk's
own icons in `assets/icons` carry its directory's prefix (`escrow-`, `perps-`, ...); unprefixed icons are
shared, and mean the same idea in every talk.

| Key | Does |
| --- | --- |
| `→`, `Space`, `PageDown`, `Enter`, click | next step |
| `←`, `PageUp`, `Backspace` | previous step |
| `Home` / `End` | first / last step |
| `P` | play / pause: each finished step holds for `hold` ms (3 seconds), then the next plays |
| `F` | full screen |

A step plays once and then holds until the next key. A key pressed while a step is animating finishes that
step at once. `PageDown` and `PageUp` are what presentation remotes send. Open `index.html?autoplay` to start
playing on load.

## The talk around the diagrams

`index.html` opens a slide deck in the look of the Quicknode Solana Finance Keynote: a title slide, what you
should know and what you'll learn, card slides between the runs of diagram steps, where everyone ended up,
and the closing slides. One key advances through all of it: a diagram step plays its animation, and a slide
of cards builds them one at a time.

- `deck.js` and `deck.css` are shared by every talk. A slide kind is a template filled from data, and
  `[word]` in any text is set on the green highlight, `{word}` on the purple one. The kinds follow the
  Quicknode Keynote template's layouts:

  | Kind | Layout |
  | --- | --- |
  | `title` | the series tag, a large title, the mark in a green square |
  | `columns` | what you should know, and what you'll learn |
  | `statement` | one large centred sentence |
  | `versus` | two people side by side, a full-height panel each |
  | `split` | the heading on the left, a stack of wide icon cards on the right |
  | `grid` | the heading across the top, a grid of centred icon cards (`columns`: 2, 3 or 4) |
  | `numbered` | cards tagged `// 01`, `// 02` |
  | `cards` | tall cards in the slides' three tones |
  | `chart` | a payoff chart, one line per side |
  | `allocation` | a bar split by value: a fund's weights, or who owns its shares; with `from`, the parts move from earlier values to their own, to or from nothing (a losing stake paying the winners), after `delay` ms |
  | `qr`, `follow` | the closing slides |

  Any slide with cards, or a chart's lines, builds one per key press unless it sets `build: false`.
  A card's `icon` is one of the book's account glyphs (`wallet`, `token`, ...) or, as `tpl:name`, one of
  the template's icons in `assets/icons`, named for the idea it stands for (`premium`, `price-rises`,
  `insurance`). One icon means one idea throughout a talk: reuse it where the idea comes back, and never
  give it to anything else.
- **A talk always matches its chapter.** Its people, assets, events, order of events and numbers are the
  chapter's. A talk never invents a scenario, swaps one person for another, adds an event the chapter
  doesn't describe, or shows a number the chapter doesn't state. A balance may follow from the chapter's
  numbers by plain arithmetic, marked in a comment; a number the chapter leaves out stays out. A talk may
  leave a minor branch out for time, never replace one.
- A term is defined where the talk first needs it: not before, where it means nothing yet, and not after,
  where it was already used unexplained. Calls are defined just before Alice writes one, "covered" in the
  step where her collateral lands in the vault, and "in the money" in the step where Bob exercises.
- `<chapter>/slides.js` lists the talk's slides. A `diagram` slide names the scene steps it shows, `from`
  and `to` by index, and together the diagram slides show every step once, in order; the deck refuses to
  start otherwise.
- `assets/` holds the Quicknode mark (inlined in `deck.css` as a mask), a QR code generated from
  solanabook.org, and in `assets/icons` the icons taken from the Quicknode Keynote template.

The diagrams take the same palette: accounts are pastel cards on near-black (white for wallets, green for
token accounts, lavender for programs, grey for data accounts, cream for mints), a faded account is a dark
slab, and the step's action is the bright green. A step title marks its keyword in brackets, `Maria runs
[collect_fees()]`, and the step number sits in the corner as `// STEP n`.

## How a scene is built

- `engine.js` is shared by every scene. It draws accounts, arrows and coins, and animates each step's actions.
- `<chapter>/scene.js` holds that chapter's layout and steps, and nothing else.

The layout is placed by hand, as the figures are: each column's position and width is chosen in the scene.
A public-key account's dot is put on the curve with `clusterCurve().yAt()` and its box hangs 9.3 below it,
and a derived account's dot and seed list sit above its box, so the dots never drift off the curve. A step
is a title, a caption, and a list of actions:

| Action | Shows |
| --- | --- |
| `show` | accounts that already exist on chain fade in, with their lines; `focus: "shown"` draws them in full |
| `hide` | accounts the rest of the story no longer needs fade out, so others can take their columns |
| `focus` | which accounts are drawn in full; the rest fade to their heading |
| `call` | a handler lights up in the program box, and the focus moves to the accounts it touches; `also` lights handlers it calls in other programs, and a `call` with no handler is a step no program takes, such as a price moving |
| `highlight` | the lit handlers change within a call, as a deposit moves from one swap to the next |
| `create` | a new account grows in, with a `NEW` badge |
| `set` | fields or titles change; numbers count from the old value to the new |
| `transfer` | the arrow draws, a coin rides it, and both balances count to their new values; with `alone` it replaces the step's earlier arrows, and a side with no `value` (a router trading on the far side) shows no balance |
| `close` | an account is marked `CLOSED` and fades out, taking the step's arrows with it |

A person appears in the step where they first do something, with the accounts that step uses: Bob and his
USDC when he buys, Maria when she opens the venue and her USDC only when she collects the fees. A scene
opens on one person and builds outward, so an audience new to Solana meets one account at a time.

The running handler's line in a program box is bold, on the green band, in a face with a real bold weight:
Andale Mono has none, and a browser's made-up bold is too faint to pick out. Handler names elsewhere are
set like the words around them.

A step can also carry a `key`, and a later step can start `from` that key instead of from the step before
it. That is how another possible ending branches off the story (the call expiring unused starts from the purchase,
not from the exercise before it) and how the story resumes afterwards. The jump between endings fades out
and back in, so it never reads as the program doing something. Each ending opens on a `statement`
slide that names it, "Outcome 1: nobody takes Alice's offer", "Outcome 2: Bob takes Alice's offer", and
a return to the main story on "Back to Outcome 1: …". A brief aside that is not an ending opens on
"What if …?". The steps after such a slide go straight to what happens, without "It's possible that".

Every step's end state is computed by replaying the actions without motion. Going back, jumping, or
cutting an animation short therefore lands on exactly the picture the forward animation ends on.

Order the actions as the handler in `quicknode/solana-program-examples` orders its work, not as the prose
lists it. `buy_option()` writes the holder, the status and `fees_owed`, and runs `check_custody()`, before
either transfer, so the scene does the same.

## Checking a scene

```
node scripts/animation-frames.mjs options          # each step's end state as build/animation-options-NN.png and .svg
node scripts/animation-frames.mjs managed-fund     # the same for the Managed Fund talk
node scripts/animation-frames.mjs options --video  # the whole animation, each step held, as build/animation-options.webm
```

The script fails if the page throws an error.
