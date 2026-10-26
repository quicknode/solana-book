// The Lending talk: the slides around the scene's diagram steps. Diagram
// runs name the scene steps they show, by index, and together they show every
// step once, in order. Each term is defined where the talk first needs it.

(function () {
  window.LENDING_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to build a", "[lending market]", "on Solana"] },
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
            sub: "From the Lending and Borrowing chapter",
            items: [
              "How lending and borrowing work as a Solana program",
              "How interest grows every debt without moving a token",
              "How liquidators keep the market solvent when prices move",
            ],
          },
        ],
      },

      // ---- What people want, and how a lending market gives it to them.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:savings", who: "Alice",
            name: "Wants her savings to earn [interest]",
            text: "She has $1,000 doing nothing. She'd lend it to someone, as long as she's sure to get it back.",
          },
          {
            tone: "lavender", icon: "tpl:lending-cash", who: "Bob",
            name: "Wants [cash] without selling",
            text: "He owns five NVIDIA shares worth $1,000 and needs $750 now. He expects NVIDIA to rise, " +
              "so he doesn't want to sell.",
          },
        ],
      },
      {
        type: "split",
        heading: "A [lending market] gives both what they want",
        sub: "Like a bank, with a program in place of the banker",
        cards: [
          { icon: "tpl:savings", name: "Alice deposits her dollars", text: "and earns interest on them for as long as they stay in" },
          { icon: "tpl:lending-collateral", name: "Bob pledges his NVIDIA shares", text: "and borrows dollars against them. He gets the shares back when he repays" },
          { icon: "tpl:lending-interest", name: "Bob pays interest", text: "most of it to Alice, and a slice to whoever runs the market" },
        ],
      },
      {
        type: "grid",
        tone: "lavender",
        heading: "The [terms] of a loan",
        sub: "Every lending market sets these",
        cards: [
          { icon: "tpl:lending-collateral", name: "Collateral", text: "What the borrower pledges, and can lose: Bob's NVIDIA shares" },
          { icon: "tpl:lending-ltv", name: "Loan-to-value", text: "How much of the collateral's value may be borrowed: 75%, so $750 against $1,000" },
          { icon: "tpl:lending-interest", name: "Interest", text: "What borrowers pay for the loan, at a yearly rate that rises as more of the pool is lent out" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, the market, Alice's deposits, and Bob's loan.
      { type: "diagram", from: 0, to: 20 },
      {
        type: "allocation",
        heading: "Bob's loan against his [collateral]",
        sub: "He may borrow up to 75% of its value",
        parts: [
          { tone: "lavender", name: "Debt", text: "750 USDC", value: 750 },
          { tone: "mint", name: "Not borrowed against", text: "$250 of $1,000", value: 250 },
        ],
      },
      {
        type: "statement",
        heading: "Carol wants to [short] SpaceX",
        sub: "Borrow the asset, sell it now, and buy it back later, cheaper if she is right. A lending market is where shorts are built",
      },
      // Carol borrows SPCXx and sells it, and SpaceX rallies.
      { type: "diagram", from: 21, to: 29 },
      {
        type: "allocation",
        heading: "SpaceX rallies, and Carol's debt passes [80%]",
        sub: "Against her $1,000 of collateral. Past 80%, $800, the loan can be liquidated",
        parts: [
          { tone: "lavender", name: "Debt", fromText: "3 SPCXx at $250: $750", text: "3 SPCXx at $300: $900", from: 750, value: 900 },
          { tone: "mint", name: "Not borrowed against", fromText: "$250 of $1,000", text: "$100 of $1,000", from: 250, value: 100 },
        ],
      },
      {
        type: "numbered",
        heading: "How a [liquidation] works",
        sub: "Anyone may repay part of an unhealthy loan, and is paid in its collateral",
        cards: [
          { name: "Only past the threshold", text: "A loan below 80% of its collateral's value cannot be touched" },
          { name: "At most half at a time", text: "The close factor caps one liquidation at 50% of the debt" },
          { name: "Paid with a bonus", text: "The liquidator takes collateral worth the repayment plus 5%" },
        ],
      },
      // Dave's two liquidations.
      { type: "diagram", from: 30, to: 35 },
      {
        type: "allocation",
        decimals: 1,
        delay: 1800,
        heading: "Carol's collateral, [paid down]",
        sub: "Her 1,000 USDC shares: what is left of them, and what Dave took for repaying $675 of her debt",
        parts: [
          { tone: "mint", name: "Carol", fromText: "1,000 shares", text: "291.25 shares", from: 1000, value: 291.25 },
          { tone: "lavender", name: "Dave", fromText: "0 shares", text: "708.75 shares", from: 0, value: 708.75 },
        ],
      },
      // Interest, Bob's repayment, Maria's fee, and Alice's yield.
      { type: "diagram", from: 36, to: 41 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:savings", name: "Alice", text: "About $3.38 for five weeks of otherwise idle capital" },
          { tone: "lavender", icon: "tpl:lending-cash", name: "Bob", text: "Five weeks of cash for about $7.50, and he kept his stock" },
          { tone: "mint", icon: "tpl:lending-short", name: "Carol", text: "$1,000 became about $816.25: the price moved against her short, and $33.75 went to Dave" },
          { tone: "white", icon: "tpl:lending-liquidation", name: "Dave", text: "$33.75 for repaying $675 of Carol's debt" },
          { tone: "lavender", icon: "tpl:venue", name: "Maria the market owner", text: "$0.75: her 10% of the interest on Bob's loan" },
        ],
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
