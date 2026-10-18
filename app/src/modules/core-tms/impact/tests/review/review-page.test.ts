import assert from "node:assert/strict";
import { test } from "node:test";
import { reviewPage } from "../../model/review/review-page";

const items = Array.from({ length: 127 }, (_, index) => ({ id: index, text: `HOST-TC-${index + 1} Проверка ${index + 1}` }));
const text = (item: typeof items[number]) => item.text;

test("review pages bound long lists without dropping any entries", () => {
  const first = reviewPage(items, "", 1, text);
  assert.equal(first.items.length, 10);
  assert.equal(first.pages, 13);
  assert.equal(first.total, 127);
  assert.deepEqual([first.start, first.end], [1, 10]);
  const all = Array.from({ length: first.pages }, (_, page) => reviewPage(items, "", page + 1, text).items).flat();
  assert.deepEqual(all, items);
});

test("search uses all entries and matches a case key or localized text without changing source order", () => {
  const found = reviewPage(items, "  host-tc-127  ", 1, text);
  assert.deepEqual(found.items, [items[126]]);
  assert.equal(found.total, 1);
  assert.equal(reviewPage(items, "ПРОВЕРКА", 1, text).total, 127);
  assert.equal(items.length, 127);
});

test("a disappearing last page clamps safely and an empty result has an honest range", () => {
  const last = reviewPage(items.slice(0, 12), "", 13, text);
  assert.equal(last.page, 2);
  assert.deepEqual(last.items, items.slice(10, 12));
  assert.deepEqual([last.start, last.end], [11, 12]);
  const empty = reviewPage(items, "missing", 99, text);
  assert.deepEqual([empty.page, empty.pages, empty.start, empty.end], [1, 1, 0, 0]);
  assert.deepEqual(empty.items, []);
});
