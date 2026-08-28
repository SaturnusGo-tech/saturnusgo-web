import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";

const roots = ["app/src/core/tms", "app/src/modules/core-tms"];
const codeExtensions = new Set([".ts", ".tsx"]);
const files = [];

function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "generated") visit(path);
    } else if (codeExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }
}

for (const root of roots) visit(root);

const failures = [];
const directoryCounts = new Map();
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const lineCount = source === "" ? 0 : source.split("\n").length - Number(source.endsWith("\n"));
  if (lineCount > 200) failures.push(`${file}: ${lineCount} lines (maximum 200)`);
  const directory = dirname(file);
  directoryCounts.set(directory, (directoryCounts.get(directory) ?? 0) + 1);
  if (
    file.includes("/presentation/") &&
    /from\s+["'][^"']*\/(?:data|infrastructure|transport)\//.test(source)
  ) {
    failures.push(`${file}: presentation imports a transport implementation`);
  }
}

for (const [directory, count] of directoryCounts) {
  if (count > 2) failures.push(`${directory}: ${count} handwritten code files (maximum 2)`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`TMS architecture checks passed for ${files.length} files.`);
}
