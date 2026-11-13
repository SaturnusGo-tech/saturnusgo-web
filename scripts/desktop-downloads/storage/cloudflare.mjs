import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { bucket, prefix, latestKey, compareVersions } from "../release/manifest.mjs";
import { identity } from "../retention/plan.mjs";

export async function createCloudflareStore({ accountId = process.env.CLOUDFLARE_ACCOUNT_ID, request = fetch } = {}) {
  if (!/^[a-f0-9]{32}$/.test(accountId ?? "")) throw Error("Set CLOUDFLARE_ACCOUNT_ID for the installer bucket owner");
  let token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    const config = join(homedir(), process.platform === "darwin" ? "Library/Preferences/.wrangler" : ".config/.wrangler", "config/default.toml");
    const auth = await readFile(config, "utf8").catch(() => "");
    const expiry = /^expiration_time\s*=\s*"([^"]+)"/m.exec(auth)?.[1];
    if (expiry && Date.parse(expiry) <= Date.now()) throw Error("Wrangler login expired; run wrangler login first");
    token = /^oauth_token\s*=\s*"([^"]+)"/m.exec(auth)?.[1];
  }
  if (!token) throw Error("Existing Wrangler OAuth or CLOUDFLARE_API_TOKEN is required");
  const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects`;
  const call = async (key = "", options = {}) => {
    if (key && !key.startsWith(prefix)) throw Error("Refusing access outside installer namespace");
    const path = key ? `/${key.split("/").map(encodeURIComponent).join("/")}` : "";
    const { query = "", ...init } = options;
    const response = await request(base + path + query, { ...init, redirect: "error", headers: { Authorization: `Bearer ${token}`, ...init.headers } });
    if (!response.ok && response.status !== 404) throw Error(`R2 ${init.method ?? "GET"} failed (${response.status})`);
    return response;
  };
  const json = async key => {
    const response = await call(key); if (response.status === 404) return null;
    const body = await response.text(); if (Buffer.byteLength(body) > 65536) throw Error("Oversized installer metadata");
    return JSON.parse(body);
  };
  const store = {
    read: key => call(key), json,
    async list() {
      const objects = [], seen = new Set(); let cursor;
      do {
        const query = new URLSearchParams({ prefix }); if (cursor) query.set("cursor", cursor);
        const result = await (await call("", { query: `?${query}` })).json();
        if (!result.success || !Array.isArray(result.result)) throw Error("Invalid R2 inventory response");
        for (const object of result.result) {
          if (!object.key.startsWith(prefix) || typeof object.etag !== "string" || !object.etag || !Number.isSafeInteger(object.size) || object.size < 0 || !Number.isFinite(Date.parse(object.last_modified))) throw Error("Invalid R2 object identity");
          if (objects.some(o => o.key === object.key)) throw Error("Duplicate R2 object in inventory");
          objects.push(identity(object));
        }
        if (result.result_info?.is_truncated && !result.result_info.cursor) throw Error("Missing R2 inventory cursor");
        cursor = result.result_info?.is_truncated ? result.result_info.cursor : null;
        if (cursor && seen.has(cursor)) throw Error("Repeated R2 inventory cursor"); seen.add(cursor);
      } while (cursor);
      return objects.sort((a, b) => a.key.localeCompare(b.key));
    },
    async inventory() {
      const objects = await store.list(), latest = await json(latestKey), records = {}, retired = {}, uploads = {};
      for (const object of objects) {
        const match = /^falcon\/desktop\/beta\/_retention\/(releases|retired|uploads)\/([^/]+)\.json$/.exec(object.key);
        if (!match) continue;
        if (object.size > 65536) throw Error("Oversized retention provenance");
        const target = { releases: records, retired, uploads }[match[1]];
        target[match[2]] = await json(object.key);
      }
      return { objects, latest, records, retired, uploads };
    },
    async putJson(key, value) {
      if (!/^falcon\/desktop\/beta\/_retention\/(releases|retired|uploads)\/[^/]+\.json$/.test(key)) throw Error("Refusing non-provenance write");
      if (await json(key)) throw Error("Provenance already exists; refusing overwrite");
      await call(key, { method: "PUT", body: `${JSON.stringify(value, null, 2)}\n`, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
      if (JSON.stringify(await json(key)) !== JSON.stringify(value)) throw Error("Provenance write verification failed");
    },
    async remove(key) {
      const match = /^falcon\/desktop\/beta\/([^/]+)\/(.+)$/.exec(key);
      if (!match || !["SHA256SUMS.txt", `Falcon-${match[1]}-mac-arm64-beta.dmg`, `Falcon-${match[1]}-mac-x64-beta.dmg`, `Falcon-${match[1]}-win-x64-beta-setup.exe`].includes(match[2]) || match[1].startsWith("_")) throw Error("Refusing deletion of non-installer key");
      try { compareVersions(match[1], match[1]); } catch { throw Error("Refusing invalid installer version"); }
      await call(key, { method: "DELETE", headers: { "cf-r2-data-catalog-check": "true" } });
    },
  };
  return store;
}
