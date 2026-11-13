import { buildPlan, digest, fingerprint, identity } from "./plan.mjs";
import { metadataKey } from "../release/manifest.mjs";

// Caller holds the same managed-host lock used by publishing, including all preflight checks.
export async function applyPlan({ store, plan, now = new Date().toISOString() }) {
  const age = Date.parse(now) - Date.parse(plan.generatedAt);
  if (!Number.isFinite(age) || age < 0 || age > 3600000) throw Error("Retention plan expired; create and review a new plan");
  const initial = await store.inventory();
  if (fingerprint(initial) !== plan.snapshot) throw Error("Installer inventory or latest pointer changed; review a new plan");
  const derived = buildPlan({ snapshot: initial, now: plan.generatedAt, adoptions: plan.adopt });
  if (digest(derived) !== digest(plan)) throw Error("Retention plan actions changed or invalid");
  for (const record of plan.adopt) await store.putJson(metadataKey("releases", record.release.version), record);
  for (const item of plan.retire) await store.putJson(metadataKey("retired", item.version), { schema: 1, version: item.version, retiredAt: now });
  let expected = initial;
  // Recheck all identities and pointer before every delete; never delete provenance, pointers, or unknown keys.
  for (const object of plan.delete) {
    const current = await store.inventory();
    const expectedObjects = expected.objects.filter(o => !o.key.includes("/_retention/"));
    const currentObjects = current.objects.filter(o => !o.key.includes("/_retention/"));
    if (digest(current.latest) !== digest(initial.latest) || digest(currentObjects.map(identity)) !== digest(expectedObjects.map(identity))) throw Error("Installer inventory or latest pointer changed during cleanup");
    await store.remove(object.key);
    expected = { ...expected, objects: expected.objects.filter(o => o.key !== object.key) };
  }
  return { retired: plan.retire.length, adopted: plan.adopt.length, deleted: plan.delete.length, deletedBytes: plan.deleteBytes };
}
