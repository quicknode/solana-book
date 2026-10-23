// The Escrow talk: the slides around the scene's diagram steps. Diagram runs
// name the scene steps they show, by index, and together they show every
// step once, in order. Each term is defined where the talk first needs it.

(function () {
  window.ESCROW_DECK = {
    series: "Quicknode Solana Finance",
    // Relative to the talk's index.html.
    assets: "../assets/",
    slides: [
      { type: "title", lines: ["How to build an", "[escrow]", "on Solana"] },
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
            sub: "From the Escrow chapter",
            items: [
              "How two strangers swap tokens without trusting each other",
              "How a program holds tokens that only its own code can move",
              "Why every open offer needs a way out",
            ],
          },
        ],
      },

      // ---- What people want, and how an escrow gives it to them, before any Solana.
      {
        type: "versus",
        cards: [
          {
            tone: "mint", icon: "tpl:escrow-buy", who: "Alice",
            name: "Wants a share of [Tesla]",
            text: "She has 1,000 USDC and will pay 250 for one share. But if she pays first, the seller could " +
              "keep her money and never send the share.",
          },
          {
            tone: "lavender", icon: "tpl:escrow-sell", who: "Bob",
            name: "Wants to [sell] his share",
            text: "He holds a Tesla share and likes Alice's price. But if he sends it first, she could keep it " +
              "and never pay.",
          },
        ],
      },
      {
        type: "split",
        heading: "The usual answer: a [middleman]",
        sub: "How traditional finance makes strangers trade",
        cards: [
          { icon: "tpl:escrow-middleman", name: "Both sides send to a third party", text: "A company they both trust holds Alice's money and Bob's share" },
          { icon: "tpl:escrow-swap", name: "It swaps them once both have arrived", text: "This holding is called escrow, and the company the escrow agent" },
          { icon: "tpl:escrow-fee", name: "And it takes a fee", text: "A cut of what it holds, for being trusted not to walk away with it" },
        ],
      },
      {
        type: "split",
        tone: "dark",
        heading: "A [program] can be the middleman",
        sub: "Code that both sides can read, and nobody can change",
        cards: [
          { icon: "tpl:escrow-vault", name: "It holds Alice's tokens", text: "In a vault that only the program's own code can move, not any person" },
          { icon: "tpl:escrow-atomic", name: "Bob's side and Alice's move together", text: "In one transaction: either both happen, or neither does" },
          { icon: "tpl:escrow-fee", name: "And it takes no fee", text: "Nobody runs it, so each side receives the whole of what the other offered" },
        ],
      },
      {
        type: "grid",
        tone: "lavender",
        heading: "The [roles] in an escrow",
        sub: "The program names them the same way",
        cards: [
          { icon: "tpl:escrow-maker", name: "Maker", text: "Creates the offer, and posts what they're offering up front: Alice" },
          { icon: "tpl:escrow-taker", name: "Taker", text: "Accepts the offer exactly as it stands: Bob" },
          { icon: "tpl:escrow-offer", name: "Offer", text: "What the maker gives, and what they want back: 250 USDC for 1 TSLAx" },
        ],
      },
      {
        type: "statement",
        heading: "Now let's build it on [Solana]",
        sub: "Every account, every handler, and every token that moves",
      },

      // Solana, Alice, her accounts, the offer, the cancel, and Bob's take.
      { type: "diagram", from: 0, to: 15 },
      {
        type: "cards",
        tone: "light",
        tag: "Where everyone ended up",
        cards: [
          { tone: "white", icon: "tpl:escrow-buy", name: "Alice", text: "Paid 250 USDC for her Tesla share, and got every lamport of rent back" },
          { tone: "lavender", icon: "tpl:escrow-sell", name: "Bob", text: "Sold his share for the full 250 USDC, without trusting Alice" },
          { tone: "mint", icon: "program", name: "The escrow program", text: "Took no fee: nobody runs it, and nobody can sign for its vaults" },
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
