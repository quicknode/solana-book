// The Lending chapter as an animated scene: Maria opens a lending market,
// Alice supplies USDC and receives shares, Bob pledges NVDAx and borrows
// USDC against it. In one future NVIDIA falls and Dave liquidates half of
// Bob's loan; in the other, interest accrues, Bob repays and takes his
// shares back, Alice redeems hers with their yield, and Maria collects her
// cut of the interest.
//
// The columns are the chapter figures' accounts spread across a 16:9 screen:
// each person's accounts under their wallet, each reserve's accounts in a
// column of their own, and the program, the market and the price feeds on
// the right. Arrows run down the lanes between columns and along a corridor
// beneath them, one transfer on screen at a time. The steps follow the
// handlers in quicknode/solana-program-examples finance/lending: state is
// written before tokens move, a deposit transfers before it mints, a
// redemption burns before it pays, and a liquidation takes the repayment
// before it hands over the seized shares.
//
// The liquidation is Bob's here rather than the chapter's short seller's, so
// one borrower carries the whole story; its numbers follow the program's
// rules at the chapter's settings, and like the chapter's leave interest out.

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

  // Columns, left to right; the lanes between them carry the arrows.
  const COLUMN = {
    alice: [12, 124],
    bob: [148, 164],
    dave: [324, 122],
    maria: [458, 110],
    usdc: [580, 178],
    nvdax: [770, 142],
    program: [924, 190],
  };

  // A person's token account, its three seeds set in two lines.
  const ata = (owner, token, x, y, w, title = `${owner}'s ${token}`) =>
    derived("token", title, x, y, w, [`${owner.toUpperCase()}'S ADDRESS + TOKEN`, `PROGRAM + ${token.toUpperCase()} MINT`]);

  const alice = onCurve("wallet", "Alice", ...COLUMN.alice);
  const bob = onCurve("wallet", "Bob", ...COLUMN.bob);
  const dave = onCurve("wallet", "Dave", ...COLUMN.dave);
  const maria = onCurve("wallet", "Maria", ...COLUMN.maria);
  // Each box below a wallet sits one slot lower: a 40-unit box and its seeds.
  const slot = (person, n) => person.y + 68.6 * n;

  const obligation = derived("struct", "obligation", COLUMN.bob[0], slot(bob, 4), COLUMN.bob[1], ['"OBLIGATION" + MARKET +', "BOB'S ADDRESS"]);
  const collateralVault = derived("token", "collateral vault", COLUMN.bob[0], obligation.y + tall(4) + GAP2, COLUMN.bob[1], ['"OBLIGATION_SHARE_VAULT"', "+ RESERVE + OBLIGATION"]);

  // A reserve's three accounts: the reserve, its liquidity vault and its
  // share mint, the last two with the reserve as authority.
  function reserveColumn(asset, [x, w], fields) {
    const reserve = derived("struct", `${asset} reserve`, x, 150, w, ['"RESERVE" + MARKET +', `${asset.toUpperCase()} MINT`]);
    const vault = derived("token", `${asset} vault`, x, reserve.y + tall(fields) + GAP2, w, ['"LIQUIDITY_VAULT" +', "RESERVE'S ADDRESS"]);
    const shareMint = derived("mint", "share mint", x, vault.y + tall(2) + GAP2, w, ['"SHARE_MINT" +', "RESERVE'S ADDRESS"]);
    return [reserve, vault, shareMint];
  }
  const [usdcReserve, usdcVault, usdcShareMint] = reserveColumn("USDC", COLUMN.usdc, 4);
  const [nvdaxReserve, nvdaxVault, nvdaxShareMint] = reserveColumn("NVDAx", COLUMN.nvdax, 1);

  const program = onCurve("program", "lending program", ...COLUMN.program);
  const lendingMarket = derived("struct", "lending market", COLUMN.program[0], program.y + 190 + GAP2, COLUMN.program[1], ['"LENDING_MARKET" +', "MARKET ID"]);
  const usdcFeed = derived("struct", "USDC price feed", COLUMN.program[0], lendingMarket.y + tall(2) + GAP2, COLUMN.program[1], ['"PRICE_FEED" + MARKET +', "USDC MINT"]);
  const nvdaxFeed = derived("struct", "NVDAx price feed", COLUMN.program[0], usdcFeed.y + tall(1) + GAP2, COLUMN.program[1], ['"PRICE_FEED" + MARKET +', "NVDAX MINT"]);

  const accounts = {
    alice,
    aliceUsdc: ata("Alice", "USDC", COLUMN.alice[0], slot(alice, 1), COLUMN.alice[1]),
    aliceShares: ata("Alice", "USDC share", COLUMN.alice[0], slot(alice, 2), COLUMN.alice[1], "Alice's shares"),
    bob,
    bobNvdax: ata("Bob", "NVDAx", COLUMN.bob[0], slot(bob, 1), COLUMN.bob[1]),
    bobShares: ata("Bob", "NVDAx share", COLUMN.bob[0], slot(bob, 2), COLUMN.bob[1], "Bob's shares"),
    bobUsdc: ata("Bob", "USDC", COLUMN.bob[0], slot(bob, 3), COLUMN.bob[1]),
    obligation,
    collateralVault,
    dave,
    daveUsdc: ata("Dave", "USDC", COLUMN.dave[0], slot(dave, 1), COLUMN.dave[1]),
    daveShares: ata("Dave", "NVDAx share", COLUMN.dave[0], slot(dave, 2), COLUMN.dave[1], "Dave's shares"),
    maria,
    mariaUsdc: ata("Maria", "USDC", COLUMN.maria[0], slot(maria, 1), COLUMN.maria[1]),
    usdcReserve, usdcVault, usdcShareMint,
    nvdaxReserve, nvdaxVault, nvdaxShareMint,
    program, lendingMarket, usdcFeed, nvdaxFeed,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------

  const LANE = {
    alice: 142, // between Alice and Bob
    bob: 318, // between Bob and Dave
    dave: 452, // between Dave and Maria
    usdc: 574, // between Maria and the USDC reserve
    nvdax: 764, // between the two reserves
  };
  // Beneath every person's column, above the caption.
  const CORRIDOR = 510;
  const right = (acc, dy = 20) => [acc.x + acc.w + 2, acc.y + dy];
  const left = (acc, dy = 26) => [acc.x - 2, acc.y + dy];

  // From a person's account down their lane, along the corridor, and up a
  // reserve's lane into one of its accounts.
  const into = (from, lane, to, reserveLane) => {
    const [sx, sy] = right(from);
    const [ex, ey] = left(to);
    return rounded([[sx, sy], [lane, sy], [lane, CORRIDOR], [reserveLane, CORRIDOR], [reserveLane, ey], [ex, ey]]);
  };
  // The reverse: out of a reserve's account and up into a person's.
  const outOf = (from, reserveLane, to, lane) => {
    const [sx, sy] = left(from);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [reserveLane, sy], [reserveLane, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]]);
  };
  // Within Bob's lane: from the right edge of one account to another's,
  // either side of the lane.
  const across = (from, to, toLeft = false) => {
    const [sx, sy] = right(from);
    const [ex, ey] = toLeft ? left(to, 20) : right(to);
    return rounded([[sx, sy], [LANE.bob, sy], [LANE.bob, ey], [ex, ey]]);
  };

  // Labels sit above a corridor coin, clear of the caption beneath it, or
  // beside a lane coin.
  const above = { dx: 0, dy: -12, anchor: "middle" };
  const above2 = { dx: 0, dy: -25, anchor: "middle" };
  const leftOf = { dx: -14, dy: 4, anchor: "end" };
  const rightOf = { dx: 14, dy: 4, anchor: "start" };
  const onCorridor = (x) => ({ x, y: CORRIDOR });

  const supply = (id) => (id === "usdcShareMint" || id === "nvdaxShareMint" ? "supply" : undefined);
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

  const HANDLERS = [
    "initialize_lending_market()",
    "set_price()",
    "initialize_reserve()",
    "update_reserve_config()",
    "collect_program_fees()",
    "refresh_reserve()",
    "deposit_reserve_liquidity()",
    "redeem_reserve_collateral()",
    "initialize_obligation()",
    "refresh_obligation()",
    "close_obligation()",
    "deposit_obligation_collateral()",
    "withdraw_obligation_collateral()",
    "borrow_obligation_liquidity()",
    "repay_obligation_liquidity()",
    "liquidate_obligation()",
  ];

  const set = (...changes) => ({ type: "set", changes });
  const ch = (id, key, value) => ({ id, key, value });

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
      title: "Alice wants her savings to earn [interest]",
      caption: "Alice's 1,000 USDC sits idle. She would lend it out, if she could be sure of getting it back.",
      actions: [{ type: "focus", ids: ["alice", "aliceUsdc"] }],
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
      title: "Maria runs [set_price()]",
      caption:
        "A price feed is an account holding an asset's price. Here only Maria may write one, and a price older " +
        "than 25 slots, about ten seconds, is refused. USDC is $1 and NVDAx, one NVIDIA share, is $200.",
      actions: [
        { type: "call", handler: "set_price()", focus: ["maria", "program", "lendingMarket"] },
        { type: "create", id: "usdcFeed", lines: [field("price_mantissa: 1")] },
        { type: "create", id: "nvdaxFeed", lines: [field("price_mantissa: 200")] },
      ],
    },
    {
      title: "Maria runs [initialize_reserve()]",
      caption:
        "A reserve is a pool of one asset. Its vault holds the tokens, and its share mint issues suppliers' claims " +
        "on them. Each reserve's config sets the loan-to-value, 75%, and the liquidation threshold, 80%.",
      actions: [
        { type: "call", handler: "initialize_reserve()", focus: ["maria", "program", "lendingMarket", "usdcFeed", "nvdaxFeed"] },
        {
          type: "create", id: "usdcReserve",
          lines: [
            field("available_liquidity: 0"),
            field("borrowed_principal: 0"),
            field("borrow_accumulation_factor: 1.0"),
            field("accumulated_program_fees: 0"),
          ],
        },
        { type: "create", id: "usdcVault", lines: [balance("0 USDC"), note("authority: the reserve")] },
        { type: "create", id: "usdcShareMint", lines: [field("supply: 0 shares"), note("mint authority: the reserve")] },
        { type: "create", id: "nvdaxReserve", lines: [field("available_liquidity: 0")] },
        { type: "create", id: "nvdaxVault", lines: [balance("0 NVDAx"), note("authority: the reserve")] },
        { type: "create", id: "nvdaxShareMint", lines: [field("supply: 0 shares"), note("mint authority: the reserve")] },
      ],
    },

    // ---- Alice supplies
    {
      title: "Alice runs [deposit_reserve_liquidity()]",
      caption:
        "Alice supplies her USDC. Maria seeded each reserve with a sliver of its asset, so Alice's deposit is priced " +
        "like every later one: one share per USDC today. She opened an account for the shares first.",
      actions: [
        { type: "show", ids: ["aliceShares"], lines: { aliceShares: [balance("0 shares")] }, focus: "shown" },
        { type: "call", handler: "deposit_reserve_liquidity()", focus: ["alice", "aliceUsdc", "aliceShares", "program", "usdcReserve", "usdcVault", "usdcShareMint"] },
        set({ id: "alice", title: "Alice (supplier)" }),
      ],
    },
    {
      title: "Alice's 1,000 USDC go into the [vault]",
      caption: "The reserve records the deposit before any token moves, then the USDC lands in the reserve's vault.",
      actions: [
        set(ch("usdcReserve", "available_liquidity", "1,000")),
        transfer("aliceUsdc", "0 USDC", "usdcVault", "1,000 USDC", {
          id: "aliceIn", d: into(A.aliceUsdc, LANE.alice, usdcVault, LANE.usdc),
          coinNear: onCorridor(400), label: ["deposit_reserve_liquidity()", "1,000 USDC"], labelAt: above2,
        }),
      ],
    },
    {
      key: "supplied",
      title: "Alice gets 1,000 [shares]",
      caption:
        "The share mint mints 1,000 USDC shares to Alice: her claim on the pool. As borrowers pay interest the pool " +
        "grows while the shares stay put, so each share redeems for more.",
      actions: [
        transfer("usdcShareMint", "1,000 shares", "aliceShares", "1,000 shares", {
          id: "aliceMint", d: outOf(usdcShareMint, LANE.usdc, A.aliceShares, LANE.alice),
          coinNear: onCorridor(400), label: ["1,000 USDC shares"], labelAt: above,
        }),
      ],
    },

    // ---- Bob borrows
    {
      title: "Bob runs [deposit_reserve_liquidity()]",
      caption:
        "Bob wants $750 in cash, but doesn't want to sell his five NVDAx, worth $200 each. First he supplies them " +
        "to the NVDAx reserve, like Alice did with her USDC.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobNvdax", "bobShares"],
          lines: { bob: [sol("1 SOL")], bobNvdax: [balance("5 NVDAx")], bobShares: [balance("0 shares")] },
          focus: "shown",
        },
        { type: "call", handler: "deposit_reserve_liquidity()", focus: ["bob", "bobNvdax", "bobShares", "program", "nvdaxReserve", "nvdaxVault", "nvdaxShareMint"] },
        set({ id: "bob", title: "Bob (borrower)" }),
      ],
    },
    {
      title: "Bob's 5 NVDAx go into the [vault]",
      caption: "The NVDAx reserve records the deposit, then the five NVDAx land in its vault.",
      actions: [
        set(ch("nvdaxReserve", "available_liquidity", "5")),
        transfer("bobNvdax", "0 NVDAx", "nvdaxVault", "5 NVDAx", {
          id: "bobIn", d: into(A.bobNvdax, LANE.bob, nvdaxVault, LANE.nvdax),
          coinNear: onCorridor(530), label: ["deposit_reserve_liquidity()", "5 NVDAx"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Bob gets 5 NVDAx [shares]",
      caption: "Five NVDAx shares are minted to Bob. He still owns his NVIDIA position, through the shares.",
      actions: [
        transfer("nvdaxShareMint", "5 shares", "bobShares", "5 shares", {
          id: "bobMint", d: outOf(nvdaxShareMint, LANE.nvdax, A.bobShares, LANE.bob),
          coinNear: onCorridor(530), label: ["5 NVDAx shares"], labelAt: above,
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
        {
          type: "create", id: "obligation",
          lines: [field("deposits: none"), field("borrows: none"), field("borrowed_value: $0"), field("unhealthy_borrow_value: $0")],
        },
      ],
    },
    {
      title: "Bob runs [deposit_obligation_collateral()]",
      caption:
        "Bob pledges his shares as collateral: they move into a vault his obligation controls. Pledged shares " +
        "keep earning what any supplier earns.",
      actions: [
        { type: "call", handler: "deposit_obligation_collateral()", focus: ["bob", "bobShares", "program", "obligation", "nvdaxReserve"] },
        { type: "create", id: "collateralVault", lines: [balance("0 shares")] },
        set(ch("obligation", "deposits", "5 shares")),
        transfer("bobShares", "0 shares", "collateralVault", "5 shares", {
          id: "pledge", d: across(A.bobShares, collateralVault),
          coinNear: { x: LANE.bob, y: 265 }, label: ["5 shares"], labelAt: rightOf,
        }),
      ],
    },
    {
      title: "Bob runs [borrow_obligation_liquidity()]",
      caption:
        "His collateral is worth $1,000 at the price feed's $200, and the loan-to-value is 75%, so he may borrow up " +
        "to $750. At 80%, $800 of debt, he could be liquidated. The records change first.",
      actions: [
        { type: "show", ids: ["bobUsdc"], lines: { bobUsdc: [balance("1,000 USDC")] }, focus: "shown" },
        { type: "call", handler: "borrow_obligation_liquidity()", focus: ["bob", "bobUsdc", "program", "obligation", "nvdaxFeed", "usdcReserve", "usdcVault"] },
        set(
          ch("obligation", "borrows", "750 USDC"),
          ch("obligation", "borrowed_value", "$750"),
          ch("obligation", "unhealthy_borrow_value", "$800"),
          ch("usdcReserve", "available_liquidity", "250"),
          ch("usdcReserve", "borrowed_principal", "750"),
        ),
      ],
    },
    {
      key: "borrowed",
      title: "Bob receives [750 USDC]",
      caption:
        "The USDC comes out of the reserve's vault: Alice's deposit, lent to Bob. His NVDAx is not sold, " +
        "and he gets it back when he repays.",
      actions: [
        transfer("usdcVault", "250 USDC", "bobUsdc", "1,750 USDC", {
          id: "loan", d: outOf(usdcVault, LANE.usdc, A.bobUsdc, LANE.bob),
          coinNear: onCorridor(530), label: ["borrow_obligation_liquidity()", "750 USDC"], labelAt: above2,
        }),
      ],
    },

    // ---- One future: NVIDIA falls, and Dave liquidates half the loan
    {
      title: "Had NVIDIA fallen to [$180]",
      caption:
        "It's possible that NVIDIA falls. Say it drops to $180, and Maria's price feed says so. Bob's collateral is now worth $900, " +
        "80% of that is $720, and he owes $750.",
      actions: [
        { type: "call", handler: "set_price()", focus: ["maria", "program", "nvdaxFeed", "obligation", "collateralVault"] },
        set(ch("nvdaxFeed", "price_mantissa", "180")),
      ],
    },
    {
      title: "Had NVIDIA fallen, Dave runs [liquidate_obligation()]",
      caption:
        "Dave, a liquidator, is paid to repay unhealthy debt. His transaction refreshes the reserves and Bob's " +
        "obligation first: $750 owed against a $720 threshold, so the loan is liquidatable.",
      actions: [
        {
          type: "show",
          ids: ["dave", "daveUsdc", "daveShares"],
          lines: { dave: [sol("1 SOL")], daveUsdc: [balance("1,000 USDC")], daveShares: [balance("0 shares")] },
          focus: "shown",
        },
        {
          type: "call", handler: "liquidate_obligation()", also: ["refresh_reserve()", "refresh_obligation()"],
          focus: ["dave", "daveUsdc", "daveShares", "program", "obligation", "collateralVault", "nvdaxFeed", "usdcFeed", "usdcReserve", "usdcVault"],
        },
        set({ id: "dave", title: "Dave (liquidator)" }, ch("obligation", "unhealthy_borrow_value", "$720")),
      ],
    },
    {
      title: "Had NVIDIA fallen, Dave repays [half]",
      caption:
        "The close factor lets one liquidation repay at most 50% of a debt, so Dave pays 375 USDC into the reserve " +
        "on Bob's behalf.",
      actions: [
        set(
          ch("obligation", "borrows", "375 USDC"),
          ch("obligation", "borrowed_value", "$375"),
          ch("usdcReserve", "available_liquidity", "625"),
          ch("usdcReserve", "borrowed_principal", "375"),
        ),
        transfer("daveUsdc", "625 USDC", "usdcVault", "625 USDC", {
          id: "repayHalf", d: into(A.daveUsdc, LANE.dave, usdcVault, LANE.usdc),
          coinNear: onCorridor(530), label: ["liquidate_obligation()", "375 USDC"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Had NVIDIA fallen, Dave takes Bob's [collateral]",
      caption:
        "In return he seizes $375 of Bob's collateral plus a 5% bonus: $393.75, 2.1875 NVDAx shares at $180. " +
        "Bob now owes $375 against $506.25, healthy again.",
      actions: [
        set(ch("obligation", "deposits", "2.8125 shares"), ch("obligation", "unhealthy_borrow_value", "$405")),
        transfer("collateralVault", "2.8125 shares", "daveShares", "2.1875 shares", {
          id: "seize", d: across(collateralVault, A.daveShares, true),
          coinNear: { x: LANE.bob, y: 265 }, label: ["2.1875 shares"], labelAt: rightOf,
        }),
      ],
    },

    // ---- The other future: interest, repayment, and everyone settling up
    {
      from: "borrowed",
      key: "accrued",
      title: "Weeks pass, and interest [accrues]",
      caption:
        "Back to the loan, with NVIDIA steady. Anyone may run refresh_reserve(): it grows the borrow accumulation " +
        "factor, which every debt is multiplied by, to 1.01. Bob owes $757.50, and no token has moved.",
      actions: [
        {
          type: "call", handler: "refresh_reserve()", also: ["refresh_obligation()"],
          focus: ["program", "usdcReserve", "obligation"],
        },
        set(
          ch("usdcReserve", "borrow_accumulation_factor", "1.01"),
          ch("usdcReserve", "accumulated_program_fees", "0.75"),
          ch("obligation", "borrowed_value", "$757.50"),
        ),
      ],
    },
    {
      title: "Bob runs [repay_obligation_liquidity()]",
      caption:
        "Bob repays the 750 he borrowed plus 7.50 of interest. Of the interest, 10% is Maria's fee, 0.75, " +
        "set aside in the reserve; the rest is the suppliers'.",
      actions: [
        { type: "call", handler: "repay_obligation_liquidity()", focus: ["bob", "bobUsdc", "program", "obligation", "usdcReserve", "usdcVault"] },
        set(
          ch("obligation", "borrows", "none"),
          ch("obligation", "borrowed_value", "$0"),
          ch("usdcReserve", "available_liquidity", "1,007.50"),
          ch("usdcReserve", "borrowed_principal", "0"),
        ),
        transfer("bobUsdc", "992.50 USDC", "usdcVault", "1,007.50 USDC", {
          id: "repay", d: into(A.bobUsdc, LANE.bob, usdcVault, LANE.usdc),
          coinNear: onCorridor(530), label: ["repay_obligation_liquidity()", "757.50 USDC"], labelAt: above2,
        }),
      ],
    },
    {
      title: "Bob runs [withdraw_obligation_collateral()]",
      caption:
        "With nothing owed, Bob's shares come back out of the collateral vault. The emptied vault closes, and " +
        "its rent returns to Bob.",
      actions: [
        { type: "call", handler: "withdraw_obligation_collateral()", focus: ["bob", "bobShares", "program", "obligation", "collateralVault", "nvdaxReserve"] },
        set(ch("obligation", "deposits", "none")),
        transfer("collateralVault", "0 shares", "bobShares", "5 shares", {
          id: "unpledge", d: across(collateralVault, A.bobShares),
          coinNear: { x: LANE.bob, y: 265 }, label: ["5 shares"], labelAt: rightOf,
        }),
        { type: "close", id: "collateralVault" },
      ],
    },
    {
      title: "Bob runs [redeem_reserve_collateral()]",
      caption: "His five shares are burned first, then the reserve pays him five NVDAx. He kept his NVIDIA shares, and paid $7.50 for the loan.",
      actions: [
        { type: "call", handler: "redeem_reserve_collateral()", focus: ["bob", "bobShares", "bobNvdax", "program", "nvdaxReserve", "nvdaxVault", "nvdaxShareMint"] },
        set(ch("nvdaxReserve", "available_liquidity", "0")),
        transfer("bobShares", "0 shares", "nvdaxShareMint", "0 shares", {
          id: "bobBurn", d: into(A.bobShares, LANE.bob, nvdaxShareMint, LANE.nvdax),
          coinNear: onCorridor(530), label: ["burn 5 shares"], labelAt: above,
        }),
        transfer("nvdaxVault", "0 NVDAx", "bobNvdax", "5 NVDAx", {
          id: "bobOut", d: outOf(nvdaxVault, LANE.nvdax, A.bobNvdax, LANE.bob),
          coinNear: onCorridor(530), label: ["5 NVDAx"], labelAt: above,
        }),
      ],
    },
    {
      title: "Alice runs [redeem_reserve_collateral()]",
      caption:
        "Alice burns her 1,000 shares for about 1,006.75 USDC: her deposit plus the interest Bob paid, less " +
        "Maria's fee. Her savings earned $6.75.",
      actions: [
        { type: "call", handler: "redeem_reserve_collateral()", focus: ["alice", "aliceShares", "aliceUsdc", "program", "usdcReserve", "usdcVault", "usdcShareMint"] },
        set(ch("usdcReserve", "available_liquidity", "0.75")),
        transfer("aliceShares", "0 shares", "usdcShareMint", "0 shares", {
          id: "aliceBurn", d: into(A.aliceShares, LANE.alice, usdcShareMint, LANE.usdc),
          coinNear: onCorridor(400), label: ["burn 1,000 shares"], labelAt: above,
        }),
        transfer("usdcVault", "0.75 USDC", "aliceUsdc", "1,006.75 USDC", {
          id: "aliceOut", d: outOf(usdcVault, LANE.usdc, A.aliceUsdc, LANE.alice),
          coinNear: onCorridor(400), label: ["1,006.75 USDC"], labelAt: above,
        }),
      ],
    },
    {
      title: "Maria runs [collect_program_fees()]",
      caption: "Maria collects the 10% of the interest set aside for her: 75 cents, paid to her own USDC account.",
      actions: [
        { type: "show", ids: ["mariaUsdc"], lines: { mariaUsdc: [balance("1,000 USDC")] }, focus: "shown" },
        { type: "call", handler: "collect_program_fees()", focus: ["maria", "mariaUsdc", "program", "lendingMarket", "usdcReserve", "usdcVault"] },
        set(ch("usdcReserve", "accumulated_program_fees", "0"), ch("usdcReserve", "available_liquidity", "0")),
        transfer("usdcVault", "0 USDC", "mariaUsdc", "1,000.75 USDC", {
          id: "fees", d: rounded([left(usdcVault, 20), [LANE.usdc, usdcVault.y + 20], [LANE.usdc, A.mariaUsdc.y + 20], right(A.mariaUsdc)]),
          coinNear: { x: LANE.usdc, y: 230 }, label: ["0.75 USDC"], labelAt: leftOf,
        }),
      ],
    },
  ];

  window.LENDING_SCENE = {
    title: "Lending",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    caption: { x: 16, y: 532, w: 560, h: 92, fontSize: 13 },
    hold: 3000,
    program: "program",
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
