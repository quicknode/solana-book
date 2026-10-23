// The Fundraiser chapter as an animated scene: Maria starts an all-or-nothing
// raise for 9,000 USDC, Alice, Bob and Carol back it, and then the story
// branches. In one future eight more backers meet the target, Maria claims the
// vault, and every receipt and the fundraiser close. In the other, Dave backs
// it too but the deadline passes short of the target, and every backer is
// refunded exactly what they brought.
//
// The columns are the chapter figures' accounts spread across a 16:9 screen.
// Contributions and payouts run down the lane beside each person's column,
// along a corridor beneath the columns, and up the lane beside the vault.
// The steps follow the handlers in quicknode/solana-program-examples
// finance/fundraiser (anchor-v1): contribute() counts the contribution
// before it moves the tokens, and refund() zeroes the receipt before it pays.

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

  // Columns, left to right: Maria, the three backers drawn in both futures,
  // Dave, the USDC mint, and the program.
  const COLUMN = {
    maria: [12, 130],
    alice: [154, 140],
    bob: [306, 140],
    carol: [458, 140],
    dave: [610, 130],
    mint: [752, 110],
    program: [878, 230],
  };

  const maria = onCurve("wallet", "Maria", ...COLUMN.maria);
  const alice = onCurve("wallet", "Alice", ...COLUMN.alice);
  const bob = onCurve("wallet", "Bob", ...COLUMN.bob);
  const carol = onCurve("wallet", "Carol", ...COLUMN.carol);
  const dave = onCurve("wallet", "Dave", ...COLUMN.dave);
  const usdcMint = onCurve("mint", "USDC mint", ...COLUMN.mint);
  const program = onCurve("program", "fundraiser program", ...COLUMN.program);

  const usdc = (person, owner) =>
    derived("token", `${owner}'s USDC`, person.x, person.y + 77, person.w, [`${owner.toUpperCase()}'S ADDRESS +`, "TOKEN PROGRAM +", "USDC MINT"]);
  const receipt = (person, owner) =>
    derived("struct", `${owner}'s receipt`, person.x, person.y + 154, person.w, ['"CONTRIBUTION" +', "FUNDRAISER +", `${owner.toUpperCase()}'S ADDRESS`]);

  const fundraiser = derived("struct", "fundraiser", COLUMN.program[0], program.y + 90 + GAP2, COLUMN.program[1], ['"FUNDRAISER" +', "MARIA'S ADDRESS"]);
  const vault = derived("token", "vault", COLUMN.program[0], fundraiser.y + tall(8) + GAP3, COLUMN.program[1], ["FUNDRAISER'S ADDRESS +", "TOKEN PROGRAM +", "USDC MINT"]);

  const accounts = {
    maria, mariaUsdc: usdc(maria, "Maria"),
    alice, aliceUsdc: usdc(alice, "Alice"), aliceReceipt: receipt(alice, "Alice"),
    bob, bobUsdc: usdc(bob, "Bob"), bobReceipt: receipt(bob, "Bob"),
    carol, carolUsdc: usdc(carol, "Carol"), carolReceipt: receipt(carol, "Carol"),
    dave, daveUsdc: usdc(dave, "Dave"), daveReceipt: receipt(dave, "Dave"),
    usdcMint, program, fundraiser, vault,
  };
  for (const [id, acc] of Object.entries(accounts)) acc.id = id;
  const A = accounts;

  // ---- Arrows --------------------------------------------------------------
  // Each person's lane is the gap on the right of their column; the corridor
  // runs beneath every column; the vault's lane is the gap on its left.

  const laneRight = (acc) => acc.x + acc.w + 6;
  const VAULT_LANE = 870;
  const CORRIDOR = 330;

  // From a person's USDC down their lane, along the corridor, and up into the vault.
  function intoVault(from) {
    const sx = from.x + from.w + 2, sy = from.y + 20;
    const lane = laneRight(from);
    const ex = vault.x - 2, ey = vault.y + 26;
    return rounded([[sx, sy], [lane, sy], [lane, CORRIDOR], [VAULT_LANE, CORRIDOR], [VAULT_LANE, ey], [ex, ey]]);
  }

  // From the vault along the corridor and up a person's lane into their USDC.
  function outOfVault(to) {
    const sx = vault.x - 2, sy = vault.y + 26;
    const lane = laneRight(to);
    const ex = to.x + to.w + 2, ey = to.y + 20;
    return rounded([[sx, sy], [VAULT_LANE, sy], [VAULT_LANE, CORRIDOR], [lane, CORRIDOR], [lane, ey], [ex, ey]]);
  }

  // The coin sits on the corridor, beside the person's own lane.
  const below = { dx: 0, dy: 22, anchor: "middle" };
  const corridorNear = (acc) => ({ x: laneRight(acc) + 70, y: CORRIDOR });

  const contribution = (who, from, to, label) => ({
    type: "transfer",
    alone: true,
    from: { id: `${who}Usdc`, value: from },
    to: { id: "vault", value: to },
    arrow: { id: `${who}-${to}`, d: intoVault(A[`${who}Usdc`]), coinNear: corridorNear(A[`${who}Usdc`]), label, labelAt: below },
  });
  const payout = (who, from, to, label) => ({
    type: "transfer",
    alone: true,
    from: { id: "vault", value: from },
    to: { id: `${who}Usdc`, value: to },
    arrow: { id: `${who}-out-${from}`, d: outOfVault(A[`${who}Usdc`]), coinNear: corridorNear(A[`${who}Usdc`]), label, labelAt: below },
  });

  // ---- Lines ---------------------------------------------------------------

  const sol = (text) => ({ text, style: "sol" });
  const balance = (text) => ({ text, style: "balance" });
  const field = (text) => ({ text });
  const note = (text) => ({ text, style: "note" });

  const HANDLERS = [
    "initialize_fundraiser()",
    "contribute()",
    "check_contributions()",
    "close_contribution()",
    "refund()",
    "close_fundraiser()",
  ];

  const backer = (who, name) => ({
    type: "show",
    ids: [who, `${who}Usdc`],
    lines: { [who]: [sol("1 SOL")], [`${who}Usdc`]: [balance("1,000 USDC")] },
    focus: "shown",
  });

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
      caption: "Each kind of token is defined by one mint account. This is the mint for USDC, a token worth one US dollar.",
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
      title: "Alice wants to [back] a machine",
      caption:
        "Alice runs three cafes and wants Maria's espresso machine on her counters. She'll put in her 1,000 USDC, " +
        "as long as she gets it back if the machine can't be built.",
      actions: [{ type: "focus", ids: ["alice", "aliceUsdc"] }],
    },
    {
      title: "Programs are [accounts] too",
      caption:
        "A program is an account that holds code. This one runs fundraisers, and each line is an instruction " +
        "handler anyone can call by sending a transaction. First, Maria has to start her fundraiser.",
      actions: [{ type: "show", ids: ["program"], lines: { program: HANDLERS.map(field) }, focus: "all" }],
    },

    // ---- The raise opens
    {
      title: "Maria runs [initialize_fundraiser()]",
      caption:
        "Maria is the maker. She sets a target of 9,000 USDC and a duration of 7 days, and nothing lets her change " +
        "either later. The fundraiser records the terms; the vault is a token account only the program can sign for.",
      actions: [
        { type: "show", ids: ["maria"], lines: { maria: [sol("1 SOL")] }, focus: "shown" },
        { type: "call", handler: "initialize_fundraiser()", focus: ["maria", "program", "usdcMint"] },
        { type: "set", changes: [{ id: "maria", title: "Maria (maker)" }] },
        {
          type: "create", id: "fundraiser",
          lines: [
            field("maker: Maria"),
            field("mint_to_raise: USDC"),
            field("amount_to_raise: 9,000 USDC"),
            field("current_amount: 0 USDC"),
            field("time_started: today"),
            field("duration: 7 days"),
            field("claimed: false"),
            field("open_contributions: 0"),
          ],
        },
        { type: "create", id: "vault", lines: [balance("0 USDC"), note("authority: the fundraiser")] },
      ],
    },

    // ---- The backers
    {
      title: "Alice runs [contribute()]",
      caption:
        "Her first contribution creates a receipt: a contribution account the program writes for itself, " +
        "at an address made from the fundraiser and Alice's address. It will record what she put in.",
      actions: [
        { type: "call", handler: "contribute()", focus: ["alice", "aliceUsdc", "program", "fundraiser", "vault"] },
        { type: "set", changes: [{ id: "alice", title: "Alice (backer)" }] },
        { type: "create", id: "aliceReceipt", lines: [field("amount: 0 USDC")] },
      ],
    },
    {
      title: "The program [counts] it first",
      caption:
        "Before a token moves, current_amount rises by 1,000, Alice's receipt records 1,000, and open_contributions " +
        "counts one open receipt.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "1,000 USDC" },
            { id: "aliceReceipt", key: "amount", value: "1,000 USDC" },
            { id: "fundraiser", key: "open_contributions", value: "1" },
          ],
        },
      ],
    },
    {
      title: "Alice's 1,000 USDC go into the [vault]",
      caption: "Only the program can move them out again, and only to Maria if the target is met, or back to Alice if it isn't.",
      actions: [contribution("alice", "0 USDC", "1,000 USDC", ["contribute()", "1,000 USDC"])],
    },
    {
      title: "Bob backs it with [800]",
      caption: "Bob distributes restaurant equipment and wants a new product line to carry. He gets his own receipt.",
      actions: [
        backer("bob"),
        { type: "call", handler: "contribute()", focus: ["bob", "bobUsdc", "program", "fundraiser", "vault"] },
        { type: "set", changes: [{ id: "bob", title: "Bob (backer)" }] },
        { type: "create", id: "bobReceipt", lines: [field("amount: 0 USDC")] },
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "1,800 USDC" },
            { id: "bobReceipt", key: "amount", value: "800 USDC" },
            { id: "fundraiser", key: "open_contributions", value: "2" },
          ],
        },
        contribution("bob", "200 USDC", "1,800 USDC", ["800 USDC"]),
      ],
    },
    {
      title: "Carol backs it with [500]",
      caption: "Carol is an espresso enthusiast who wants one at home badly enough to help it exist.",
      actions: [
        backer("carol"),
        { type: "call", handler: "contribute()", focus: ["carol", "carolUsdc", "program", "fundraiser", "vault"] },
        { type: "set", changes: [{ id: "carol", title: "Carol (backer)" }] },
        { type: "create", id: "carolReceipt", lines: [field("amount: 0 USDC")] },
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "2,300 USDC" },
            { id: "carolReceipt", key: "amount", value: "500 USDC" },
            { id: "fundraiser", key: "open_contributions", value: "3" },
          ],
        },
        contribution("carol", "500 USDC", "2,300 USDC", ["500 USDC"]),
      ],
    },
    {
      key: "carolDone",
      title: "Carol comes back with [500 more]",
      caption:
        "A later contribution adds to the same receipt: Carol's reaches 1,000 USDC, and the fundraiser still counts " +
        "one open receipt for her.",
      actions: [
        { type: "call", handler: "contribute()", focus: ["carol", "carolUsdc", "carolReceipt", "program", "fundraiser", "vault"] },
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "2,800 USDC" },
            { id: "carolReceipt", key: "amount", value: "1,000 USDC" },
          ],
        },
        contribution("carol", "0 USDC", "2,800 USDC", ["500 USDC"]),
      ],
    },

    // ---- First ending: the target is met
    {
      title: "Eight more backers reach the [target]",
      caption:
        "Eight more backers, not drawn here, contribute 6,200 USDC between them. That's eleven receipts and 9,000 USDC: " +
        "the target is met.",
      actions: [
        { type: "call", handler: "contribute()", focus: ["program", "fundraiser", "vault"] },
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "9,000 USDC" },
            { id: "fundraiser", key: "open_contributions", value: "11" },
            { id: "vault", value: "9,000 USDC" },
          ],
        },
      ],
    },
    {
      title: "Maria runs [check_contributions()]",
      caption:
        "The claim compares the target with current_amount, the program's own count, never the vault's balance, " +
        "which anyone can raise by sending tokens in. It sets claimed, and creates Maria's USDC account if she has none.",
      actions: [
        { type: "call", handler: "check_contributions()", focus: ["maria", "program", "fundraiser", "vault"] },
        { type: "set", changes: [{ id: "fundraiser", key: "claimed", value: "true" }] },
        { type: "create", id: "mariaUsdc", lines: [balance("0 USDC")] },
      ],
    },
    {
      title: "Maria receives the [9,000 USDC]",
      caption: "The whole vault goes to Maria, signed by the fundraiser. A second claim, or a late contribution, now fails.",
      actions: [payout("maria", "0 USDC", "9,000 USDC", ["check_contributions()", "9,000 USDC"])],
    },
    {
      title: "Anyone runs [close_contribution()]",
      caption:
        "Each receipt closes and its rent goes back to its backer, whoever sends it. The fundraiser stays open until " +
        "open_contributions reaches zero, so a new raise at the same address can never read an old receipt.",
      actions: [
        { type: "call", handler: "close_contribution()", focus: ["alice", "bob", "carol", "program", "fundraiser", "aliceReceipt", "bobReceipt", "carolReceipt"] },
        { type: "set", changes: [{ id: "fundraiser", key: "open_contributions", value: "0" }] },
        { type: "close", id: "aliceReceipt" },
        { type: "close", id: "bobReceipt" },
        { type: "close", id: "carolReceipt" },
      ],
    },
    {
      title: "Maria runs [close_fundraiser()]",
      caption:
        "With no receipt open, the vault and the fundraiser close and their rent goes back to Maria. " +
        "Whether she builds the machine is outside the program, as it is on Kickstarter.",
      actions: [
        { type: "call", handler: "close_fundraiser()", focus: ["maria", "program", "fundraiser", "vault"] },
        { type: "close", id: "vault" },
        { type: "close", id: "fundraiser" },
      ],
    },

    // ---- Second ending: the target is missed
    {
      from: "carolDone",
      title: "Dave backs it with [800]",
      caption:
        "It's possible that too few people back it. Say Dave, who runs a catering company, contributes 800 USDC, and nobody else comes: " +
        "3,600 USDC against a 9,000 USDC target.",
      actions: [
        backer("dave"),
        { type: "call", handler: "contribute()", focus: ["dave", "daveUsdc", "program", "fundraiser", "vault"] },
        { type: "set", changes: [{ id: "dave", title: "Dave (backer)" }] },
        { type: "create", id: "daveReceipt", lines: [field("amount: 0 USDC")] },
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "3,600 USDC" },
            { id: "daveReceipt", key: "amount", value: "800 USDC" },
            { id: "fundraiser", key: "open_contributions", value: "4" },
          ],
        },
        contribution("dave", "200 USDC", "3,600 USDC", ["800 USDC"]),
      ],
    },
    {
      title: "The [deadline] passes",
      caption:
        "Seven days pass with the target missed. No handler marks the raise as failed: refund() simply starts " +
        "accepting calls, and the claim can never succeed.",
      actions: [{ type: "call", handler: null, focus: ["fundraiser", "vault"] }],
    },
    {
      title: "Alice runs [refund()]",
      caption:
        "It checks the deadline has passed and the target was missed. Then, before any token moves, it takes Alice's " +
        "1,000 off current_amount, zeroes her receipt, and counts one fewer open receipt.",
      actions: [
        { type: "call", handler: "refund()", focus: ["alice", "aliceUsdc", "aliceReceipt", "program", "fundraiser", "vault"] },
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "2,600 USDC" },
            { id: "aliceReceipt", key: "amount", value: "0 USDC" },
            { id: "fundraiser", key: "open_contributions", value: "3" },
          ],
        },
      ],
    },
    {
      title: "Alice gets her 1,000 USDC [back]",
      caption: "Exactly what she brought, and her receipt closes with its rent, so she can't be refunded twice.",
      actions: [
        payout("alice", "2,600 USDC", "1,000 USDC", ["refund()", "1,000 USDC"]),
        { type: "close", id: "aliceReceipt" },
      ],
    },
    {
      title: "Everyone is [refunded]",
      caption:
        "Bob and Carol send their own refunds. Dave doesn't come back, so Maria sends his: a refund needs nobody's " +
        "signature, because the tokens can only go to the backer.",
      actions: [
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "1,800 USDC" },
            { id: "bobReceipt", key: "amount", value: "0 USDC" },
            { id: "fundraiser", key: "open_contributions", value: "2" },
          ],
        },
        payout("bob", "1,800 USDC", "1,000 USDC", ["refund()", "800 USDC"]),
        { type: "close", id: "bobReceipt" },
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "800 USDC" },
            { id: "carolReceipt", key: "amount", value: "0 USDC" },
            { id: "fundraiser", key: "open_contributions", value: "1" },
          ],
        },
        payout("carol", "800 USDC", "1,000 USDC", ["refund()", "1,000 USDC"]),
        { type: "close", id: "carolReceipt" },
        {
          type: "set",
          changes: [
            { id: "fundraiser", key: "current_amount", value: "0 USDC" },
            { id: "daveReceipt", key: "amount", value: "0 USDC" },
            { id: "fundraiser", key: "open_contributions", value: "0" },
          ],
        },
        payout("dave", "0 USDC", "1,000 USDC", ["refund()", "800 USDC"]),
        { type: "close", id: "daveReceipt" },
      ],
    },
    {
      title: "Maria runs [close_fundraiser()]",
      caption:
        "With every backer repaid, the vault and the fundraiser close and their rent goes back to Maria. " +
        "Nothing of the failed raise remains, and she can try again with a smaller target.",
      actions: [
        { type: "call", handler: "close_fundraiser()", focus: ["maria", "program", "fundraiser", "vault"] },
        { type: "close", id: "vault" },
        { type: "close", id: "fundraiser" },
      ],
    },
  ];

  window.FUNDRAISER_SCENE = {
    title: "Fundraiser",
    canvas: { width: WIDTH, height: HEIGHT },
    curve,
    network: { text: "Solana Devnet", x: WIDTH - 12, y: curve.yAt(1000) - 12 },
    caption: { x: 16, y: 520, w: 540, h: 104, fontSize: 13 },
    hold: 3000,
    program: "program",
    order: Object.keys(accounts),
    accounts,
    steps,
  };
})();
