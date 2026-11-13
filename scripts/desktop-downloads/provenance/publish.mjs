import { metadataKey, filesFor } from "../release/manifest.mjs";
import { buildPlan, digest, identity } from "../retention/plan.mjs";
import { applyPlan } from "../retention/apply.mjs";

export function createPublishingLifecycle({ store, now = () => new Date().toISOString(), log = console.log }) {
  return {
    async beforePublish(release) {
      if (await store.json(metadataKey("retired", release.version))) throw Error("Cannot republish a retired installer version");
      const key = metadataKey("uploads", release.version), previous = await store.json(key);
      if (previous && digest(previous.release) !== digest(release)) throw Error("Upload provenance manifest changed");
      if (!previous) await store.putJson(key, { schema: 1, release, startedAt: now() });
    },
    async afterPublish(release) {
      let snapshot = await store.inventory();
      if (digest(snapshot.latest) !== digest(release)) throw Error("Published latest changed before housekeeping");
      const objects = snapshot.objects.filter(o => filesFor(release).includes(o.key)).map(identity).sort((a, b) => a.key.localeCompare(b.key));
      if (objects.length !== 4) throw Error("Verified installer objects missing before housekeeping");
      const key = metadataKey("releases", release.version), previous = snapshot.records[release.version];
      const record = { schema: 1, release, verification: "sha256", recordedAt: now(), objects };
      if (previous && (digest(previous.release) !== digest(release) || digest(previous.objects) !== digest(objects))) throw Error("Verified provenance changed");
      if (!previous) await store.putJson(key, record);
      snapshot = await store.inventory();
      const plan = buildPlan({ snapshot, now: now() });
      log(JSON.stringify({ installerRetentionPlan: plan }));
      const result = await applyPlan({ store, plan, now: now() });
      log(JSON.stringify({ installerRetention: result }));
    },
  };
}
