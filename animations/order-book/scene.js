// The Order Book Exchange chapter as an animated scene: Maria opens an
// NVDAx/USDC market, Alice rests an ask, Bob rests a bid below it, Carol's
// ask crosses and fills against Bob's bid, Bob cancels the rest, Bob and
// Carol settle, Maria withdraws the fee, and the finished accounts close.
//
// The columns are the chapter figures' accounts spread across a 16:9 screen.
// The order book is created from a key pair, so its dot sits on the curve.
// Arrows run down the lanes between columns and along a corridor beneath
// them, one transfer on screen at a time. The steps follow the handlers in
// quicknode/solana-program-examples finance/order-book: place_order() takes
// the order's tokens before it matches, credits unsettled balances for each
// fill, moves the fee in one transfer at the end, and rests the remainder.

(function () {
  const WIDTH = 1120;
  const HEIGHT = 630;
  const curve = AccountAnimation.clusterCurve(WIDTH, { top: 62, drop: 60, control: 700 / WIDTH });
  const rounded = AccountAnimation.rounded;

  // A public-key account hugs its dot: the dot sits on the curve over the
  // box's right edge, and the box top 9.3 below it.
  function onCurve(kind, title, x, w) {
    const cx = x + w - 8;
    const cy = curve.yAt(cx);
    return { kind, title, x, w, y: cy + 9.3, dot: { cx, cy }, onCurve: true };
  }

  // A derived account hangs at a given top, its dot and seed list above it.
  function derived(kind, title, x, y, w, seeds) {
    const three = seeds.length === 3;
    return {
      kind, title, x, y, w,
      dot: { cx: x + 8, cy: y - (three ? 18.5 : 14) },
      seeds: { x: x + 18, y: y - (three ? 24 : 15), lines: seeds },
    };
  }

  const tall = (lines) => 21 + lines * 12 + 7;
  const GAP2 = 28.6;
  const GAP3 = 37;

  // Columns, left to right, with a lane after each person's for arrows.
  const COLUMN = {
    maria: [10, 120],
    alice: [146, 148],
    bob: [312, 148],
    carol: [478, 148],
    book: [652, 196],
    program: [872, 236],
  };

  const ata = (owner, token, x, y, w) =>
    derived("token", `${owner}'s ${token}`, x, y, w, [`${owner.toUpperCase()}'S ADDRESS +`, "TOKEN PROGRAM +", `${token.toUpperCase()} MINT`]);
  const marketUser = (owner, x, y, w) =>
    derived("struct", `${owner}'s market user`, x, y, w, ['"MARKET_USER" +', "MARKET ADDRESS +", `${owner.toUpperCase()}'S ADDRESS`]);
  // The seed is the order book's next_order_id when the order is placed: 1, 2 and 3.
  const order = (owner, id, x, y, w) => derived("struct", `${owner}'s order`, x, y, w, ['"ORDER" +', "MARKET ADDRESS +", `ORDER ID ${id}`]);

  // Each person's column: wallet, token accounts, market user, order.
  const maria = onCurve("wallet", "Maria", ...COLUMN.maria);
  const alice = onCurve("wallet", "Alice", ...COLUMN.alice);
  const bob = onCurve("wallet", "Bob", ...COLUMN.bob);
  const carol = onCurve("wallet", "Carol", ...COLUMN.carol);
  const below = (y, h) => y + h + GAP3;

  const aliceNvdax = ata("Alice", "NVDAx", COLUMN.alice[0], below(alice.y, 40), COLUMN.alice[1]);
  const aliceUser = marketUser("Alice", COLUMN.alice[0], below(aliceNvdax.y, 40), COLUMN.alice[1]);
  const aliceOrder = order("Alice", 1, COLUMN.alice[0], below(aliceUser.y, tall(3)), COLUMN.alice[1]);

  const bobUsdc = ata("Bob", "USDC", COLUMN.bob[0], below(bob.y, 40), COLUMN.bob[1]);
  const bobNvdax = ata("Bob", "NVDAx", COLUMN.bob[0], below(bobUsdc.y, 40), COLUMN.bob[1]);
  const bobUser = marketUser("Bob", COLUMN.bob[0], below(bobNvdax.y, 40), COLUMN.bob[1]);
  const bobOrder = order("Bob", 2, COLUMN.bob[0], below(bobUser.y, tall(3)), COLUMN.bob[1]);

  const carolNvdax = ata("Carol", "NVDAx", COLUMN.carol[0], below(carol.y, 40), COLUMN.carol[1]);
  const carolUsdc = ata("Carol", "USDC", COLUMN.carol[0], below(carolNvdax.y, 40), COLUMN.carol[1]);
  const carolUser = marketUser("Carol", COLUMN.carol[0], below(carolUsdc.y, 40), COLUMN.carol[1]);
  const carolOrder = order("Carol", 3, COLUMN.carol[0], below(carolUser.y, tall(3)), COLUMN.carol[1]);

  const mariaUsdc = ata("Maria", "USDC", COLUMN.maria[0], below(maria.y, 40), COLUMN.maria[1]);

  // The order book: a public key, created from a key pair by Maria's client.
  const orderBook = onCurve("struct", "order book", ...COLUMN.book);

  // The program, the market and its three vaults.
  const program = onCurve("program", "order-book program", ...COLUMN.program);
  const P = COLUMN.program;
  const market = derived("struct", "market", P[0], program.y + 130 + GAP2, P[1], ['"MARKET" + NVDAX MINT +', "USDC MINT ADDRESS"]);
  const baseVault = derived("token", "base vault", P[0], market.y + tall(5) + GAP2, P[1], ['"BASE_VAULT" +', "MARKET ADDRESS"]);
  const quoteVault = derived("token", "quote vault", P[0], baseVault.y + tall(2) + GAP2, P[1], ['"QUOTE_VAULT" +', "MARKET ADDRESS"]);
  const feeVault = derived("token", "fee vault", P[0], quoteVault.y + tall(2) + GAP2, P[1], ['"FEE_VAULT" +', "MARKET ADDRESS"]);

  const accounts = {
    maria, mariaUsdc,
    alice, aliceNvdax, aliceUser, aliceOrder,
    bob, bobUsdc, bobNvdax, bobUser, bobOrder,
    carol, carolNvdax, carolUsdc, carolUser, carolOrder,
    orderBook,
    program, market, baseVault, quoteVault, feeVault,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------
  // Lanes run down the gap after each person's column; the corridor runs
  // beneath every column; the vault lane runs down beside the program column.

  const LANE = { maria: 137, alice: 303, bob: 469, carol: 639, vaults: 860, fees: 856 };
  const CORRIDOR = 518;
  const right = (acc, dy = 20) => [acc.x + acc.w + 2, acc.y + dy];
  const left = (acc, dy = 26) => [acc.x - 2, acc.y + dy];

  function intoVault(from, lane, to) {
    const [sx, sy] = right(from);
    const [ex, ey] = left(to);
    return rounded([[sx, sy], [lane, sy], [lane, CORRIDOR], [LANE.vaults, CORRIDOR], [LANE.vaults, ey], [ex, ey]]);
  }

  function outOfVault(from, lane, to) {
    const [sx, sy] = left(from);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [LANE.vaults, sy], [LANE.vaults, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]]);
  }

  const feeLoop = (() => {
    const [sx, sy] = left(quoteVault, 20);
    const [ex, ey] = left(feeVault, 26);
    return rounded([[sx, sy], [LANE.fees, sy], [LANE.fees, ey], [ex, ey]]);
  })();

  // Coins on the corridor sit beneath the order book's column, which is
  // empty below the book, with their labels above them.
  const onCorridor = { x: 750, y: CORRIDOR };
  const above = { dx: 0, dy: -10, anchor: "middle" };
  const above2 = { dx: 0, dy: -23, anchor: "middle" };
  const leftOf = { dx: -14, dy: 4, anchor: "end" };

  const transfer = (from, fromValue, to, toValue, arrow) => ({
    type: "transfer",
    alone: true,
    from: { id: from, value: fromValue },
    to: { id: to, value: toValue },
    arrow,
  });

  // ---- Lines ---------------------------------------------------------------

  const sol = (text) => ({ text, style: "sol" });
  const balance = (text) => ({ text, style: "balance" });
  const field = (text) => ({ text });
  const note = (text) => ({ text, style: "note" });
  const vault = (amount) => [balance(amount), note("authority: the market")];
  const userLines = () => [field("unsettled_base: 0"), field("unsettled_quote: 0"), field("open_orders: [ ]")];
  const orderLines = (side, price, quantity) => [
    field(`side: ${side}`),
    field(`price: ${price}`),
    field(`original_quantity: ${quantity}`),
    field("filled_quantity: 0"),
    field("status: Open"),
  ];

  const HANDLERS = [
    "initialize_market()",
    "initialize_market_user()",
    "place_order()",
    "cancel_order()",
    "settle_funds()",
    "close_order()",
    "close_market_user()",
    "withdraw_fees()",
    "pause_market()",
    "resume_market()",
  ];

  // ---- Steps ---------------------------------------------------------------

  const steps = [
    // ---- The opening, for an audience new to Solana.
    {
      title: "This is [Solana Devnet]",
      // One idea a line: a caption keeps its line breaks.
      caption:
        "It is a global computer\nFinancial products are programs that run on this computer\n" +
        "All data is stored in accounts\nEach account has an address\n" +
        "Some addresses are public keys, others are made from ‘seeds’ chosen by programmers",
      actions: [],
    },
    {
      title: "Meet [Alice]",
      caption:
        "Each rounded box is an account. Alice's sits at her address, the dot on the curve, and holds " +
        "1 SOL: Solana's own currency, which pays for her transactions.",
      actions: [{ type: "show", ids: ["alice"], lines: { alice: [sol("1 SOL")] }, focus: "all" }],
    },
    {
      title: "Alice owns ten shares of [NVIDIA]",
      caption:
        "NVDAx is a token that tracks one share of NVIDIA stock. Alice keeps hers in a token account, whose address " +
        "is worked out from the three names above it. Every kind of token is defined by a mint, one of those names.",
      actions: [{ type: "show", ids: ["aliceNvdax"], lines: { aliceNvdax: [balance("10 NVDAx")] }, focus: "all" }],
    },
    {
      title: "Alice wants to [sell]",
      caption:
        "Alice wants to post an ask: sell her ten NVDAx at $265 or more. Nobody is bidding that yet, " +
        "so her order has to wait on a book until somebody is.",
      actions: [{ type: "focus", ids: ["alice", "aliceNvdax"] }],
    },
    {
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one runs an exchange, and each line is an instruction " +
        "handler anyone can call by sending a transaction. First, somebody has to open a market.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },

    // ---- The market opens
    {
      title: "Maria runs [initialize_market()]",
      caption:
        "Maria runs the exchange for a 0.25% fee on every trade, 25 basis points. The order book is too big for a " +
        "program to create, so her client makes it from a key pair: its address is a public key, on the curve.",
      actions: [
        { type: "show", ids: ["maria"], lines: { maria: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_market()", focus: ["maria", "program"] },
        { type: "set", changes: [{ id: "maria", title: "Maria (authority)" }] },
        { type: "create", id: "orderBook", lines: [field("next_order_id: 1"), field("bids_root: empty"), field("asks_root: empty")] },
        {
          type: "create", id: "market",
          lines: [
            field("authority: Maria"),
            field("base_mint: NVDAx"),
            field("quote_mint: USDC"),
            field("fee_basis_points: 25"),
            field("is_active: true"),
          ],
        },
      ],
    },
    {
      title: "The market gets three [vaults]",
      caption:
        "Vaults are token accounts the program controls: NVDAx, the base token, waits in the base vault, and USDC, " +
        "the quote token prices are stated in, in the quote vault. Maria's fees get a vault of their own.",
      actions: [
        { type: "create", id: "baseVault", lines: vault("0 NVDAx") },
        { type: "create", id: "quoteVault", lines: vault("0 USDC") },
        { type: "create", id: "feeVault", lines: vault("0 USDC") },
      ],
    },

    // ---- Alice's ask
    {
      title: "Alice runs [initialize_market_user()]",
      caption:
        "Her market user account will record what the exchange owes her, as unsettled balances, " +
        "and lists her open orders: at most 20.",
      actions: [
        { type: "call", handler: "initialize_market_user()", focus: ["alice", "program", "market"] },
        { type: "create", id: "aliceUser", lines: userLines() },
      ],
    },
    {
      title: "Alice runs [place_order()]",
      caption:
        "An ask: ten NVDAx at 265. The handler checks the market is open and the order is big enough, " +
        "and that Alice has fewer than 20 open orders. Each order gets an account of its own.",
      actions: [
        { type: "call", handler: "place_order()", focus: ["alice", "aliceNvdax", "aliceUser", "program", "market", "orderBook", "baseVault"] },
        { type: "set", changes: [{ id: "alice", title: "Alice (seller)" }] },
        { type: "create", id: "aliceOrder", lines: orderLines("Ask", 265, 10) },
      ],
    },
    {
      title: "Alice's 10 NVDAx move into the [base vault]",
      caption:
        "The tokens move before anything else happens, so every order on the book is backed by tokens in a vault. " +
        "An ask pays in shares; a bid would pay in USDC.",
      actions: [
        transfer("aliceNvdax", "0 NVDAx", "baseVault", "10 NVDAx", {
          id: "aliceAsk", d: intoVault(A.aliceNvdax, LANE.alice, baseVault),
          coinNear: onCorridor, label: ["place_order()", "10 NVDAx"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Alice's ask [rests] on the book",
      caption:
        "Nobody bids 265, so there is nothing to match. Her order waits in the order book's ask tree: a resting order. " +
        "Placing it cost her no exchange fee: fees only apply to trades.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "orderBook", key: "asks_root", value: "Alice's ask, 10 @ 265" },
            { id: "orderBook", key: "next_order_id", value: "2" },
            { id: "aliceUser", key: "open_orders", value: "[1]" },
          ],
        },
      ],
    },

    // ---- Bob's bid
    {
      title: "Bob runs [initialize_market_user()]",
      caption: "Bob wants to buy NVDAx, but won't pay more than $250. He has 1,000 USDC, and opens his market user account.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobUsdc"],
          lines: { bob: [sol("1 SOL")], bobUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "initialize_market_user()", focus: ["bob", "bobUsdc", "program", "market"] },
        { type: "create", id: "bobUser", lines: userLines() },
      ],
    },
    {
      title: "Bob runs [place_order()]",
      caption: "A bid: four NVDAx at 250. A bid pays in the quote token, price times quantity: 4 × 250 = 1,000 USDC.",
      actions: [
        { type: "call", handler: "place_order()", focus: ["bob", "bobUsdc", "bobUser", "program", "market", "orderBook", "quoteVault"] },
        { type: "set", changes: [{ id: "bob", title: "Bob (buyer)" }] },
        { type: "create", id: "bobOrder", lines: orderLines("Bid", 250, 4) },
      ],
    },
    {
      title: "Bob's 1,000 USDC move into the [quote vault]",
      caption: "Every dollar he has, committed the moment the order is placed.",
      actions: [
        transfer("bobUsdc", "0 USDC", "quoteVault", "1,000 USDC", {
          id: "bobBid", d: intoVault(A.bobUsdc, LANE.bob, quoteVault),
          coinNear: onCorridor, label: ["place_order()", "1,000 USDC"], labelAt: above2,
        }),
      ],
    },
    {
      key: "spread",
      title: "Bob's bid rests, and the book has a [spread]",
      caption:
        "Bob's 250 doesn't reach Alice's 265, so his bid waits in the bid tree. The book now shows bid 250, " +
        "ask 265: a $15 spread. None of it goes to Maria; her only revenue is the fee.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "orderBook", key: "bids_root", value: "Bob's bid, 4 @ 250" },
            { id: "orderBook", key: "next_order_id", value: "3" },
            { id: "bobUser", key: "open_orders", value: "[2]" },
          ],
        },
      ],
    },

    // ---- Carol's crossing ask
    {
      title: "Carol runs [initialize_market_user()]",
      caption: "Carol owns three NVDAx and wants out now, so she'll take whatever the best bid is, down to $245.",
      actions: [
        {
          type: "show",
          ids: ["carol", "carolNvdax", "carolUsdc"],
          lines: { carol: [sol("1 SOL")], carolNvdax: [balance("3 NVDAx")], carolUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "initialize_market_user()", focus: ["carol", "carolNvdax", "program", "market"] },
        { type: "create", id: "carolUser", lines: userLines() },
      ],
    },
    {
      title: "Carol runs [place_order()], and it crosses",
      caption:
        "An ask: three NVDAx at 245, at or below Bob's 250, so it crosses. The handler walks the bids best price first, " +
        "and checks that the accounts Carol passed for Bob's order match the ones it found.",
      actions: [
        { type: "call", handler: "place_order()", focus: ["carol", "carolNvdax", "carolUser", "bobUser", "bobOrder", "program", "market", "orderBook", "baseVault"] },
        { type: "set", changes: [{ id: "carol", title: "Carol (seller)" }] },
        { type: "create", id: "carolOrder", lines: orderLines("Ask", 245, 3) },
      ],
    },
    {
      title: "Carol's 3 NVDAx move into the [base vault]",
      caption: "Even an order that trades at once pays its tokens in first.",
      actions: [
        transfer("carolNvdax", "0 NVDAx", "baseVault", "13 NVDAx", {
          id: "carolAsk", d: intoVault(A.carolNvdax, LANE.carol, baseVault),
          coinNear: onCorridor, label: ["place_order()", "3 NVDAx"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Carol's ask [fills] Bob's bid at 250",
      caption:
        "Three shares at Bob's price, 750 USDC. Carol receives the USDC, so she pays the 1.875 fee: she's owed 748.125, " +
        "and Bob three shares. Unsettled balances are just numbers; tokens move when each settles.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "carolUser", key: "unsettled_quote", value: "748.125" },
            { id: "bobUser", key: "unsettled_base", value: "3" },
            { id: "bobOrder", key: "filled_quantity", value: "3" },
            { id: "bobOrder", key: "status", value: "PartiallyFilled" },
            { id: "orderBook", key: "bids_root", value: "Bob's bid, 1 @ 250" },
            { id: "orderBook", key: "next_order_id", value: "4" },
            { id: "carolOrder", key: "filled_quantity", value: "3" },
            { id: "carolOrder", key: "status", value: "Filled" },
          ],
        },
      ],
    },
    {
      key: "filled",
      title: "Maria's [fee] moves to the fee vault",
      caption:
        "The fees of every fill in the order move in one transfer at the end, so they never mix with what traders are owed. " +
        "Bob signed nothing for this fill: a maker signs once, when placing.",
      actions: [
        transfer("quoteVault", "998.125 USDC", "feeVault", "1.875 USDC", {
          id: "fee", d: feeLoop, coinNear: { x: LANE.fees, y: (quoteVault.y + feeVault.y) / 2 + 20 },
          label: ["1.875 USDC"], labelAt: leftOf,
        }),
      ],
    },

    // ---- Bob cancels
    {
      title: "Bob runs [cancel_order()]",
      caption:
        "Three shares is enough for Bob. His last share at 250 means 250 USDC of his is still in the quote vault, " +
        "so the exchange now owes it back to him. His order leaves the book, Cancelled.",
      actions: [
        { type: "call", handler: "cancel_order()", focus: ["bob", "bobUser", "bobOrder", "program", "market", "orderBook"] },
        {
          type: "set",
          changes: [
            { id: "bobUser", key: "unsettled_quote", value: "250" },
            { id: "bobUser", key: "open_orders", value: "[ ]" },
            { id: "orderBook", key: "bids_root", value: "empty" },
            { id: "bobOrder", key: "status", value: "Cancelled" },
          ],
        },
      ],
    },

    // ---- Settlement
    {
      title: "Bob runs [settle_funds()]",
      caption:
        "Settling turns his claims into tokens. The handler copies what he's owed and zeroes the counters first, " +
        "so calling it twice pays nothing. His NVDAx account receives the shares.",
      actions: [
        { type: "show", ids: ["bobNvdax"], lines: { bobNvdax: [balance("0 NVDAx")] }, focus: "shown" },
        { type: "call", handler: "settle_funds()", focus: ["bob", "bobUsdc", "bobNvdax", "bobUser", "program", "market", "baseVault", "quoteVault"] },
        {
          type: "set",
          changes: [
            { id: "bobUser", key: "unsettled_base", value: "0" },
            { id: "bobUser", key: "unsettled_quote", value: "0" },
          ],
        },
      ],
    },
    {
      title: "Bob receives 3 [NVDAx]",
      caption: "The market's PDA signs for the vault: only the program's own handlers can move these tokens.",
      actions: [
        transfer("baseVault", "10 NVDAx", "bobNvdax", "3 NVDAx", {
          id: "bobShares", d: outOfVault(baseVault, LANE.bob, A.bobNvdax),
          coinNear: onCorridor, label: ["settle_funds()", "3 NVDAx"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Bob's 250 USDC come [back]",
      caption: "Bob paid 750 USDC for three NVDAx, $250 a share, exactly his limit.",
      actions: [
        transfer("quoteVault", "748.125 USDC", "bobUsdc", "250 USDC", {
          id: "bobRefund", d: outOfVault(quoteVault, LANE.bob, A.bobUsdc),
          coinNear: onCorridor, label: ["250 USDC"], labelAt: above,
        }),
      ],
    },
    {
      title: "Carol runs [settle_funds()]",
      caption: "Her counter is copied and zeroed the same way.",
      actions: [
        { type: "call", handler: "settle_funds()", focus: ["carol", "carolUsdc", "carolUser", "program", "market", "quoteVault"] },
        { type: "set", changes: [{ id: "carolUser", key: "unsettled_quote", value: "0" }] },
      ],
    },
    {
      title: "Carol receives 748.125 [USDC]",
      caption: "She asked 245 a share and got Bob's 250: any difference always favours the taker. The quote vault is empty.",
      actions: [
        transfer("quoteVault", "0 USDC", "carolUsdc", "1,748.125 USDC", {
          id: "carolPaid", d: outOfVault(quoteVault, LANE.carol, A.carolUsdc),
          coinNear: onCorridor, label: ["settle_funds()", "748.125 USDC"], labelAt: above2,
        }),
      ],
    },

    // ---- Fees
    {
      title: "Maria runs [withdraw_fees()]",
      caption:
        "Only the market's authority may, and the whole fee vault goes to her token account. With nothing to withdraw " +
        "it succeeds and does nothing, so Maria can run it on a schedule.",
      actions: [
        { type: "show", ids: ["mariaUsdc"], lines: { mariaUsdc: [balance("1,000 USDC")] }, focus: "shown" },
        { type: "call", handler: "withdraw_fees()", focus: ["maria", "mariaUsdc", "program", "market", "feeVault"] },
        transfer("feeVault", "0 USDC", "mariaUsdc", "1,001.875 USDC", {
          id: "fees", d: outOfVault(feeVault, LANE.maria, A.mariaUsdc),
          coinNear: onCorridor, label: ["withdraw_fees()", "1.875 USDC"], labelAt: above2,
        }),
      ],
    },

    // ---- Closing
    {
      title: "Bob and Carol run [close_order()]",
      caption: "A Filled or Cancelled order holds nothing the book still needs, so its owner closes it and gets its rent back.",
      actions: [
        { type: "call", handler: "close_order()", focus: ["bob", "carol", "bobOrder", "carolOrder", "program"] },
        { type: "close", id: "bobOrder" },
        { type: "close", id: "carolOrder" },
      ],
    },
    {
      title: "Bob and Carol run [close_market_user()]",
      caption:
        "With no open orders and nothing owed, their market user accounts close too. Alice's ask still rests at 265, " +
        "so her accounts stay open, waiting for a buyer.",
      actions: [
        { type: "call", handler: "close_market_user()", focus: ["bob", "carol", "bobUser", "carolUser", "program", "aliceUser", "aliceOrder", "orderBook"] },
        { type: "close", id: "bobUser" },
        { type: "close", id: "carolUser" },
      ],
    },
  ];

  window.ORDERBOOK_SCENE = {
    title: "Order Book Exchange",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    caption: { x: 16, y: 536, w: 540, h: 94, fontSize: 13 },
    hold: 3000,
    program: "program",
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
