// The Options chapter as an animated scene: the venue opens, Alice writes a
// covered call, and Bob buys it.
//
// Layout is copied from the chapter's figures (options-open-venue.svg,
// options-write-call.svg, options-buy-call.svg), so every box sits where the
// reader has already seen it. The steps follow the handlers in
// quicknode/solana-program-examples finance/options: state is written and
// check_custody() runs before any transfer.

(function () {
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

  const accounts = {
    maria: {
      kind: "wallet", title: "Maria (admin)", x: 16, y: 44.63, w: 124,
      dot: { cx: 132, cy: 35.33 }, onCurve: true,
    },
    mariaUsdc: {
      kind: "token", title: "Maria's USDC", x: 16, y: 121.63, w: 124,
      dot: { cx: 24, cy: 103.13 },
      seeds: { x: 34, y: 97.63, lines: ["MARIA'S ADDRESS +", "TOKEN PROGRAM +", "USDC MINT"] },
    },
    alice: {
      kind: "wallet", title: "Alice (writer)", x: 152, y: 56.43, w: 164,
      dot: { cx: 308, cy: 47.13 }, onCurve: true,
    },
    aliceNvdax: {
      kind: "token", title: "Alice's NVDAx", x: 152, y: 133.43, w: 164,
      dot: { cx: 160, cy: 114.93 },
      seeds: { x: 170, y: 109.43, lines: ["ALICE'S ADDRESS +", "TOKEN PROGRAM +", "NVDAX MINT"] },
    },
    aliceUsdc: {
      kind: "token", title: "Alice's USDC", x: 152, y: 210.43, w: 164,
      dot: { cx: 160, cy: 191.93 },
      seeds: { x: 170, y: 186.43, lines: ["ALICE'S ADDRESS +", "TOKEN PROGRAM +", "USDC MINT"] },
    },
    option: {
      kind: "struct", title: "option", x: 152, y: 279.03, w: 164,
      dot: { cx: 160, cy: 265.03 },
      seeds: { x: 170, y: 264.03, lines: ['"OPTION" + MARKET\'S ADDRESS +', "ALICE'S ADDRESS + ID"] },
    },
    bob: {
      kind: "wallet", title: "Bob", x: 328, y: 73.97, w: 120,
      dot: { cx: 440, cy: 64.67 }, onCurve: true,
    },
    bobUsdc: {
      kind: "token", title: "Bob's USDC", x: 328, y: 150.97, w: 120,
      dot: { cx: 336, cy: 132.47 },
      seeds: { x: 346, y: 126.97, lines: ["BOB'S ADDRESS +", "TOKEN PROGRAM +", "USDC MINT"] },
    },
    program: {
      kind: "program", title: "options program", x: 464, y: 117.11, w: 168,
      dot: { cx: 624, cy: 107.81 }, onCurve: true,
    },
    market: {
      kind: "struct", title: "market", x: 464, y: 255.71, w: 168,
      dot: { cx: 472, cy: 241.71 },
      seeds: { x: 482, y: 240.71, lines: ['"MARKET" + NVDAX &', "USDC MINT ADDRESSES"] },
    },
    underlyingVault: {
      kind: "token", title: "underlying vault", x: 464, y: 404.71, w: 168,
      dot: { cx: 472, cy: 386.21 },
      seeds: { x: 482, y: 380.71, lines: ['"UNDERLYING_VAULT" +', "MARKET'S ADDRESS"] },
    },
    quoteVault: {
      kind: "token", title: "quote vault", x: 464, y: 496.71, w: 168,
      dot: { cx: 472, cy: 478.21 },
      seeds: { x: 482, y: 472.71, lines: ['"QUOTE_VAULT" +', "MARKET'S ADDRESS"] },
    },
    // The mints hang beneath a continued piece of the curve, as in the figures.
    nvdaxMint: {
      kind: "mint", title: "NVDAx mint", x: 26, y: 588.03, w: 104,
      dot: { cx: 122, cy: 579.03 }, onCurve: true,
    },
    usdcMint: {
      kind: "mint", title: "USDC mint", x: 142, y: 592.323, w: 104,
      dot: { cx: 238, cy: 583.323 }, onCurve: true,
    },
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;

  const background = `
    <path d="M 0,33 Q 400,33 640,113" fill="none" stroke="#111" stroke-width="3.5"/>
    <text stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round" x="628" y="79" font-size="13" font-weight="bold" text-anchor="end">Solana Devnet</text>
    <rect x="16" y="554" width="240" height="68.323" fill="none" stroke="#888" stroke-width="1" stroke-dasharray="4 3"/>
    <text stroke="#fff" stroke-width="4.5" paint-order="stroke" stroke-linejoin="round" x="248" y="568" font-size="9" fill="#444" font-style="italic" text-anchor="end">curve continued</text>
    <path d="M 22,578 Q 147.4,578 250,584" fill="none" stroke="#111" stroke-width="3.5"/>`;

  const steps = [
    {
      caption:
        "Maria, Alice and Bob each hold one SOL and 1,000 USDC, and Alice also holds five NVDAx. " +
        "The options program is deployed, but no market exists yet.",
      actions: [
        { type: "headline", text: "Before the venue opens" },
        {
          type: "show",
          ids: ["maria", "mariaUsdc", "alice", "aliceNvdax", "aliceUsdc", "bob", "bobUsdc", "program", "nvdaxMint", "usdcMint"],
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
      caption:
        "Maria calls initialize_market() with fee_bps of 100. One transaction creates the market and its two vaults, " +
        "and Maria pays their rent.",
      actions: [
        { type: "headline", text: "Maria opens the venue" },
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
      caption:
        "Alice calls write_option(): a call on 5 NVDAx, a strike amount of 900 USDC, a premium of 25 USDC, " +
        "and an expiry one week out. The handler writes the option as Listed, with no holder.",
      actions: [
        { type: "headline", text: "Alice writes a covered call on 5 NVDAx" },
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
      caption:
        "Before any token moves, the market's underlying_owed rises by 5 NVDAx, and check_custody() confirms " +
        "the underlying vault will still cover everything the market owes.",
      actions: [{ type: "set", changes: [{ id: "market", key: "underlying_owed", value: "5 NVDAx" }] }],
    },
    {
      caption:
        "Alice's 5 NVDAx move into the underlying vault. The call is covered: everything a holder could claim " +
        "is already in custody.",
      actions: [
        {
          type: "transfer",
          from: { id: "aliceNvdax", value: "0 NVDAx" },
          to: { id: "underlyingVault", value: "5 NVDAx" },
          arrow: {
            id: "write",
            d: "M 318,161.43 C 338,190.43 346,420 462,433",
            label: ["write_option()", "5 NVDAx"],
            labelAt: { x: 370, y: 300 },
            coin: { x: 357, y: 313 },
          },
        },
      ],
    },
    {
      caption:
        "Bob calls buy_option() with the terms he read. The handler refuses if the option is no longer Listed, " +
        "has expired, or has different terms from the ones Bob passed (OptionTermsChanged).",
      actions: [
        { type: "headline", text: "Bob buys the call" },
        { type: "call", handler: "buy_option()", focus: ["bob", "bobUsdc", "aliceUsdc", "option", "program", "market", "quoteVault"] },
      ],
    },
    {
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
      caption: "24.75 USDC goes straight from Bob to Alice. It is hers from this moment, whatever Bob does later.",
      actions: [
        {
          type: "transfer",
          from: { id: "bobUsdc", value: "975.25 USDC" },
          to: { id: "aliceUsdc", value: "1,024.75 USDC" },
          arrow: {
            id: "premium",
            d: "M 338,191 C 338,226 352,235 318,235",
            label: ["1. buy_option()", "24.75 USDC"],
            labelAt: { x: 355, y: 208 },
            coin: { x: 341, y: 222 },
          },
        },
      ],
    },
    {
      caption:
        "Maria's 0.25 USDC fee goes into the quote vault. The 5 NVDAx do not move: Bob's downside is fixed at " +
        "the 25 USDC he paid, and Alice's upside is capped at $180 a share until the week is out.",
      actions: [
        {
          type: "transfer",
          from: { id: "bobUsdc", value: "975 USDC" },
          to: { id: "quoteVault", value: "0.25 USDC" },
          arrow: {
            id: "fee",
            d: "M 448,178 C 462,200 452,494 462,523",
            label: ["2. Maria's fee · 0.25 USDC"],
            labelAt: { x: 444.5, y: 458, anchor: "end" },
            coin: { x: 457.5, y: 457 },
          },
        },
      ],
    },
  ];

  window.OPTIONS_SCENE = {
    title: "Options",
    canvas: { width: 640, height: 632 },
    program: "program",
    // Drawing order: later accounts paint over earlier ones.
    order: Object.keys(accounts),
    accounts,
    background,
    steps,
  };
})();
