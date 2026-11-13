import { mkdir, rm, writeFile } from "node:fs/promises";
import { hostname, homedir } from "node:os";
import { join, dirname } from "node:path";

// One managed publishing host; lock is shared by every checkout and never expires automatically.
export async function withReleaseLock(work, { path = join(homedir(), ".falcon-desktop-release", "writer.lock") } = {}) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  try { await mkdir(path, { mode: 0o700 }); }
  catch (error) { if (error.code === "EEXIST") throw Error(`Desktop release writer locked: ${path}`); throw error; }
  try {
    await writeFile(join(path, "owner.json"), JSON.stringify({ host: hostname(), pid: process.pid, startedAt: new Date().toISOString() }), { mode: 0o600 });
    return await work();
  } finally { await rm(path, { recursive: true }); }
}
