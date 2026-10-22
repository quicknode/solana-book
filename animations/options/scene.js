// The Options chapter as an animated scene: the venue opens, Alice writes a
// covered call, and Bob buys it.
//
// The columns are the chapter figures' columns (options-open-venue.svg,
// options-write-call.svg, options-buy-call.svg) spread across a 16:9 screen,
// which leaves room for the mints beneath the one curve. The steps follow the
// handlers in quicknode/solana-program-examples finance/options: state is
// written and check_custody() runs before any transfer.

(function () {
  const WIDTH = 1120;
  const HEIGHT = 630;
  const curve = AccountAnimation.clusterCurve(WIDTH, { control: 700 / WIDTH });

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

  // Columns: Maria, Alice, Bob, the two mints, and the program.
  const maria = onCurve("wallet", "Maria (admin)", 16, 150);
  const alice = onCurve("wallet", "Alice (writer)", 182, 200);
  const bob = onCurve("wallet", "Bob", 398, 160);
  const program = onCurve("program", "options program", 884, 220);
  const market = derived("struct", "market", 884, program.y + 110 + 28.6, 220, ['"MARKET" + NVDAX &', "USDC MINT ADDRESSES"]);
  const underlyingVault = derived("token", "underlying vault", 884, market.y + 112 + 37, 220, ['"UNDERLYING_VAULT" +', "MARKET'S ADDRESS"]);
  const quoteVault = derived("token", "quote vault", 884, underlyingVault.y + 52 + 40, 220, ['"QUOTE_VAULT" +', "MARKET'S ADDRESS"]);
  const aliceNvdax = derived("token", "Alice's NVDAx", 182, alice.y + 77, 200, ["ALICE'S ADDRESS +", "TOKEN PROGRAM +", "NVDAX MINT"]);
  const aliceUsdc = derived("token", "Alice's USDC", 182, alice.y + 154, 200, ["ALICE'S ADDRESS +", "TOKEN PROGRAM +", "USDC MINT"]);
  const bobUsdc = derived("token", "Bob's USDC", 398, bob.y + 77, 160, ["BOB'S ADDRESS +", "TOKEN PROGRAM +", "USDC MINT"]);

  const accounts = {
    maria,
    mariaUsdc: derived("token", "Maria's USDC", 16, maria.y + 77, 150, ["MARIA'S ADDRESS +", "TOKEN PROGRAM +", "USDC MINT"]),
    alice,
    aliceNvdax,
    aliceUsdc,
    option: derived("struct", "option", 182, alice.y + 222.6, 200, ['"OPTION" + MARKET\'S ADDRESS +', "ALICE'S ADDRESS + ID"]),
    bob,
    bobUsdc,
    nvdaxMint: onCurve("mint", "NVDAx mint", 574, 120),
    usdcMint: onCurve("mint", "USDC mint", 710, 120),
    program,
    market,
    underlyingVault,
    quoteVault,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;

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

  // Arrows run from the flat of one box's edge to the flat of another's.
  const right = (acc, dy) => [acc.x + acc.w + 2, acc.y + dy];
  const left = (acc, dy) => [acc.x - 2, acc.y + dy];
  const bottom = (acc, dx, h) => [acc.x + dx, acc.y + h];
  const xy = ([x, y]) => `${x},${y}`;

  const write = (() => {
    const [sx, sy] = right(aliceNvdax, 20);
    const [ex, ey] = left(underlyingVault, 26);
    return `M ${sx},${sy} C ${sx + 10},${sy + 80} ${sx + 18},${ey} ${ex},${ey}`;
  })();
  const premium = (() => {
    const [sx, sy] = bottom(bobUsdc, 10, 40);
    const [ex, ey] = right(aliceUsdc, 24.6);
    return `M ${sx},${sy} C ${sx},${sy + 35} ${sx + 14},${ey} ${ex},${ey}`;
  })();
  const fee = (() => {
    const [sx, sy] = right(bobUsdc, 20);
    const [ex, ey] = left(quoteVault, 26);
    return `M ${sx},${sy} C ${sx + 150},${sy} ${ex - 180},${ey} ${ex},${ey}`;
  })();

  const steps = [
    {
      title: "Before the venue opens",
      caption:
        "Maria, Alice and Bob each hold one SOL and 1,000 USDC, and Alice also holds five NVDAx. " +
        "The options program is deployed, but no market exists yet.",
      actions: [
        {
          type: "show",
          ids: ["maria", "mariaUsdc", "alice", "aliceNvdax", "aliceUsdc", "bob", "bobUsdc", "nvdaxMint", "usdcMint", "program"],
          lines: {
            maria: [sol("1 SOL")],
            mariaUsdc: [balance("1,000 USDC")],
            alice: [sol("1 SOL")],
            aliceNvdax: [balance("5 NVDAx")],
            aliceUsdc: [balance("1,000 USDC")],
            bob: [sol("1 SOL")],
            bobUsdc: [balance("1,000 USDC")],
            program: HANDLERS.map(field),
          },
        },
        { type: "focus", ids: "all" },
      ],
    },
    {
      title: "Maria opens the venue",
      caption:
        "Maria calls initialize_market() with fee_bps of 100. One transaction creates the market and its two vaults, " +
        "and Maria pays their rent. No tokens move until a writer posts collateral.",
      actions: [
        { type: "call", handler: "initialize_market()", focus: ["maria", "program", "nvdaxMint", "usdcMint"] },
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
    {
      title: "Alice writes a covered call on 5 NVDAx",
      caption:
        "Alice calls write_option(): a call on 5 NVDAx, a strike amount of 900 USDC, a premium of 25 USDC, " +
        "and an expiry one week out. The handler writes the option as Listed, with no holder.",
      actions: [
        { type: "call", handler: "write_option()", focus: ["alice", "aliceNvdax", "program", "market", "underlyingVault"] },
        {
          type: "create", id: "option",
          lines: [
            field("id: 1"),
            field("market: the NVDAx/USDC market"),
            field("writer: Alice"),
            field("holder: none yet"),
            field("kind: Call"),
            field("status: Listed"),
            field("underlying_amount: 5 NVDAx"),
            field("strike_amount: 900 USDC"),
            field("premium: 25 USDC"),
            field("expiry: one week out"),
          ],
        },
      ],
    },
    {
      title: "The market records what it will owe",
      caption:
        "Before any token moves, the market's underlying_owed rises by 5 NVDAx, and check_custody() confirms " +
        "the underlying vault will still cover everything the market owes.",
      actions: [{ type: "set", changes: [{ id: "market", key: "underlying_owed", value: "5 NVDAx" }] }],
    },
    {
      title: "Alice's 5 NVDAx move into the vault",
      caption:
        "Alice's 5 NVDAx move into the underlying vault. The call is covered: everything a holder could claim " +
        "is already in custody.",
      actions: [
        {
          type: "transfer",
          from: { id: "aliceNvdax", value: "0 NVDAx" },
          to: { id: "underlyingVault", value: "5 NVDAx" },
          arrow: {
            id: "write", d: write, coinAt: 0.62,
            label: ["write_option()", "5 NVDAx"],
            labelAt: { dx: 0, dy: -24, anchor: "middle" },
          },
        },
      ],
    },
    {
      title: "Bob buys the call",
      caption:
        "Bob calls buy_option() with the terms he read. The handler refuses if the option is no longer Listed, " +
        "has expired, or has different terms from the ones Bob passed (OptionTermsChanged).",
      actions: [
        { type: "call", handler: "buy_option()", focus: ["bob", "bobUsdc", "aliceUsdc", "option", "program", "market", "quoteVault"] },
      ],
    },
    {
      title: "The option records its holder",
      caption:
        "Before a token moves, the handler records Bob as the holder and the option as Held, and adds Maria's " +
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
      title: "Bob pays Alice the premium",
      caption: "24.75 USDC goes straight from Bob to Alice. It is hers from this moment, whatever Bob does later.",
      actions: [
        {
          type: "transfer",
          from: { id: "bobUsdc", value: "975.25 USDC" },
          to: { id: "aliceUsdc", value: "1,024.75 USDC" },
          arrow: {
            id: "premium", d: premium, coinAt: 0.45,
            label: ["1. buy_option()", "24.75 USDC"],
            labelAt: { dx: 14, dy: -10 },
          },
        },
      ],
    },
    {
      title: "Bob pays Maria's fee",
      caption:
        "Maria's 0.25 USDC fee goes into the quote vault. The 5 NVDAx do not move: Bob's downside is fixed at " +
        "the 25 USDC he paid, and Alice's upside is capped at $180 a share until the week is out.",
      actions: [
        {
          type: "transfer",
          from: { id: "bobUsdc", value: "975 USDC" },
          to: { id: "quoteVault", value: "0.25 USDC" },
          arrow: {
            id: "fee", d: fee, coinAt: 0.5,
            label: ["2. Maria's fee · 0.25 USDC"],
            labelAt: { dx: -14, dy: 4, anchor: "end" },
          },
        },
      ],
    },
  ];

  window.OPTIONS_SCENE = {
    title: "Options",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    // The caption sits in the open space beneath the people's columns.
    caption: { x: 16, y: 470, w: 520, h: 140, fontSize: 13 },
    // How long autoplay holds each finished step, in ms.
    hold: 3000,
    program: "program",
    // Drawing order: later accounts paint over earlier ones.
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
