# Animated figures

A chapter's figures, stepped through on screen: press a key and the next thing the program does happens.
Accounts are created, fields change, and tokens travel along their arrows. Every step is drawn in the book's
own figure vocabulary (`DIAGRAMS.md` in the companion plugin), with the chapter figures' columns, so the
screen version and the printed figures show the same map.

The screen has no print limits, so a scene is drawn on a 16:9 canvas (1120 by 630 units). The extra width
puts every public-key account, mints included, beneath the one cluster curve. Colours live in `THEME` at
the top of `engine.js`. Each step has a title, with its caption in the frame beneath.

Open `options/index.html` in a browser. No build step and no server: it runs straight from disk.

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
  | `qr`, `follow` | the closing slides |

  Any slide with cards, or a chart's lines, builds one per key press unless it sets `build: false`.
  A card's `icon` is one of the book's account glyphs (`wallet`, `token`, ...) or, as `tpl:name`, one of
  the template's icons in `assets/icons`, named for the idea it stands for (`premium`, `price-rises`,
  `insurance`). One icon means one idea throughout a talk: reuse it where the idea comes back, and never
  give it to anything else.
- A term is defined where the talk first needs it: not before, where it means nothing yet, and not after,
  where it was already used unexplained. Calls are defined just before Alice writes one, "covered" in the
  step where her collateral lands in the vault, and "in the money" in the step where Bob exercises.
- `<chapter>/slides.js` lists the talk's slides. A `diagram` slide names the scene steps it shows, `from`
  and `to` by index, and together the diagram slides show every step once, in order; the deck refuses to
  start otherwise.
- `assets/` holds the Quicknode mark (inlined in `deck.css` as a mask), QR codes generated from the two
  repository URLs, and in `assets/icons` the icons taken from the Quicknode Keynote template.

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
| `call` | a handler lights up in the program box, and the focus moves to the accounts it touches |
| `create` | a new account grows in, with a `NEW` badge |
| `set` | fields or titles change; numbers count from the old value to the new |
| `transfer` | the arrow draws, a coin rides it, and both balances count to their new values |
| `close` | an account is marked `CLOSED` and fades out |

A person appears in the step where they first do something, with the accounts that step uses: Bob and his
USDC when he buys, Maria when she opens the venue and her USDC only when she collects the fees. A scene
opens on one person and builds outward, so an audience new to Solana meets one account at a time.

A step can also carry a `key`, and a later step can start `from` that key instead of from the step before
it. That is how another future branches off the story (the call expiring unused starts from the purchase,
not from the exercise before it) and how the story resumes afterwards. The jump between futures fades out
and back in, so it never reads as the program doing something.

Every step's end state is computed by replaying the actions without motion. Going back, jumping, or
cutting an animation short therefore lands on exactly the picture the forward animation ends on.

Order the actions as the handler in `quicknode/solana-program-examples` orders its work, not as the prose
lists it. `buy_option()` writes the holder, the status and `fees_owed`, and runs `check_custody()`, before
either transfer, so the scene does the same.

## Checking a scene

```
node scripts/animation-frames.mjs options          # each step's end state as build/animation-options-NN.png and .svg
node scripts/animation-frames.mjs options --video  # the whole animation, each step held, as build/animation-options.webm
```

The script fails if the page throws an error.
