// The Constant-Product AMM chapter as an animated scene: Maria opens an
// ACME/USDC pool with its first deposit, Alice adds liquidity, Bob buys and
// Carol buys after him, Bob sells back, Maria sweeps the admin's share of the
// fees, and Alice withdraws.
//
// The columns are the chapter figures' accounts spread across a 16:9 screen:
// the four people, then the pool's two vaults and its LP mint, then the
// program and its two config accounts. The ACME and USDC mints are named only
// in seeds, as in the figures. Arrows run down a lane beside each person's
// column, along a corridor beneath them, and up the lane beside the vaults,
// one transfer on screen at a time. The steps follow the handlers in
// quicknode/solana-program-examples finance/token-swap: a swap records the
// admin's fee before any transfer, and pays out before it takes in when the
// input is USDC (token B), and takes in first when the input is ACME.

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

  const COLUMN = {
    maria: [12, 120],
    alice: [160, 120],
    bob: [312, 124],
    carol: [464, 124],
    vaults: [624, 150],
    program: [880, 224],
  };

  const ata = (owner, token, x, y, w) =>
    derived("token", `${owner}'s ${token}`, x, y, w, [`${owner.toUpperCase()}'S ADDRESS +`, "TOKEN PROGRAM +", `${token === "LP" ? "LP" : token.toUpperCase()} MINT`]);

  const maria = onCurve("wallet", "Maria", ...COLUMN.maria);
  const alice = onCurve("wallet", "Alice", ...COLUMN.alice);
  const bob = onCurve("wallet", "Bob", ...COLUMN.bob);
  const carol = onCurve("wallet", "Carol", ...COLUMN.carol);
  const slot = (person, n) => person.y + 77 * n;

  // The pool's vaults and LP mint, in a column of their own.
  const vaultSeeds = (token) => ["POOL CONFIG'S ADDRESS +", "TOKEN PROGRAM +", `${token} MINT`];
  const poolA = derived("token", "pool_a (ACME)", COLUMN.vaults[0], 150, COLUMN.vaults[1], vaultSeeds("ACME"));
  const poolB = derived("token", "pool_b (USDC)", COLUMN.vaults[0], poolA.y + tall(2) + GAP3, COLUMN.vaults[1], vaultSeeds("USDC"));
  const lpMint = derived("mint", "LP mint", COLUMN.vaults[0], poolB.y + tall(2) + GAP3, COLUMN.vaults[1], ["CONFIG'S ADDRESS +", "ACME MINT + USDC MINT +", '"LIQUIDITY"']);

  // The program and its two config accounts.
  const program = onCurve("program", "AMM program", ...COLUMN.program);
  const config = derived("struct", "config", COLUMN.program[0], program.y + 90 + GAP2, COLUMN.program[1], ['"CONFIG"']);
  const poolConfig = derived("struct", "pool config", COLUMN.program[0], config.y + tall(3) + GAP2, COLUMN.program[1], ["CONFIG'S ADDRESS +", "ACME MINT + USDC MINT"]);

  const accounts = {
    maria,
    mariaAcme: ata("Maria", "ACME", COLUMN.maria[0], slot(maria, 1), COLUMN.maria[1]),
    mariaUsdc: ata("Maria", "USDC", COLUMN.maria[0], slot(maria, 2), COLUMN.maria[1]),
    mariaLp: ata("Maria", "LP", COLUMN.maria[0], slot(maria, 3), COLUMN.maria[1]),
    alice,
    aliceAcme: ata("Alice", "ACME", COLUMN.alice[0], slot(alice, 1), COLUMN.alice[1]),
    aliceUsdc: ata("Alice", "USDC", COLUMN.alice[0], slot(alice, 2), COLUMN.alice[1]),
    aliceLp: ata("Alice", "LP", COLUMN.alice[0], slot(alice, 3), COLUMN.alice[1]),
    bob,
    bobUsdc: ata("Bob", "USDC", COLUMN.bob[0], slot(bob, 1), COLUMN.bob[1]),
    bobAcme: ata("Bob", "ACME", COLUMN.bob[0], slot(bob, 2), COLUMN.bob[1]),
    carol,
    carolUsdc: ata("Carol", "USDC", COLUMN.carol[0], slot(carol, 1), COLUMN.carol[1]),
    carolAcme: ata("Carol", "ACME", COLUMN.carol[0], slot(carol, 2), COLUMN.carol[1]),
    poolA, poolB, lpMint,
    program, config, poolConfig,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------
  // Each person has a lane on the right of their column; the corridor runs
  // beneath every person's column; the vault lane runs up beside the vaults.

  const LANE = { maria: 146, alice: 296, bob: 450, carol: 600, vaults: 612 };
  const CORRIDOR = 448;
  const right = (acc, dy = 20) => [acc.x + acc.w + 2, acc.y + dy];
  const left = (acc, dy = 26) => [acc.x - 2, acc.y + dy];

  // From a person's account down their lane, along the corridor, and up into
  // a vault or the LP mint.
  function intoPool(from, lane, to) {
    const [sx, sy] = right(from);
    const [ex, ey] = left(to);
    return rounded([[sx, sy], [lane, sy], [lane, CORRIDOR], [LANE.vaults, CORRIDOR], [LANE.vaults, ey], [ex, ey]], 6);
  }

  // From a vault or the LP mint down to the corridor, and up a person's lane.
  function outOfPool(from, lane, to) {
    const [sx, sy] = left(from);
    const [ex, ey] = right(to);
    return rounded([[sx, sy], [LANE.vaults, sy], [LANE.vaults, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]], 6);
  }

  // A coin sits on the corridor, its label beneath; for Carol, whose lane
  // meets the vault lane at once, on her lane beneath her column.
  const below = { dx: 0, dy: 22, anchor: "middle" };
  const leftOf = { dx: -14, dy: 4, anchor: "end" };
  const onCorridor = (lane) => ({ coinNear: { x: (lane + LANE.vaults) / 2, y: CORRIDOR }, labelAt: below });
  const onCarolsLane = { coinNear: { x: LANE.carol, y: 400 }, labelAt: leftOf };

  const transfer = (from, fromValue, to, toValue, arrow) => ({
    type: "transfer",
    alone: true,
    from: { id: from, value: fromValue, key: from === "lpMint" ? "supply" : undefined },
    to: { id: to, value: toValue, key: to === "lpMint" ? "supply" : undefined },
    arrow,
  });

  // ---- Lines ---------------------------------------------------------------

  const sol = (text) => ({ text, style: "sol" });
  const balance = (text) => ({ text, style: "balance" });
  const field = (text) => ({ text });
  const note = (text) => ({ text, style: "note" });
  const vault = (amount) => [balance(amount), note("authority: the pool config")];

  const HANDLERS = [
    "initialize_config()",
    "initialize_pool()",
    "deposit_liquidity()",
    "withdraw_liquidity()",
    "swap_tokens()",
    "claim_admin_fees()",
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
      title: "Alice has a [thousand dollars]",
      caption:
        "She keeps USDC, a token worth one US dollar, in a token account of her own. Every kind of token is " +
        "defined by a mint, one of the three names its address is worked out from. It holds 1,000 USDC.",
      actions: [{ type: "show", ids: ["aliceUsdc"], lines: { aliceUsdc: [balance("1,000 USDC")] }, focus: "all" }],
    },
    {
      title: "Alice owns 100 [ACME]",
      caption:
        "ACME is the stock of a robotics startup, launching on Solana today as a token. Alice works there, " +
        "and holds a grant of 100 ACME in a second token account, one for each kind of token she owns.",
      actions: [{ type: "show", ids: ["aliceAcme"], lines: { aliceAcme: [balance("100 ACME")] }, focus: "all" }],
    },
    {
      title: "Alice wants her ACME to [earn]",
      caption:
        "Alice wants to be a liquidity provider: to put her ACME, and the USDC that matches it, into a pool " +
        "that traders swap against, and earn a share of every trade's fee.",
      actions: [{ type: "focus", ids: ["alice", "aliceAcme", "aliceUsdc"] }],
    },
    {
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one runs automated market makers, and each line is an " +
        "instruction handler anyone can call by sending a transaction. First, somebody has to open the pool.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },

    // ---- The venue
    {
      title: "Maria runs [initialize_config()]",
      caption:
        "Maria operates the AMM. Her config sets the trading fee in basis points, hundredths of a percent: 30, " +
        "so 0.3% of every trade. 1,667 basis points of that fee, about a sixth, is the admin's: hers.",
      actions: [
        { type: "show", ids: ["maria"], lines: { maria: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_config()", focus: ["maria", "program"] },
        { type: "set", changes: [{ id: "maria", title: "Maria (admin)" }] },
        { type: "create", id: "config", lines: [field("admin: Maria"), field("fee: 30 bps"), field("admin_share_bps: 1,667")] },
      ],
    },
    {
      title: "Maria runs [initialize_pool()]",
      caption:
        "She holds 400 ACME of founder stock. The pool config records the pair; the two vaults are token " +
        "accounts only the pool config can sign for, and the LP mint is the mint for the pool's receipts.",
      actions: [
        {
          type: "show",
          ids: ["mariaAcme", "mariaUsdc"],
          lines: { mariaAcme: [balance("400 ACME")], mariaUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "initialize_pool()", focus: ["maria", "mariaAcme", "mariaUsdc", "program", "config"] },
        {
          type: "create", id: "poolConfig",
          lines: [field("mint_a: ACME"), field("mint_b: USDC"), field("admin_fees_owed_a: 0"), field("admin_fees_owed_b: 0")],
        },
        { type: "create", id: "poolA", lines: vault("0 ACME") },
        { type: "create", id: "poolB", lines: vault("0 USDC") },
        { type: "create", id: "lpMint", lines: [field("supply: 0 LP"), note("authority: the pool config")] },
        { type: "create", id: "mariaLp", lines: [balance("0 LP")] },
      ],
    },
    {
      title: "Maria's 400 ACME go into the [pool]",
      caption:
        "The first deposit is taken by the instruction that creates the pool, so nobody else can set its " +
        "launch price first.",
      actions: [
        transfer("mariaAcme", "0 ACME", "poolA", "400 ACME", {
          id: "mariaAcmeIn", d: intoPool(A.mariaAcme, LANE.maria, poolA),
          ...onCorridor(LANE.maria), label: ["initialize_pool()", "400 ACME"],
        }),
      ],
    },
    {
      title: "900 USDC go in [alongside]",
      caption:
        "Her deposit sets the price: 900 ÷ 400 = $2.25 an ACME. Call the pool's ACME X and its USDC Y: " +
        "K = X × Y = 360,000.",
      actions: [
        transfer("mariaUsdc", "100 USDC", "poolB", "900 USDC", {
          id: "mariaUsdcIn", d: intoPool(A.mariaUsdc, LANE.maria, poolB),
          ...onCorridor(LANE.maria), label: ["900 USDC"],
        }),
      ],
    },
    {
      title: "Maria gets 599.9999 [LP tokens]",
      caption:
        "LP tokens are receipts: each is a claim on a slice of the pool. The first deposit mints √K = 600, less " +
        "0.0001 never minted to anyone, so a donation can never make a later deposit round to nothing.",
      actions: [
        transfer("lpMint", "599.9999 LP", "mariaLp", "599.9999 LP", {
          id: "mariaMint", d: outOfPool(lpMint, LANE.maria, A.mariaLp),
          ...onCorridor(LANE.maria), label: ["599.9999 LP"],
        }),
      ],
    },

    // ---- Alice adds liquidity
    {
      title: "Alice runs [deposit_liquidity()]",
      caption:
        "A liquidity provider can't change the pool's price, so her 100 ACME must come with 225 USDC: 100 × $2.25. " +
        "The handler clamps her deposit to that ratio. Her LP account is created.",
      actions: [
        { type: "call", handler: "deposit_liquidity()", focus: ["alice", "aliceAcme", "aliceUsdc", "program", "poolConfig", "poolA", "poolB", "lpMint"] },
        { type: "set", changes: [{ id: "alice", title: "Alice (LP)" }] },
        { type: "create", id: "aliceLp", lines: [balance("0 LP")] },
      ],
    },
    {
      title: "Alice's 100 ACME go [in]",
      caption: "Into the same vault as Maria's ACME.",
      actions: [
        transfer("aliceAcme", "0 ACME", "poolA", "500 ACME", {
          id: "aliceAcmeIn", d: intoPool(A.aliceAcme, LANE.alice, poolA),
          ...onCorridor(LANE.alice), label: ["deposit_liquidity()", "100 ACME"],
        }),
      ],
    },
    {
      title: "225 USDC go in [alongside]",
      caption: "X = 500 and Y = 1,125, so K grows to 562,500, and the price is still exactly $2.25. Deposits grow K without moving the price.",
      actions: [
        transfer("aliceUsdc", "775 USDC", "poolB", "1,125 USDC", {
          id: "aliceUsdcIn", d: intoPool(A.aliceUsdc, LANE.alice, poolB),
          ...onCorridor(LANE.alice), label: ["225 USDC"],
        }),
      ],
    },
    {
      title: "Alice gets 150 [LP tokens]",
      caption:
        "Minted in proportion to what she added: 100 ACME against the 400 already there, times 600 LP counting " +
        "the unminted floor. She owns a fifth of the pool.",
      actions: [
        transfer("lpMint", "749.9999 LP", "aliceLp", "150 LP", {
          id: "aliceMint", d: outOfPool(lpMint, LANE.alice, A.aliceLp),
          ...onCorridor(LANE.alice), label: ["150 LP"],
        }),
      ],
    },

    // ---- Bob buys
    {
      title: "Bob runs [swap_tokens()]",
      caption:
        "Bob is early and bullish: he spends 100 USDC on ACME, with a min_output_amount, the least ACME he will " +
        "accept, as his slippage check. His ACME account is created.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobUsdc"],
          lines: { bob: [sol("1 SOL")], bobUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "swap_tokens()", focus: ["bob", "bobUsdc", "program", "config", "poolConfig", "poolA", "poolB"] },
        { type: "set", changes: [{ id: "bob", title: "Bob (trader)" }] },
        { type: "create", id: "bobAcme", lines: [balance("0 ACME")] },
      ],
    },
    {
      title: "The [fee] comes off first",
      caption:
        "0.3% of 100 USDC is 30 cents. About 5 cents is recorded as owed to the admin, and stays in the vault " +
        "until she claims it; the other 25 cents is the LPs'. The curve prices the remaining 99.70.",
      actions: [{ type: "set", changes: [{ id: "poolConfig", key: "admin_fees_owed_b", value: "0.05" }] }],
    },
    {
      title: "The pool pays Bob ≈40.7 [ACME]",
      caption:
        "The amount that keeps X × Y at K: 562,500 ÷ (1,125 + 99.70) ≈ 459.3 ACME left. Paid by the pool config's " +
        "signature, before Bob's USDC is taken in.",
      actions: [
        transfer("poolA", "≈459.3 ACME", "bobAcme", "≈40.7 ACME", {
          id: "bobBuyOut", d: outOfPool(poolA, LANE.bob, A.bobAcme),
          ...onCorridor(LANE.bob), label: ["swap_tokens()", "≈40.7 ACME"],
        }),
      ],
    },
    {
      title: "Bob's 100 USDC go [in]",
      caption:
        "He paid ≈$2.46 an ACME, though the price was $2.25 before and is ≈$2.67 after: price impact, his own " +
        "trade moving the price. Then the handler checks X × Y did not shrink, or it fails (InvariantViolated).",
      actions: [
        transfer("bobUsdc", "900 USDC", "poolB", "1,225 USDC", {
          id: "bobBuyIn", d: intoPool(A.bobUsdc, LANE.bob, poolB),
          ...onCorridor(LANE.bob), label: ["100 USDC"],
        }),
      ],
    },

    // ---- Carol buys after him
    {
      title: "Carol runs [swap_tokens()]",
      caption:
        "Carol buys $50 of ACME at the price Bob's trade made. Of her 15 cents of fee, about 2.5 cents is owed " +
        "to the admin. Her ACME account is created.",
      actions: [
        {
          type: "show",
          ids: ["carol", "carolUsdc"],
          lines: { carol: [sol("1 SOL")], carolUsdc: [balance("1,000 USDC")] },
          focus: "shown",
        },
        { type: "call", handler: "swap_tokens()", focus: ["carol", "carolUsdc", "program", "config", "poolConfig", "poolA", "poolB"] },
        { type: "set", changes: [{ id: "carol", title: "Carol (trader)" }] },
        { type: "create", id: "carolAcme", lines: [balance("0 ACME")] },
        { type: "set", changes: [{ id: "poolConfig", key: "admin_fees_owed_b", value: "0.075" }] },
      ],
    },
    {
      title: "Carol pays the price Bob [made]",
      caption: "About 17.96 ACME out, at an average near $2.78, then her 50 USDC in. The price moves from $2.67 to ≈$2.89.",
      actions: [
        transfer("poolA", "≈441.3 ACME", "carolAcme", "≈17.96 ACME", {
          id: "carolOut", d: outOfPool(poolA, LANE.carol, A.carolAcme),
          ...onCarolsLane, label: ["≈17.96 ACME"],
        }),
        transfer("carolUsdc", "950 USDC", "poolB", "1,275 USDC", {
          id: "carolIn", d: intoPool(A.carolUsdc, LANE.carol, poolB),
          ...onCarolsLane, label: ["50 USDC"],
        }),
      ],
    },

    // ---- Bob sells back
    {
      title: "Bob [sells] 20 ACME back",
      caption:
        "The same handler with the input flipped, so the fee comes off his ACME: 0.06 ACME, of which 0.01 is " +
        "owed to the admin. The admin is now owed fees in both tokens.",
      actions: [
        { type: "call", handler: "swap_tokens()", focus: ["bob", "bobUsdc", "bobAcme", "program", "config", "poolConfig", "poolA", "poolB"] },
        { type: "set", changes: [{ id: "poolConfig", key: "admin_fees_owed_a", value: "0.01" }] },
      ],
    },
    {
      title: "Bob's 20 ACME go [in]",
      caption: "With ACME as the input, the handler takes it in before it pays out.",
      actions: [
        transfer("bobAcme", "≈20.7 ACME", "poolA", "≈461.3 ACME", {
          id: "bobSellIn", d: intoPool(A.bobAcme, LANE.bob, poolA),
          ...onCorridor(LANE.bob), label: ["swap_tokens()", "20 ACME"],
        }),
      ],
    },
    {
      title: "The pool pays Bob ≈55.11 [USDC]",
      caption: "An average near $2.76 an ACME, against the $2.46 he paid. The price falls back to ≈$2.64.",
      actions: [
        transfer("poolB", "≈1,219.89 USDC", "bobUsdc", "≈955.11 USDC", {
          id: "bobSellOut", d: outOfPool(poolB, LANE.bob, A.bobUsdc),
          ...onCorridor(LANE.bob), label: ["≈55.11 USDC"],
        }),
      ],
    },

    // ---- The admin's fees
    {
      title: "Maria runs [claim_admin_fees()]",
      caption:
        "Only the config's admin may call it, and only when something is owed (NothingToClaim). It zeroes both " +
        "counters before it pays.",
      actions: [
        { type: "call", handler: "claim_admin_fees()", focus: ["maria", "mariaAcme", "mariaUsdc", "program", "config", "poolConfig", "poolA", "poolB"] },
        {
          type: "set",
          changes: [
            { id: "poolConfig", key: "admin_fees_owed_a", value: "0" },
            { id: "poolConfig", key: "admin_fees_owed_b", value: "0" },
          ],
        },
      ],
    },
    {
      title: "Maria sweeps her [fees]",
      caption: "One transfer per token, however many swaps accrued it: 0.01 ACME and ≈0.075 USDC.",
      actions: [
        transfer("poolA", "≈461.3 ACME", "mariaAcme", "≈0.01 ACME", {
          id: "claimA", d: outOfPool(poolA, LANE.maria, A.mariaAcme),
          ...onCorridor(LANE.maria), label: ["claim_admin_fees()", "0.01 ACME"],
        }),
        transfer("poolB", "≈1,219.81 USDC", "mariaUsdc", "≈100.08 USDC", {
          id: "claimB", d: outOfPool(poolB, LANE.maria, A.mariaUsdc),
          ...onCorridor(LANE.maria), label: ["≈0.075 USDC"],
        }),
      ],
    },

    // ---- Alice withdraws
    {
      title: "Alice runs [withdraw_liquidity()]",
      caption:
        "She gets a slice of both vaults, less what the admin is still owed: her 150 LP over the supply plus the " +
        "unminted floor, 750. A fifth of each.",
      actions: [
        { type: "call", handler: "withdraw_liquidity()", focus: ["alice", "aliceAcme", "aliceUsdc", "aliceLp", "program", "config", "poolConfig", "poolA", "poolB", "lpMint"] },
      ],
    },
    {
      title: "Alice receives her [slice]",
      caption: "≈92.27 ACME and ≈243.96 USDC. The pool's mix has shifted since she deposited 100 ACME and 225 USDC.",
      actions: [
        transfer("poolA", "≈369.1 ACME", "aliceAcme", "≈92.27 ACME", {
          id: "withdrawA", d: outOfPool(poolA, LANE.alice, A.aliceAcme),
          ...onCorridor(LANE.alice), label: ["withdraw_liquidity()", "≈92.27 ACME"],
        }),
        transfer("poolB", "≈975.85 USDC", "aliceUsdc", "≈1,018.96 USDC", {
          id: "withdrawB", d: outOfPool(poolB, LANE.alice, A.aliceUsdc),
          ...onCorridor(LANE.alice), label: ["≈243.96 USDC"],
        }),
      ],
    },
    {
      title: "Her 150 LP are [burned]",
      caption:
        "At $2.64 she holds ≈$487.93; had she kept her tokens, ≈$489.41. That gap is impermanent loss: a pool " +
        "sells what rises, so an LP trails just holding when the price moves. The fees are what pay for it.",
      actions: [
        transfer("aliceLp", "0 LP", "lpMint", "599.9999 LP", {
          id: "burn", d: intoPool(A.aliceLp, LANE.alice, lpMint),
          ...onCorridor(LANE.alice), label: ["burn 150 LP"],
        }),
      ],
    },
  ];

  window.AMM_SCENE = {
    title: "Constant-Product AMM",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    caption: { x: 16, y: 532, w: 540, h: 92, fontSize: 13 },
    hold: 3000,
    program: "program",
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
