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
              "How liquidators keep the market solvent when prices fall",
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
        columns: 2,
        heading: "The [terms] of a loan",
        sub: "Every lending market sets these",
        cards: [
          { icon: "tpl:lending-collateral", name: "Collateral", text: "What the borrower pledges, and loses if they don't keep the loan safe: Bob's NVIDIA shares" },
          { icon: "tpl:lending-ltv", name: "Loan-to-value", text: "How much of the collateral's value may be borrowed: 75%, so $750 against $1,000" },
          { icon: "tpl:lending-interest", name: "Interest", text: "What borrowers pay for the loan, at a yearly rate that rises as more of the pool is lent out" },
          { icon: "tpl:lending-liquidation", name: "Liquidation", text: "If the debt passes 80% of the collateral's value, anyone may repay part of it and take collateral at a discount" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, the market, Alice's deposit, and Bob's loan.
      { type: "diagram", from: 0, to: 17 },
      {
        type: "allocation",
        heading: "Bob's loan against his [collateral]",
        sub: "He may borrow up to 75% of its value; past 80%, the loan can be liquidated",
        parts: [
          { tone: "lavender", name: "Debt", text: "750 USDC", value: 750 },
          { tone: "mint", name: "Not borrowed against", text: "$250 of $1,000", value: 250 },
        ],
      },
      // One future: the price falls.
      { type: "diagram", from: 18, to: 18 },
      {
        type: "allocation",
        decimals: 1,
        heading: "NVIDIA falls, and the debt passes [80%]",
        sub: "Bob still owes $750, but his collateral is worth less",
        parts: [
          { tone: "lavender", name: "Debt", text: "750 USDC", value: 750, from: 750 },
          { tone: "mint", name: "Not borrowed against", fromText: "$250 of $1,000", text: "$150 of $900", value: 150, from: 250 },
        ],
      },
      // The liquidation, then the other future: interest, repayment, redemptions, fees.
      { type: "diagram", from: 19, to: 27 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:savings", name: "Alice", text: "Earned $6.75 on savings that would otherwise have sat idle" },
          { tone: "lavender", icon: "tpl:lending-cash", name: "Bob", text: "Borrowed $750 for weeks for $7.50 of interest, and kept his NVIDIA shares" },
          { tone: "mint", icon: "tpl:lending-liquidation", name: "Dave", text: "If NVIDIA had fallen: paid 375 USDC for $393.75 of NVDAx shares" },
          { tone: "white", icon: "tpl:venue", name: "Maria the market owner", text: "Earned 10% of the interest: 75 cents" },
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
