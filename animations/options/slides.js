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
              "How calls and puts work as a Solana program",
              "Why fully collateralized options need no margin, no oracle and no liquidator",
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
            tone: "mint", icon: "tpl:premium", who: "Alice",
            name: "Wants to be paid for [waiting]",
            text: "She owns five NVIDIA shares at $165, and doesn't expect the price to move much this week. " +
              "She'd like money now for promising to sell them at $180: a promise she expects nobody to take up, " +
              "and one she'd be happy to keep if they did.",
          },
          {
            tone: "lavender", icon: "tpl:call", who: "Bob",
            name: "Wants to buy [below the market]",
            text: "He thinks NVIDIA will pass $180 this week. He wants the chance to buy at $180 when it does, " +
              "without spending $825 on five shares today, or losing more than a little if he's wrong.",
          },
        ],
      },
      {
        type: "split",
        heading: "An [option] gives both what they want",
        sub: "The right, but not the obligation, to trade at a price fixed today",
        cards: [
          { icon: "tpl:contract", name: "Bob pays Alice $25 now", text: "For the right to buy her five shares at $180, any time this week" },
          { icon: "tpl:call", name: "If NVIDIA passes $180, Bob buys", text: "He pays $180 a share for shares the market prices higher, and Alice sells at the price she chose" },
          { icon: "tpl:expire", name: "If it doesn't, the option expires", text: "Bob is out $25, and Alice keeps the $25 and her shares: paid for waiting" },
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
        type: "grid",
        tone: "mint",
        columns: 2,
        heading: "A [call] and a [put]",
        sub: "The two kinds of option",
        cards: [
          { icon: "tpl:call", name: "Call", text: "The right to buy at the strike. Worth using when the price rises above it" },
          { icon: "tpl:put", name: "Put", text: "The right to sell at the strike. Worth using when the price falls below it: insurance for an owner" },
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
        sub: "Profit at expiry for each side of the call. Bob profits past $185: the strike plus the premium",
        x: [140, 210], xStep: 10,
        y: [-150, 150], yStep: 50,
        xLabel: "NVIDIA's price at expiry",
        yLabel: "Profit, five shares ($)",
        marks: [{ at: 165, label: "TODAY $165" }, { at: 180, label: "STRIKE $180" }],
        series: [
          { tone: "green", label: "Bob, the holder: loses at most $25", points: [[140, -25], [180, -25], [210, 125]], labelAt: [141, -50] },
          { tone: "purple", label: "Alice, the writer: earns at most $25", points: [[140, 25], [180, 25], [210, -125]], labelAt: [141, 40] },
        ],
      },
      {
        type: "grid",
        columns: 4,
        heading: "More [words] traders use",
        cards: [
          { icon: "tpl:american", name: "American", text: "May be exercised at any moment before expiry. This venue's options are American" },
          { icon: "tpl:european", name: "European", text: "May be exercised only at expiry. The names are historical, not geographic" },
          { icon: "tpl:in-the-money", name: "In the money", text: "Worth exercising: for a call, the price is above the strike" },
          { icon: "tpl:out-of-the-money", name: "Out of the money", text: "Not worth exercising, so the holder lets it expire" },
        ],
      },
      {
        type: "split",
        tone: "dark",
        heading: "How the trade [settles]",
        sub: "What changes hands when the holder exercises",
        cards: [
          { icon: "tpl:physical", name: "Physical settlement", text: "The asset itself changes hands at the strike, and no price is read. This venue settles physically" },
          { icon: "tpl:cash", name: "Cash settlement", text: "Pays the holder the difference between the price and the strike. Needs a price feed, and a defense against its manipulation" },
          { icon: "tpl:collateral", name: "Fully collateralized", text: "The writer posts the whole obligation up front, so this venue needs no margin, no oracle and no liquidator" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every instruction, and every token that moves",
      },

      // Solana, Alice, her accounts, and the deal she wants.
      { type: "diagram", from: 0, to: 6 },
      // The venue opens, and the call is written, bought, exercised, and paid out.
      { type: "diagram", from: 7, to: 22 },
      {
        type: "statement",
        heading: "Now a [put]: the right to sell",
        sub: "A put writer posts cash instead of shares, and the holder delivers the shares if they exercise",
      },

      // The put is written, bought, and expires; the fees are collected.
      { type: "diagram", from: 23, to: 35 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "wallet", name: "Alice", text: "Earned a premium and sold her shares at her price" },
          { tone: "lavender", icon: "wallet", name: "Bob", text: "Bought five NVDAx at $180 against a $200 market: $75 ahead after the premium" },
          { tone: "mint", icon: "wallet", name: "Carol", text: "Was paid 19.80 USDC to wait for a purchase that never came" },
          { tone: "white", icon: "wallet", name: "Dave", text: "Paid 20 USDC for insurance he did not need" },
          { tone: "lavender", icon: "mint", name: "Maria the venue operator", text: "Earned 1% of every premium" },
        ],
      },

      {
        type: "qr",
        heading: "Working [examples] of every kind of Solana program",
        url: "github.com/quicknode/solana-program-examples",
        qr: "../assets/qr-program-examples.svg",
        items: [
          "Working, up-to-date examples for every type of Solana program, in current Anchor",
          "Emphasis on [financial software]",
          "Please ⭐ it if you find it useful",
        ],
      },
      {
        type: "qr",
        heading: "[AI skill] for generating financial software",
        url: "github.com/quicknode/solana-finance-claude-plugin",
        qr: "../assets/qr-finance-plugin.svg",
        items: ["Building mathematically correct financial products on Solana", "Please ⭐ it if you find it useful"],
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
