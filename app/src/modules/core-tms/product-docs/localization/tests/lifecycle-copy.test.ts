import assert from "node:assert/strict";
import test from "node:test";
import { archiveCopy } from "../archive-copy";

test("archive confirmation identifies the privileged restore roles in both languages", () => {
  assert.match(archiveCopy.en.archiveHint, /administrator or QA manager can restore/);
  assert.match(archiveCopy.ru.archiveHint, /администратор или QA-менеджер/);
  assert.doesNotMatch(archiveCopy.en.archiveHint, /you can restore/i);
});
