#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { hostname } from "node:os";
import { createCloudflareStore } from "../storage/cloudflare.mjs";
import { withReleaseLock } from "../release/lock.mjs";
import { adoptLegacy } from "../provenance/legacy.mjs";
import { buildPlan, fingerprint } from "../retention/plan.mjs";
import { applyPlan } from "../retention/apply.mjs";
const args = process.argv.slice(2);
const value = flag => { const i = args.indexOf(flag); return i < 0 ? undefined : args[i + 1]; };
const allowed = new Set(["--plan", "--apply", "--sha256", "--adopt-legacy", "--managed-host"]);
for (let i = 0; i < args.length; i++) {
  if (!allowed.has(args[i])) throw Error("Unknown retention argument");
  if (args[i] !== "--adopt-legacy" && (!args[++i] || args[i].startsWith("--"))) throw Error("Missing retention argument value");
}
if (value("--apply") && (value("--plan") || args.includes("--adopt-legacy"))) throw Error("Apply accepts only an exact reviewed plan");
const sha = text => createHash("sha256").update(text).digest("hex");
await withReleaseLock(async () => {
  const store = await createCloudflareStore();
  if (value("--apply")) {
    if (value("--managed-host") !== hostname()) throw Error("Apply requires --managed-host matching this exclusive publishing host");
    const body = await readFile(value("--apply"), "utf8");
    if (sha(body) !== value("--sha256")) throw Error("Reviewed plan SHA-256 does not match");
    console.log(JSON.stringify(await applyPlan({ store, plan: JSON.parse(body) }), null, 2));
    return;
  }
  const snapshot = await store.inventory(), now = new Date().toISOString();
  const adoptions = args.includes("--adopt-legacy") ? await adoptLegacy({ store, snapshot, now }) : [];
  if (fingerprint(await store.inventory()) !== fingerprint(snapshot)) throw Error("Inventory changed during planning; retry");
  const plan = buildPlan({ snapshot, now, adoptions }), body = `${JSON.stringify(plan, null, 2)}\n`;
  if (value("--plan")) await writeFile(value("--plan"), body, { mode: 0o600, flag: "wx" });
  console.log(body);
  console.error(`Dry-run only. Plan SHA-256: ${sha(body)}; managed host: ${hostname()}`);
});
