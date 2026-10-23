// The Betting Market chapter as an animated scene: Maria opens a parimutuel
// market on this month's top-grossing film, Alice and Bob back Glowbugs 3 and
// Carol backs The Quiet Floor, Maria settles it, the winners claim, and every
// account the market created is closed. The other future the chapter names
// (the event cancelled and every stake refunded) branches off once the bets
// are in, and the story returns to settlement after it.
//
// The columns are the chapter figures' accounts spread across a 16:9 screen:
// the bettors and Maria under the curve, the event's accounts in a column of
// their own, and the program with its config on the right. Arrows run down
// the lane beside each bettor's column and along a corridor at the vault's
// height. The steps follow the handlers in quicknode/solana-program-examples
// finance/betting-market: place_bet() moves the stake before it writes the
// bet; settle_event() pays the fee before it records the result; a claim
// lowers open_bets before it pays.

(function () {
  const WIDTH = 1120;
  const HEIGHT = 630;
  // As flat as the Managed Fund talk's: the event column needs the height.
  const curve = AccountAnimation.clusterCurve(WIDTH, { top: 62, drop: 60, control: 700 / WIDTH });
  const rounded = AccountAnimation.rounded;

  // A public-key account hugs its dot: the dot sits on the curve over the
  // box's right edge, and the box top 9.3 below it.
  function onCurve(kind, title, x, w) {
    const cx = x + w - 8;
    const cy = curve.yAt(cx);
    return { kind, title, x, w, y: cy + 9.3, dot: { cx, cy }, onCurve: true };
  }

  // A derived account hangs at a given top, its dot and seed list above it.
  function derived(kind, title, x, y, w, seeds) {
    const three = seeds.length === 3;
    return {
      kind, title, x, y, w,
      dot: { cx: x + 8, cy: y - (three ? 18.5 : 14) },
      seeds: { x: x + 18, y: y - (three ? 24 : 15), lines: seeds },
    };
  }

  const tall = (lines) => 21 + lines * 12 + 7;
  const GAP2 = 28.6;
  const GAP3 = 37;

  // Columns, left to right: three bettors, Maria, the event's accounts, and
  // the program. The gaps between them are the arrows' lanes.
  const COLUMN = {
    alice: [12, 140],
    bob: [168, 132],
    carol: [316, 140],
    maria: [472, 132],
    event: [636, 220],
    program: [876, 232],
  };
  const LANE = { alice: 160, bob: 308, carol: 464, maria: 620 };

  const ata = (owner, x, y, w) =>
    derived("token", `${owner}'s USDC`, x, y, w, [`${owner.toUpperCase()}'S ADDRESS +`, "TOKEN PROGRAM +", "USDC MINT"]);
  const bet = (owner, outcome, x, y, w) =>
    derived("struct", `${owner}'s bet`, x, y, w, [`"BET" + ${outcome} +`, `${owner.toUpperCase()}'S ADDRESS`]);

  const alice = onCurve("wallet", "Alice", ...COLUMN.alice);
  const bob = onCurve("wallet", "Bob", ...COLUMN.bob);
  const carol = onCurve("wallet", "Carol", ...COLUMN.carol);
  const maria = onCurve("wallet", "Maria", ...COLUMN.maria);
  const slot = (person, n) => person.y + 77 * n;

  // The event column hangs beneath the curve at its right edge.
  const eventTop = curve.yAt(COLUMN.event[0] + COLUMN.event[1]) + 9 + GAP2;
  const event = derived("struct", "event", COLUMN.event[0], eventTop, COLUMN.event[1], ['"EVENT" +', "EVENT ID"]);
  const outcome0 = derived("struct", "outcome 0", COLUMN.event[0], event.y + tall(8) + GAP2, COLUMN.event[1], ['"OUTCOME" + EVENT\'S', "ADDRESS + INDEX 0"]);
  const outcome1 = derived("struct", "outcome 1", COLUMN.event[0], outcome0.y + tall(3) + GAP2, COLUMN.event[1], ['"OUTCOME" + EVENT\'S', "ADDRESS + INDEX 1"]);
  const vault = derived("token", "vault", COLUMN.event[0], outcome1.y + tall(3) + GAP3, COLUMN.event[1], ["EVENT'S ADDRESS +", "TOKEN PROGRAM +", "USDC MINT"]);

  const program = onCurve("program", "betting program", ...COLUMN.program);
  const config = derived("struct", "config", COLUMN.program[0], program.y + 150 + GAP2, COLUMN.program[1], ['"CONFIG"']);

  const accounts = {
    alice,
    aliceUsdc: ata("Alice", COLUMN.alice[0], slot(alice, 1), COLUMN.alice[1]),
    aliceBet: bet("Alice", "GLOWBUGS 3 OUTCOME", COLUMN.alice[0], slot(alice, 2), COLUMN.alice[1]),
    bob,
    bobUsdc: ata("Bob", COLUMN.bob[0], slot(bob, 1), COLUMN.bob[1]),
    bobBet: bet("Bob", "GLOWBUGS 3 OUTCOME", COLUMN.bob[0], slot(bob, 2), COLUMN.bob[1]),
    carol,
    carolUsdc: ata("Carol", COLUMN.carol[0], slot(carol, 1), COLUMN.carol[1]),
    carolBet: bet("Carol", "QUIET FLOOR OUTCOME", COLUMN.carol[0], slot(carol, 2), COLUMN.carol[1]),
    maria,
    mariaUsdc: ata("Maria", COLUMN.maria[0], slot(maria, 1), COLUMN.maria[1]),
    event, outcome0, outcome1, vault,
    program, config,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------
  // A stake runs out of a bettor's USDC, down their lane, and along the
  // corridor at the vault's height into its left edge. A payout runs back the
  // other way a little lower, so the two never share a line.

  const IN_Y = vault.y + 22;
  const OUT_Y = vault.y + 36;

  function stake(from, lane) {
    const sx = from.x + from.w + 2, sy = from.y + 20;
    return rounded([[sx, sy], [lane, sy], [lane, IN_Y], [vault.x - 2, IN_Y]]);
  }

  function payout(to, lane) {
    const ex = to.x + to.w + 2, ey = to.y + 28;
    return rounded([[vault.x - 2, OUT_Y], [lane, OUT_Y], [lane, ey], [ex, ey]]);
  }

  // A stake's label hangs below its corridor; a payout's sits above its own,
  // clear of the caption.
  const below = { dx: 0, dy: 20, anchor: "middle" };
  const above = { dx: 0, dy: -24, anchor: "middle" };
  const corridor = (x, y) => ({ x, y });

  const transfer = (from, fromValue, to, toValue, arrow) => ({
    type: "transfer",
    alone: true,
    from: { id: from, value: fromValue },
    to: { id: to, value: toValue },
    arrow,
  });

  // ---- Lines ---------------------------------------------------------------

  const sol = (text) => ({ text, style: "sol" });
  const balance = (text) => ({ text, style: "balance" });
  const field = (text) => ({ text });
  const note = (text) => ({ text, style: "note" });

  const HANDLERS = [
    "initialize_config()",
    "initialize_event()",
    "add_outcome()",
    "open_betting()",
    "place_bet()",
    "settle_event()",
    "claim_winnings()",
    "close_losing_bet()",
    "cancel_event()",
    "claim_refund()",
    "close_outcome()",
    "close_event()",
  ];

  // The focus of every step that touches the market's bookkeeping.
  const MARKET = ["program", "event", "outcome0", "outcome1", "vault"];

  // ---- Steps ---------------------------------------------------------------

  const steps = [
    // ---- The opening, for an audience new to Solana.
    {
      title: "This is [Solana Devnet]",
      // One idea a line: a caption keeps its line breaks.
      caption:
        "It is a global computer\nFinancial products are programs that run on this computer\n" +
        "All data is stored in accounts\nEach account has an address\n" +
        "Some addresses are public keys, others are made from ‘seeds’ chosen by programmers",
      actions: [],
    },
    {
      title: "Meet [Alice]",
      caption:
        "Each rounded box is an account. Alice's sits at her address, the dot on the curve, and holds " +
        "1 SOL: Solana's own currency, which pays for her transactions.",
      actions: [{ type: "show", ids: ["alice"], lines: { alice: [sol("1 SOL")] }, focus: "all" }],
    },
    {
      title: "Alice has a [thousand dollars]",
      caption:
        "She keeps USDC, a token worth one US dollar, in a token account of her own. Every kind of token is " +
        "defined by a mint, one of the three names its address is worked out from. It holds 1,000 USDC.",
      actions: [{ type: "show", ids: ["aliceUsdc"], lines: { aliceUsdc: [balance("1,000 USDC")] }, focus: "all" }],
    },
    {
      title: "Alice wants to back [Glowbugs 3]",
      caption:
        "Alice is confident about school holidays: she thinks Glowbugs 3 will be this month's top-grossing film, " +
        "and wants to stake $300 on it.",
      actions: [{ type: "focus", ids: ["alice", "aliceUsdc"] }],
    },
    {
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one runs betting markets, and each line is an instruction " +
        "handler anyone can call by sending a transaction. First, somebody has to open a market.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },

    // ---- Maria sets the market up
    {
      title: "Maria runs [initialize_config()]",
      caption:
        "Maria runs the platform, for a fee. The config names her the admin, the only signer allowed to run the " +
        "market, makes USDC the token every bet is in, and sets her fee: 200 basis points, hundredths of a percent, so 2%.",
      actions: [
        { type: "show", ids: ["maria"], lines: { maria: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_config()", focus: ["maria", "program"] },
        { type: "set", changes: [{ id: "maria", title: "Maria (admin)" }] },
        {
          type: "create", id: "config",
          lines: [
            field("admin: Maria"),
            field("token_mint: USDC"),
            field("fee_recipient: Maria"),
            field("default_fee_bps: 200"),
          ],
        },
      ],
    },
    {
      title: "Maria runs [initialize_event()]",
      caption:
        "The event is this month's question, with the time betting closes, and a copy of the 2% fee that later " +
        "changes to the config can't touch. Its vault is one token account for every stake, controlled by the event.",
      actions: [
        { type: "call", handler: "initialize_event()", focus: ["maria", "program", "config"] },
        {
          type: "create", id: "event",
          lines: [
            field("status: Draft"),
            field("betting_closes_at: month's end"),
            field("fee_bps: 200"),
            field("total_pool: 0 USDC"),
            // A count, so zero until the first bet. The settlement fields are left out
            // until settle_event() writes them, as in the chapter's figures.
            field("open_bets: 0"),
          ],
        },
        { type: "create", id: "vault", lines: [balance("0 USDC"), note("authority: the event")] },
      ],
    },
    {
      title: "Maria runs [add_outcome()] twice",
      caption:
        "An outcome is one result people can bet on, each with an account counting what's staked on it. " +
        "Outcomes can only be added while the event is a Draft.",
      actions: [
        { type: "call", handler: "add_outcome()", focus: ["maria", "program", "event"] },
        { type: "create", id: "outcome0", lines: [field("label: Glowbugs 3"), field("total_amount: 0 USDC"), field("bet_count: 0")] },
        { type: "create", id: "outcome1", lines: [field("label: The Quiet Floor"), field("total_amount: 0 USDC"), field("bet_count: 0")] },
      ],
    },
    {
      title: "Maria runs [open_betting()]",
      caption:
        "The event becomes Open, and its outcome list is now fixed: nobody can stake on a list that might still " +
        "change, and a market needs at least two outcomes, so the winners have losers to be paid from.",
      actions: [
        { type: "call", handler: "open_betting()", focus: ["maria", "program", "event", "outcome0", "outcome1"] },
        { type: "set", changes: [{ id: "event", key: "status", value: "Open" }] },
      ],
    },

    // ---- The bets
    {
      title: "Alice runs [place_bet()]",
      caption:
        "Her first bet on an outcome creates her bet account, before the handler's code runs. Its outcome_index " +
        "of 0 is Glowbugs 3.",
      actions: [
        { type: "call", handler: "place_bet()", focus: ["alice", "aliceUsdc", ...MARKET] },
        { type: "set", changes: [{ id: "alice", title: "Alice (bettor)" }] },
        { type: "create", id: "aliceBet", lines: [field("outcome_index: 0"), field("amount: 0 USDC")] },
      ],
    },
    {
      title: "Alice's 300 USDC go into the [vault]",
      caption: "The stake moves first. Alice signs the transfer herself; nothing from the program has to sign on the way in.",
      actions: [
        transfer("aliceUsdc", "700 USDC", "vault", "300 USDC", {
          id: "aliceStake", d: stake(A.aliceUsdc, LANE.alice),
          coinNear: corridor(400, IN_Y), label: ["place_bet()", "300 USDC"], labelAt: below,
        }),
      ],
    },
    {
      title: "The pool records her [stake]",
      caption:
        "Then the handler fills in her bet, and adds her 300 to Glowbugs 3's total and to the event's total pool.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "aliceBet", key: "amount", value: "300 USDC" },
            { id: "outcome0", key: "total_amount", value: "300 USDC" },
            { id: "outcome0", key: "bet_count", value: "1" },
            { id: "event", key: "total_pool", value: "300 USDC" },
            { id: "event", key: "open_bets", value: "1" },
          ],
        },
      ],
    },
    {
      title: "Bob backs Glowbugs 3 [too]",
      caption: "Bob agrees with Alice, but has less to spend: 100 USDC on Glowbugs 3, through the same handler.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobUsdc"],
          lines: { bob: [sol("1 SOL")], bobUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "place_bet()", focus: ["bob", "bobUsdc", ...MARKET] },
        { type: "set", changes: [{ id: "bob", title: "Bob (bettor)" }] },
        { type: "create", id: "bobBet", lines: [field("outcome_index: 0"), field("amount: 0 USDC")] },
        transfer("bobUsdc", "900 USDC", "vault", "400 USDC", {
          id: "bobStake", d: stake(A.bobUsdc, LANE.bob),
          coinNear: corridor(480, IN_Y), label: ["place_bet()", "100 USDC"], labelAt: below,
        }),
        {
          type: "set",
          changes: [
            { id: "bobBet", key: "amount", value: "100 USDC" },
            { id: "outcome0", key: "total_amount", value: "400 USDC" },
            { id: "outcome0", key: "bet_count", value: "2" },
            { id: "event", key: "total_pool", value: "400 USDC" },
            { id: "event", key: "open_bets", value: "2" },
          ],
        },
      ],
    },
    {
      key: "betsPlaced",
      title: "Carol backs [The Quiet Floor]",
      caption:
        "Carol believes in word of mouth: 200 USDC on The Quiet Floor. The vault now holds 600 USDC, 400 on " +
        "Glowbugs 3 and 200 on The Quiet Floor, all in one account.",
      actions: [
        {
          type: "show",
          ids: ["carol", "carolUsdc"],
          lines: { carol: [sol("1 SOL")], carolUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "place_bet()", focus: ["carol", "carolUsdc", ...MARKET] },
        { type: "set", changes: [{ id: "carol", title: "Carol (bettor)" }] },
        { type: "create", id: "carolBet", lines: [field("outcome_index: 1"), field("amount: 0 USDC")] },
        transfer("carolUsdc", "800 USDC", "vault", "600 USDC", {
          id: "carolStake", d: stake(A.carolUsdc, LANE.carol),
          coinNear: corridor(560, IN_Y), label: ["place_bet()", "200 USDC"], labelAt: below,
        }),
        {
          type: "set",
          changes: [
            { id: "carolBet", key: "amount", value: "200 USDC" },
            { id: "outcome1", key: "total_amount", value: "200 USDC" },
            { id: "outcome1", key: "bet_count", value: "1" },
            { id: "event", key: "total_pool", value: "600 USDC" },
            { id: "event", key: "open_bets", value: "3" },
          ],
        },
      ],
    },

    // ---- Another future: the event is cancelled
    {
      title: "Maria runs [cancel_event()]",
      caption:
        "With both films pulled there's no result to report, so Maria cancels " +
        "the event instead, and the market owes every bettor their exact stake back.",
      actions: [
        { type: "call", handler: "cancel_event()", focus: ["maria", "program", "event"] },
        { type: "set", changes: [{ id: "event", key: "status", value: "Cancelled" }] },
      ],
    },
    {
      title: "Every bettor gets a [refund]",
      caption:
        "Each bettor calls claim_refund() for their whole stake, with no fee taken, and their bet account closes. " +
        "Alice's 300 USDC come back; Bob and Carol do the same.",
      actions: [
        { type: "call", handler: "claim_refund()", focus: ["alice", "aliceUsdc", "aliceBet", "program", "event", "vault"] },
        { type: "set", changes: [{ id: "event", key: "open_bets", value: "2" }] },
        transfer("vault", "300 USDC", "aliceUsdc", "1,000 USDC", {
          id: "refund", d: payout(A.aliceUsdc, LANE.alice),
          coinNear: corridor(400, OUT_Y), label: ["claim_refund()", "300 USDC"], labelAt: above,
        }),
        { type: "close", id: "aliceBet" },
      ],
    },

    // ---- Settlement
    {
      from: "betsPlaced",
      title: "The month ends, and Maria runs [settle_event()]",
      caption:
        "Glowbugs 3 wins in the real world, and the program only learns it because Maria, " +
        "the admin, signs to say so. Settling is reporting the result; it can't happen before betting closes.",
      actions: [
        { type: "call", handler: "settle_event()", focus: ["maria", "program", "event", "outcome0", "vault"] },
      ],
    },
    {
      title: "Maria takes her 2% [fee]",
      caption:
        "The losing pool is 600 − 400 = 200 USDC, and the fee is 2% of the losing pool only: 4 USDC. So a winner " +
        "never gets back less than their stake. The fee leaves the vault first.",
      actions: [
        // 1,000: the chapter's figure shows 1,004 once the 4 USDC fee lands.
        { type: "show", ids: ["mariaUsdc"], lines: { mariaUsdc: [balance("1,000 USDC")] }, focus: "shown" },
        transfer("vault", "596 USDC", "mariaUsdc", "1,004 USDC", {
          id: "fee",
          d: rounded([[vault.x - 2, OUT_Y], [LANE.maria, OUT_Y], [LANE.maria, A.mariaUsdc.y + 20], [A.mariaUsdc.x + A.mariaUsdc.w + 2, A.mariaUsdc.y + 20]]),
          coinNear: { x: LANE.maria, y: 360 }, label: ["4 USDC"], labelAt: { dx: -14, dy: 4, anchor: "end" },
        }),
      ],
    },
    {
      key: "settled",
      title: "The event records the [result]",
      caption:
        "Then the event becomes Settled, and records the winner, the 400 USDC winning pool, and the 196 USDC left " +
        "of the losing pool for the winners to share.",
      actions: [
        // The settlement fields join the event box, then light up as written.
        {
          type: "show",
          ids: ["event"],
          lines: {
            event: [
              field("status: Open"),
              field("betting_closes_at: month's end"),
              field("fee_bps: 200"),
              field("total_pool: 600 USDC"),
              field("open_bets: 3"),
              field("winning_outcome_index: 0 (Glowbugs 3)"),
              field("winning_pool: 400 USDC"),
              field("distributable_losing_pool: 196 USDC"),
            ],
          },
        },
        {
          type: "set",
          changes: [
            { id: "event", key: "status", value: "Settled" },
            { id: "event", key: "winning_outcome_index", value: "0 (Glowbugs 3)" },
            { id: "event", key: "winning_pool", value: "400 USDC" },
            { id: "event", key: "distributable_losing_pool", value: "196 USDC" },
          ],
        },
      ],
    },

    // ---- The winners claim
    {
      title: "Alice runs [claim_winnings()]",
      caption:
        "Her stake back, plus her share of the 196 in proportion to her stake: 300 + 300 × 196 ÷ 400 = 447 USDC. " +
        "Her bet account closes as she is paid, so she can never claim twice.",
      actions: [
        { type: "call", handler: "claim_winnings()", focus: ["alice", "aliceUsdc", "aliceBet", "program", "event", "vault"] },
        { type: "set", changes: [{ id: "event", key: "open_bets", value: "2" }] },
        transfer("vault", "149 USDC", "aliceUsdc", "1,147 USDC", {
          id: "aliceWins", d: payout(A.aliceUsdc, LANE.alice),
          coinNear: corridor(400, OUT_Y), label: ["claim_winnings()", "447 USDC"], labelAt: above,
        }),
        { type: "close", id: "aliceBet" },
      ],
    },
    {
      title: "Bob claims [149 USDC]",
      caption:
        "100 + 100 × 196 ÷ 400 = 149. Alice staked three times what Bob did, and won three times as much. " +
        "When either of them bet made no difference: the payout reads the pools at the close.",
      actions: [
        { type: "call", handler: "claim_winnings()", focus: ["bob", "bobUsdc", "bobBet", "program", "event", "vault"] },
        { type: "set", changes: [{ id: "event", key: "open_bets", value: "1" }] },
        transfer("vault", "0 USDC", "bobUsdc", "1,049 USDC", {
          id: "bobWins", d: payout(A.bobUsdc, LANE.bob),
          coinNear: corridor(480, OUT_Y), label: ["claim_winnings()", "149 USDC"], labelAt: above,
        }),
        { type: "close", id: "bobBet" },
      ],
    },
    {
      title: "Carol runs [close_losing_bet()]",
      caption:
        "Carol's 200 USDC went to the winners, but her bet account still holds the SOL it needed to exist, its " +
        "rent. Closing it gives the rent back to her.",
      actions: [
        { type: "call", handler: "close_losing_bet()", focus: ["carol", "carolBet", "program", "event"] },
        { type: "set", changes: [{ id: "event", key: "open_bets", value: "0" }] },
        { type: "close", id: "carolBet" },
      ],
    },

    // ---- Closing the market
    {
      title: "Maria runs [close_outcome()]",
      caption:
        "With no bets left open, Maria closes each outcome, and its rent comes back to her. An outcome can't close " +
        "while any bet still names it.",
      actions: [
        { type: "call", handler: "close_outcome()", focus: ["maria", "program", "event", "outcome0", "outcome1"] },
        { type: "close", id: "outcome0" },
        { type: "close", id: "outcome1" },
      ],
    },
    {
      title: "Maria runs [close_event()]",
      caption:
        "Last, the vault and the event close. Any dust the rounding left would go to the fee recipient; here the " +
        "shares divided exactly, and the vault is empty.",
      actions: [
        { type: "call", handler: "close_event()", focus: ["maria", "program", "event", "vault"] },
        { type: "close", id: "vault" },
        { type: "close", id: "event" },
      ],
    },
  ];

  window.BETTING_SCENE = {
    title: "Betting Market",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    caption: { x: 16, y: 542, w: 540, h: 84, fontSize: 13 },
    hold: 3000,
    program: "program",
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
