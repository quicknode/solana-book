// The Betting Market talk: the slides around the scene's diagram steps.
// Diagram runs name the scene steps they show, by index, and together they
// show every step once, in order. Each term is defined where the talk first
// needs it.

(function () {
  window.BETTING_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to build a", "[betting market]", "on Solana"] },
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
            sub: "From the Betting Market chapter",
            items: [
              "How a betting market works as a Solana program, with no bookmaker",
              "How a program learns a fact from the real world, and what that costs in trust",
              "How closing accounts stops anyone being paid twice",
            ],
          },
        ],
      },

      // ---- What people want, and how a betting pool gives it to them.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:betting-backs", who: "Alice",
            name: "Thinks [Glowbugs 3] will win",
            text: "She's sure it will be this month's top-grossing film, and wants to put $300 on it.",
          },
          {
            tone: "lavender", icon: "tpl:betting-against", who: "Carol",
            name: "Thinks it [won't]",
            text: "She's betting on The Quiet Floor instead, and would happily take the other side of Alice's bet.",
          },
        ],
      },
      {
        type: "split",
        heading: "Two ways to [bet] on it",
        sub: "Both let Alice and Carol put money on their view",
        cards: [
          { icon: "tpl:betting-house", name: "With a bookmaker", text: "A house sets the odds, the payout for each dollar staked, and takes the other side of every bet, carrying the risk itself" },
          { icon: "tpl:betting-pool", name: "Without one: a parimutuel pool", text: "Every stake goes into one pool. When the result is known, the winners share the losers' stakes" },
          { icon: "tpl:betting-fee", name: "The house takes a fee", text: "instead of a side: here 2%, and only out of the losing stakes" },
        ],
      },
      {
        type: "grid",
        tone: "lavender",
        heading: "The words of a [parimutuel] market",
        sub: "Devised in Paris in 1867, and still how racetrack pools work",
        cards: [
          { icon: "tpl:betting-film", name: "Event", text: "The question being bet on: this month's top-grossing film" },
          { icon: "tpl:betting-stake", name: "Stake", text: "What a bettor puts in on one outcome" },
          { icon: "tpl:betting-odds", name: "Odds", text: "Set by the pools when betting closes, not when you bet, so they move as people bet" },
          { icon: "tpl:betting-won", name: "Winnings", text: "Proportional to stake: bet three times as much, win three times as much" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, Alice, Maria's market, and the three bets.
      { type: "diagram", from: 0, to: 13 },
      {
        type: "allocation",
        heading: "The pool when betting [closes]",
        sub: "600 USDC in one vault. Whoever wins, the losing side's stakes pay the winners",
        parts: [
          { tone: "mint", name: "Glowbugs 3", text: "Alice 300 + Bob 100 = 400 USDC", value: 400 },
          { tone: "lavender", name: "The Quiet Floor", text: "Carol 200 USDC", value: 200 },
        ],
      },
      // The cancelled future, then settlement.
      { type: "diagram", from: 14, to: 18 },
      {
        type: "allocation",
        decimals: 1,
        // Hold the stakes long enough to read before the losing side pays out.
        delay: 2200,
        heading: "Glowbugs 3 wins: the losing stake pays the [winners]",
        sub: "From each bettor's stake to each bettor's payout. Carol's 200 goes to Alice and Bob in proportion to their stakes, less Maria's 4 USDC fee",
        parts: [
          { tone: "mint", name: "Alice", fromText: "staked 300 USDC", text: "447 USDC: her 300, plus 147", from: 300, value: 447 },
          { tone: "lavender", name: "Bob", fromText: "staked 100 USDC", text: "149 USDC: his 100, plus 49", from: 100, value: 149 },
          { tone: "white", name: "Carol", fromText: "staked 200 USDC", text: "lost her stake", from: 200, value: 0 },
          { tone: "white", name: "Maria", text: "4 USDC fee", from: 0, value: 4, callout: true },
        ],
      },
      // The claims, and closing the market.
      { type: "diagram", from: 19, to: 23 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:betting-won", name: "Alice", text: "Won 147 USDC on her 300: three times Bob's winnings, for three times his stake" },
          { tone: "lavender", icon: "tpl:betting-won", name: "Bob", text: "Won 49 USDC on his 100, paid at the same final odds as Alice" },
          { tone: "mint", icon: "tpl:betting-against", name: "Carol", text: "Lost her 200 USDC to the winners, and got her account's rent back" },
          { tone: "white", icon: "tpl:betting-fee", name: "Maria the admin", text: "Earned 4 USDC, 2% of the losing pool, and never took a side" },
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
