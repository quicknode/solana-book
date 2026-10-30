// The Order Book talk: the slides around the scene's diagram steps. Diagram
// runs name the scene steps they show, by index, and together they show every
// step once, in order. Each term is defined where the talk first needs it.

(function () {
  window.ORDERBOOK_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to build an", "[order book exchange]", "on Solana"] },
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
            sub: "From the Order Book Exchange chapter",
            items: [
              "How an exchange like NASDAQ works as a Solana program",
              "Why every order on the book is backed by tokens in a vault",
              "How the exchange records what it owes, and pays it out later",
            ],
          },
        ],
      },

      // ---- What people want, and how an order book gives it to them.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:orderbook-ask", who: "Alice",
            name: "Wants to sell at [her price]",
            text: "She owns ten NVIDIA shares and thinks AI is overhyped. She wants out, " +
              "but not at any price: $265 a share or more.",
          },
          {
            tone: "lavender", icon: "tpl:orderbook-bid", who: "Bob",
            name: "Wants to buy at [his price]",
            text: "He wants in, but he isn't prepared to pay more than $250 a share.",
          },
        ],
      },
      {
        type: "split",
        heading: "An [order book] lets both wait for their price",
        sub: "The way NYSE and NASDAQ work",
        cards: [
          { icon: "tpl:orderbook-ask", name: "Alice posts her price", text: "Sell ten shares at $265 or more" },
          { icon: "tpl:orderbook-bid", name: "Bob posts his", text: "Buy four shares at $250 or less" },
          { icon: "tpl:orderbook-book", name: "Both wait in the book", text: "until somebody arrives willing to take one of those prices" },
        ],
      },
      {
        type: "grid",
        tone: "lavender",
        heading: "The [terms] of an order book",
        sub: "Every exchange uses these",
        cards: [
          { icon: "tpl:orderbook-limit", name: "Limit order", text: "An order with a price its owner refuses to cross" },
          { icon: "tpl:orderbook-bid", name: "Bid", text: "Buy, but only at or below this price: Bob's $250" },
          { icon: "tpl:orderbook-ask", name: "Ask", text: "Sell, but only at or above this price: Alice's $265" },
          { icon: "tpl:orderbook-book", name: "Order book", text: "The bids and the asks, each sorted best price first" },
          { icon: "tpl:orderbook-spread", name: "Spread", text: "The gap between the best bid and the best ask: $15" },
          { icon: "tpl:orderbook-cross", name: "Crossing", text: "An order whose limit reaches across the spread trades at once" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, Alice, the market, Alice's ask, Bob's bid, and Carol's ask arriving.
      { type: "diagram", from: 0, to: 17 },
      {
        type: "numbered",
        heading: "How a [fill] works",
        sub: "Carol's ask crosses Bob's bid",
        cards: [
          { name: "Maker and taker", text: "Bob's resting order is the maker; Carol's arriving order is the taker" },
          { name: "The maker's price", text: "The fill happens at the price on the book, 250, not Carol's 245" },
          { name: "The fee", text: "Whoever receives the USDC pays Maria's 0.25%: here, Carol" },
        ],
      },
      // The fill, the cancel, settlement, the fee, and closing up.
      { type: "diagram", from: 18, to: 28 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:orderbook-ask", name: "Alice", text: "Her ask for ten shares at $265 still rests on the book, waiting for a buyer" },
          { tone: "lavender", icon: "tpl:orderbook-bid", name: "Bob", text: "Bought three NVDAx at $250, his limit, and got his unused 250 USDC back" },
          { tone: "mint", icon: "tpl:orderbook-cross", name: "Carol", text: "Sold three NVDAx right away, at $250 rather than the $245 she'd have taken" },
          { tone: "white", icon: "tpl:venue", name: "Maria the exchange operator", text: "Earned 1.875 USDC, 0.25% of the one fill" },
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
