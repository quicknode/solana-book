// The Managed Fund chapter as an animated scene: Victor approves the assets,
// Maria creates a fund and sets its weights, Alice deposits, NVIDIA rises and
// the fund is rebalanced, Bob buys in at the new price, Maria's fee is minted
// to her, and Alice withdraws in kind.
//
// The columns are the chapter figures' accounts spread across a 16:9 screen:
// every public-key account hangs beneath the one curve, the swap router with
// the fund's vaults beneath it. Arrows run down the lanes between columns and
// along a corridor beneath them, one transfer on screen at a time. The steps
// follow the handlers in quicknode/solana-program-examples
// finance/managed-fund: a deposit values the fund before it takes the USDC
// in, deploys it, and mints the shares last; a withdrawal burns first.

(function () {
  const WIDTH = 1120;
  const HEIGHT = 630;
  // A flatter curve than the Options talk's: the program column here holds
  // five accounts and needs the height.
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

  // Heights of the boxes in full, for stacking: the title bar, 12 a line, and
  // padding; 10 a line for a program's handlers.
  const tall = (lines) => 21 + lines * 12 + 7;
  // The gap above a box that carries a two- or three-line seed list.
  const GAP2 = 28.6;
  const GAP3 = 37;

  // Columns, left to right, with lanes between some of them for arrows.
  const COLUMN = {
    victor: [12, 148],
    alice: [172, 140],
    bob: [356, 128],
    maria: [528, 136],
    router: [712, 136],
    program: [884, 224],
  };

  const ata = (owner, token, x, y, w) =>
    derived("token", `${owner}'s ${token}`, x, y, w, [`${owner.toUpperCase()}'S ADDRESS +`, "TOKEN PROGRAM +", `${token.toUpperCase()} MINT`]);

  // Victor's column: his wallet, the registry, the approved assets, and the
  // price accounts they name.
  const victor = onCurve("wallet", "Victor", ...COLUMN.victor);
  const registry = derived("struct", "registry", COLUMN.victor[0], victor.y + tall(1) + GAP2, COLUMN.victor[1], ['"REGISTRY" +', "VICTOR'S ADDRESS"]);
  const approvedTsla = derived("struct", "ApprovedAsset", COLUMN.victor[0], registry.y + tall(1) + GAP3, COLUMN.victor[1], ['"APPROVED_ASSET" +', "REGISTRY +", "TSLAX MINT"]);
  const approvedNvda = derived("struct", "ApprovedAsset", COLUMN.victor[0], approvedTsla.y + tall(2) + GAP3, COLUMN.victor[1], ['"APPROVED_ASSET" +', "REGISTRY +", "NVDAX MINT"]);
  const pythTsla = derived("struct", "Pyth TSLA", COLUMN.victor[0], approvedNvda.y + tall(2) + GAP2, COLUMN.victor[1], ["SHARD +", "TSLA FEED ID"]);
  const pythNvda = derived("struct", "Pyth NVDA", COLUMN.victor[0], pythTsla.y + tall(2) + GAP2, COLUMN.victor[1], ["SHARD +", "NVDA FEED ID"]);

  // Each investor's column: wallet, USDC, shares, and the assets a
  // withdrawal pays out.
  const alice = onCurve("wallet", "Alice", ...COLUMN.alice);
  const bob = onCurve("wallet", "Bob", ...COLUMN.bob);
  const maria = onCurve("wallet", "Maria", ...COLUMN.maria);
  const slot = (person, n) => person.y + 77 * n;

  // The router hangs beneath the curve, and the fund's vaults beneath it.
  const router = onCurve("program", "swap router", ...COLUMN.router);
  const usdcVault = derived("token", "USDC vault", COLUMN.router[0], router.y + 50 + GAP2, COLUMN.router[1], ["FUND'S ADDRESS + TOKEN", "PROGRAM + USDC MINT"]);
  const tslaxVault = derived("token", "TSLAx vault", COLUMN.router[0], usdcVault.y + tall(2) + GAP2, COLUMN.router[1], ["FUND'S ADDRESS + TOKEN", "PROGRAM + TSLAX MINT"]);
  const nvdaxVault = derived("token", "NVDAx vault", COLUMN.router[0], tslaxVault.y + tall(2) + GAP2, COLUMN.router[1], ["FUND'S ADDRESS + TOKEN", "PROGRAM + NVDAX MINT"]);

  // The program, the fund, its asset configs, and its share mint.
  const program = onCurve("program", "managed-fund program", ...COLUMN.program);
  const fund = derived("struct", "fund", COLUMN.program[0], program.y + 120 + GAP2, COLUMN.program[1], ['"FUND" +', "INDEX"]);
  const assetConfig0 = derived("struct", "asset config 0", COLUMN.program[0], fund.y + tall(6) + GAP2, COLUMN.program[1], ['"ASSET" + FUND +', "INDEX"]);
  const assetConfig1 = derived("struct", "asset config 1", COLUMN.program[0], assetConfig0.y + tall(2) + GAP2, COLUMN.program[1], ['"ASSET" + FUND +', "INDEX"]);
  const shareMint = derived("mint", "share mint", COLUMN.program[0], assetConfig1.y + tall(2) + GAP2, COLUMN.program[1], ['"SHARE_MINT" +', "FUND'S ADDRESS"]);

  const accounts = {
    victor, registry, approvedTsla, approvedNvda, pythTsla, pythNvda,
    alice,
    aliceUsdc: ata("Alice", "USDC", COLUMN.alice[0], slot(alice, 1), COLUMN.alice[1]),
    aliceShares: derived("token", "Alice's shares", COLUMN.alice[0], slot(alice, 2), COLUMN.alice[1], ["ALICE'S ADDRESS +", "TOKEN PROGRAM +", "SHARE MINT"]),
    aliceTslax: ata("Alice", "TSLAx", COLUMN.alice[0], slot(alice, 3), COLUMN.alice[1]),
    aliceNvdax: ata("Alice", "NVDAx", COLUMN.alice[0], slot(alice, 4), COLUMN.alice[1]),
    bob,
    bobUsdc: ata("Bob", "USDC", COLUMN.bob[0], slot(bob, 1), COLUMN.bob[1]),
    bobShares: derived("token", "Bob's shares", COLUMN.bob[0], slot(bob, 2), COLUMN.bob[1], ["BOB'S ADDRESS +", "TOKEN PROGRAM +", "SHARE MINT"]),
    maria,
    mariaShares: derived("token", "Maria's shares", COLUMN.maria[0], slot(maria, 1), COLUMN.maria[1], ["MARIA'S ADDRESS +", "TOKEN PROGRAM +", "SHARE MINT"]),
    router, usdcVault, tslaxVault, nvdaxVault,
    program, fund, assetConfig0, assetConfig1, shareMint,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------
  // Lanes run down the gaps between columns; the corridor runs beneath every
  // column but the program's. An arrow leaves the flat of an edge, follows
  // lanes and the corridor, and arrives on the flat of an edge.

  const LANE = {
    alice: 338, // between Alice and Bob
    bob: 510, // between Bob and Maria
    toRouter: 684, // between Maria and the router, for arrows heading right
    toMaria: 690, // the same gap, for arrows heading left into Maria's column
    program: 858, // between the router's column and the program's
  };
  const CORRIDOR = 448;
  const right = (acc, dy = 20) => [acc.x + acc.w + 2, acc.y + dy];
  const left = (acc, dy = 26) => [acc.x - 2, acc.y + dy];

  // From an investor's account down their lane, along the corridor, and up
  // into a vault in the router's column.
  function intoVault(from, lane, to) {
    const [sx, sy] = right(from);
    const [ex, ey] = left(to);
    return rounded([[sx, sy], [lane, sy], [lane, CORRIDOR], [LANE.toRouter, CORRIDOR], [LANE.toRouter, ey], [ex, ey]]);
  }

  // From a vault down to the corridor, and up a lane into an investor's account.
  function outOfVault(from, lane, to) {
    const [sx, sy] = left(from);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [LANE.toRouter, sy], [LANE.toRouter, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]]);
  }

  // Between a vault and the router, round the lane on the router's left.
  function loop(from, fromDy, to, toDy) {
    const [sx, sy] = left(from, fromDy);
    const [ex, ey] = left(to, toDy);
    return rounded([[sx, sy], [LANE.toRouter, sy], [LANE.toRouter, ey], [ex, ey]]);
  }

  // From the share mint, out under the router's column, along the corridor,
  // and up a lane into a shareholder's account.
  function minted(lane, to) {
    const [sx, sy] = left(shareMint);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [LANE.program, sy], [LANE.program, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]]);
  }

  // The reverse: shares burned, from a shareholder's account to the mint.
  function burned(lane, from) {
    const [sx, sy] = right(from);
    const [ex, ey] = left(shareMint);
    return rounded([[sx, sy], [lane, sy], [lane, CORRIDOR], [LANE.program, CORRIDOR], [LANE.program, ey], [ex, ey]]);
  }

  // A label hangs below a corridor coin, or to the left of a lane coin.
  const below = { dx: 0, dy: 22, anchor: "middle" };
  const leftOf = { dx: -14, dy: 4, anchor: "end" };

  const transfer = (from, fromValue, to, toValue, arrow) => ({
    type: "transfer",
    alone: true,
    from: { id: from, value: fromValue, key: fromValue && from === "shareMint" ? "supply" : undefined },
    to: { id: to, value: toValue, key: toValue && to === "shareMint" ? "supply" : undefined },
    arrow,
  });

  // ---- Lines ---------------------------------------------------------------

  const sol = (text) => ({ text, style: "sol" });
  const balance = (text) => ({ text, style: "balance" });
  const field = (text) => ({ text });
  const note = (text) => ({ text, style: "note" });
  const vault = (amount) => [balance(amount), note("authority: the fund")];

  const HANDLERS = [
    "initialize_registry()",
    "approve_asset()",
    "initialize_fund()",
    "add_asset()",
    "set_weight()",
    "deposit()",
    "rebalance()",
    "collect_fees()",
    "withdraw()",
  ];
  const BUY = "swap_usdc_for_asset()";
  const SELL = "swap_asset_for_usdc()";

  // ---- Steps ---------------------------------------------------------------

  const steps = [
    // ---- The opening, for an audience new to Solana.
    {
      title: "This is [Solana]",
      caption:
        "Everything on Solana is stored in accounts, and every account lives at an address. " +
        "This curve stands for the addresses that someone holds a private key for.",
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
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one runs managed funds. Each line is an instruction " +
        "handler, which anyone can call by sending a transaction.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },
    {
      title: "Alice wants her savings [invested]",
      caption:
        "Alice wants to put $900 into stocks, picked by an expert, without handing the expert her money. " +
        "First, somebody has to decide which stocks a fund may hold at all.",
      actions: [{ type: "focus", ids: ["alice", "aliceUsdc"] }],
    },

    // ---- The registry
    {
      title: "Victor runs [initialize_registry()]",
      caption:
        "Victor is a curator: he decides which assets any fund on his platform may hold, and his reputation rests " +
        "on funds not failing. His registry records him as its authority. He is not a fund manager.",
      actions: [
        { type: "show", ids: ["victor"], lines: { victor: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_registry()", focus: ["victor", "program"] },
        { type: "set", changes: [{ id: "victor", title: "Victor (curator)" }] },
        { type: "create", id: "registry", lines: [field("authority: Victor")] },
      ],
    },
    {
      title: "Pyth publishes the [prices]",
      caption:
        "TSLAx and NVDAx are tokens that track one share of Tesla and of NVIDIA. Pyth, an oracle, publishes their " +
        "prices onto Solana: each price feed is an account owned by the Pyth Receiver program.",
      actions: [
        {
          type: "show",
          ids: ["pythTsla", "pythNvda"],
          lines: {
            pythTsla: [field("price: $250"), field("owner: Pyth Receiver")],
            pythNvda: [field("price: $180"), field("owner: Pyth Receiver")],
          },
          focus: "shown",
        },
      ],
    },
    {
      title: "Victor runs [approve_asset()]",
      caption:
        "For each asset Victor vets, an ApprovedAsset binds its mint to its official price feed. A manager can " +
        "then neither list a token they minted themselves, nor pair a real asset with a price feed they control.",
      actions: [
        { type: "call", handler: "approve_asset()", focus: ["victor", "program", "registry", "pythTsla", "pythNvda"] },
        { type: "create", id: "approvedTsla", lines: [field("mint: TSLAx"), field("price_feed: Pyth TSLA")] },
        { type: "create", id: "approvedNvda", lines: [field("mint: NVDAx"), field("price_feed: Pyth NVDA")] },
      ],
    },

    // ---- The fund
    {
      title: "Maria runs [initialize_fund()]",
      caption:
        "Maria, the fund manager, sets her fee in basis points, hundredths of a percent: 100, so 1% a year. Her slippage " +
        "limit, also 1%, caps how far below Pyth's price a trade may fill. The fund gets a mint for its shares, and a USDC " +
        "vault: a token account the program controls.",
      actions: [
        { type: "show", ids: ["maria"], lines: { maria: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_fund()", focus: ["maria", "program", "registry"] },
        { type: "set", changes: [{ id: "maria", title: "Maria (manager)" }] },
        {
          type: "create", id: "fund",
          lines: [
            field("manager: Maria"),
            field("registry: Victor's"),
            field("fee_bps: 100"),
            field("max_slippage_bps: 100"),
            field("total_shares: 0"),
            field("total_weight_bps: 0"),
          ],
        },
        { type: "create", id: "shareMint", lines: [field("supply: 0 shares"), note("mint authority: the fund")] },
        { type: "create", id: "usdcVault", lines: vault("0 USDC") },
      ],
    },
    {
      title: "Maria runs [add_asset()] to set the weights",
      caption:
        "40% TSLAx and 60% NVDAx, each with its own vault. add_asset() only takes an asset with an ApprovedAsset, " +
        "and copies its price feed from there. Nobody can deposit until the weights reach 100%.",
      actions: [
        { type: "call", handler: "add_asset()", focus: ["maria", "program", "fund", "approvedTsla", "approvedNvda"] },
        { type: "create", id: "assetConfig0", lines: [field("mint: TSLAx"), field("weight_bps: 4,000")] },
        { type: "create", id: "tslaxVault", lines: vault("0 TSLAx") },
        { type: "create", id: "assetConfig1", lines: [field("mint: NVDAx"), field("weight_bps: 6,000")] },
        { type: "create", id: "nvdaxVault", lines: vault("0 NVDAx") },
        { type: "set", changes: [{ id: "fund", key: "total_weight_bps", value: "10,000" }] },
      ],
    },

    // ---- Alice's deposit
    {
      key: "aliceCalls",
      title: "Alice runs [deposit()]",
      caption:
        "First the program values the fund: every holding times its Pyth price, its net asset value, NAV. An empty " +
        "fund's NAV is zero, so Alice's 900 USDC will buy 900 shares, one-to-one. Her share account is created.",
      actions: [
        { type: "call", handler: "deposit()", focus: ["alice", "aliceUsdc", "program", "fund", "pythTsla", "pythNvda", "usdcVault", "shareMint"] },
        { type: "set", changes: [{ id: "alice", title: "Alice (investor)" }] },
        { type: "create", id: "aliceShares", lines: [balance("0 shares")] },
      ],
    },
    {
      title: "Alice's 900 USDC go into the [fund]",
      caption: "The USDC lands in the fund's USDC vault. From here the program, not Maria, decides where it goes.",
      actions: [
        transfer("aliceUsdc", "100 USDC", "usdcVault", "900 USDC", {
          id: "aliceIn", d: intoVault(A.aliceUsdc, LANE.alice, usdcVault),
          coinNear: { x: 490, y: CORRIDOR }, label: ["deposit()", "900 USDC"], labelAt: below,
        }),
      ],
    },
    {
      title: "The fund buys [TSLAx] with 40%",
      caption:
        "The swap router is a program that trades one token for another, like Jupiter. 40% of 900 is 360 USDC, " +
        "which buys TSLAx at $250. The fund signs, and the router is the one fixed when Maria created the fund.",
      actions: [
        { type: "show", ids: ["router"], lines: { router: [field(BUY), field(SELL)] }, focus: "shown" },
        { type: "highlight", handlers: ["deposit()", BUY] },
        transfer("usdcVault", "540 USDC", "router", null, {
          id: "aliceTslaOut", d: loop(usdcVault, 20, router, 32),
          coinNear: { x: LANE.toRouter, y: 140 }, label: ["360 USDC"], labelAt: leftOf,
        }),
      ],
    },
    {
      title: "1.44 TSLAx come [back]",
      caption:
        "The program sets the worst price it will accept from Pyth's price, at most 1% below it, or the whole " +
        "deposit reverts. Maria never supplies that minimum, so she can't approve a bad trade.",
      actions: [
        transfer("router", null, "tslaxVault", "1.44 TSLAx", {
          id: "aliceTslaIn", d: loop(router, 40, tslaxVault, 26),
          coinNear: { x: LANE.toRouter, y: 200 }, label: ["1.44 TSLAx"], labelAt: leftOf,
        }),
      ],
    },
    {
      title: "The fund buys [NVDAx] with 60%",
      caption: "60% of 900 is 540 USDC, which buys NVDAx at $180, through the same router, under the same floor.",
      actions: [
        transfer("usdcVault", "0 USDC", "router", null, {
          id: "aliceNvdaOut", d: loop(usdcVault, 20, router, 32),
          coinNear: { x: LANE.toRouter, y: 140 }, label: ["540 USDC"], labelAt: leftOf,
        }),
      ],
    },
    {
      title: "3 NVDAx come [back]",
      caption: "The program counts what each swap actually moved into its vaults, and records it as the fund's holdings.",
      actions: [
        transfer("router", null, "nvdaxVault", "3 NVDAx", {
          id: "aliceNvdaIn", d: loop(router, 40, nvdaxVault, 26),
          coinNear: { x: LANE.toRouter, y: 280 }, label: ["3 NVDAx"], labelAt: leftOf,
        }),
      ],
    },
    {
      key: "aliceShares",
      title: "Alice gets 900 [shares]",
      caption:
        "Last, the share mint mints 900 shares into Alice's account: her slice of everything the fund holds. " +
        "Only the program's own math can mint them.",
      actions: [
        { type: "highlight", handlers: ["deposit()"] },
        transfer("shareMint", "900 shares", "aliceShares", "900 shares", {
          id: "aliceMint", d: minted(LANE.alice, A.aliceShares),
          coinNear: { x: 600, y: CORRIDOR }, label: ["900 shares"], labelAt: below,
        }),
        { type: "set", changes: [{ id: "fund", key: "total_shares", value: "900" }] },
      ],
    },

    // ---- The market moves, and the fund is rebalanced
    {
      title: "NVIDIA rises to [$200]",
      caption:
        "Pyth's NVDA price moves from $180 to $200. The fund's 1.44 TSLAx and 3 NVDAx are now worth $960, so each " +
        "of the 900 shares is worth about $1.07. Nobody stores that price: it's worked out at each deposit.",
      actions: [
        { type: "call", handler: null, focus: ["pythNvda", "pythTsla", "tslaxVault", "nvdaxVault", "fund"] },
        { type: "set", changes: [{ id: "pythNvda", key: "price", value: "$200" }] },
      ],
    },
    {
      title: "Anyone runs [rebalance()]",
      caption:
        "NVDAx is now 62.5% of the fund against its 60% weight: $24 too much, and TSLAx $24 too little. Anyone may " +
        "call this, but the program decides the trade, and only once drift passes the threshold Maria set: 2 points.",
      actions: [
        { type: "call", handler: "rebalance()", focus: ["program", "fund", "pythTsla", "pythNvda", "router", "usdcVault", "tslaxVault", "nvdaxVault"] },
      ],
    },
    {
      title: "The fund sells 0.12 [NVDAx]",
      caption: "$24 of NVDAx at $200 is 0.12 NVDAx, sold through the same router, under an oracle-anchored floor.",
      actions: [
        { type: "highlight", handlers: ["rebalance()", SELL] },
        transfer("nvdaxVault", "2.88 NVDAx", "router", null, {
          id: "sellNvda", d: loop(nvdaxVault, 20, router, 32),
          coinNear: { x: LANE.toRouter, y: 300 }, label: ["0.12 NVDAx"], labelAt: leftOf,
        }),
      ],
    },
    {
      title: "24 USDC come [back]",
      caption: "The USDC lands in the fund's own USDC vault. It never passes through an account the caller controls.",
      actions: [
        transfer("router", null, "usdcVault", "24 USDC", {
          id: "sellBack", d: loop(router, 40, usdcVault, 26),
          coinNear: { x: LANE.toRouter, y: 150 }, label: ["24 USDC"], labelAt: leftOf,
        }),
      ],
    },
    {
      title: "The fund buys [TSLAx] with it",
      caption: "The 24 USDC goes straight back out through the router for TSLAx at $250.",
      actions: [
        { type: "highlight", handlers: ["rebalance()", BUY] },
        transfer("usdcVault", "0 USDC", "router", null, {
          id: "buyTsla", d: loop(usdcVault, 20, router, 32),
          coinNear: { x: LANE.toRouter, y: 140 }, label: ["24 USDC"], labelAt: leftOf,
        }),
      ],
    },
    {
      key: "rebalanced",
      title: "0.096 TSLAx come [back]",
      caption:
        "The weights are back at 40/60: 1.536 TSLAx and 2.88 NVDAx. A second call straight after would find nothing " +
        "to sell, and fail.",
      actions: [
        transfer("router", null, "tslaxVault", "1.536 TSLAx", {
          id: "buyBack", d: loop(router, 40, tslaxVault, 26),
          coinNear: { x: LANE.toRouter, y: 200 }, label: ["0.096 TSLAx"], labelAt: leftOf,
        }),
      ],
    },

    // ---- Bob buys in
    {
      title: "Bob runs [deposit()]",
      caption:
        "Bob, a later investor, deposits 480 USDC. The NAV is now $960 against 900 shares, so 480 USDC buys 450 shares, " +
        "not 480: Alice's gains stay hers. His share account is created.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobUsdc"],
          lines: { bob: [sol("1 SOL")], bobUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "deposit()", focus: ["bob", "bobUsdc", "program", "fund", "pythTsla", "pythNvda", "router", "usdcVault", "tslaxVault", "nvdaxVault", "shareMint"] },
        { type: "set", changes: [{ id: "bob", title: "Bob (investor)" }] },
        { type: "create", id: "bobShares", lines: [balance("0 shares")] },
      ],
    },
    {
      title: "Bob's USDC buys at [40/60]",
      caption:
        "His 480 USDC goes in and out at today's prices, same as Alice's did: 192 USDC for 0.768 TSLAx, " +
        "and 288 USDC for 1.44 NVDAx.",
      actions: [
        transfer("bobUsdc", "520 USDC", "usdcVault", "480 USDC", {
          id: "bobIn", d: intoVault(A.bobUsdc, LANE.bob, usdcVault),
          coinNear: { x: 570, y: CORRIDOR }, label: ["deposit()", "480 USDC"], labelAt: below,
        }),
        { type: "highlight", handlers: ["deposit()", BUY] },
        transfer("usdcVault", "288 USDC", "router", null, {
          id: "bobTslaOut", d: loop(usdcVault, 20, router, 32),
          coinNear: { x: LANE.toRouter, y: 140 }, label: ["192 USDC"], labelAt: leftOf,
        }),
        transfer("router", null, "tslaxVault", "2.304 TSLAx", {
          id: "bobTslaIn", d: loop(router, 40, tslaxVault, 26),
          coinNear: { x: LANE.toRouter, y: 200 }, label: ["0.768 TSLAx"], labelAt: leftOf,
        }),
        transfer("usdcVault", "0 USDC", "router", null, {
          id: "bobNvdaOut", d: loop(usdcVault, 20, router, 32),
          coinNear: { x: LANE.toRouter, y: 140 }, label: ["288 USDC"], labelAt: leftOf,
        }),
        transfer("router", null, "nvdaxVault", "4.32 NVDAx", {
          id: "bobNvdaIn", d: loop(router, 40, nvdaxVault, 26),
          coinNear: { x: LANE.toRouter, y: 280 }, label: ["1.44 NVDAx"], labelAt: leftOf,
        }),
      ],
    },
    {
      title: "Bob gets 450 [shares]",
      caption: "Last, 450 shares are minted to Bob. 1,350 shares now exist.",
      actions: [
        { type: "highlight", handlers: ["deposit()"] },
        transfer("shareMint", "1,350 shares", "bobShares", "450 shares", {
          id: "bobMint", d: minted(LANE.bob, A.bobShares),
          coinNear: { x: 680, y: CORRIDOR }, label: ["450 shares"], labelAt: below,
        }),
        { type: "set", changes: [{ id: "fund", key: "total_shares", value: "1,350" }] },
      ],
    },

    // ---- The fee
    {
      title: "Anyone runs [collect_fees()]",
      caption:
        "A year on, the 1% fee is due: 1% of 1,350 shares is 13.5. Instead of selling assets, the program mints new " +
        "shares to the manager, diluting every holder equally. The fee rate can never be changed.",
      actions: [
        { type: "call", handler: "collect_fees()", focus: ["maria", "program", "fund", "shareMint"] },
        { type: "create", id: "mariaShares", lines: [balance("0 shares")] },
      ],
    },
    {
      key: "feesPaid",
      title: "Maria gets 13.5 [shares]",
      caption: "No token leaves any vault. Maria's shares are a claim on the fund, like everyone else's.",
      actions: [
        transfer("shareMint", "1,363.5 shares", "mariaShares", "13.5 shares", {
          id: "feeMint", d: minted(LANE.toMaria, A.mariaShares),
          coinNear: { x: 760, y: CORRIDOR }, label: ["collect_fees()", "13.5 shares"], labelAt: below,
        }),
        { type: "set", changes: [{ id: "fund", key: "total_shares", value: "1,363.5" }] },
      ],
    },

    // ---- Alice withdraws
    {
      title: "Alice runs [withdraw()]",
      caption:
        "Alice cashes out. The program sells nothing: it pays her slice of every vault in kind, as the tokens " +
        "themselves. She has opened TSLAx and NVDAx accounts to receive them.",
      actions: [
        {
          type: "show",
          ids: ["aliceTslax", "aliceNvdax"],
          lines: { aliceTslax: [balance("0 TSLAx")], aliceNvdax: [balance("0 NVDAx")] },
          focus: "shown",
        },
        { type: "call", handler: "withdraw()", focus: ["alice", "aliceShares", "aliceTslax", "aliceNvdax", "program", "fund", "shareMint", "usdcVault", "tslaxVault", "nvdaxVault"] },
      ],
    },
    {
      title: "Alice's 900 shares are [burned]",
      caption: "Her shares are destroyed first: 900 of the 1,363.5, so her slice of each vault is 900 ÷ 1,363.5, about 66%.",
      actions: [
        transfer("aliceShares", "0 shares", "shareMint", "463.5 shares", {
          id: "burn", d: burned(LANE.alice, A.aliceShares),
          coinNear: { x: 600, y: CORRIDOR }, label: ["withdraw()", "burn 900 shares"], labelAt: below,
        }),
        { type: "set", changes: [{ id: "fund", key: "total_shares", value: "463.5" }] },
      ],
    },
    {
      title: "Alice receives her [TSLAx]",
      caption: "66% of the TSLAx vault's 2.304 TSLAx is 1.521, rounded down, in the fund's favour.",
      actions: [
        transfer("tslaxVault", "0.783 TSLAx", "aliceTslax", "1.521 TSLAx", {
          id: "payTsla", d: outOfVault(tslaxVault, LANE.alice, A.aliceTslax),
          coinNear: { x: 490, y: CORRIDOR }, label: ["1.521 TSLAx"], labelAt: below,
        }),
      ],
    },
    {
      title: "Alice receives her [NVDAx]",
      caption:
        "And 2.851 of the 4.32 NVDAx. She came in with $900, rode NVIDIA up, paid Maria's 1% by dilution, " +
        "and leaves with about $950 of shares in Tesla and NVIDIA.",
      actions: [
        transfer("nvdaxVault", "1.469 NVDAx", "aliceNvdax", "2.851 NVDAx", {
          id: "payNvda", d: outOfVault(nvdaxVault, LANE.alice, A.aliceNvdax),
          coinNear: { x: 490, y: CORRIDOR }, label: ["2.851 NVDAx"], labelAt: below,
        }),
      ],
    },
  ];

  window.FUND_SCENE = {
    title: "Managed Fund",
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
