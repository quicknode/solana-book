// The Prop AMM talk: the slides around the scene's diagram steps. Diagram
// runs name the scene steps they show, by index, and together they show every
// step once, in order. Each term is defined where the talk first needs it.

(function () {
  window.PROPAMM_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to build a", "[prop AMM]", "on Solana"] },
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
            sub: "From the Prop AMM chapter",
            items: [
              "How a market-making firm quotes its own capital on Solana",
              "Why a price read from an oracle has no price impact",
              "How a market maker protects itself when prices move fast",
            ],
          },
        ],
      },

      // ---- What people want, and how a prop AMM gives it to them, before any Solana.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:propamm-spread", who: "Maria",
            name: "Wants to earn the [spread]",
            text: "She runs a market-making firm: it stands ready to buy from anyone and sell to anyone, " +
              "selling a little above the market price and buying a little below it. The difference is her income.",
          },
          {
            tone: "lavender", icon: "tpl:propamm-instant", who: "Alice",
            name: "Wants to buy [right now]",
            text: "She wants five NVIDIA shares at a fair price, without waiting for someone who happens to be " +
              "selling, and without her own purchase pushing the price up.",
          },
        ],
      },
      {
        type: "numbered",
        heading: "A [prop AMM] gives both what they want",
        sub: "“Prop” is short for proprietary: the firm trades its own capital, and nobody else's",
        cards: [
          { name: "Maria quotes both sides", text: "Anyone may buy from her, or sell to her, at any moment" },
          { name: "An oracle sets the price", text: "Her prices follow the market price an oracle publishes, plus or minus her margin" },
          { name: "Maria keeps the difference", text: "What buyers pay above the market, and sellers take below it, is all she earns" },
        ],
      },
      {
        type: "grid",
        tone: "lavender",
        heading: "The [terms] of a prop AMM",
        sub: "Every market maker's quote names these",
        cards: [
          { icon: "tpl:propamm-maker", name: "Market maker", text: "A firm that stands ready to buy and to sell: Maria" },
          { icon: "tpl:propamm-oracle", name: "Oracle price", text: "The market price an oracle publishes: $165 for NVIDIA" },
          { icon: "tpl:propamm-ask", name: "Ask", text: "What a buyer pays: the oracle price plus Maria's margin" },
          { icon: "tpl:propamm-bid", name: "Bid", text: "What a seller receives: the oracle price minus the same margin" },
          { icon: "tpl:propamm-spread", name: "Spread", text: "The gap between the ask and the bid: Maria's income" },
          { icon: "tpl:propamm-inventory", name: "Inventory", text: "The firm's own tokens that every trade fills from" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, Alice, the price feed, the market, and both trades.
      { type: "diagram", from: 0, to: 15 },
      {
        type: "statement",
        heading: "A round trip costs [1.65 USDC]",
        sub: "Alice paid 825.825 USDC for 5 NVDAx, and Bob got 824.175 for the same 5. The difference stays in the market",
      },
      // The price moves, Maria manages her risk, and closes the market.
      {
        type: "statement",
        heading: "What if NVIDIA [reprices] to $170?",
      },
      { type: "diagram", from: 16, to: 16 },
      {
        type: "statement",
        heading: "Back at $165: Maria [manages] the risk",
      },
      { type: "diagram", from: 17, to: 17 },
      {
        type: "statement",
        heading: "What if Maria [distrusts] the price?",
      },
      { type: "diagram", from: 18, to: 18 },
      {
        type: "statement",
        heading: "Back to the open market: Maria [withdraws]",
      },
      { type: "diagram", from: 19, to: 21 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:propamm-instant", name: "Alice", text: "Bought 5 NVDAx at once, for 825.825 USDC: the quoted price, with no price impact" },
          { tone: "lavender", icon: "tpl:propamm-bid", name: "Bob", text: "Sold his 5 NVDAx at the bid, for 824.175 USDC towards his down payment" },
          { tone: "mint", icon: "tpl:propamm-spread", name: "Maria the market maker", text: "Earned the 1.65 USDC spread, carried every risk, and took all her capital back" },
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
