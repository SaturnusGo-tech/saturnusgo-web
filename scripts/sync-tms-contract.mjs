import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve(
  process.env.TMS_OPENAPI_PATH ?? "../saturnusgo-tms-backend/openapi/v1/openapi.json",
);
const target = resolve("app/src/core/tms/generated/tms-openapi.json");
const raw = await readFile(source, "utf8");
const document = JSON.parse(raw);

if (document?.openapi !== "3.1.0" || typeof document?.info?.version !== "string") {
  throw new Error("TMS OpenAPI source is not the supported versioned contract.");
}

await writeFile(target, raw.endsWith("\n") ? raw : `${raw}\n`, { mode: 0o644 });
