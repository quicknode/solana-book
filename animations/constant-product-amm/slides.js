// The Constant-Product AMM talk: the slides around the scene's diagram steps.
// Diagram runs name the scene steps they show, by index, and together they
// show every step once, in order. Each term is defined where the talk first
// needs it.

(function () {
  window.AMM_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to build an", "[automated market maker]", "on Solana"] },
      {
        type: "columns",
        columns: [
          {
            heading: "What you should {know}",
            sub: "Before you start",
            items: [
              "Users interact with Solana by making transactions containing many instructions",
              "Solana programs have instruction handler functions",
              "Programs save data in PDAs with seeds",
            ],
          },
          {
            heading: "What you'll {learn}",
            sub: "From the Constant-Product AMM chapter",
            items: [
              "How a pool prices every trade with one formula",
              "How liquidity providers earn fees, and when they'd have done better just holding",
              "Why the program checks its own arithmetic after every trade",
            ],
          },
        ],
      },

      // ---- What people want, and how a pool gives it to them, before any Solana.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:income", who: "Alice",
            name: "Wants her tokens to [earn]",
            text: "She holds ACME, a newly launched stock token, and some USDC. She'd like them to earn fees from " +
              "traders, without posting prices or watching a screen all day.",
          },
          {
            tone: "lavender", icon: "tpl:amm-instant", who: "Bob",
            name: "Wants to trade [instantly]",
            text: "ACME launched today. On an exchange where people post prices, he might wait all day for a " +
              "seller. He wants to buy now.",
          },
        ],
      },
      {
        type: "split",
        heading: "A [liquidity pool] gives both what they want",
        sub: "An automated market maker, or AMM: nobody posts prices",
        cards: [
          { icon: "tpl:amm-pool", name: "Liquidity providers fill a pool", text: "Alice and others deposit both tokens. They are called liquidity providers, or LPs" },
          { icon: "tpl:amm-formula", name: "A formula sets the price", text: "Bob trades against the pool at once, at whatever price the formula gives" },
          { icon: "tpl:amm-fee", name: "Every trade pays a fee", text: "0.3% of each trade, most of it kept in the pool for the LPs" },
        ],
      },
      {
        type: "numbered",
        heading: "[X × Y = K] prices every trade",
        sub: "The pool holds X of one token and Y of the other",
        cards: [
          { name: "K is X times Y", text: "400 ACME and 900 USDC make K = 360,000" },
          { name: "A trade keeps K fixed", text: "Add USDC, and the pool pays out the ACME that keeps X × Y at K" },
          { name: "The price is Y ÷ X", text: "So every buy makes the next one dearer, and every sell makes it cheaper" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, Alice, and Maria opening the pool.
      { type: "diagram", from: 0, to: 10 },
      // Alice adds liquidity.
      { type: "diagram", from: 11, to: 14 },
      {
        type: "allocation",
        heading: "Who owns the [pool]",
        sub: "Each LP token is a claim on a slice: Maria's 600, counting the unminted floor, and Alice's 150",
        parts: [
          { tone: "mint", name: "Maria", text: "600 LP", value: 600 },
          { tone: "lavender", name: "Alice", text: "150 LP", value: 150 },
        ],
      },
      // Bob and Carol trade, Maria claims, and Alice withdraws.
      { type: "diagram", from: 15, to: 28 },
      {
        type: "chart",
        heading: "LPs win when fees outrun [impermanent loss]",
        sub: "Alice's $450 position at withdrawal, against just holding, at different ACME prices",
        x: [1, 9], xStep: 1,
        y: [-250, 100], yStep: 50,
        xLabel: "ACME's price at withdrawal",
        yLabel: "LP minus holding ($)",
        marks: [{ at: 2.25, label: "LAUNCH $2.25" }],
        series: [
          { tone: "purple", label: "No fees", points: [[1.13, -19], [1.69, -4], [2.25, 0], [2.81, -3], [4.5, -39], [9, -225]], labelAt: [1.1, -60] },
          { tone: "green", label: "With $50 of fees", points: [[1.13, 31], [1.69, 46], [2.25, 50], [2.81, 47], [4.5, 11], [9, -175]], labelAt: [5.0, 60] },
        ],
      },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:venue", name: "Maria the admin", text: "Collected the admin's share of every fee, and still holds 599.9999 LP" },
          { tone: "lavender", icon: "tpl:income", name: "Alice", text: "Earned her share of the fees, but trails just holding by ≈$1.50: the price moved on light trading" },
          { tone: "mint", icon: "tpl:amm-instant", name: "Bob", text: "Traded the moment he wanted: bought ≈40.7 ACME at ≈$2.46, and sold 20 at ≈$2.76" },
          { tone: "white", icon: "tpl:price-rises", name: "Carol", text: "Paid ≈$2.78 an ACME: the price Bob's buy had made" },
        ],
      },

      {
        type: "photo",
        image: "../assets/sky.jpg",
        heading: "[Questions]?",
        sub: "solanabook.org  ·  @QuicknodeSolana",
      },
      {
        type: "qr",
        heading: "Building [Financial Software] on Solana",
        url: "solanabook.org",
        qr: "../assets/qr-solanabook.svg",
        cover: "../assets/book-cover.jpg",
        items: [
          "The definitive guide to building financial products on the most active blockchain",
          "Options trading, Exchanges, Betting Markets, Perpetual Futures.",
          "#3 in “Financial Engineering” category on Amazon",
        ],
      },
      {
        type: "follow",
        tag: "Follow Quicknode on X",
        lead: "To [learn] more on Solana development:",
        handle: "[@QuicknodeSolana]",
        thanks: "Thanks!",
      },
    ],
  };
})();
