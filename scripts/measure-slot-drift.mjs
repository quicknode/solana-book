// Measures how far real slots run from the target slot length, for the Time
// chapter's slot drift figures. It reads two block times a known number of
// slots apart and divides, which is the measurement the chapter describes for
// offchain tooling, and reports the skip rate over the current epoch, the
// main reason a slot runs long.
//
// Usage:
//   npm run measure-slot-drift                              # testnet, 200 ms target, one target day of slots
//   npm run measure-slot-drift -- --rpc https://api.mainnet-beta.solana.com
//   npm run measure-slot-drift -- --target-ms 200 --span 432000
//
// Block times are leader-written whole seconds, so each end of the span is out
// by a second or two. Across a day that is a few parts in a hundred thousand,
// far below the drift being measured. A shorter span, which an RPC node with
// little history forces, is less precise, and the output says which span was used.

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};

const rpcUrl = option("rpc", "https://api.testnet.solana.com");
const targetMs = Number(option("target-ms", "200"));
const requestedSpan = Number(option("span", String((24 * 60 * 60 * 1000) / targetMs)));

let requestId = 0;
const rpc = async (method, params = []) => {
  requestId += 1;
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }),
  });
  if (!response.ok) {
    throw new Error(`${method}: HTTP ${response.status} from ${rpcUrl}`);
  }
  const body = await response.json();
  if (body.error) {
    throw new Error(`${method}: ${body.error.message}`);
  }
  return body.result;
};

// A slot can be skipped and have no block, so find the first slot at or after
// `slot` that has one.
const firstBlockAtOrAfter = async (slot) => {
  const [block] = await rpc("getBlocksWithLimit", [slot, 1, { commitment: "finalized" }]);
  if (block === undefined) {
    throw new Error(`no finalized block at or after slot ${slot}`);
  }
  return block;
};

const version = await rpc("getVersion");
const latestSlot = await rpc("getSlot", [{ commitment: "finalized" }]);
const firstAvailableBlock = await rpc("getFirstAvailableBlock");

const endSlot = latestSlot;
const endTime = await rpc("getBlockTime", [endSlot]).catch(async () => {
  // The latest finalized slot is always a block, but guard a race with the node.
  return rpc("getBlockTime", [await firstBlockAtOrAfter(endSlot - 100)]);
});

const startSlot = await firstBlockAtOrAfter(Math.max(endSlot - requestedSpan, firstAvailableBlock));
const startTime = await rpc("getBlockTime", [startSlot]);

const slotsElapsed = endSlot - startSlot;
const secondsElapsed = endTime - startTime;
const averageMs = (secondsElapsed * 1000) / slotsElapsed;
const drift = averageMs / targetMs - 1;
const hoursPerWeek = drift * 7 * 24;

const production = await rpc("getBlockProduction", [{ commitment: "finalized" }]);
let leaderSlots = 0;
let blocksProduced = 0;
for (const [slots, produced] of Object.values(production.value.byIdentity)) {
  leaderSlots += slots;
  blocksProduced += produced;
}
const skipRate = leaderSlots === 0 ? 0 : 1 - blocksProduced / leaderSlots;

const measuredAt = new Date(endTime * 1000).toISOString();
console.log(`RPC:                 ${rpcUrl} (solana-core ${version["solana-core"]})`);
console.log(`Measured at:         ${measuredAt} (slot ${endSlot})`);
console.log(`Span:                ${slotsElapsed.toLocaleString("en-US")} slots, ${(secondsElapsed / 3600).toFixed(2)} hours`);
if (slotsElapsed < requestedSpan * 0.9) {
  console.log(`                     (asked for ${requestedSpan.toLocaleString("en-US")}; the node's history starts at slot ${firstAvailableBlock})`);
}
console.log(`Average slot:        ${averageMs.toFixed(1)} ms against a ${targetMs} ms target`);
console.log(`Drift:               ${(drift * 100).toFixed(1)}%`);
console.log(`A week in slots is:  ${hoursPerWeek >= 0 ? "long" : "short"} by ${Math.abs(hoursPerWeek).toFixed(1)} hours`);
console.log(
  `Skip rate:           ${(skipRate * 100).toFixed(1)}% of ${leaderSlots.toLocaleString("en-US")} leader slots, slots ${production.value.range.firstSlot}-${production.value.range.lastSlot}`,
);
