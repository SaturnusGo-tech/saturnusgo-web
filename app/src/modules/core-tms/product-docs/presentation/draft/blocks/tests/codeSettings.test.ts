import assert from "node:assert/strict";
import test from "node:test";
import { productDocCodeSettings, updateProductDocCodeSetting } from "../engine/codeSettings";

test("code snippets wrap and number lines by default", () => {
  assert.deepEqual(productDocCodeSettings("title=example"), { wrap: true, lineNumbers: true });
});

test("a code setting round trips without dropping other fence metadata", () => {
  const meta = updateProductDocCodeSetting('title="example one" falcon-no-line-numbers', "wrap", false);
  assert.equal(meta, 'title="example one" falcon-no-line-numbers falcon-no-wrap');
  assert.deepEqual(productDocCodeSettings(meta), { wrap: false, lineNumbers: false });
  assert.equal(updateProductDocCodeSetting(meta, "lineNumbers", true), 'title="example one" falcon-no-wrap');
  assert.deepEqual(productDocCodeSettings('title="this says falcon-no-wrap on purpose"'), { wrap: true, lineNumbers: true });
});
