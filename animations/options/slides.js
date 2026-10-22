// The Options talk: the slides around the scene's diagram steps. Diagram
// runs name the scene steps they show, by index, and together they show every
// step once, in order.

(function () {
  window.OPTIONS_DECK = {
    series: "Quicknode Solana Finance",
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

      // Solana, the people, their accounts, and the deal they want.
      { type: "diagram", from: 0, to: 7 },
      {
        type: "cards",
        heading: "An option is a [right] on one side and an [obligation] on the other",
        cards: [
          { tone: "slab", icon: "wallet", name: "Alice writes the option", text: "She posts her five NVDAx up front, and names a price" },
          { tone: "lavender", icon: "wallet", name: "Bob pays the premium", text: "25 USDC now, for the right to buy at $180 this week" },
          { tone: "mint", icon: "token", name: "Bob decides", text: "Exercise if NVDAx passes $180, or let the option expire" },
        ],
      },

      // The venue opens, and the call is written, bought, exercised, and paid out.
      { type: "diagram", from: 8, to: 23 },
      {
        type: "cards",
        heading: "A [call] and a [put]",
        cards: [
          { tone: "slab", icon: "token", name: "A call", text: "The right to buy. The writer posts the shares" },
          { tone: "lavender", icon: "token", name: "A put", text: "The right to sell. The writer posts the strike, in USDC" },
          { tone: "mint", icon: "program", name: "Either way", text: "What the holder could claim is in the vault from the start: no margin, no oracle, no liquidator" },
        ],
      },

      // The put is written, bought, and expires; the fees are collected.
      { type: "diagram", from: 24, to: 37 },
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
