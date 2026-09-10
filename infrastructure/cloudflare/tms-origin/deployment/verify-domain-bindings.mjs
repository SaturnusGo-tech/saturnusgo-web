import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { readDomainBindings, verifyDomainBindings } from "./domain-binding-inventory.mjs";

try {
  const [mode, path, ...extra] = process.argv.slice(2);
  if (!["snapshot", "verify"].includes(mode) || !path || !isAbsolute(path) || extra.length) {
    throw new Error("Expected snapshot|verify and an absolute snapshot path");
  }
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk.toString();
    if (input.length > 16_384) throw new Error("Invalid credentials input");
  }
  const bindings = await readDomainBindings(JSON.parse(input));
  input = "";
  if (mode === "snapshot") await writeFile(path, JSON.stringify(bindings), { mode: 0o600 });
  else verifyDomainBindings(JSON.parse(await readFile(path, "utf8")), bindings);
  process.stdout.write(`Worker domains ${mode}: ${bindings.length} verified.\n`);
} catch (error) {
  // Never include raw HTTP, stdin, credentials, or provider error bodies in release logs.
  const allowed = /^(?:Domain |The existing Falcon domain |A Cloudflare bearer |Expected snapshot)/;
  const message = error instanceof Error && allowed.test(error.message) ? error.message : "Domain verification failed";
  process.stderr.write(`${message}. No automatic domain reassignment was attempted.\n`);
  process.exitCode = 1;
}
