// The Managed Fund talk: the slides around the scene's diagram steps. Diagram
// runs name the scene steps they show, by index, and together they show every
// step once, in order. Each term is defined where the talk first needs it.

(function () {
  window.FUND_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to make an", "[investment fund]", "on Solana"] },
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
            sub: "From the Managed Fund chapter",
            items: [
              "How an investment fund works as a Solana program",
              "Why the manager can trade the fund's assets, but never take them",
              "How shares price every investor fairly, early or late",
            ],
          },
        ],
      },

      // ---- What people want, and how a fund gives it to them, before any Solana.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:savings", who: "Alice",
            name: "Wants her savings [invested]",
            text: "She has $900 for the stock market, but not the time or the expertise to pick stocks. " +
              "She'd pay someone to do it, as long as they can't walk off with her money.",
          },
          {
            tone: "lavender", icon: "tpl:expertise", who: "Maria",
            name: "Wants to be paid for her [expertise]",
            text: "She's good at picking stocks, and wants to earn a fee for managing other people's money.",
          },
        ],
      },
      {
        type: "numbered",
        heading: "A [managed fund] gives both what they want",
        sub: "The same idea as a mutual fund",
        cards: [
          { name: "Investors put money in", text: "and receive shares: each investor's slice of everything the fund holds" },
          { name: "The manager picks the assets", text: "and how much of the fund goes to each, its weight. The fund buys them" },
          { name: "The manager earns a fee", text: "a small slice of the fund each year, whatever the market does" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, Alice, the curator, the fund, and Alice's deposit.
      { type: "diagram", from: 0, to: 16 },
      {
        type: "allocation",
        heading: "The fund holds its [target weights]",
        sub: "Alice's 900 USDC, deployed at 40/60 on deposit",
        parts: [
          { tone: "mint", name: "TSLAx", text: "1.44 TSLAx at $250: $360", value: 360 },
          { tone: "lavender", name: "NVDAx", text: "3 NVDAx at $180: $540", value: 540 },
        ],
      },
      // The market moves.
      { type: "diagram", from: 17, to: 17 },
      {
        type: "allocation",
        decimals: 1,
        heading: "NVIDIA rallies, and the weights [drift]",
        sub: "Nothing traded, but NVDAx is now worth more than its 60% share",
        parts: [
          { tone: "mint", name: "TSLAx", text: "1.44 TSLAx at $250: $360", value: 360, from: 360 },
          { tone: "lavender", name: "NVDAx", fromText: "3 NVDAx at $180: $540", text: "3 NVDAx at $200: $600", value: 600, from: 540 },
        ],
      },
      // The rebalance.
      { type: "diagram", from: 18, to: 22 },
      {
        type: "allocation",
        heading: "Back to [40/60]",
        sub: "The rebalance sold $24 of NVDAx and bought $24 of TSLAx",
        parts: [
          { tone: "mint", name: "TSLAx", fromText: "1.44 TSLAx at $250: $360", text: "1.536 TSLAx at $250: $384", value: 384, from: 360 },
          { tone: "lavender", name: "NVDAx", fromText: "3 NVDAx at $200: $600", text: "2.88 NVDAx at $200: $576", value: 576, from: 600 },
        ],
      },
      // Bob, and the fee.
      { type: "diagram", from: 23, to: 27 },
      {
        type: "allocation",
        decimals: 1,
        heading: "Maria is paid by [dilution]",
        sub: "Who owns the fund's 1,363.5 shares, after 13.5 new shares were minted to Maria",
        parts: [
          { tone: "mint", name: "Alice", text: "900 shares", value: 900 },
          { tone: "lavender", name: "Bob", text: "450 shares", value: 450 },
          { tone: "white", name: "Maria", text: "13.5 shares", value: 13.5, callout: true },
        ],
      },
      // Alice withdraws.
      { type: "diagram", from: 28, to: 31 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:savings", name: "Alice", text: "Came in with $900, rode NVIDIA up, paid Maria by dilution, and left with about $950 of TSLAx and NVDAx" },
          { tone: "lavender", icon: "tpl:later", name: "Bob", text: "Still holds his 450 shares, unrealized" },
          { tone: "mint", icon: "tpl:expertise", name: "Maria the manager", text: "Holds 13.5 shares, about $14, for managing the fund" },
          { tone: "white", icon: "tpl:vetting", name: "Victor the curator", text: "Took no fee: his business is a platform whose funds don't fail" },
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
