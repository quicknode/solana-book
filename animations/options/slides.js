// The Options talk: the slides around the scene's diagram steps. Diagram
// runs name the scene steps they show, by index, and together they show every
// step once, in order.

(function () {
  window.OPTIONS_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to build an", "[options venue]", "on Solana"] },
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
            sub: "From the Options chapter",
            items: [
              "How options work as a Solana program",
              "Why a venue that holds everything up front never has to chase anyone",
              "How a program records what it owes before it moves a token",
            ],
          },
        ],
      },

      // ---- Options trading, before any Solana: the deal, the terms, the endings.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:income", who: "Alice",
            name: "Wants to be paid for [waiting]",
            text: "She holds five NVDAx, a token that tracks a share of NVIDIA, trading at $165. " +
              "She would be happy to sell at $180, and she would like to be paid while she waits.",
          },
          {
            tone: "lavender", icon: "tpl:bargain", who: "Bob",
            name: "Wants to buy [below the market]",
            text: "He thinks NVIDIA will pass $180 within the week, and he wants that upside for less than " +
              "the $825 five shares would cost him.",
          },
        ],
      },
      {
        type: "split",
        heading: "An [option] gives both what they want",
        sub: "The right, but not the obligation, to trade at a price fixed today",
        cards: [
          { icon: "tpl:contract", name: "Bob pays Alice $25 now", text: "For the right to buy her five shares at $180, any time this week" },
          { icon: "tpl:price-rises", name: "If NVIDIA passes $180, Bob buys", text: "He pays $180 a share for shares the market prices higher, and Alice sells at the price she chose" },
          { icon: "tpl:expire", name: "If it doesn't, the option expires", text: "Bob loses the $25, and Alice keeps it as income on shares she still owns" },
        ],
      },
      {
        type: "grid",
        tone: "lavender",
        heading: "The [terms] of an option",
        sub: "Every option names these",
        cards: [
          { icon: "tpl:underlying", name: "Underlying", text: "The asset the option is about: NVIDIA shares" },
          { icon: "tpl:strike", name: "Strike", text: "The price the trade happens at: $180 a share" },
          { icon: "tpl:expiry", name: "Expiry", text: "When the right lapses: one week from now" },
          { icon: "tpl:premium", name: "Premium", text: "What the buyer pays for the right, once, up front: $25" },
          { icon: "tpl:writer", name: "Writer", text: "Creates the option, and must trade if the holder asks: Alice" },
          { icon: "tpl:holder", name: "Holder", text: "Buys the option, and may use the right it carries: Bob" },
        ],
      },
      {
        type: "numbered",
        heading: "A sold option has [two endings]",
        sub: "Where the price lands inside each ending decides how much each side made",
        cards: [
          { name: "The holder exercises", text: "Before expiry, Bob uses the right: he pays $900 and takes Alice's five shares" },
          { name: "The option expires", text: "Bob lets the right lapse. Alice keeps the $25 premium, and her shares" },
        ],
      },
      {
        type: "chart",
        heading: "The holder's loss is capped at the [premium]",
        sub: "Profit at expiry for each side of Alice and Bob's option. Bob profits past $185: the strike plus the premium",
        // The prices and results of the chapter's payoff figure: $160, $180,
        // $185 and $200, with +-25, +-25, 0 and -+75.
        x: [160, 200], xStep: 5,
        y: [-100, 100], yStep: 25,
        xLabel: "NVIDIA's price at expiry",
        yLabel: "Profit, five shares ($)",
        marks: [{ at: 165, label: "TODAY $165" }, { at: 180, label: "STRIKE $180" }],
        series: [
          { tone: "green", label: "Bob, the holder: loses at most $25", points: [[160, -25], [180, -25], [185, 0], [200, 75]], labelAt: [160.5, -45] },
          { tone: "purple", label: "Alice, the writer: earns at most $25", points: [[160, 25], [180, 25], [185, 0], [200, -75]], labelAt: [160.5, 40] },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, Alice, her accounts, and the deal she wants.
      { type: "diagram", from: 0, to: 6 },
      // The venue opens, and the call is written, bought, exercised, and paid out.
      { type: "diagram", from: 7, to: 7 },
      // "Call" is first needed here: the next step writes one.
      {
        type: "statement",
        heading: "Alice's option is a [call]",
        sub: "The right to buy the underlying at the strike, worth using when the price rises above it",
      },
      { type: "diagram", from: 8, to: 14 },
      {
        type: "statement",
        heading: "Outcome 1: NVDAx [moves] to $200, and Bob exercises",
      },
      { type: "diagram", from: 15, to: 18 },
      {
        type: "statement",
        heading: "Outcome 2: NVDAx [stays] at $165",
      },
      { type: "diagram", from: 19, to: 20 },
      {
        type: "statement",
        heading: "Back to Outcome 1: Alice [collects] the strike",
      },
      { type: "diagram", from: 21, to: 22 },
      {
        type: "statement",
        heading: "Now a [put]: the right to sell",
        sub: "Worth using when the price falls below the strike: insurance for an owner. " +
          "A put writer posts cash instead of shares, and the holder delivers the shares if they exercise",
      },

      // The put is written, bought, and expires; the fees are collected.
      { type: "diagram", from: 23, to: 29 },
      {
        type: "statement",
        heading: "Outcome 1: the put [expires] unused",
      },
      { type: "diagram", from: 30, to: 31 },
      {
        type: "statement",
        heading: "Outcome 2: NVDAx [falls] below $150",
      },
      { type: "diagram", from: 32, to: 33 },
      {
        type: "statement",
        heading: "Back to Outcome 1: Maria [collects] the fees",
      },
      { type: "diagram", from: 34, to: 35 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:premium", name: "Alice", text: "Earned a premium and sold her shares at her price" },
          { tone: "lavender", icon: "tpl:price-rises", name: "Bob", text: "Bought five NVDAx at $180 against a $200 market: $75 ahead after the premium" },
          { tone: "mint", icon: "tpl:expire", name: "Carol", text: "Was paid 19.80 USDC to wait for a purchase that never came" },
          { tone: "white", icon: "tpl:insurance", name: "Dave", text: "Paid 20 USDC for insurance he did not need" },
          { tone: "lavender", icon: "tpl:venue", name: "Maria the venue operator", text: "Earned 1% of every premium" },
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
