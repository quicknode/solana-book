// The Prop AMM chapter as an animated scene: an oracle publishes NVDAx's
// price, Maria opens a market and stocks it with her firm's own capital,
// Alice buys at the ask, Bob sells at the bid, the price moves, Maria widens
// the spread and pauses, then withdraws everything and closes the market.
//
// The columns are the chapter figures' accounts spread across a 16:9 screen:
// the three people, the two mints and the price feed beneath the one curve,
// and the program with the market and its vaults on the right. Arrows run
// down the lanes between the people's columns, along a corridor beneath
// them, and up the lane beside the vaults, one transfer on screen at a time.
// The steps follow the handlers in quicknode/solana-program-examples
// finance/prop-amm: swap() reads the price feed and prices the fill before
// the trader pays in, then the vault pays out.

(function () {
  const WIDTH = 1120;
  const HEIGHT = 630;
  const curve = AccountAnimation.clusterCurve(WIDTH, { top: 62, control: 700 / WIDTH });
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

  const COLUMN = {
    alice: [16, 150],
    bob: [182, 150],
    maria: [348, 150],
    nvdaxMint: [516, 104],
    usdcMint: [630, 104],
    priceFeed: [744, 132],
    program: [884, 220],
  };

  const ata = (owner, token, person, slot, [x, w]) =>
    derived("token", `${owner}'s ${token}`, x, person.y + 77 * slot, w, [
      `${owner.toUpperCase()}'S ADDRESS +`, "TOKEN PROGRAM +", `${token.toUpperCase()} MINT`,
    ]);

  const alice = onCurve("wallet", "Alice", ...COLUMN.alice);
  const bob = onCurve("wallet", "Bob", ...COLUMN.bob);
  const maria = onCurve("wallet", "Maria", ...COLUMN.maria);
  const program = onCurve("program", "prop amm program", ...COLUMN.program);
  const market = derived("struct", "market", COLUMN.program[0], program.y + tall(6) + 2 + GAP2, COLUMN.program[1], ['"MARKET" + NVDAX &', "USDC MINT ADDRESSES"]);
  const baseVault = derived("token", "base vault", COLUMN.program[0], market.y + tall(5) + GAP2, COLUMN.program[1], ['"BASE_VAULT" +', "MARKET'S ADDRESS"]);
  const quoteVault = derived("token", "quote vault", COLUMN.program[0], baseVault.y + tall(2) + GAP2, COLUMN.program[1], ['"QUOTE_VAULT" +', "MARKET'S ADDRESS"]);

  const accounts = {
    alice,
    aliceUsdc: ata("Alice", "USDC", alice, 1, COLUMN.alice),
    aliceNvdax: ata("Alice", "NVDAx", alice, 2, COLUMN.alice),
    bob,
    bobUsdc: ata("Bob", "USDC", bob, 1, COLUMN.bob),
    bobNvdax: ata("Bob", "NVDAx", bob, 2, COLUMN.bob),
    maria,
    mariaUsdc: ata("Maria", "USDC", maria, 1, COLUMN.maria),
    mariaNvdax: ata("Maria", "NVDAx", maria, 2, COLUMN.maria),
    nvdaxMint: onCurve("mint", "NVDAx mint", ...COLUMN.nvdaxMint),
    usdcMint: onCurve("mint", "USDC mint", ...COLUMN.usdcMint),
    // Created from a key pair by the oracle's deployer, so its dot is on the curve.
    // Named as the chapter's figures name it.
    priceFeed: onCurve("struct", "NVDAx feed", ...COLUMN.priceFeed),
    program,
    market,
    baseVault,
    quoteVault,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------

  const LANE = {
    alice: 174, // between Alice and Bob
    bob: 340, // between Bob and Maria
    maria: 506, // between Maria and the mints
    vaults: 862, // beside the vaults, below the price feed
  };
  const CORRIDOR = 440;
  const right = (acc, dy = 20) => [acc.x + acc.w + 2, acc.y + dy];
  const left = (acc, dy = 26) => [acc.x - 2, acc.y + dy];

  // From a person's account down their lane, along the corridor, and up or
  // down the vaults' lane into a vault.
  function intoVault(from, lane, to) {
    const [sx, sy] = right(from);
    const [ex, ey] = left(to);
    return rounded([[sx, sy], [lane, sy], [lane, CORRIDOR], [LANE.vaults, CORRIDOR], [LANE.vaults, ey], [ex, ey]]);
  }

  // From a vault along the corridor and up a lane into a person's account.
  function outOfVault(from, lane, to) {
    const [sx, sy] = left(from);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [LANE.vaults, sy], [LANE.vaults, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]]);
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
  const vault = (amount) => [balance(amount), note("authority: the market")];

  const HANDLERS = [
    "initialize_market()",
    "deposit_inventory()",
    "swap()",
    "set_quote()",
    "withdraw_inventory()",
    "close_market()",
  ];

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
      title: "Every token has a [mint]",
      caption:
        "Each kind of token is defined by one mint account. Here are two: USDC, a token worth one US dollar, " +
        "and NVDAx, a token that tracks one share of NVIDIA stock.",
      actions: [{ type: "show", ids: ["nvdaxMint", "usdcMint"], focus: "all" }],
    },
    {
      title: "Alice has a [thousand dollars]",
      caption:
        "Alice keeps her USDC in a token account of her own. Its address, the dot off the curve, is worked out " +
        "from the three names above it rather than held by anyone. It holds 1,000 USDC: a thousand dollars.",
      actions: [{ type: "show", ids: ["aliceUsdc"], lines: { aliceUsdc: [balance("1,000 USDC")] }, focus: "all" }],
    },
    {
      title: "Alice wants five NVIDIA shares [now]",
      caption:
        "Alice wants 5 NVDAx right away, at the market price, without waiting for someone to sell to her.",
      actions: [{ type: "focus", ids: ["alice", "aliceUsdc"] }],
    },
    {
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one runs a market, and each line is an instruction " +
        "handler anyone can call by sending a transaction. First, somebody has to open the market.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },

    // ---- The market opens
    {
      title: "An oracle publishes the [price]",
      caption:
        "An oracle is a service that writes real-world facts onto Solana. Its price feed is an account, owned by " +
        "the oracle's program, that it keeps updated with NVDAx's market price: $165.",
      actions: [
        {
          type: "show",
          ids: ["priceFeed"],
          lines: { priceFeed: [field("price: $165.00"), field("owner: mock-price-feed")] },
          focus: "shown",
        },
      ],
    },
    {
      title: "Maria runs [initialize_market()]",
      caption:
        "Maria runs a market-making firm. Her market reads that price feed, and quotes a spread_bps of 10, in basis " +
        "points, hundredths of a percent: buyers pay the price plus 0.1%, sellers get the price minus 0.1%. " +
        "It has two vaults, token accounts the program controls.",
      actions: [
        { type: "show", ids: ["maria"], lines: { maria: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_market()", focus: ["maria", "program", "priceFeed", "nvdaxMint", "usdcMint"] },
        { type: "set", changes: [{ id: "maria", title: "Maria (operator)" }] },
        {
          type: "create", id: "market",
          lines: [
            field("operator: Maria"),
            field("oracle_feed: the NVDAx feed"),
            field("spread_bps: 10"),
            field("max_confidence_bps: 100"),
            field("paused: false"),
          ],
        },
        { type: "create", id: "baseVault", lines: vault("0 NVDAx") },
        { type: "create", id: "quoteVault", lines: vault("0 USDC") },
      ],
    },
    {
      title: "Maria runs [deposit_inventory()]",
      caption:
        "Her firm's own capital is the market's inventory, what every trade fills from. 1,000 NVDAx go into the " +
        "base vault. Nobody else deposits, so there are no shares to mint.",
      actions: [
        {
          type: "show",
          ids: ["mariaUsdc", "mariaNvdax"],
          // The chapter: her own 1,000 USDC plus the firm's 200,000 USDC, and 1,000 NVDAx.
          lines: { mariaUsdc: [balance("201,000 USDC")], mariaNvdax: [balance("1,000 NVDAx")] },
          focus: "shown",
        },
        { type: "call", handler: "deposit_inventory()", focus: ["maria", "mariaUsdc", "mariaNvdax", "program", "market", "baseVault", "quoteVault"] },
        transfer("mariaNvdax", "0 NVDAx", "baseVault", "1,000 NVDAx", {
          id: "stockBase", d: intoVault(A.mariaNvdax, LANE.maria, baseVault),
          coinNear: { x: 690, y: CORRIDOR }, label: ["deposit_inventory()", "1,000 NVDAx"], labelAt: below,
        }),
      ],
    },
    {
      title: "200,000 USDC go into the [quote vault]",
      caption: "Now Maria can sell NVDAx to buyers, and pay USDC to sellers.",
      actions: [
        transfer("mariaUsdc", "1,000 USDC", "quoteVault", "200,000 USDC", {
          id: "stockQuote", d: intoVault(A.mariaUsdc, LANE.maria, quoteVault),
          coinNear: { x: 690, y: CORRIDOR }, label: ["200,000 USDC"], labelAt: below,
        }),
      ],
    },

    // ---- Alice buys at the ask
    {
      title: "Alice runs [swap()] to buy",
      caption:
        "The handler checks the price feed is fresh and belongs to the oracle Maria chose, then prices Alice at " +
        "the ask: $165 plus 0.1% is $165.165, rounded up. Her 825.825 USDC buy exactly 5 NVDAx.",
      actions: [
        { type: "call", handler: "swap()", focus: ["alice", "aliceUsdc", "program", "priceFeed", "market", "baseVault", "quoteVault"] },
        { type: "set", changes: [{ id: "alice", title: "Alice (trader)" }] },
        { type: "create", id: "aliceNvdax", lines: [balance("0 NVDAx")] },
      ],
    },
    {
      title: "Alice pays the [ask]",
      caption: "825.825 USDC go into the quote vault. Her NVDAx account was created in the same transaction.",
      actions: [
        transfer("aliceUsdc", "174.175 USDC", "quoteVault", "200,825.825 USDC", {
          id: "aliceIn", d: intoVault(A.aliceUsdc, LANE.alice, quoteVault),
          coinNear: { x: 520, y: CORRIDOR }, label: ["swap()", "825.825 USDC"], labelAt: below,
        }),
      ],
    },
    {
      title: "Alice receives 5 [NVDAx]",
      caption:
        "The vault pays out. A fund buying 500 NVDAx would pay $165.165 each too: the price never depends on " +
        "the trade's size or the vaults' balances, so there is no price impact.",
      actions: [
        transfer("baseVault", "995 NVDAx", "aliceNvdax", "5 NVDAx", {
          id: "aliceOut", d: outOfVault(baseVault, LANE.alice, A.aliceNvdax),
          coinNear: { x: 520, y: CORRIDOR }, label: ["5 NVDAx"], labelAt: below,
        }),
      ],
    },

    // ---- Bob sells at the bid
    {
      title: "Bob runs [swap()] to sell",
      caption:
        "Bob needs USDC for a down payment, and sells the 5 NVDAx he holds. He gets the bid: $165 minus 0.1% is " +
        "$164.835, rounded down, the rounding again in the market's favour.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobUsdc", "bobNvdax"],
          lines: { bob: [sol("1 SOL")], bobUsdc: [balance("1,000 USDC")], bobNvdax: [balance("5 NVDAx")] },
          focus: "shown",
        },
        { type: "call", handler: "swap()", focus: ["bob", "bobUsdc", "bobNvdax", "program", "priceFeed", "market", "baseVault", "quoteVault"] },
        { type: "set", changes: [{ id: "bob", title: "Bob (trader)" }] },
      ],
    },
    {
      title: "Bob delivers 5 [NVDAx]",
      caption: "The trader pays in first, then the vault pays out, both in one transaction or neither.",
      actions: [
        transfer("bobNvdax", "0 NVDAx", "baseVault", "1,000 NVDAx", {
          id: "bobIn", d: intoVault(A.bobNvdax, LANE.bob, baseVault),
          coinNear: { x: 600, y: CORRIDOR }, label: ["swap()", "5 NVDAx"], labelAt: below,
        }),
      ],
    },
    {
      key: "bobSold",
      title: "Bob receives the [bid]",
      caption:
        "824.175 USDC to Bob. Alice paid 825.825 for the same 5 NVDAx, so 1.65 USDC stays in the quote vault: " +
        "the spread, and all of Maria's revenue.",
      actions: [
        transfer("quoteVault", "200,001.65 USDC", "bobUsdc", "1,824.175 USDC", {
          id: "bobOut", d: outOfVault(quoteVault, LANE.bob, A.bobUsdc),
          coinNear: { x: 600, y: CORRIDOR }, label: ["824.175 USDC"], labelAt: below,
        }),
      ],
    },

    // ---- The chapter's hypothetical: the oracle reprices
    {
      title: "If NVIDIA reprices to [$170]",
      caption:
        "It's possible NVIDIA reports earnings and the price feed reprices to $170. The very next swap fills at a " +
        "$170.17 ask. But a quote can be seconds old, and a trader who knows the price moved fills it first: " +
        "adverse selection, a loss Maria bears.",
      actions: [
        { type: "call", handler: null, focus: ["priceFeed", "market"] },
        { type: "set", changes: [{ id: "priceFeed", key: "price", value: "$170.00" }] },
      ],
    },

    // ---- Maria manages the risk
    {
      from: "bobSold",
      key: "widened",
      title: "Maria runs [set_quote()] to widen the spread",
      caption:
        "Back at $165. When volatility rises, Maria widens the spread to 50 basis points. The next buyer " +
        "would pay $165.825 per NVDAx, paying her more for the risk of a stale quote.",
      actions: [
        { type: "call", handler: "set_quote()", focus: ["maria", "program", "market"] },
        { type: "set", changes: [{ id: "market", key: "spread_bps", value: "50" }] },
      ],
    },
    // The chapter pauses only when Maria's view diverges from the price feed; its
    // withdrawal figure shows the market unpaused, so the pause is a branch.
    {
      title: "If she distrusts the price, Maria [pauses]",
      caption:
        "It's possible Maria's view of the market diverges from the price feed entirely. Then set_quote() sets " +
        "paused, and every swap is refused with MarketPaused until she calls it again with paused false.",
      actions: [
        { type: "call", handler: "set_quote()", focus: ["maria", "program", "market"] },
        { type: "set", changes: [{ id: "market", key: "paused", value: "true" }] },
      ],
    },

    // ---- Maria takes her capital back, from the widened, unpaused market
    {
      from: "widened",
      title: "Maria runs [withdraw_inventory()]",
      caption:
        "Her capital comes back whenever she wants it, with nobody's permission and no shares to work out. " +
        "Only the operator can call it.",
      actions: [
        { type: "call", handler: "withdraw_inventory()", focus: ["maria", "mariaUsdc", "mariaNvdax", "program", "market", "baseVault", "quoteVault"] },
        transfer("baseVault", "0 NVDAx", "mariaNvdax", "1,000 NVDAx", {
          id: "drainBase", d: outOfVault(baseVault, LANE.maria, A.mariaNvdax),
          coinNear: { x: 690, y: CORRIDOR }, label: ["withdraw_inventory()", "1,000 NVDAx"], labelAt: below,
        }),
      ],
    },
    {
      title: "Maria takes the [USDC] back",
      caption:
        "Every NVDAx came back, and 1.65 USDC more than she put in: the spread both traders paid.",
      actions: [
        transfer("quoteVault", "0 USDC", "mariaUsdc", "201,001.65 USDC", {
          id: "drainQuote", d: outOfVault(quoteVault, LANE.maria, A.mariaUsdc),
          coinNear: { x: 690, y: CORRIDOR }, label: ["200,001.65 USDC"], labelAt: below,
        }),
      ],
    },
    {
      title: "Maria runs [close_market()]",
      caption:
        "It refuses while either vault holds a token (InventoryNotEmpty). Both vaults and the market close, " +
        "and the rent Maria paid for all three, the SOL each account holds to exist, comes back to her.",
      actions: [
        { type: "call", handler: "close_market()", focus: ["maria", "program", "market", "baseVault", "quoteVault"] },
        { type: "close", id: "baseVault" },
        { type: "close", id: "quoteVault" },
        { type: "close", id: "market" },
      ],
    },
  ];

  window.PROPAMM_SCENE = {
    title: "Prop AMM",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    caption: { x: 16, y: 520, w: 540, h: 100, fontSize: 13 },
    hold: 3000,
    program: "program",
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
