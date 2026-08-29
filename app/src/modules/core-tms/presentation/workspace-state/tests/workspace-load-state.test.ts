import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("workspace loading keeps copy screen-reader-only", () => {
  const source = readFileSync(
    new URL("../WorkspaceLoadState.tsx", import.meta.url),
    "utf8",
  );
  const loadingBranch = source.slice(
    source.indexOf("if (!failure)"),
    source.indexOf("const status"),
  );

  assert.match(loadingBranch, /data-testid="workspace-loading"/);
  assert.match(loadingBranch, /aria-busy="true"/);
  assert.match(loadingBranch, /styles\.srOnly/);
  assert.match(loadingBranch, /workspaceLoaderOrbit/);
  assert.doesNotMatch(loadingBranch, /workspace\.loadingDescription|<h1|<p/);
});
