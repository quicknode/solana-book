// The Options chapter as an animated scene: the venue opens, Alice writes a
// covered call that Bob buys and exercises, Carol writes a cash-secured put
// that Dave buys and lets expire, and Maria collects the fees. The two
// futures the chapter sets aside (the call expiring unused, the put
// exercised) branch off the story and return to it.
//
// The columns are the chapter figures' columns spread across a 16:9 screen,
// which leaves room for the mints beneath the one curve. Carol and Dave take
// Alice's and Bob's columns once the call is done, as they do in the figures.
// The steps follow the handlers in quicknode/solana-program-examples
// finance/options: state is written and check_custody() runs before any
// transfer.

(function () {
  const WIDTH = 1120;
  const HEIGHT = 630;
  // The curve starts lower than in the figures, leaving the top of the slide
  // to the headline.
  const curve = AccountAnimation.clusterCurve(WIDTH, { top: 62, control: 700 / WIDTH });

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

  // Each person's column stacks the wallet, two token accounts, and the
  // writer's option, 77 units apart as in the figures.
  const SLOT = { second: 77, third: 154, option: 222.6 };
  const ata = (person, slot, owner, token, x, w) =>
    derived("token", `${owner}'s ${token}`, x, person.y + SLOT[slot], w, [
      `${owner.toUpperCase()}'S ADDRESS +`, "TOKEN PROGRAM +", `${token.toUpperCase()} MINT`,
    ]);
  const optionAt = (writer, owner, x, w) =>
    derived("struct", "option", x, writer.y + SLOT.option, w, ['"OPTION" + MARKET\'S ADDRESS +', `${owner.toUpperCase()}'S ADDRESS + ID`]);

  // Columns: Maria, the writer (Alice, then Carol), the holder (Bob, then
  // Dave), the two mints, and the program. The gap between the writer's and
  // the holder's columns is the lane arrows take between them.
  const COLUMN = { maria: [16, 150], writer: [182, 200], holder: [430, 160], program: [884, 220] };

  const maria = onCurve("wallet", "Maria", ...COLUMN.maria);
  const alice = onCurve("wallet", "Alice", ...COLUMN.writer);
  const bob = onCurve("wallet", "Bob", ...COLUMN.holder);
  const carol = onCurve("wallet", "Carol", ...COLUMN.writer);
  const dave = onCurve("wallet", "Dave", ...COLUMN.holder);
  const program = onCurve("program", "options program", ...COLUMN.program);
  const market = derived("struct", "market", COLUMN.program[0], program.y + 110 + 28.6, COLUMN.program[1], ['"MARKET" + NVDAX &', "USDC MINT ADDRESSES"]);
  const underlyingVault = derived("token", "underlying vault", COLUMN.program[0], market.y + 112 + 37, COLUMN.program[1], ['"UNDERLYING_VAULT" +', "MARKET'S ADDRESS"]);
  const quoteVault = derived("token", "quote vault", COLUMN.program[0], underlyingVault.y + 52 + 40, COLUMN.program[1], ['"QUOTE_VAULT" +', "MARKET'S ADDRESS"]);

  const accounts = {
    maria,
    mariaUsdc: ata(maria, "second", "Maria", "USDC", ...COLUMN.maria),
    alice,
    aliceNvdax: ata(alice, "second", "Alice", "NVDAx", ...COLUMN.writer),
    aliceUsdc: ata(alice, "third", "Alice", "USDC", ...COLUMN.writer),
    option: optionAt(alice, "Alice", ...COLUMN.writer),
    bob,
    bobUsdc: ata(bob, "second", "Bob", "USDC", ...COLUMN.holder),
    bobNvdax: ata(bob, "third", "Bob", "NVDAx", ...COLUMN.holder),
    carol,
    carolNvdax: ata(carol, "second", "Carol", "NVDAx", ...COLUMN.writer),
    carolUsdc: ata(carol, "third", "Carol", "USDC", ...COLUMN.writer),
    putOption: optionAt(carol, "Carol", ...COLUMN.writer),
    dave,
    // Dave's USDC sits level with Carol's, so his premium crosses the lane.
    daveNvdax: ata(dave, "second", "Dave", "NVDAx", ...COLUMN.holder),
    daveUsdc: ata(dave, "third", "Dave", "USDC", ...COLUMN.holder),
    nvdaxMint: onCurve("mint", "NVDAx mint", 606, 120),
    usdcMint: onCurve("mint", "USDC mint", 742, 120),
    program,
    market,
    underlyingVault,
    quoteVault,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------
  // Each runs from the flat of one box's edge to the flat of another's. The
  // writer-to-holder lane is the middle of the gap between those columns.

  const LANE = (COLUMN.writer[0] + COLUMN.writer[1] + COLUMN.holder[0]) / 2;
  const rightEdge = (acc, dy) => [acc.x + acc.w + 2, acc.y + dy];
  const leftEdge = (acc, dy) => [acc.x - 2, acc.y + dy];

  // Across the page, from a right edge to the left edge of a program-column
  // account: out level, then down (or up) and in level.
  function across(from, fromDy, to, toDy) {
    const [sx, sy] = rightEdge(from, fromDy);
    const [ex, ey] = leftEdge(to, toDy);
    const pull = (ex - sx) / 2;
    return `M ${sx},${sy} C ${sx + pull},${sy} ${ex - pull},${ey} ${ex},${ey}`;
  }

  // Back from a program-column account's left edge to a right edge.
  function back(from, fromDy, to, toDy) {
    const [sx, sy] = leftEdge(from, fromDy);
    const [ex, ey] = rightEdge(to, toDy);
    const pull = (sx - ex) / 2;
    return `M ${sx},${sy} C ${sx - pull},${sy} ${ex + pull},${ey} ${ex},${ey}`;
  }

  // From a program-column account into a writer's account, up the lane, so
  // the arrow passes beside the holder's column rather than through it.
  function upLane(from, fromDy, to, toDy) {
    const [sx, sy] = leftEdge(from, fromDy);
    const [ex, ey] = rightEdge(to, toDy);
    const turn = ey + 70;
    return `M ${sx},${sy} C ${sx - 220},${sy} ${LANE},${sy - 40} ${LANE},${turn} C ${LANE},${ey + 25} ${LANE - 6},${ey} ${ex},${ey}`;
  }

  // From a writer's account down the lane, then across to the program column.
  function downLane(from, fromDy, to, toDy) {
    const [sx, sy] = rightEdge(from, fromDy);
    const [ex, ey] = leftEdge(to, toDy);
    const turn = sy + 70;
    return `M ${sx},${sy} C ${LANE - 6},${sy} ${LANE},${sy + 25} ${LANE},${turn} C ${LANE},${ey - 40} ${ex - 220},${ey} ${ex},${ey}`;
  }

  // From the bottom of the holder's USDC into the writer's USDC, which sits
  // one slot lower in the next column.
  function premium(from, to) {
    const sx = from.x + 12;
    const sy = from.y + 42;
    const [ex, ey] = rightEdge(to, 24);
    return `M ${sx},${sy} C ${sx},${sy + 35} ${sx + 8},${ey} ${ex},${ey}`;
  }

  // Straight across the lane, between two accounts at the same height.
  function acrossLane(from, to) {
    const y = (Math.max(from.y, to.y) + Math.min(from.y, to.y) + 40) / 2;
    return `M ${from.x - 2},${y} L ${to.x + to.w + 2},${y}`;
  }

  // From the quote vault, beneath everything, up into Maria's USDC.
  function toMaria() {
    const [sx, sy] = leftEdge(quoteVault, 26);
    const ex = A.mariaUsdc.x + 75;
    const ey = A.mariaUsdc.y + 42;
    return `M ${sx},${sy} C ${sx - 420},${sy - 30} ${ex},${ey + 300} ${ex},${ey}`;
  }

  // ---- Lines ---------------------------------------------------------------

  const sol = (text) => ({ text, style: "sol" });
  const balance = (text) => ({ text, style: "balance" });
  const field = (text) => ({ text });
  const note = (text) => ({ text, style: "note" });

  const HANDLERS = [
    "initialize_market()",
    "write_option()",
    "buy_option()",
    "cancel_option()",
    "exercise_option()",
    "collect_proceeds()",
    "reclaim_collateral()",
    "collect_fees()",
  ];

  const optionLines = ({ id, writer, kind, strike, premium }) => [
    field(`id: ${id}`),
    field("market: the NVDAx/USDC market"),
    field(`writer: ${writer}`),
    field("holder: none yet"),
    field(`kind: ${kind}`),
    field("status: Listed"),
    field("underlying_amount: 5 NVDAx"),
    field(`strike_amount: ${strike} USDC`),
    field(`premium: ${premium} USDC`),
    field("expiry: one week out"),
  ];

  const transfer = (from, fromValue, to, toValue, arrow) => ({
    type: "transfer",
    from: { id: from, value: fromValue },
    to: { id: to, value: toValue },
    arrow,
  });

  // ---- Steps ---------------------------------------------------------------

  const steps = [
    // ---- The opening, for an audience new to Solana: one account at a time.
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
      title: "Alice owns five shares of [NVIDIA]",
      caption:
        "Alice holds five NVDAx in a second token account, one for each kind of token she owns. " +
        "NVIDIA trades at $165, so her five shares are worth $825.",
      actions: [{ type: "show", ids: ["aliceNvdax"], lines: { aliceNvdax: [balance("5 NVDAx")] }, focus: "all" }],
    },
    {
      title: "Alice wants to be paid to [wait]",
      caption:
        "Alice wants to write an option: the right to buy her five NVDAx at $180 any time this week, " +
        "for a premium of 25 USDC.",
      actions: [{ type: "focus", ids: ["alice", "aliceNvdax"] }],
    },

    // ---- The venue opens
    {
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one runs an options venue, and each line is an instruction " +
        "handler anyone can call by sending a transaction. First, somebody has to open the venue.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },
    {
      title: "Maria runs [initialize_market()] to open the venue",
      caption:
        "Maria runs the venue, for 1% of every premium. One transaction creates the market, which records what the " +
        "venue owes, and two vaults: token accounts the program controls, an underlying vault for NVDAx and a quote " +
        "vault for USDC. Maria pays their rent, the SOL an account holds to exist.",
      actions: [
        { type: "show", ids: ["maria"], lines: { maria: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_market()", focus: ["maria", "program", "nvdaxMint", "usdcMint"] },
        { type: "set", changes: [{ id: "maria", title: "Maria (admin)" }] },
        {
          type: "create", id: "market",
          lines: [
            field("admin: Maria"),
            field("underlying_mint: NVDAx"),
            field("quote_mint: USDC"),
            field("underlying_owed: 0 NVDAx"),
            field("quote_owed: 0 USDC"),
            field("fees_owed: 0 USDC"),
            field("fee_bps: 100"),
          ],
        },
        { type: "create", id: "underlyingVault", lines: [balance("0 NVDAx"), note("authority: the market")] },
        { type: "create", id: "quoteVault", lines: [balance("0 USDC"), note("authority: the market")] },
      ],
    },

    // ---- The call
    {
      title: "Alice runs [write_option()] for a call",
      caption:
        "Alice calls write_option(): a call on 5 NVDAx, a strike amount of 900 USDC, a premium of 25 USDC, " +
        "and an expiry one week out. The handler writes the option as Listed, for sale, with no holder.",
      actions: [
        { type: "call", handler: "write_option()", focus: ["alice", "aliceNvdax", "program", "market", "underlyingVault"] },
        { type: "set", changes: [{ id: "alice", title: "Alice (writer)" }] },
        { type: "create", id: "option", lines: optionLines({ id: 1, writer: "Alice", kind: "Call", strike: 900, premium: 25 }) },
      ],
    },
    {
      title: "The market records what it will [owe]",
      caption:
        "Before any token moves, the market's underlying_owed rises by 5 NVDAx, and check_custody() confirms " +
        "the underlying vault will still cover everything the market owes.",
      actions: [{ type: "set", changes: [{ id: "market", key: "underlying_owed", value: "5 NVDAx" }] }],
    },
    {
      title: "Alice's 5 NVDAx move into the [vault]",
      caption:
        "Alice's 5 NVDAx move into the underlying vault: her collateral. The call is covered, since everything a " +
        "holder could claim is already in the vault, so nobody ever has to chase Alice to deliver.",
      actions: [
        transfer("aliceNvdax", "0 NVDAx", "underlyingVault", "5 NVDAx", {
          id: "write", d: downLane(A.aliceNvdax, 20, underlyingVault, 26), coinAt: 0.7,
          label: ["write_option()", "5 NVDAx"],
          labelAt: { dx: 0, dy: -24, anchor: "middle" },
        }),
      ],
    },
    {
      title: "Bob runs [buy_option()]",
      caption:
        "Bob thinks NVIDIA will pass $180 this week, and has 1,000 USDC. He calls buy_option() with the terms he " +
        "read, and the handler refuses if the option is no longer Listed, has expired, or has changed terms.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobUsdc"],
          lines: { bob: [sol("1 SOL")], bobUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "buy_option()", focus: ["bob", "bobUsdc", "aliceUsdc", "option", "program", "market", "quoteVault"] },
      ],
    },
    {
      title: "The option records its [holder]",
      caption:
        "Before a token moves, the handler records Bob as the holder and the option as Held, sold, and adds Maria's " +
        "1% fee, 0.25 USDC, to fees_owed.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "bob", title: "Bob (holder)" },
            { id: "option", key: "holder", value: "Bob" },
            { id: "option", key: "status", value: "Held" },
            { id: "market", key: "fees_owed", value: "0.25 USDC" },
          ],
        },
      ],
    },
    {
      title: "Bob pays Alice the [premium]",
      caption: "24.75 USDC goes straight from Bob to Alice. It is hers from this moment, whatever Bob does later.",
      actions: [
        transfer("bobUsdc", "975.25 USDC", "aliceUsdc", "1,024.75 USDC", {
          id: "premium", d: premium(A.bobUsdc, A.aliceUsdc), coinAt: 0.4,
          label: ["1. buy_option()", "24.75 USDC"],
          labelAt: { dx: 14, dy: -2 },
        }),
      ],
    },
    {
      key: "callBought",
      title: "Bob pays Maria's [fee]",
      caption:
        "Maria's 0.25 USDC fee goes into the quote vault. The 5 NVDAx do not move: Bob's downside is fixed at " +
        "the 25 USDC he paid, and Alice's upside is capped at $180 a share until the week is out.",
      actions: [
        transfer("bobUsdc", "975 USDC", "quoteVault", "0.25 USDC", {
          id: "fee", d: across(A.bobUsdc, 20, quoteVault, 26), coinAt: 0.5,
          label: ["2. Maria's fee · 0.25 USDC"],
          labelAt: { dx: -14, dy: 4, anchor: "end" },
        }),
      ],
    },

    // ---- The call is exercised
    {
      title: "Bob runs [exercise_option()]",
      caption:
        "NVDAx moves to $200: the option is in the money, worth exercising. It is American, so Bob may exercise at " +
        "any moment before expiry; a European option would wait for expiry. His NVDAx account is created at his expense.",
      actions: [
        { type: "call", handler: "exercise_option()", focus: ["bob", "bobUsdc", "program", "option", "market", "underlyingVault", "quoteVault"] },
        { type: "create", id: "bobNvdax", lines: [balance("0 NVDAx")] },
      ],
    },
    {
      title: "The ledger moves [before] the tokens",
      caption:
        "The option becomes Exercised. underlying_owed falls by 5 NVDAx, collateral no longer owed to anyone, " +
        "and quote_owed rises by 900 USDC, the strike now owed to Alice.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "option", key: "status", value: "Exercised" },
            { id: "market", key: "underlying_owed", value: "0 NVDAx" },
            { id: "market", key: "quote_owed", value: "900 USDC" },
          ],
        },
      ],
    },
    {
      title: "Bob pays the [strike]",
      caption:
        "Bob pays the strike, 5 times 180 USDC, into the quote vault. This is physical settlement: the tokens " +
        "themselves change hands, so the program never reads a price. Cash settlement would need a price feed.",
      actions: [
        transfer("bobUsdc", "75 USDC", "quoteVault", "900.25 USDC", {
          id: "strike", d: across(A.bobUsdc, 20, quoteVault, 26), coinAt: 0.5,
          label: ["1. exercise_option() · 900 USDC"],
          labelAt: { dx: -14, dy: 4, anchor: "end" },
        }),
      ],
    },
    {
      key: "callExercised",
      title: "Bob [receives] the shares",
      caption:
        "The underlying vault pays Bob the 5 NVDAx, worth $1,000 at $200. He spent 925 USDC to get them: " +
        "25 of premium and 900 of strike.",
      actions: [
        transfer("underlyingVault", "0 NVDAx", "bobNvdax", "5 NVDAx", {
          id: "shares", d: back(underlyingVault, 26, A.bobNvdax, 20), coinAt: 0.3,
          label: ["2. Bob receives 5 NVDAx"],
          labelAt: { dx: 0, dy: 20, anchor: "middle" },
        }),
      ],
    },

    // ---- Another future: the call expires
    {
      from: "callBought",
      title: "Had NVDAx stayed at $165, Alice runs [reclaim_collateral()]",
      caption:
        "Another future. At $165 the option is out of the money: Bob would not pay 900 for shares the market sells " +
        "for 825, so he lets it expire. Then Alice calls reclaim_collateral(), and underlying_owed falls by 5 NVDAx.",
      actions: [
        { type: "call", handler: "reclaim_collateral()", focus: ["alice", "aliceNvdax", "program", "option", "market", "underlyingVault"] },
        { type: "set", changes: [{ id: "market", key: "underlying_owed", value: "0 NVDAx" }] },
      ],
    },
    {
      title: "Had NVDAx stayed at $165, Alice [keeps] her shares",
      caption:
        "Alice's 5 NVDAx come back and the option closes, its rent returned to her. Bob's 25 USDC bought a right " +
        "he never used; Alice keeps 24.75 of it and her shares.",
      actions: [
        transfer("underlyingVault", "0 NVDAx", "aliceNvdax", "5 NVDAx", {
          id: "reclaimCall", d: upLane(underlyingVault, 26, A.aliceNvdax, 20), coinAt: 0.3,
          label: ["reclaim_collateral() · 5 NVDAx"],
          labelAt: { dx: 0, dy: 20, anchor: "middle" },
        }),
        { type: "close", id: "option" },
      ],
    },

    // ---- The writer collects the strike
    {
      from: "callExercised",
      title: "Alice runs [collect_proceeds()]",
      caption:
        "Back to the exercised call. Alice calls collect_proceeds(), which only the writer may call, and only once " +
        "the option is Exercised. quote_owed falls by the 900 USDC it held for her.",
      actions: [
        { type: "call", handler: "collect_proceeds()", focus: ["alice", "aliceUsdc", "program", "option", "market", "quoteVault"] },
        { type: "set", changes: [{ id: "market", key: "quote_owed", value: "0 USDC" }] },
      ],
    },
    {
      title: "Alice is [paid], and the option closes",
      caption:
        "Alice sold her five NVDAx for 900 USDC and was paid 24.75 USDC for agreeing to. She holds 1,924.75 USDC, " +
        "an effective $184.95 a share against the $200 they now trade at.",
      actions: [
        transfer("quoteVault", "0.25 USDC", "aliceUsdc", "1,924.75 USDC", {
          id: "proceeds", d: upLane(quoteVault, 26, A.aliceUsdc, 20), coinAt: 0.3,
          label: ["collect_proceeds() · 900 USDC"],
          labelAt: { dx: 0, dy: 20, anchor: "middle" },
        }),
        { type: "close", id: "option" },
      ],
    },

    // ---- The put
    {
      title: "Carol runs [write_option()] for a put",
      caption:
        "Carol has 1,000 USDC and would buy NVDAx at $150. She calls write_option() for a put: 5 NVDAx, a strike " +
        "amount of 750 USDC, a premium of 20 USDC. She has no NVDAx account, so the handler creates one.",
      actions: [
        // Alice and Bob are done; Carol takes the writer's column.
        { type: "hide", ids: ["alice", "aliceNvdax", "aliceUsdc", "bob", "bobUsdc", "bobNvdax"] },
        {
          type: "show",
          ids: ["carol", "carolUsdc"],
          lines: { carol: [sol("1 SOL")], carolUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "write_option()", focus: ["carol", "carolUsdc", "program", "market", "quoteVault"] },
        { type: "set", changes: [{ id: "carol", title: "Carol (writer)" }] },
        { type: "create", id: "carolNvdax", lines: [balance("0 NVDAx")] },
        { type: "create", id: "putOption", lines: optionLines({ id: 2, writer: "Carol", kind: "Put", strike: 750, premium: 20 }) },
      ],
    },
    {
      title: "The market records what it will [owe]",
      caption:
        "A put writer's collateral is the strike amount, so quote_owed rises by 750 USDC before any token moves, " +
        "and check_custody() confirms the quote vault will cover it.",
      actions: [{ type: "set", changes: [{ id: "market", key: "quote_owed", value: "750 USDC" }] }],
    },
    {
      title: "Carol's 750 USDC move into the [vault]",
      caption:
        "The put is cash-secured: everything Dave could claim on exercise is already in custody. " +
        "Of her 1,000 USDC, Carol has 250 left.",
      actions: [
        transfer("carolUsdc", "250 USDC", "quoteVault", "750.25 USDC", {
          id: "writePut", d: downLane(A.carolUsdc, 20, quoteVault, 26), coinAt: 0.7,
          label: ["write_option()", "750 USDC"],
          labelAt: { dx: 0, dy: -24, anchor: "middle" },
        }),
      ],
    },
    {
      title: "Dave runs [buy_option()]",
      caption:
        "Dave holds five NVDAx and 1,000 USDC, and wants insurance against a fall below $150 this week. " +
        "This is a protective put, meant like fire insurance to expire unused.",
      actions: [
        {
          type: "show",
          ids: ["dave", "daveNvdax", "daveUsdc"],
          lines: { dave: [sol("1 SOL")], daveNvdax: [balance("5 NVDAx")], daveUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "buy_option()", focus: ["dave", "daveUsdc", "carolUsdc", "putOption", "program", "market", "quoteVault"] },
      ],
    },
    {
      title: "The option records its [holder]",
      caption:
        "Before a token moves, the handler records Dave as the holder and the option as Held, and adds Maria's " +
        "1% fee, 0.20 USDC, to fees_owed.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "dave", title: "Dave (holder)" },
            { id: "putOption", key: "holder", value: "Dave" },
            { id: "putOption", key: "status", value: "Held" },
            { id: "market", key: "fees_owed", value: "0.45 USDC" },
          ],
        },
      ],
    },
    {
      title: "Dave pays Carol the [premium]",
      caption: "19.80 USDC goes straight from Dave to Carol, hers whatever happens next.",
      actions: [
        transfer("daveUsdc", "980.20 USDC", "carolUsdc", "269.80 USDC", {
          id: "putPremium", d: acrossLane(A.daveUsdc, A.carolUsdc), coinAt: 0.5,
          label: ["1. buy_option()", "19.80 USDC"],
          labelAt: { dx: 6, dy: 36 },
        }),
      ],
    },
    {
      key: "putBought",
      title: "Dave pays Maria's [fee]",
      caption: "Maria's 0.20 USDC fee goes into the quote vault, beside Carol's 750 USDC of collateral.",
      actions: [
        transfer("daveUsdc", "980 USDC", "quoteVault", "750.45 USDC", {
          id: "putFee", d: across(A.daveUsdc, 20, quoteVault, 26), coinAt: 0.5,
          label: ["2. Maria's fee · 0.20 USDC"],
          labelAt: { dx: -14, dy: 4, anchor: "end" },
        }),
      ],
    },

    // ---- The put expires
    {
      title: "The put expires, and Carol runs [reclaim_collateral()]",
      caption:
        "The week passes with NVDAx above $150, and Dave does nothing. Once the expiry has passed, Carol calls " +
        "reclaim_collateral(), and quote_owed falls by 750 USDC.",
      actions: [
        { type: "call", handler: "reclaim_collateral()", focus: ["carol", "carolUsdc", "program", "putOption", "market", "quoteVault"] },
        { type: "set", changes: [{ id: "market", key: "quote_owed", value: "0 USDC" }] },
      ],
    },
    {
      key: "putReclaimed",
      title: "Carol's 750 USDC come [back]",
      caption:
        "The option closes, its rent returned to Carol. Her return is the 19.80 USDC premium on a purchase that " +
        "never happened. Dave's insurance cost him 20 USDC and paid nothing.",
      actions: [
        transfer("quoteVault", "0.45 USDC", "carolUsdc", "1,019.80 USDC", {
          id: "reclaimPut", d: upLane(quoteVault, 26, A.carolUsdc, 20), coinAt: 0.3,
          label: ["reclaim_collateral() · 750 USDC"],
          labelAt: { dx: 0, dy: 20, anchor: "middle" },
        }),
        { type: "close", id: "putOption" },
      ],
    },

    // ---- Another future: the put is exercised
    {
      from: "putBought",
      title: "Had NVDAx fallen below $150, Dave runs [exercise_option()]",
      caption:
        "Another future. Below $150, Dave exercises. The option becomes Exercised, quote_owed falls by the 750 USDC " +
        "strike, and underlying_owed rises by the 5 NVDAx now owed to Carol.",
      actions: [
        { type: "call", handler: "exercise_option()", focus: ["dave", "daveUsdc", "daveNvdax", "program", "putOption", "market", "underlyingVault", "quoteVault"] },
        {
          type: "set",
          changes: [
            { id: "putOption", key: "status", value: "Exercised" },
            { id: "market", key: "quote_owed", value: "0 USDC" },
            { id: "market", key: "underlying_owed", value: "5 NVDAx" },
          ],
        },
      ],
    },
    {
      title: "Had NVDAx fallen below $150, the tokens [change hands]",
      caption:
        "Dave delivers his 5 NVDAx and takes 750 USDC. The shares wait in the vault for Carol, who bought at $150 " +
        "what the market now sells for less.",
      actions: [
        transfer("daveNvdax", "0 NVDAx", "underlyingVault", "5 NVDAx", {
          id: "deliver", d: across(A.daveNvdax, 20, underlyingVault, 26), coinAt: 0.5,
          label: ["1. exercise_option() · 5 NVDAx"],
          labelAt: { dx: -14, dy: 4, anchor: "end" },
        }),
        transfer("quoteVault", "0.45 USDC", "daveUsdc", "1,730 USDC", {
          id: "putStrike", d: back(quoteVault, 26, A.daveUsdc, 20), coinAt: 0.3,
          label: ["2. Dave receives 750 USDC"],
          labelAt: { dx: 0, dy: 20, anchor: "middle" },
        }),
      ],
    },

    // ---- The operator collects the fees
    {
      from: "putReclaimed",
      title: "Maria runs [collect_fees()]",
      caption:
        "Back to the expired put. Maria calls collect_fees(), which zeroes fees_owed, 0.45 USDC across the two " +
        "sales, before it pays her. It refuses to run with nothing to collect (NothingToCollect).",
      actions: [
        { type: "show", ids: ["mariaUsdc"], lines: { mariaUsdc: [balance("1,000 USDC")] }, focus: "shown" },
        { type: "call", handler: "collect_fees()", focus: ["maria", "mariaUsdc", "program", "market", "quoteVault"] },
        { type: "set", changes: [{ id: "market", key: "fees_owed", value: "0 USDC" }] },
      ],
    },
    {
      title: "Maria is paid, and the vaults are [empty]",
      caption:
        "Every token that entered the vaults has left to the party it was owed to. Alice sold at her price, Bob " +
        "gained $75 after the premium, Carol was paid to wait, Dave bought insurance he did not need, and Maria " +
        "earned 1% of every premium.",
      actions: [
        transfer("quoteVault", "0 USDC", "mariaUsdc", "1,000.45 USDC", {
          id: "fees", d: toMaria(), coinAt: 0.35,
          label: ["collect_fees() · 0.45 USDC"],
          labelAt: { dx: 0, dy: 20, anchor: "middle" },
        }),
      ],
    },
  ];

  window.OPTIONS_SCENE = {
    title: "Options",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    // The caption sits in the open space beneath the people's columns.
    caption: { x: 16, y: 520, w: 540, h: 100, fontSize: 13 },
    // How long autoplay holds each finished step, in ms.
    hold: 3000,
    program: "program",
    // Drawing order: later accounts paint over earlier ones.
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
