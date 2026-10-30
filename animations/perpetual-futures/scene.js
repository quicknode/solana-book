// The Perpetual Futures chapter as an animated scene: Maria creates a pool,
// Carol and eleven others fund it, Alice opens a 5x long and Bob a 5x short,
// NVDAx rallies, Dave liquidates Bob, Alice closes at $120, and Maria
// collects her fees.
//
// The columns are the chapter figures' accounts spread across a 16:9 screen:
// every public-key account hangs beneath the one curve, the oracle's price
// feed included. Arrows run down the gaps between columns and along a
// corridor beneath them, one transfer on screen at a time. The steps follow
// the handlers in quicknode/solana-program-examples finance/perpetual-futures:
// each records the pool's accounting before it moves a token, a liquidation
// pays the liquidator before the trader's refund, and add_liquidity() takes
// the deposit before it mints the shares.

(function () {
  const WIDTH = 1120;
  const HEIGHT = 630;
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

  // Columns, left to right; the 12-unit gaps between them are the lanes.
  const COLUMN = {
    alice: [12, 140],
    bob: [164, 140],
    carol: [316, 140],
    dave: [468, 130],
    maria: [610, 130],
    oracle: [752, 120],
    program: [884, 224],
  };
  const laneAfter = (column) => COLUMN[column][0] + COLUMN[column][1] + 6;

  const ata = (owner, x, y, w) =>
    derived("token", `${owner}'s USDC`, x, y, w, [`${owner.toUpperCase()}'S ADDRESS +`, "TOKEN PROGRAM +", "USDC MINT"]);
  const slot = (person, n) => person.y + 77 * n;

  const alice = onCurve("wallet", "Alice", ...COLUMN.alice);
  const bob = onCurve("wallet", "Bob", ...COLUMN.bob);
  const carol = onCurve("wallet", "Carol", ...COLUMN.carol);
  const dave = onCurve("wallet", "Dave", ...COLUMN.dave);
  const maria = onCurve("wallet", "Maria", ...COLUMN.maria);
  const oracle = onCurve("struct", "oracle feed", ...COLUMN.oracle);

  const program = onCurve("program", "perps program", ...COLUMN.program);
  const pool = derived("struct", "Pool", COLUMN.program[0], program.y + 110 + GAP2, COLUMN.program[1], ['"POOL" + COLLATERAL MINT +', "ORACLE FEED ADDRESS"]);
  const vault = derived("token", "custody vault", COLUMN.program[0], pool.y + tall(6) + GAP2, COLUMN.program[1], ['"VAULT" +', "POOL'S ADDRESS"]);
  const lpMint = derived("mint", "LP share mint", COLUMN.program[0], vault.y + tall(2) + GAP2, COLUMN.program[1], ['"LP_MINT" +', "POOL'S ADDRESS"]);

  const position = (owner, side, x, y, w) =>
    derived("struct", `${owner}'s ${side}`, x, y, w, ['"POSITION" + POOL +', `${owner.toUpperCase()}'S ADDRESS + "${side.toUpperCase()}"`]);

  const accounts = {
    alice,
    aliceUsdc: ata("Alice", COLUMN.alice[0], slot(alice, 1), COLUMN.alice[1]),
    aliceLong: position("Alice", "long", COLUMN.alice[0], slot(alice, 2) - 8, COLUMN.alice[1]),
    bob,
    bobUsdc: ata("Bob", COLUMN.bob[0], slot(bob, 1), COLUMN.bob[1]),
    bobShort: position("Bob", "short", COLUMN.bob[0], slot(bob, 2) - 8, COLUMN.bob[1]),
    carol,
    carolUsdc: ata("Carol", COLUMN.carol[0], slot(carol, 1), COLUMN.carol[1]),
    carolShares: derived("token", "Carol's shares", COLUMN.carol[0], slot(carol, 2), COLUMN.carol[1], ["CAROL'S ADDRESS +", "TOKEN PROGRAM +", "LP SHARE MINT"]),
    dave,
    daveUsdc: ata("Dave", COLUMN.dave[0], slot(dave, 1), COLUMN.dave[1]),
    maria,
    mariaUsdc: ata("Maria", COLUMN.maria[0], slot(maria, 1), COLUMN.maria[1]),
    oracle,
    program, pool, vault, lpMint,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------
  // Out of an account's right edge, down the lane beside it, along the
  // corridor beneath every column, and up the lane before the program column
  // into the vault; or the reverse.

  const CORRIDOR = 452;
  const PROGRAM_LANE = COLUMN.program[0] - 6;
  const right = (acc, dy = 20) => [acc.x + acc.w + 2, acc.y + dy];
  const left = (acc, dy = 26) => [acc.x - 2, acc.y + dy];

  function intoVault(from, lane) {
    const [sx, sy] = right(from);
    const [ex, ey] = left(vault);
    return rounded([[sx, sy], [lane, sy], [lane, CORRIDOR], [PROGRAM_LANE, CORRIDOR], [PROGRAM_LANE, ey], [ex, ey]]);
  }

  function outOfVault(lane, to) {
    const [sx, sy] = left(vault, 34);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [PROGRAM_LANE, sy], [PROGRAM_LANE, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]]);
  }

  function minted(lane, to) {
    const [sx, sy] = left(lpMint);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [PROGRAM_LANE, sy], [PROGRAM_LANE, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]]);
  }

  const below = { dx: 0, dy: 22, anchor: "middle" };

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
    "initialize_pool()",
    "add_liquidity()",
    "remove_liquidity()",
    "open_position()",
    "close_position()",
    "liquidate_position()",
    "update_price_average()",
    "collect_fees()",
  ];

  const positionLines = (collateral) => [
    field(`collateral: ${collateral}`),
    field("size: 5,000"),
    field("entry_price: $100"),
    field("entry_funding: 0"),
  ];

  const changes = (id, pairs) => ({
    type: "set",
    changes: Object.entries(pairs).map(([key, value]) => ({ id, key, value })),
  });

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
      title: "Alice wants to go [long] with leverage",
      caption:
        "Alice expects NVDAx, a token that tracks NVIDIA stock, to rise from $100. She wants a 5,000 USDC position " +
        "backed by her 1,000 USDC: five times the exposure her money buys.",
      actions: [{ type: "focus", ids: ["alice", "aliceUsdc"] }],
    },
    {
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one runs a perpetual futures venue, and each line is an " +
        "instruction handler anyone can call by sending a transaction. First, the venue needs a price.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },
    {
      title: "An oracle publishes the [price]",
      caption:
        "An oracle publishes NVDAx's price to an account, a price feed. Here a test program, mock-price-feed, " +
        "stands in for a real oracle so the price can be moved. NVDAx is at $100.",
      actions: [
        {
          type: "show",
          ids: ["oracle"],
          lines: { oracle: [field("price: $100"), field("owner: mock-price-feed")] },
          focus: "shown",
        },
      ],
    },

    // ---- The pool
    {
      title: "Maria runs [initialize_pool()]",
      caption:
        "Maria sets the market's rules once: the fees, the collateral every position needs, and the liquidation fee. " +
        "No handler can change them later. Her income is a share of the fees, and she has no path to anyone's collateral.",
      actions: [
        { type: "show", ids: ["maria"], lines: { maria: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_pool()", focus: ["maria", "program", "oracle"] },
        { type: "set", changes: [{ id: "maria", title: "Maria (authority)" }] },
        {
          type: "create", id: "pool",
          lines: [
            field("liquidity: 0 USDC"),
            field("total_collateral: 0"),
            field("program_fees: 0"),
            field("insurance_fund: 0"),
            field("long_size: 0"),
            field("short_size: 0"),
          ],
        },
        { type: "create", id: "vault", lines: [balance("0 USDC"), note("authority: the pool")] },
        { type: "create", id: "lpMint", lines: [note("mint authority: the pool")] },
      ],
    },
    {
      title: "Carol runs [add_liquidity()]",
      caption:
        "Carol is a liquidity provider, an LP. The LPs' pool is the other side of every trade: it pays the traders who win " +
        "and keeps what the losers lose. The pool records her 1,000 USDC first, and her share account is created.",
      actions: [
        {
          type: "show",
          ids: ["carol", "carolUsdc"],
          lines: { carol: [sol("1 SOL")], carolUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "add_liquidity()", focus: ["carol", "carolUsdc", "program", "pool", "vault", "lpMint", "oracle"] },
        { type: "set", changes: [{ id: "carol", title: "Carol (LP)" }] },
        { type: "create", id: "carolShares", lines: [balance("0 LP")] },
        changes("pool", { liquidity: "1,000 USDC" }),
      ],
    },
    {
      title: "Carol's 1,000 USDC go into the [vault]",
      caption: "One vault holds everything: the LPs' liquidity, traders' collateral and fees. The Pool's fields record whose is whose.",
      actions: [
        transfer("carolUsdc", "0 USDC", "vault", "1,000 USDC", {
          id: "carolIn", d: intoVault(A.carolUsdc, laneAfter("carol")),
          coinNear: { x: 650, y: CORRIDOR }, label: ["add_liquidity()", "1,000 USDC"], labelAt: below,
        }),
      ],
    },
    {
      // Derived: the LP mint has the collateral's 6 decimals, so 1,000 USDC less MINIMUM_LIQUIDITY's
      // 1,000 minor units (the chapter's "tenth of a cent") is 999.999 shares.
      title: "Carol gets 999.999 [LP shares]",
      caption:
        "Her shares are her slice of the pool. As the first depositor, she gets her deposit less a tenth of a cent, " +
        "MINIMUM_LIQUIDITY, which no one will ever own: the defense against a first-depositor attack.",
      actions: [
        transfer("lpMint", null, "carolShares", "999.999 LP", {
          id: "carolMint", d: minted(laneAfter("carol"), A.carolShares),
          coinNear: { x: 650, y: CORRIDOR }, label: ["999.999 LP"], labelAt: below,
        }),
      ],
    },
    {
      title: "Eleven more LPs [deposit]",
      caption:
        "Eleven more providers follow Carol over the morning, each priced against the pool's value at that moment. " +
        "The pool opens for trading with 12,000 USDC of liquidity.",
      actions: [
        { type: "call", handler: "add_liquidity()", focus: ["program", "pool", "vault", "lpMint", "oracle"] },
        changes("pool", { liquidity: "12,000 USDC" }),
        { type: "set", changes: [{ id: "vault", value: "12,000 USDC" }] },
      ],
    },

    // ---- Alice's long
    {
      title: "Alice runs [open_position()]",
      caption:
        "Side Long, 1,000 USDC of collateral, size 5,000 USDC: 5x leverage, so each 1% move in NVDAx moves her stake " +
        "about 5%. Her position account records the trade, at an entry price of $100.",
      actions: [
        { type: "call", handler: "open_position()", focus: ["alice", "aliceUsdc", "program", "pool", "vault", "oracle"] },
        { type: "set", changes: [{ id: "alice", title: "Alice (long)" }] },
        { type: "create", id: "aliceLong", lines: positionLines(995) },
      ],
    },
    {
      title: "The pool takes a 5 USDC [open fee]",
      caption:
        "The fee is 0.1% of her size, not her collateral, leaving 995 at work. Half goes to Maria's program_fees, half to the " +
        "insurance_fund. Her 995 clears the initial margin: 10% of size, the least a position may open with.",
      actions: [
        changes("pool", { total_collateral: "995", program_fees: "2.50", insurance_fund: "2.50", long_size: "5,000" }),
      ],
    },
    {
      title: "Alice's 1,000 USDC go into the [vault]",
      caption:
        "That is the only token that moves. The pool sets nothing aside for her: whether it can pay her profit is decided " +
        "when she closes.",
      actions: [
        transfer("aliceUsdc", "0 USDC", "vault", "13,000 USDC", {
          id: "aliceIn", d: intoVault(A.aliceUsdc, laneAfter("alice")),
          coinNear: { x: 650, y: CORRIDOR }, label: ["open_position()", "1,000 USDC"], labelAt: below,
        }),
      ],
    },

    // ---- Bob's short
    {
      title: "Bob runs [open_position()] to go short",
      caption:
        "Bob thinks NVIDIA's run is over. A short profits as the price falls. He opens the mirror image of Alice's position: " +
        "1,000 USDC of collateral, size 5,000, entry $100, and the same 5 USDC fee, split the same way.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobUsdc"],
          lines: { bob: [sol("1 SOL")], bobUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "open_position()", focus: ["bob", "bobUsdc", "program", "pool", "vault", "oracle"] },
        { type: "set", changes: [{ id: "bob", title: "Bob (short)" }] },
        { type: "create", id: "bobShort", lines: positionLines(995) },
        changes("pool", { total_collateral: "1,990", program_fees: "5", insurance_fund: "5", short_size: "5,000" }),
      ],
    },
    {
      title: "Bob's 1,000 USDC go into the [vault]",
      caption: "Two positions are open: one long, one short, both against the pool.",
      actions: [
        transfer("bobUsdc", "0 USDC", "vault", "14,000 USDC", {
          id: "bobIn", d: intoVault(A.bobUsdc, laneAfter("bob")),
          coinNear: { x: 650, y: CORRIDOR }, label: ["open_position()", "1,000 USDC"], labelAt: below,
        }),
      ],
    },

    // ---- The rally
    {
      title: "NVDAx rallies to [$110]",
      caption:
        "Profit is size × price change ÷ entry price: Alice is up 500, Bob down 500. Bob's equity, his 995 plus his loss, " +
        "is 495. The maintenance margin, 5% of size, is 250: above it, a position is safe.",
      actions: [
        { type: "call", handler: null, focus: ["oracle", "aliceLong", "bobShort"] },
        changes("oracle", { price: "$110" }),
      ],
    },
    {
      title: "At [$115], Bob is under the line",
      caption:
        "Bob's equity is 995 − 750 = 245, below the 250 maintenance margin. He should close, but he keeps putting it off. " +
        "Now anyone may liquidate his position: close it for him, for a fee.",
      actions: [
        { type: "call", handler: null, focus: ["oracle", "bobShort"] },
        changes("oracle", { price: "$115" }),
      ],
    },
    {
      title: "Dave runs [liquidate_position()]",
      caption:
        "Dave runs a bot that liquidates any position at or under its maintenance margin. The handler checks the position's " +
        "health, not who calls. The LPs take the 750 Bob lost, and his short leaves the pool's books.",
      actions: [
        {
          type: "show",
          ids: ["dave", "daveUsdc"],
          // The book's standard wallet: every character starts with one SOL and 1,000 USDC.
          lines: { dave: [sol("1 SOL")], daveUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "liquidate_position()", focus: ["dave", "daveUsdc", "bobShort", "bobUsdc", "program", "pool", "vault", "oracle"] },
        { type: "set", changes: [{ id: "dave", title: "Dave (liquidator)" }] },
        changes("pool", { liquidity: "12,750 USDC", total_collateral: "995", short_size: "0" }),
      ],
    },
    {
      title: "Dave takes the 50 USDC [liquidation fee]",
      caption: "1% of the 5,000 size, paid out of Bob's remaining equity. Dave put up no capital: he's paid for sending the transaction.",
      actions: [
        transfer("vault", "13,950 USDC", "daveUsdc", "1,050 USDC", {
          id: "daveFee", d: outOfVault(laneAfter("dave"), A.daveUsdc),
          coinNear: { x: 700, y: CORRIDOR }, label: ["liquidate_position()", "50 USDC"], labelAt: below,
        }),
      ],
    },
    {
      title: "Bob gets back [195 USDC]",
      caption:
        "The rest of his 245 of equity, and his position account closes, its rent back to him. Bob turned 1,000 USDC " +
        "into 195 by being wrong, and slow.",
      actions: [
        transfer("vault", "13,755 USDC", "bobUsdc", "195 USDC", {
          id: "bobRefund", d: outOfVault(laneAfter("bob"), A.bobUsdc),
          coinNear: { x: 560, y: CORRIDOR }, label: ["195 USDC"], labelAt: below,
        }),
        { type: "close", id: "bobShort" },
      ],
    },

    // ---- Alice closes
    {
      title: "NVDAx reaches [$120]",
      caption:
        "Alice's profit is 5,000 × 20 ÷ 100 = 1,000 USDC. Her position has been open longer than the pool's ten-slot " +
        "warm-up, so she may take it.",
      actions: [
        { type: "call", handler: null, focus: ["oracle", "aliceLong"] },
        changes("oracle", { price: "$120" }),
      ],
    },
    {
      title: "Alice runs [close_position()]",
      caption:
        "The pool's 12,755 USDC of backing, liquidity plus insurance, covers her 1,000 profit, so the haircut is 1: paid in " +
        "full. The LPs pay her profit, and a 5 USDC close fee splits like the open fee.",
      actions: [
        { type: "call", handler: "close_position()", focus: ["alice", "aliceUsdc", "aliceLong", "program", "pool", "vault", "oracle"] },
        changes("pool", { liquidity: "11,750 USDC", total_collateral: "0", program_fees: "7.50", insurance_fund: "7.50", long_size: "0" }),
      ],
    },
    {
      title: "Alice receives [1,990 USDC]",
      caption:
        "995 + 1,000 − 5. Her stake nearly doubled on a 20% move: that is what 5x leverage means. Her position account " +
        "closes, its rent back to her.",
      actions: [
        transfer("vault", "11,765 USDC", "aliceUsdc", "1,990 USDC", {
          id: "aliceOut", d: outOfVault(laneAfter("alice"), A.aliceUsdc),
          coinNear: { x: 560, y: CORRIDOR }, label: ["close_position()", "1,990 USDC"], labelAt: below,
        }),
        { type: "close", id: "aliceLong" },
      ],
    },

    // ---- Maria's fees
    {
      title: "Maria runs [collect_fees()]",
      caption:
        "program_fees holds 7.50 USDC: half the fees on two opens and one close. The other half stays in the insurance fund. " +
        "Only Maria may collect, and it zeroes the balance before it pays her.",
      actions: [
        // The book's standard wallet: every character starts with one SOL and 1,000 USDC.
        { type: "show", ids: ["mariaUsdc"], lines: { mariaUsdc: [balance("1,000 USDC")] }, focus: "shown" },
        { type: "call", handler: "collect_fees()", focus: ["maria", "mariaUsdc", "program", "pool", "vault"] },
        changes("pool", { program_fees: "0" }),
      ],
    },
    {
      title: "Maria receives [7.50 USDC]",
      caption: "The only handler that needs her signature once the pool exists, and the oracle is not even read.",
      actions: [
        transfer("vault", "11,757.50 USDC", "mariaUsdc", "1,007.50 USDC", {
          id: "fees", d: outOfVault(laneAfter("maria"), A.mariaUsdc),
          coinNear: { x: 820, y: CORRIDOR }, label: ["collect_fees()", "7.50 USDC"], labelAt: below,
        }),
      ],
    },
  ];

  window.PERPS_SCENE = {
    title: "Perpetual Futures",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    caption: { x: 16, y: 532, w: 540, h: 92, fontSize: 13 },
    hold: 3000,
    program: "program",
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
