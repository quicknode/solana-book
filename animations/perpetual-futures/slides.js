// The Perpetual Futures talk: the slides around the scene's diagram steps.
// Diagram runs name the scene steps they show, by index, and together they
// show every step once, in order. Each term is defined where the talk first
// needs it.

(function () {
  window.PERPS_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to build a", "[perpetual futures]", "venue on Solana"] },
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
            sub: "From the Perpetual Futures chapter",
            items: [
              "How a pool can be the other side of every leveraged trade",
              "How a program checks it can pay every winner without reading every position",
              "Why a stranger is paid to close a losing position",
            ],
          },
        ],
      },

      // ---- What people want, and how a perpetual future gives it to them.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:price-rises", who: "Alice",
            name: "Wants [more upside] than her money buys",
            text: "She thinks NVIDIA is about to have a very good quarter. She could buy NVIDIA and wait, " +
              "but she wants more exposure than her $1,000 buys.",
          },
          {
            tone: "lavender", icon: "tpl:perps-price-falls", who: "Bob",
            name: "Wants to profit if it [falls]",
            text: "He thinks NVIDIA's run is over, and wants to profit if it falls, which owning the stock " +
              "cannot give him.",
          },
        ],
      },
      {
        type: "split",
        heading: "A [perpetual future] gives both what they want",
        sub: "A contract that pays the movement of a price, without anyone holding the asset",
        cards: [
          { icon: "tpl:price-rises", name: "Alice goes long", text: "She profits as the price rises, and loses as it falls" },
          { icon: "tpl:perps-price-falls", name: "Bob goes short", text: "He profits as the price falls, and loses as it rises" },
          { icon: "tpl:perps-no-expiry", name: "It never expires", text: "Unlike a traditional future, a position stays open until its owner closes it" },
        ],
      },
      {
        type: "grid",
        tone: "lavender",
        heading: "The [terms] of a position",
        sub: "Every position names these",
        cards: [
          { icon: "tpl:perps-collateral", name: "Collateral", text: "What the trader puts up, and can lose: Alice's $1,000" },
          { icon: "tpl:perps-size", name: "Size", text: "The exposure the position controls: $5,000 of NVIDIA" },
          { icon: "tpl:perps-leverage", name: "Leverage", text: "Size divided by collateral: 5x, so a 1% move moves her stake 5%" },
        ],
      },
      {
        type: "chart",
        heading: "Five times the gain, and five times the [loss]",
        sub: "Alice's profit at each NVIDIA price, with her 5x long and with $1,000 of the stock",
        x: [90, 120], xStep: 5,
        y: [-500, 1000], yStep: 500,
        xLabel: "NVIDIA's price",
        yLabel: "Profit ($)",
        marks: [{ at: 100, label: "TODAY $100" }],
        series: [
          // Both lines follow from the chapter by arithmetic: the long's profit is size × price change ÷
          // entry price (5,000 × (p − 100) ÷ 100, so +1,000 at $120 as the chapter states), and $1,000 of
          // the stock at the chapter's $100 entry is ten shares, the chapter's "buy NVDAx and wait".
          { tone: "green", label: "Alice's 5x long", points: [[90, -500], [120, 1000]], labelAt: [91, 380] },
          { tone: "purple", label: "Owning $1,000 of NVIDIA", points: [[90, -100], [120, 200]], labelAt: [111, -140] },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, Alice, the venue, the LPs, and both positions opening.
      { type: "diagram", from: 0, to: 15 },
      {
        type: "numbered",
        heading: "A perpetual never expires, so traders pay [funding]",
        sub: "To keep the numbers clean, this walkthrough's pool sets the funding rate to zero",
        cards: [
          { name: "The heavier side pays", text: "The side with more open interest pays a fee for every second it stays open" },
          { name: "The pool is the other side", text: "It takes the heavier side's payment, and pays the lighter side at the same rate" },
          { name: "One index for every position", text: "Each position remembers the index when it opened, so settling it reads one account" },
        ],
      },
      // The rally, and Bob's liquidation.
      { type: "diagram", from: 16, to: 21 },
      {
        type: "grid",
        columns: 4,
        heading: "Where a loss too big to pay [goes]",
        sub: "Decided in advance, in this order",
        cards: [
          { icon: "tpl:perps-liquidation", name: "Liquidation", text: "Takes it from the loser, while collateral remains" },
          { icon: "tpl:insurance", name: "Insurance fund", text: "Takes it from a pot filled from half of every fee" },
          { icon: "tpl:perps-pool", name: "The LPs", text: "Take what the insurance fund can't" },
          { icon: "tpl:perps-haircut", name: "A haircut", text: "Pays every winner the same fraction of their profit when the pool can't pay in full" },
        ],
      },
      // Alice closes, and Maria collects.
      { type: "diagram", from: 22, to: 25 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:price-rises", name: "Alice", text: "Turned 1,000 USDC into 1,990 by being right with leverage" },
          { tone: "lavender", icon: "tpl:perps-price-falls", name: "Bob", text: "Turned 1,000 USDC into 195 by being wrong, and slow" },
          { tone: "mint", icon: "tpl:perps-liquidation", name: "Dave", text: "Collected 50 USDC for one well-timed transaction" },
          { tone: "white", icon: "tpl:perps-pool", name: "Carol", text: "Owns a twelfth of a pool that took Bob's 750 and paid Alice's 1,000: down about 21 USDC" },
          { tone: "lavender", icon: "tpl:venue", name: "Maria", text: "Collected 7.50 USDC of fees, and could touch nothing else" },
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
