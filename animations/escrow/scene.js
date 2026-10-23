// The Escrow chapter as an animated scene: Alice offers 250 USDC for one
// TSLAx, the program holds her USDC in a vault only it can move, and either
// Bob takes the offer or Alice cancels it.
//
// The columns are the chapter figures' columns spread across a 16:9 screen:
// Alice, Bob, the two mints beneath the curve, and the program with the offer
// and its vault. The steps follow the handlers in
// quicknode/solana-program-examples finance/escrow (anchor-v1): make_offer()
// moves the USDC before it writes the offer's fields, and take_offer() checks
// the taker's terms before any token moves.

(function () {
  const WIDTH = 1120;
  const HEIGHT = 630;
  const curve = AccountAnimation.clusterCurve(WIDTH, { top: 62, control: 700 / WIDTH });
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

  const COLUMN = { alice: [150, 170], bob: [390, 160], program: [880, 224] };
  const ata = (person, n, owner, token, [x, w]) =>
    derived("token", `${owner}'s ${token}`, x, person.y + 77 * n, w, [
      `${owner.toUpperCase()}'S ADDRESS +`, "TOKEN PROGRAM +", `${token.toUpperCase()} MINT`,
    ]);

  const alice = onCurve("wallet", "Alice", ...COLUMN.alice);
  const bob = onCurve("wallet", "Bob", ...COLUMN.bob);
  const program = onCurve("program", "escrow program", ...COLUMN.program);
  const offer = derived("struct", "offer account", COLUMN.program[0], program.y + tall(3) + 4 + GAP2, COLUMN.program[1], ['"OFFER" + ALICE\'S', "ADDRESS + ID"]);
  const vault = derived("token", "vault", COLUMN.program[0], offer.y + tall(5) + GAP2, COLUMN.program[1], ["OFFER'S ADDRESS + TOKEN", "PROGRAM + USDC MINT"]);

  const accounts = {
    alice,
    aliceUsdc: ata(alice, 1, "Alice", "USDC", COLUMN.alice),
    aliceTslax: ata(alice, 2, "Alice", "TSLAx", COLUMN.alice),
    bob,
    bobUsdc: ata(bob, 1, "Bob", "USDC", COLUMN.bob),
    bobTslax: ata(bob, 2, "Bob", "TSLAx", COLUMN.bob),
    usdcMint: onCurve("mint", "USDC mint", 590, 120),
    tslaxMint: onCurve("mint", "TSLAx mint", 730, 120),
    program,
    offer,
    vault,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------
  // Alice's lane runs down the gap between her column and Bob's; the program
  // lane down the gap beside the program's column.

  const ALICE_LANE = (COLUMN.alice[0] + COLUMN.alice[1] + COLUMN.bob[0]) / 2;
  const PROGRAM_LANE = COLUMN.program[0] - 24;
  const vaultY = vault.y + 26;

  // From Alice's USDC down her lane and straight across, under every column,
  // into the vault; and the same route back.
  const intoVault = rounded([
    [A.aliceUsdc.x + A.aliceUsdc.w + 2, A.aliceUsdc.y + 20], [ALICE_LANE, A.aliceUsdc.y + 20],
    [ALICE_LANE, vaultY], [vault.x - 2, vaultY],
  ]);
  const outOfVault = rounded([
    [vault.x - 2, vaultY], [ALICE_LANE, vaultY],
    [ALICE_LANE, A.aliceUsdc.y + 20], [A.aliceUsdc.x + A.aliceUsdc.w + 2, A.aliceUsdc.y + 20],
  ]);
  // Bob's TSLAx straight across the lane into Alice's.
  const bobToAlice = rounded([
    [A.bobTslax.x - 2, A.bobTslax.y + 20], [ALICE_LANE, A.bobTslax.y + 20],
    [ALICE_LANE, A.aliceTslax.y + 20], [A.aliceTslax.x + A.aliceTslax.w + 2, A.aliceTslax.y + 20],
  ]);
  // From the vault up the program lane and across into Bob's USDC.
  const vaultToBob = rounded([
    [vault.x - 2, vaultY], [PROGRAM_LANE, vaultY],
    [PROGRAM_LANE, A.bobUsdc.y + 20], [A.bobUsdc.x + A.bobUsdc.w + 2, A.bobUsdc.y + 20],
  ]);

  const below = { dx: 0, dy: 22, anchor: "middle" };
  const transfer = (from, fromValue, to, toValue, arrow) => ({
    type: "transfer", alone: true,
    from: { id: from, value: fromValue }, to: { id: to, value: toValue }, arrow,
  });

  // ---- Lines ---------------------------------------------------------------

  const sol = (text) => ({ text, style: "sol" });
  const balance = (text) => ({ text, style: "balance" });
  const field = (text) => ({ text });
  const note = (text) => ({ text, style: "note" });
  const HANDLERS = ["make_offer()", "take_offer()", "cancel_offer()"];

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
      title: "Every token has a [mint]",
      caption:
        "Each kind of token is defined by one mint account. This is the mint for USDC, a token worth one US dollar.",
      actions: [{ type: "show", ids: ["usdcMint"], focus: "all" }],
    },
    {
      title: "Alice has a [thousand dollars]",
      caption:
        "Alice keeps her USDC in a token account of her own. Its address, the dot off the curve, is worked out " +
        "from the three names above it rather than held by anyone. It holds 1,000 USDC: a thousand dollars.",
      actions: [{ type: "show", ids: ["aliceUsdc"], lines: { aliceUsdc: [balance("1,000 USDC")] }, focus: "all" }],
    },
    {
      title: "Alice wants a share of [Tesla]",
      caption:
        "TSLAx is a token that tracks one share of Tesla stock, with a mint of its own. Alice will pay 250 USDC " +
        "for one, but whoever pays first has to trust the other to deliver.",
      actions: [{ type: "show", ids: ["tslaxMint"], focus: "all" }],
    },
    {
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one is an escrow, and each line is an instruction handler " +
        "anyone can call by sending a transaction. First, Alice makes her offer.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },

    // ---- Alice makes the offer
    {
      title: "Alice runs [make_offer()]",
      caption:
        "Alice, the maker, offers 250 USDC for 1 TSLAx. The transaction creates an offer account at a PDA, a vault for " +
        "her USDC whose authority is the offer, so only the program can move it, and her own TSLAx account, so Bob " +
        "never has to. Alice pays their rent: the SOL an account holds to exist.",
      actions: [
        { type: "call", handler: "make_offer()", focus: ["alice", "aliceUsdc", "program", "usdcMint", "tslaxMint"] },
        { type: "set", changes: [{ id: "alice", title: "Alice (maker)" }] },
        { type: "create", id: "aliceTslax", lines: [balance("0 TSLAx")] },
        {
          type: "create", id: "offer",
          lines: [field("id: —"), field("maker: —"), field("token_mint_a: —"), field("token_mint_b: —"), field("token_b_wanted_amount: —")],
        },
        { type: "create", id: "vault", lines: [balance("0 USDC"), note("authority: the offer PDA")] },
      ],
    },
    {
      title: "Alice's 250 USDC go into the [vault]",
      caption:
        "The handler refuses an offer of zero tokens on either side (ZeroAmount), then moves Alice's 250 USDC into " +
        "the vault, with Alice signing. From here, no person can move them: only the escrow program's code.",
      actions: [
        transfer("aliceUsdc", "750 USDC", "vault", "250 USDC", {
          id: "make", d: intoVault, coinNear: { x: 640, y: vaultY },
          label: ["make_offer()", "250 USDC"], labelAt: below,
        }),
      ],
    },
    {
      key: "offered",
      title: "The offer records the [terms]",
      caption:
        "Last, the handler writes the offer's fields. Amounts are stored in minor units, the token's smallest unit: " +
        "TSLAx has eight decimals, so 1 TSLAx is 100,000,000. The fields never change after this.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "offer", key: "id", value: "1" },
            { id: "offer", key: "maker", value: "Alice" },
            { id: "offer", key: "token_mint_a", value: "USDC" },
            { id: "offer", key: "token_mint_b", value: "TSLAx" },
            { id: "offer", key: "token_b_wanted_amount", value: "100,000,000" },
          ],
        },
      ],
    },

    // ---- Another future: nobody takes it, and Alice cancels
    {
      title: "If nobody takes it, Alice runs [cancel_offer()]",
      caption:
        "It's possible that nobody takes the offer. Then Alice can cancel it, and only she can: the offer's address " +
        "is worked out again from the signer's address, and a different signer finds no offer there.",
      actions: [
        { type: "call", handler: "cancel_offer()", focus: ["alice", "aliceUsdc", "program", "offer", "vault"] },
      ],
    },
    {
      title: "Alice's USDC comes [back]",
      caption:
        "The program signs for the vault with the offer's seeds, and returns all 250 USDC to Alice.",
      actions: [
        transfer("vault", "0 USDC", "aliceUsdc", "1,000 USDC", {
          id: "cancel", d: outOfVault, coinNear: { x: 640, y: vaultY },
          label: ["cancel_offer()", "250 USDC"], labelAt: below,
        }),
      ],
    },
    {
      title: "The vault and the offer [close]",
      caption: "Both accounts close, and their rent goes back to Alice. She is where she started, less a transaction fee.",
      actions: [
        // Clear the last arrow first, so nothing points at a closed account.
        { type: "hide", ids: [] },
        { type: "close", id: "vault" },
        { type: "close", id: "offer" },
      ],
    },

    // ---- Bob takes the offer
    {
      from: "offered",
      title: "Bob runs [take_offer()]",
      caption:
        "Back to the open offer. Bob holds a TSLAx and likes the price. He passes the terms he saw: at least 250 USDC " +
        "out, at most 1 TSLAx in. If the offer has changed, the handler refuses (OfferTermsChanged) before any token moves.",
      actions: [
        {
          type: "show",
          ids: ["bob", "bobUsdc", "bobTslax"],
          lines: { bob: [sol("1 SOL")], bobUsdc: [balance("1,000 USDC")], bobTslax: [balance("1 TSLAx")] },
          focus: "shown",
        },
        { type: "call", handler: "take_offer()", focus: ["bob", "bobUsdc", "bobTslax", "aliceTslax", "program", "offer", "vault"] },
        { type: "set", changes: [{ id: "bob", title: "Bob (taker)" }] },
      ],
    },
    {
      title: "Bob pays Alice [directly]",
      caption:
        "Bob's TSLAx goes straight into Alice's TSLAx account, with Bob signing. The program never holds it, and " +
        "Alice doesn't need to be online: her signature on make_offer() was enough.",
      actions: [
        transfer("bobTslax", "0 TSLAx", "aliceTslax", "1 TSLAx", {
          id: "pay", d: bobToAlice, coinNear: { x: ALICE_LANE, y: (A.bobTslax.y + A.aliceTslax.y) / 2 + 20 },
          label: ["1 TSLAx"], labelAt: { dx: 0, dy: 24, anchor: "middle" },
        }),
      ],
    },
    {
      title: "The vault pays [Bob]",
      caption: "The program signs for the vault with the offer's seeds, and the vault's 250 USDC goes to Bob.",
      actions: [
        transfer("vault", "0 USDC", "bobUsdc", "1,250 USDC", {
          id: "release", d: vaultToBob, coinNear: { x: PROGRAM_LANE, y: (vaultY + A.bobUsdc.y) / 2 },
          label: ["250 USDC"], labelAt: { dx: -14, dy: 4, anchor: "end" },
        }),
      ],
    },
    {
      title: "The vault and the offer [close]",
      caption:
        "Both accounts close, and all their rent goes back to Alice. Each side received the whole of what the other " +
        "offered, and nobody took a fee.",
      actions: [
        { type: "hide", ids: [] },
        { type: "close", id: "vault" },
        { type: "close", id: "offer" },
      ],
    },
  ];

  window.ESCROW_SCENE = {
    title: "Escrow",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    caption: { x: 16, y: 520, w: 540, h: 100, fontSize: 13 },
    hold: 3000,
    program: "program",
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
