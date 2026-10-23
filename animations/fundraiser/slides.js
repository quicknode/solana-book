// The Fundraiser talk: the slides around the scene's diagram steps. Diagram
// runs name the scene steps they show, by index, and together they show every
// step once, in order. Each term is defined where the talk first needs it.

(function () {
  window.FUNDRAISER_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to build an", "[all-or-nothing fundraiser]", "on Solana"] },
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
            sub: "From the Fundraiser chapter",
            items: [
              "How a program holds many people's money until one shared condition is met",
              "Why a program trusts its own count, never a balance anyone can top up",
              "How every backer gets back exactly what they put in",
            ],
          },
        ],
      },

      // ---- What people want, and how a fundraiser gives it to them, before any Solana.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:fundraiser-maker", who: "Maria",
            name: "Needs [9,000] dollars, or nothing",
            text: "She has designed an espresso machine, and the factory quotes $9,000 to cut the mold for the first run. " +
              "$6,000 buys not two-thirds of a run, but nothing at all.",
          },
          {
            tone: "lavender", icon: "tpl:fundraiser-backer", who: "Alice",
            name: "Wants the machine, not the [risk]",
            text: "She'd put in $1,000 to see the machine made. But if Maria can't raise enough to build it, " +
              "she wants every dollar back.",
          },
        ],
      },
      {
        type: "split",
        heading: "An [all-or-nothing fundraiser] gives both what they want",
        sub: "The promise Kickstarter makes, kept by code instead of a company",
        cards: [
          { icon: "tpl:fundraiser-target", name: "Maria names a target", text: "and a deadline. Backers contribute until then" },
          { icon: "tpl:fundraiser-claim", name: "If the target is met, Maria gets it all", text: "every contribution, in one payment" },
          { icon: "tpl:fundraiser-refund", name: "If it's missed, everyone is refunded", text: "each backer gets back exactly what they put in" },
        ],
      },
      {
        type: "grid",
        tone: "lavender",
        columns: 4,
        heading: "The [terms] of a fundraiser",
        sub: "Every fundraiser names these",
        cards: [
          { icon: "tpl:fundraiser-maker", name: "Maker", text: "Starts the fundraiser and is paid if it succeeds: Maria" },
          { icon: "tpl:fundraiser-target", name: "Target", text: "The amount that must be raised: $9,000" },
          { icon: "tpl:fundraiser-deadline", name: "Deadline", text: "When contributions close: 7 days after the start" },
          { icon: "tpl:fundraiser-backer", name: "Backers", text: "Everyone who contributes: Alice, Bob, Carol and more" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, Alice, the raise opening, and the first backers.
      { type: "diagram", from: 0, to: 12 },
      {
        type: "statement",
        heading: "First ending: the target is [met]",
        sub: "Eight more backers come, and the counter reaches 9,000",
      },
      { type: "diagram", from: 13, to: 17 },
      {
        type: "statement",
        heading: "Second ending: the target is [missed]",
        sub: "The same raise, but only Dave comes after Carol",
      },
      { type: "diagram", from: 18, to: 23 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:fundraiser-maker", name: "Maria the maker", text: "Met: 9,000 USDC for the mold. Missed: nothing, and free to try again" },
          { tone: "lavender", icon: "tpl:fundraiser-backer", name: "Alice, Bob and Carol", text: "Met: their machine gets made. Missed: every dollar back" },
          { tone: "mint", icon: "tpl:fundraiser-receipt", name: "Their receipts", text: "Closed either way, their rent back to each backer" },
          { tone: "white", icon: "tpl:fundraiser-refund", name: "Dave", text: "Refunded 800 USDC without coming back: Maria sent it for him" },
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
