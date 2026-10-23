// The Lending chapter as an animated scene, following the chapter's own
// story and numbers: Maria opens a market with USDC, NVDAx and SPCXx
// reserves; Alice supplies 1,000 USDC and four SPCXx; Bob pledges five NVDAx
// and borrows 750 USDC; Carol pledges 1,000 USDC and borrows three SPCXx to
// short SpaceX; SPCXx rallies from $250 to $300 and Dave liquidates Carol
// twice; then Bob repays with interest and takes his NVDAx back, Maria
// collects her fee, and Alice redeems her shares with their yield.
//
// Every number is one the chapter or its figures state, or a balance that
// follows by adding or subtracting them; those are marked where they appear.
// Like the chapter, the scene leaves out the interest on Carol's loan, and
// Maria's opening deposits of 1,001 minor units into each reserve.
//
// Three people columns on the left, and a column per asset (its price feed,
// reserve, liquidity vault and share mint) beside the program on the right.
// People take each other's columns while they wait, as in the Options talk:
// Carol takes Alice's while Alice's deposit sits, Dave takes Maria's, and
// both hand them back for the ending. Arrows run down the lanes between
// columns and along a corridor beneath them, one transfer on screen at a
// time. The steps follow the handlers in quicknode/solana-program-examples
// finance/lending: state is written before tokens move, a deposit transfers
// before it mints, a redemption burns before it pays, and a liquidation
// takes the repayment before it hands over the seized shares.

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

  // Heights of boxes in full: the title bar, 12 a line, and padding.
  const tall = (lines) => 21 + lines * 12 + 7;
  const GAP2 = 28.6;

  // Three people columns, then a column per asset, then the program.
  const COLUMN = {
    p1: [12, 136],
    p2: [156, 136],
    p3: [300, 136],
    usdc: [452, 172],
    nvdax: [632, 132],
    spcx: [774, 136],
    program: [920, 188],
  };

  // A person's token account, its three seeds set in two lines.
  const ata = (owner, mint, x, y, w, title) =>
    derived("token", title, x, y, w, [`${owner.toUpperCase()}'S ADDRESS + TOKEN`, `PROGRAM + ${mint}`]);

  const alice = onCurve("wallet", "Alice", ...COLUMN.p1);
  const carol = onCurve("wallet", "Carol", ...COLUMN.p1);
  const bob = onCurve("wallet", "Bob", ...COLUMN.p2);
  const maria = onCurve("wallet", "Maria", ...COLUMN.p3);
  const dave = onCurve("wallet", "Dave", ...COLUMN.p3);
  // Each box below a wallet sits one slot lower: a 40-unit box and its seeds.
  const slot = (person, n) => person.y + 68.6 * n;

  const obligationOf = (owner, person, [x, w]) =>
    derived("struct", "obligation", x, slot(person, 4), w, ['"OBLIGATION" + MARKET +', `${owner.toUpperCase()}'S ADDRESS`]);
  const vaultOf = (obligation, [x, w]) =>
    derived("token", "collateral vault", x, obligation.y + tall(2) + GAP2, w, ['"OBLIGATION_SHARE_VAULT"', "+ RESERVE + OBLIGATION"]);
  const bobObligation = obligationOf("Bob", bob, COLUMN.p2);
  const carolObligation = obligationOf("Carol", carol, COLUMN.p1);

  // An asset's column: its price feed, its reserve, and the reserve's two
  // accounts, the liquidity vault and the share mint.
  function assetColumn(asset, [x, w], reserveLines) {
    const mint = `${asset.toUpperCase()} MINT`;
    const feed = derived("struct", `${asset} price feed`, x, 150, w, ['"PRICE_FEED" + MARKET +', mint]);
    const reserve = derived("struct", `${asset} reserve`, x, feed.y + tall(1) + GAP2, w, ['"RESERVE" + MARKET +', mint]);
    const vault = derived("token", `${asset} vault`, x, reserve.y + tall(reserveLines) + GAP2, w, ['"LIQUIDITY_VAULT" +', "RESERVE'S ADDRESS"]);
    const shareMint = derived("mint", "share mint", x, vault.y + tall(1) + GAP2, w, ['"SHARE_MINT" +', "RESERVE'S ADDRESS"]);
    return [feed, reserve, vault, shareMint];
  }
  const [usdcFeed, usdcReserve, usdcVault, usdcShareMint] = assetColumn("USDC", COLUMN.usdc, 4);
  const [nvdaxFeed, nvdaxReserve, nvdaxVault, nvdaxShareMint] = assetColumn("NVDAx", COLUMN.nvdax, 1);
  const [spcxFeed, spcxReserve, spcxVault, spcxShareMint] = assetColumn("SPCXx", COLUMN.spcx, 2);

  const program = onCurve("program", "lending program", ...COLUMN.program);
  const lendingMarket = derived("struct", "lending market", COLUMN.program[0], program.y + 190 + GAP2, COLUMN.program[1], ['"LENDING_MARKET" +', "MARKET ID"]);

  const p1 = COLUMN.p1, p2 = COLUMN.p2, p3 = COLUMN.p3;
  const accounts = {
    alice,
    aliceUsdc: ata("Alice", "USDC MINT", p1[0], slot(alice, 1), p1[1], "Alice's USDC"),
    aliceUsdcShares: ata("Alice", "USDC SHARE MINT", p1[0], slot(alice, 2), p1[1], "USDC shares"),
    aliceSpcx: ata("Alice", "SPCXX MINT", p1[0], slot(alice, 3), p1[1], "Alice's SPCXx"),
    aliceSpcxShares: ata("Alice", "SPCXX SHARE MINT", p1[0], slot(alice, 4), p1[1], "SPCXx shares"),
    carol,
    carolUsdc: ata("Carol", "USDC MINT", p1[0], slot(carol, 1), p1[1], "Carol's USDC"),
    carolShares: ata("Carol", "USDC SHARE MINT", p1[0], slot(carol, 2), p1[1], "USDC shares"),
    carolSpcx: ata("Carol", "SPCXX MINT", p1[0], slot(carol, 3), p1[1], "Carol's SPCXx"),
    carolObligation,
    carolVault: vaultOf(carolObligation, p1),
    bob,
    bobNvdax: ata("Bob", "NVDAX MINT", p2[0], slot(bob, 1), p2[1], "Bob's NVDAx"),
    bobShares: ata("Bob", "NVDAX SHARE MINT", p2[0], slot(bob, 2), p2[1], "NVDAx shares"),
    bobUsdc: ata("Bob", "USDC MINT", p2[0], slot(bob, 3), p2[1], "Bob's USDC"),
    bobObligation,
    bobVault: vaultOf(bobObligation, p2),
    maria,
    mariaUsdc: ata("Maria", "USDC MINT", p3[0], slot(maria, 1), p3[1], "Maria's USDC"),
    dave,
    daveSpcx: ata("Dave", "SPCXX MINT", p3[0], slot(dave, 1), p3[1], "Dave's SPCXx"),
    daveShares: ata("Dave", "USDC SHARE MINT", p3[0], slot(dave, 2), p3[1], "USDC shares"),
    usdcFeed, usdcReserve, usdcVault, usdcShareMint,
    nvdaxFeed, nvdaxReserve, nvdaxVault, nvdaxShareMint,
    spcxFeed, spcxReserve, spcxVault, spcxShareMint,
    program, lendingMarket,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------

  // Each people column's lane is the gap to its right; each asset column's
  // lane is the gap to its left.
  const LANE = { p1: 152, p2: 296, p3: 440, usdc: 447, nvdax: 627, spcx: 769 };
  // Beneath every column, above the caption.
  const CORRIDOR = 526;
  const right = (acc, dy = 20) => [acc.x + acc.w + 2, acc.y + dy];
  const left = (acc, dy = 26) => [acc.x - 2, acc.y + dy];

  // From a person's account down their lane, along the corridor, and up an
  // asset's lane into one of its accounts.
  const into = (from, lane, to, assetLane) => {
    const [sx, sy] = right(from);
    const [ex, ey] = left(to);
    return rounded([[sx, sy], [lane, sy], [lane, CORRIDOR], [assetLane, CORRIDOR], [assetLane, ey], [ex, ey]]);
  };
  // The reverse: out of an asset's account and up into a person's.
  const outOf = (from, assetLane, to, lane) => {
    const [sx, sy] = left(from);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [assetLane, sy], [assetLane, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]]);
  };
  // Within one column, down its lane from one account's right edge to another's.
  const within = (from, to, lane) => {
    const [sx, sy] = right(from);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [lane, sy], [lane, ey], [ex, ey]]);
  };
  // Between two people's columns, along the corridor beneath the one between.
  const between = (from, fromLane, to, toLane) => {
    const [sx, sy] = right(from);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [fromLane, sy], [fromLane, CORRIDOR], [toLane, CORRIDOR], [toLane, ey], [ex, ey]]);
  };

  // A label sits above a corridor coin, clear of the caption beneath it, or
  // beside a lane coin.
  const above = { dx: 0, dy: -12, anchor: "middle" };
  const above2 = { dx: 0, dy: -25, anchor: "middle" };
  const rightOf = { dx: 14, dy: 4, anchor: "start" };
  const leftOf = { dx: -14, dy: 4, anchor: "end" };
  const onCorridor = (x) => ({ x, y: CORRIDOR });

  const supply = (id) => (/ShareMint$/.test(id) ? "supply" : undefined);
  const transfer = (from, fromValue, to, toValue, arrow) => ({
    type: "transfer",
    alone: true,
    from: { id: from, value: fromValue, key: supply(from) },
    to: { id: to, value: toValue, key: supply(to) },
    arrow,
  });

  // ---- Lines ---------------------------------------------------------------

  const sol = (text) => ({ text, style: "sol" });
  const balance = (text) => ({ text, style: "balance" });
  const field = (text) => ({ text });
  const note = (text) => ({ text, style: "note" });

  // In the order the chapter's figures list them.
  const HANDLERS = [
    "initialize_lending_market()",
    "initialize_reserve()",
    "update_reserve_config()",
    "set_price()",
    "refresh_reserve()",
    "refresh_obligation()",
    "deposit_reserve_liquidity()",
    "redeem_reserve_collateral()",
    "initialize_obligation()",
    "deposit_obligation_collateral()",
    "withdraw_obligation_collateral()",
    "borrow_obligation_liquidity()",
    "repay_obligation_liquidity()",
    "liquidate_obligation()",
    "close_obligation()",
    "collect_program_fees()",
  ];

  const set = (...changes) => ({ type: "set", changes });
  const ch = (id, key, value) => ({ id, key, value });

  const aliceIds = ["alice", "aliceUsdc", "aliceUsdcShares", "aliceSpcx", "aliceSpcxShares"];
  const carolIds = ["carol", "carolUsdc", "carolShares", "carolSpcx", "carolObligation", "carolVault"];

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
      title: "Alice has a [thousand dollars]",
      caption:
        "She keeps USDC, a token worth one US dollar, in a token account of her own. Every kind of token is " +
        "defined by a mint, one of the three names its address is worked out from. It holds 1,000 USDC.",
      actions: [{ type: "show", ids: ["aliceUsdc"], lines: { aliceUsdc: [balance("1,000 USDC")] }, focus: "all" }],
    },
    {
      title: "Alice owns four SpaceX [shares]",
      caption: "SPCXx is a token that tracks one share of SpaceX stock, at $250. Alice holds four in a second token account.",
      actions: [{ type: "show", ids: ["aliceSpcx"], lines: { aliceSpcx: [balance("4 SPCXx")] }, focus: "all" }],
    },
    {
      title: "Alice wants her savings to earn [interest]",
      caption: "Her USDC and her SPCXx sit idle. She would lend them out, if she could be sure of getting them back.",
      actions: [{ type: "focus", ids: ["alice", "aliceUsdc", "aliceSpcx"] }],
    },
    {
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one runs lending markets, and each line is an instruction " +
        "handler anyone can call by sending a transaction. First, somebody has to open a market.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },

    // ---- The market opens
    {
      title: "Maria runs [initialize_lending_market()]",
      caption:
        "Maria runs the market, for a cut of the interest. Its lending market account records her as owner, and " +
        "USDC as the currency every value is measured in.",
      actions: [
        { type: "show", ids: ["maria"], lines: { maria: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_lending_market()", focus: ["maria", "program"] },
        set({ id: "maria", title: "Maria (owner)" }),
        { type: "create", id: "lendingMarket", lines: [field("owner: Maria"), field("quote_currency_mint: USDC")] },
      ],
    },
    {
      title: "Maria runs [set_price()] three times",
      caption:
        "A price feed is an account holding an asset's price. Here only Maria may write one, and a price older " +
        "than 25 slots is refused. USDC is $1, NVDAx, one NVIDIA share, $200, and SPCXx $250.",
      actions: [
        { type: "call", handler: "set_price()", focus: ["maria", "program", "lendingMarket"] },
        { type: "create", id: "usdcFeed", lines: [field("price_mantissa: 1")] },
        { type: "create", id: "nvdaxFeed", lines: [field("price_mantissa: 200")] },
        { type: "create", id: "spcxFeed", lines: [field("price_mantissa: 250")] },
      ],
    },
    {
      title: "Maria runs [initialize_reserve()] three times",
      caption:
        "A reserve is a pool of one asset. Its vault holds the tokens, and its share mint issues suppliers' claims " +
        "on them, called shares. Maria seeds each reserve with a sliver of its asset, too small to draw.",
      actions: [
        { type: "call", handler: "initialize_reserve()", focus: ["maria", "program", "lendingMarket", "usdcFeed", "nvdaxFeed", "spcxFeed"] },
        {
          type: "create", id: "usdcReserve",
          lines: [
            field("available_liquidity: 0"),
            field("borrowed_principal: 0"),
            field("borrow_accumulation_factor: 1.0"),
            field("accumulated_program_fees: 0"),
          ],
        },
        { type: "create", id: "usdcVault", lines: [balance("0 USDC")] },
        { type: "create", id: "usdcShareMint", lines: [field("supply: 0 shares")] },
        { type: "create", id: "nvdaxReserve", lines: [field("available_liquidity: 0")] },
        { type: "create", id: "nvdaxVault", lines: [balance("0 NVDAx")] },
        { type: "create", id: "nvdaxShareMint", lines: [field("supply: 0 shares")] },
        { type: "create", id: "spcxReserve", lines: [field("available_liquidity: 0"), field("borrowed_principal: 0")] },
        { type: "create", id: "spcxVault", lines: [balance("0 SPCXx")] },
        { type: "create", id: "spcxShareMint", lines: [field("supply: 0 shares")] },
      ],
    },

    // ---- Alice supplies
    {
      title: "Alice runs [deposit_reserve_liquidity()]",
      caption:
        "Alice supplies her USDC to the USDC reserve. The reserve records the deposit before any token moves. " +
        "She opened an account for the shares first.",
      actions: [
        { type: "show", ids: ["aliceUsdcShares"], lines: { aliceUsdcShares: [balance("0 shares")] }, focus: "shown" },
        { type: "call", handler: "deposit_reserve_liquidity()", focus: ["alice", "aliceUsdc", "aliceUsdcShares", "program", "usdcReserve", "usdcVault", "usdcShareMint"] },
        set({ id: "alice", title: "Alice (supplier)" }, ch("usdcReserve", "available_liquidity", "1,000")),
      ],
    },
    {
      title: "Alice's 1,000 USDC go into the [vault]",
      caption: "The USDC lands in the reserve's liquidity vault, the pool every borrower draws from.",
      actions: [
        transfer("aliceUsdc", "0 USDC", "usdcVault", "1,000 USDC", {
          id: "aliceIn", d: into(A.aliceUsdc, LANE.p1, usdcVault, LANE.usdc),
          coinNear: onCorridor(320), label: ["deposit_reserve_liquidity()", "1,000 USDC"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Alice gets 1,000 [shares]",
      caption:
        "The share mint mints her 1,000 USDC shares, one per USDC. As borrowers pay interest the pool grows " +
        "while the shares stay put, so each share redeems for more. No lender's interest is recorded anywhere.",
      actions: [
        transfer("usdcShareMint", "1,000 shares", "aliceUsdcShares", "1,000 shares", {
          id: "aliceMint", d: outOf(usdcShareMint, LANE.usdc, A.aliceUsdcShares, LANE.p1),
          coinNear: onCorridor(320), label: ["1,000 USDC shares"], labelAt: above,
        }),
      ],
    },
    {
      title: "Alice supplies her [SPCXx] too",
      caption: "She does the same with her four SPCXx: the SPCXx reserve records them, and they land in its vault.",
      actions: [
        { type: "show", ids: ["aliceSpcxShares"], lines: { aliceSpcxShares: [balance("0 shares")] }, focus: "shown" },
        { type: "call", handler: "deposit_reserve_liquidity()", focus: ["alice", "aliceSpcx", "aliceSpcxShares", "program", "spcxReserve", "spcxVault", "spcxShareMint"] },
        set(ch("spcxReserve", "available_liquidity", "4")),
        transfer("aliceSpcx", "0 SPCXx", "spcxVault", "4 SPCXx", {
          id: "aliceSpcxIn", d: into(A.aliceSpcx, LANE.p1, spcxVault, LANE.spcx),
          coinNear: onCorridor(700), label: ["deposit_reserve_liquidity()", "4 SPCXx"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Alice gets 4 SPCXx [shares]",
      caption: "Four SPCXx shares are minted to her: her claim on the SPCXx pool.",
      actions: [
        transfer("spcxShareMint", "4 shares", "aliceSpcxShares", "4 shares", {
          id: "aliceSpcxMint", d: outOf(spcxShareMint, LANE.spcx, A.aliceSpcxShares, LANE.p1),
          coinNear: onCorridor(700), label: ["4 SPCXx shares"], labelAt: above,
        }),
      ],
    },

    // ---- Bob borrows against his NVDAx
    {
      title: "Bob runs [deposit_reserve_liquidity()]",
      caption:
        "Bob needs $750 in cash but doesn't want to sell his five NVDAx, worth $200 each. First he supplies them " +
        "to the NVDAx reserve, like Alice did.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobNvdax", "bobShares"],
          lines: { bob: [sol("1 SOL")], bobNvdax: [balance("5 NVDAx")], bobShares: [balance("0 shares")] },
          focus: "shown",
        },
        { type: "call", handler: "deposit_reserve_liquidity()", focus: ["bob", "bobNvdax", "bobShares", "program", "nvdaxReserve", "nvdaxVault", "nvdaxShareMint"] },
        set({ id: "bob", title: "Bob (borrower)" }, ch("nvdaxReserve", "available_liquidity", "5")),
      ],
    },
    {
      title: "Bob's 5 NVDAx go into the [vault]",
      caption: "The five NVDAx land in the NVDAx reserve's vault.",
      actions: [
        transfer("bobNvdax", "0 NVDAx", "nvdaxVault", "5 NVDAx", {
          id: "bobIn", d: into(A.bobNvdax, LANE.p2, nvdaxVault, LANE.nvdax),
          coinNear: onCorridor(520), label: ["deposit_reserve_liquidity()", "5 NVDAx"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Bob gets 5 NVDAx [shares]",
      caption: "Five NVDAx shares are minted to Bob. He still owns his NVIDIA position, through the shares.",
      actions: [
        transfer("nvdaxShareMint", "5 shares", "bobShares", "5 shares", {
          id: "bobMint", d: outOf(nvdaxShareMint, LANE.nvdax, A.bobShares, LANE.p2),
          coinNear: onCorridor(520), label: ["5 NVDAx shares"], labelAt: above,
        }),
      ],
    },
    {
      title: "Bob runs [initialize_obligation()]",
      caption:
        "An obligation is a borrower's loan file: what they have pledged, what they owe, and what that is worth. " +
        "Bob gets one per market.",
      actions: [
        { type: "call", handler: "initialize_obligation()", focus: ["bob", "program", "lendingMarket"] },
        { type: "create", id: "bobObligation", lines: [field("deposits: none"), field("borrowed_value: $0")] },
      ],
    },
    {
      title: "Bob runs [deposit_obligation_collateral()]",
      caption:
        "Bob pledges his shares as collateral: they move into a vault his obligation controls. Pledged shares " +
        "keep earning what any supplier earns.",
      actions: [
        { type: "call", handler: "deposit_obligation_collateral()", focus: ["bob", "bobShares", "program", "bobObligation", "nvdaxReserve"] },
        { type: "create", id: "bobVault", lines: [balance("0 shares")] },
        set(ch("bobObligation", "deposits", "5 NVDAx shares")),
        transfer("bobShares", "0 shares", "bobVault", "5 shares", {
          id: "bobPledge", d: within(A.bobShares, A.bobVault, LANE.p2),
          coinNear: { x: LANE.p2, y: 330 }, label: ["5 shares"], labelAt: rightOf,
        }),
      ],
    },
    {
      title: "Bob runs [borrow_obligation_liquidity()]",
      caption:
        "His collateral is worth $1,000, and the loan-to-value is 75%: he may borrow up to $750 of USDC, and does. " +
        "The obligation and the USDC reserve record the loan first.",
      actions: [
        { type: "show", ids: ["bobUsdc"], lines: { bobUsdc: [balance("1,000 USDC")] }, focus: "shown" },
        { type: "call", handler: "borrow_obligation_liquidity()", focus: ["bob", "bobUsdc", "program", "bobObligation", "nvdaxFeed", "usdcReserve", "usdcVault"] },
        set(
          ch("bobObligation", "borrowed_value", "$750"),
          // 1,000 supplied less the 750 lent.
          ch("usdcReserve", "available_liquidity", "250"),
          ch("usdcReserve", "borrowed_principal", "750"),
        ),
      ],
    },
    {
      title: "Bob receives [750 USDC]",
      caption:
        "The USDC comes out of the reserve's vault: Alice's deposit, lent to Bob. His NVDAx is not sold, " +
        "and he gets it back when he repays.",
      actions: [
        // Bob's standard 1,000 USDC plus the loan; the chapter's figure shows 992.50 after he repays 757.50.
        transfer("usdcVault", "250 USDC", "bobUsdc", "1,750 USDC", {
          id: "loan", d: outOf(usdcVault, LANE.usdc, A.bobUsdc, LANE.p2),
          coinNear: onCorridor(360), label: ["borrow_obligation_liquidity()", "750 USDC"], labelAt: above2,
        }),
      ],
    },

    // ---- Carol shorts SpaceX
    {
      title: "Carol runs [deposit_reserve_liquidity()]",
      caption:
        "Carol thinks SpaceX is overvalued, and wants to profit if it falls. She starts by supplying 1,000 USDC " +
        "to the USDC reserve, as Alice did. Alice's deposits sit untouched, so Carol takes her column.",
      actions: [
        { type: "hide", ids: aliceIds },
        {
          type: "show",
          ids: ["carol", "carolUsdc", "carolShares"],
          lines: { carol: [sol("1 SOL")], carolUsdc: [balance("1,000 USDC")], carolShares: [balance("0 shares")] },
          focus: "shown",
        },
        { type: "call", handler: "deposit_reserve_liquidity()", focus: ["carol", "carolUsdc", "carolShares", "program", "usdcReserve", "usdcVault", "usdcShareMint"] },
        // 250 left after Bob's loan, plus Carol's 1,000.
        set(ch("usdcReserve", "available_liquidity", "1,250")),
      ],
    },
    {
      title: "Carol's 1,000 USDC go into the [vault]",
      caption: "Her USDC joins what is left of Alice's in the vault.",
      actions: [
        transfer("carolUsdc", "0 USDC", "usdcVault", "1,250 USDC", {
          id: "carolIn", d: into(A.carolUsdc, LANE.p1, usdcVault, LANE.usdc),
          coinNear: onCorridor(320), label: ["deposit_reserve_liquidity()", "1,000 USDC"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Carol gets 1,000 [shares]",
      caption: "1,000 USDC shares are minted to her. She and Alice now each hold half the reserve's shares.",
      actions: [
        transfer("usdcShareMint", "2,000 shares", "carolShares", "1,000 shares", {
          id: "carolMint", d: outOf(usdcShareMint, LANE.usdc, A.carolShares, LANE.p1),
          coinNear: onCorridor(320), label: ["1,000 USDC shares"], labelAt: above,
        }),
      ],
    },
    {
      title: "Carol pledges her shares as [collateral]",
      caption:
        "Like Bob, she runs initialize_obligation() for a loan file, then deposit_obligation_collateral() to move " +
        "her 1,000 USDC shares into a vault her obligation controls.",
      actions: [
        { type: "call", handler: "initialize_obligation()", focus: ["carol", "program", "lendingMarket"] },
        { type: "create", id: "carolObligation", lines: [field("borrows: none"), field("borrowed_value: $0")] },
        { type: "highlight", handlers: ["deposit_obligation_collateral()"] },
        { type: "create", id: "carolVault", lines: [balance("0 shares")] },
        transfer("carolShares", "0 shares", "carolVault", "1,000 shares", {
          id: "carolPledge", d: within(A.carolShares, A.carolVault, LANE.p1),
          coinNear: { x: LANE.p1, y: 330 }, label: ["1,000 shares"], labelAt: rightOf,
        }),
      ],
    },
    {
      title: "Carol runs [borrow_obligation_liquidity()]",
      caption:
        "She borrows three SPCXx at $250 each: $750, the most her $1,000 of collateral allows at 75%. " +
        "She owes the asset itself, not dollars. Her obligation and the SPCXx reserve record it first.",
      actions: [
        { type: "show", ids: ["carolSpcx"], lines: { carolSpcx: [balance("0 SPCXx")] }, focus: "shown" },
        { type: "call", handler: "borrow_obligation_liquidity()", focus: ["carol", "carolSpcx", "program", "carolObligation", "carolVault", "spcxFeed", "spcxReserve", "spcxVault"] },
        set(
          { id: "carol", title: "Carol (borrower)" },
          ch("carolObligation", "borrows", "3 SPCXx"),
          ch("carolObligation", "borrowed_value", "$750"),
          // Alice's four, less the three lent.
          ch("spcxReserve", "available_liquidity", "1"),
          ch("spcxReserve", "borrowed_principal", "3"),
        ),
      ],
    },
    {
      title: "Carol receives [3 SPCXx]",
      caption: "Three of Alice's SPCXx leave the SPCXx vault for Carol.",
      actions: [
        transfer("spcxVault", "1 SPCXx", "carolSpcx", "3 SPCXx", {
          id: "carolBorrow", d: outOf(spcxVault, LANE.spcx, A.carolSpcx, LANE.p1),
          coinNear: onCorridor(700), label: ["borrow_obligation_liquidity()", "3 SPCXx"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Carol sells them, and is [short]",
      caption:
        "She sells the three SPCXx elsewhere for $750. That is a short: if SpaceX falls she buys them back " +
        "cheaper and keeps the difference. If it rises, her debt rises with it, and her collateral does not.",
      actions: [
        { type: "call", handler: null, focus: ["carol", "carolSpcx", "carolUsdc", "carolObligation"] },
        // Out of this market: the chapter says only that she sells them for $750.
        set(ch("carolSpcx", null, "0 SPCXx"), ch("carolUsdc", null, "750 USDC")),
      ],
    },

    // ---- SpaceX rallies, and Dave liquidates Carol
    {
      title: "SpaceX rallies to [$300]",
      caption: "SPCXx rises from $250 to $300, and Maria's price feed says so.",
      actions: [
        { type: "call", handler: "set_price()", focus: ["maria", "program", "spcxFeed"] },
        set(ch("spcxFeed", "price_mantissa", "300")),
      ],
    },
    {
      title: "Carol's loan passes the [liquidation threshold]",
      caption:
        "Anyone may run refresh_obligation(). Carol now owes 3 × $300 = $900 against $1,000 of collateral, past " +
        "her liquidation threshold of 80%, $800. The market will now pay anyone to fix that.",
      actions: [
        { type: "call", handler: "refresh_obligation()", focus: ["program", "carol", "carolObligation", "carolVault", "spcxFeed"] },
        set(ch("carolObligation", "borrowed_value", "$900")),
      ],
    },
    {
      title: "Dave runs [liquidate_obligation()]",
      caption:
        "Dave watches for loans like Carol's. He has bought 1.5 SPCXx elsewhere for $450. The close factor lets one " +
        "liquidation repay at most 50% of a debt: 1.5 of her 3. The records change before any token moves.",
      actions: [
        { type: "hide", ids: ["maria"] },
        {
          type: "show",
          ids: ["dave", "daveSpcx", "daveShares"],
          lines: { dave: [sol("1 SOL")], daveSpcx: [balance("1.5 SPCXx")], daveShares: [balance("0 shares")] },
          focus: "shown",
        },
        {
          type: "call", handler: "liquidate_obligation()", also: ["refresh_reserve()", "refresh_obligation()"],
          focus: ["dave", "daveSpcx", "daveShares", "program", "carolObligation", "carolVault", "spcxFeed", "spcxReserve", "spcxVault"],
        },
        set(
          { id: "dave", title: "Dave (liquidator)" },
          ch("carolObligation", "borrows", "1.5 SPCXx"),
          ch("carolObligation", "borrowed_value", "$450"),
          // 1 left in the pool, plus Dave's 1.5.
          ch("spcxReserve", "available_liquidity", "2.5"),
          ch("spcxReserve", "borrowed_principal", "1.5"),
        ),
      ],
    },
    {
      title: "Dave repays [1.5 SPCXx]",
      caption: "Dave pays 1.5 SPCXx into the SPCXx reserve on Carol's behalf: $450 of her debt.",
      actions: [
        transfer("daveSpcx", "0 SPCXx", "spcxVault", "2.5 SPCXx", {
          id: "daveRepay1", d: into(A.daveSpcx, LANE.p3, spcxVault, LANE.spcx),
          coinNear: onCorridor(700), label: ["liquidate_obligation()", "1.5 SPCXx"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Dave seizes 472.50 [shares]",
      caption:
        "In return he takes $450 of Carol's collateral plus a 5% bonus, his fee for the service: $450 × 1.05 = " +
        "$472.50, paid in her USDC shares. Carol still owes 1.5 SPCXx, and is still slightly unhealthy.",
      actions: [
        transfer("carolVault", "527.50 shares", "daveShares", "472.50 shares", {
          id: "daveSeize1", d: between(A.carolVault, LANE.p1, A.daveShares, LANE.p3),
          coinNear: onCorridor(230), label: ["472.50 USDC shares"], labelAt: above,
        }),
      ],
    },
    {
      title: "Dave runs [liquidate_obligation()] again",
      caption:
        "He buys another 0.75 SPCXx elsewhere, for $225, and goes again: half of the remaining 1.5 SPCXx debt.",
      actions: [
        { type: "call", handler: "liquidate_obligation()", also: ["refresh_reserve()", "refresh_obligation()"], focus: ["dave", "daveSpcx", "daveShares", "program", "carolObligation", "carolVault", "spcxFeed", "spcxReserve", "spcxVault"] },
        set(
          ch("daveSpcx", null, "0.75 SPCXx"),
          ch("carolObligation", "borrows", "0.75 SPCXx"),
          ch("carolObligation", "borrowed_value", "$225"),
          // 2.5 in the pool, plus Dave's 0.75.
          ch("spcxReserve", "available_liquidity", "3.25"),
          ch("spcxReserve", "borrowed_principal", "0.75"),
        ),
      ],
    },
    {
      title: "Dave repays [0.75 SPCXx]",
      caption: "Another 0.75 SPCXx into the reserve, $225 of Carol's debt.",
      actions: [
        transfer("daveSpcx", "0 SPCXx", "spcxVault", "3.25 SPCXx", {
          id: "daveRepay2", d: into(A.daveSpcx, LANE.p3, spcxVault, LANE.spcx),
          coinNear: onCorridor(700), label: ["liquidate_obligation()", "0.75 SPCXx"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Dave seizes 236.25 more [shares]",
      caption:
        "$225 plus the 5% bonus: $236.25. Carol's loan is healthy again, still hers. Across both passes Dave " +
        "repaid $675 and collected $708.75: a $33.75 profit for keeping the market solvent.",
      actions: [
        transfer("carolVault", "291.25 shares", "daveShares", "708.75 shares", {
          id: "daveSeize2", d: between(A.carolVault, LANE.p1, A.daveShares, LANE.p3),
          coinNear: onCorridor(230), label: ["236.25 USDC shares"], labelAt: above,
        }),
      ],
    },

    // ---- Interest, repayment, and everyone settling up
    {
      title: "Five weeks pass, and interest [accrues]",
      caption:
        "Anyone may run refresh_reserve(). It grows the USDC reserve's borrow accumulation factor, which every " +
        "debt is multiplied by, to 1.01, and sets 10% of the interest aside for Maria. Bob owes $757.50; no token moved.",
      actions: [
        { type: "call", handler: "refresh_reserve()", also: ["refresh_obligation()"], focus: ["program", "usdcReserve", "bob", "bobObligation"] },
        set(
          ch("usdcReserve", "borrow_accumulation_factor", "1.01"),
          ch("usdcReserve", "accumulated_program_fees", "0.75"),
          ch("bobObligation", "borrowed_value", "$757.50"),
        ),
      ],
    },
    {
      title: "Bob runs [repay_obligation_liquidity()]",
      caption: "Bob no longer needs the cash. He repays the 750 he borrowed plus 7.50 of interest.",
      actions: [
        { type: "call", handler: "repay_obligation_liquidity()", focus: ["bob", "bobUsdc", "program", "bobObligation", "usdcReserve", "usdcVault"] },
        set(
          ch("bobObligation", "borrowed_value", "$0"),
          // 1,250 in the pool, plus the 757.50 repaid.
          ch("usdcReserve", "available_liquidity", "2,007.50"),
          ch("usdcReserve", "borrowed_principal", "0"),
        ),
        transfer("bobUsdc", "992.50 USDC", "usdcVault", "2,007.50 USDC", {
          id: "repay", d: into(A.bobUsdc, LANE.p2, usdcVault, LANE.usdc),
          coinNear: onCorridor(360), label: ["repay_obligation_liquidity()", "757.50 USDC"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Bob runs [withdraw_obligation_collateral()]",
      caption:
        "With nothing owed, Bob's shares come back out of the collateral vault. The emptied vault closes, and " +
        "its rent returns to Bob.",
      actions: [
        { type: "call", handler: "withdraw_obligation_collateral()", focus: ["bob", "bobShares", "program", "bobObligation", "bobVault", "nvdaxReserve"] },
        set(ch("bobObligation", "deposits", "none")),
        transfer("bobVault", "0 shares", "bobShares", "5 shares", {
          id: "bobUnpledge", d: within(A.bobVault, A.bobShares, LANE.p2),
          coinNear: { x: LANE.p2, y: 330 }, label: ["5 shares"], labelAt: rightOf,
        }),
        { type: "close", id: "bobVault" },
      ],
    },
    {
      title: "Bob runs [redeem_reserve_collateral()]",
      caption: "His five shares are burned first, then the reserve pays him five NVDAx. He kept his stock, and paid about $7.50 for five weeks of cash.",
      actions: [
        { type: "call", handler: "redeem_reserve_collateral()", focus: ["bob", "bobShares", "bobNvdax", "program", "nvdaxReserve", "nvdaxVault", "nvdaxShareMint"] },
        set(ch("nvdaxReserve", "available_liquidity", "0")),
        transfer("bobShares", "0 shares", "nvdaxShareMint", "0 shares", {
          id: "bobBurn", d: into(A.bobShares, LANE.p2, nvdaxShareMint, LANE.nvdax),
          coinNear: onCorridor(520), label: ["burn 5 shares"], labelAt: above,
        }),
        transfer("nvdaxVault", "0 NVDAx", "bobNvdax", "5 NVDAx", {
          id: "bobOut", d: outOf(nvdaxVault, LANE.nvdax, A.bobNvdax, LANE.p2),
          coinNear: onCorridor(520), label: ["5 NVDAx"], labelAt: above,
        }),
      ],
    },
    {
      title: "Maria runs [collect_program_fees()]",
      caption: "Maria collects the 10% of the interest set aside for her: 75 cents. Dave is done, so she takes back her column.",
      actions: [
        { type: "hide", ids: ["dave", "daveSpcx", "daveShares"] },
        { type: "show", ids: ["maria", "mariaUsdc"], lines: { maria: [sol("1 SOL")], mariaUsdc: [balance("1,000 USDC")] }, focus: "shown" },
        { type: "call", handler: "collect_program_fees()", focus: ["maria", "mariaUsdc", "program", "lendingMarket", "usdcReserve", "usdcVault"] },
        // 2,007.50 less the 0.75 paid out.
        set(ch("usdcReserve", "accumulated_program_fees", "0"), ch("usdcReserve", "available_liquidity", "2,006.75")),
        transfer("usdcVault", "2,006.75 USDC", "mariaUsdc", "1,000.75 USDC", {
          id: "fees", d: rounded([left(usdcVault, 20), [LANE.usdc, usdcVault.y + 20], [LANE.usdc, A.mariaUsdc.y + 20], right(A.mariaUsdc)]),
          coinNear: { x: LANE.usdc, y: 250 }, label: ["0.75 USDC"], labelAt: leftOf,
        }),
      ],
    },
    {
      title: "Alice runs [redeem_reserve_collateral()]",
      caption:
        "Alice takes her USDC yield. Her 1,000 shares are burned first, half the reserve's, so she is paid half " +
        "its 2,006.75 USDC: 1,003.375. Her SPCXx stay supplied.",
      actions: [
        { type: "hide", ids: carolIds },
        {
          type: "show",
          ids: aliceIds,
          lines: {
            alice: [sol("1 SOL")],
            aliceUsdc: [balance("0 USDC")],
            aliceUsdcShares: [balance("1,000 shares")],
            aliceSpcx: [balance("0 SPCXx")],
            aliceSpcxShares: [balance("4 shares")],
          },
          focus: ["alice", "aliceUsdc", "aliceUsdcShares"],
        },
        { type: "call", handler: "redeem_reserve_collateral()", focus: ["alice", "aliceUsdc", "aliceUsdcShares", "program", "usdcReserve", "usdcVault", "usdcShareMint"] },
        // 2,006.75 less the 1,003.375 paid to Alice.
        set(ch("usdcReserve", "available_liquidity", "1,003.375")),
        transfer("aliceUsdcShares", "0 shares", "usdcShareMint", "1,000 shares", {
          id: "aliceBurn", d: into(A.aliceUsdcShares, LANE.p1, usdcShareMint, LANE.usdc),
          coinNear: onCorridor(320), label: ["burn 1,000 shares"], labelAt: above,
        }),
        transfer("usdcVault", "1,003.375 USDC", "aliceUsdc", "1,003.375 USDC", {
          id: "aliceOut", d: outOf(usdcVault, LANE.usdc, A.aliceUsdc, LANE.p1),
          coinNear: onCorridor(320), label: ["1,003.375 USDC"], labelAt: above,
        }),
      ],
    },
  ];

  window.LENDING_SCENE = {
    title: "Lending",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    caption: { x: 16, y: 550, w: 600, h: 78, fontSize: 13 },
    hold: 3000,
    program: "program",
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
