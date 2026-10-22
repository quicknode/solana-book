# Animated figures

A chapter's figures, stepped through on screen: press a key and the next thing the program does happens.
Accounts are created, fields change, and tokens travel along their arrows. Every step is drawn in the book's
own figure vocabulary (`DIAGRAMS.md` in the companion plugin) at the figures' own coordinates, so the screen
version and the printed figures show the same map.

Open `options/index.html` in a browser. No build step and no server: it runs straight from disk.

| Key | Does |
| --- | --- |
| `→`, `Space`, `PageDown`, `Enter`, click | next step |
| `←`, `PageUp`, `Backspace` | previous step |
| `Home` / `End` | first / last step |

A key pressed while a step is animating finishes that step at once. `PageDown` and `PageUp` are what
presentation remotes send.

## How a scene is built

- `engine.js` is shared by every scene. It draws accounts, arrows and coins, and animates each step's actions.
- `<chapter>/scene.js` holds that chapter's layout and steps, and nothing else.

The layout is placed by hand, as the figures are: each account gives its box position, its address dot,
and its seed list, copied from the chapter's SVGs. A step is a caption and a list of actions:

| Action | Shows |
| --- | --- |
| `headline` | the figure's headline changes |
| `show` | accounts that already exist, with their lines, appear without motion |
| `focus` | which accounts are drawn in full; the rest fade to their heading |
| `call` | a handler lights up in the program box, and the focus moves to the accounts it touches |
| `create` | a new account grows in, with a `NEW` badge |
| `set` | fields or titles change; numbers count from the old value to the new |
| `transfer` | the arrow draws, a coin rides it, and both balances count to their new values |

Every step's end state is computed by replaying the actions without motion. Going back, jumping, or
cutting an animation short therefore lands on exactly the picture the forward animation ends on.

Order the actions as the handler in `quicknode/solana-program-examples` orders its work, not as the prose
lists it. `buy_option()` writes the holder, the status and `fees_owed`, and runs `check_custody()`, before
either transfer, so the scene does the same.

## Checking a scene

```
node scripts/animation-frames.mjs options          # each step's end state as build/animation-options-NN.png and .svg
node scripts/animation-frames.mjs options --video  # the whole animation as build/animation-options.webm
```

The script fails if the page throws an error.
