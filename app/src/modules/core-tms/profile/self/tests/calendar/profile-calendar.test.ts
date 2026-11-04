import assert from "node:assert/strict";
import { test } from "node:test";
import { profileCalendar } from "../../domain/calendar/profile-calendar";

void test("calendar preserves leap days, leading weeks and real counts without counting runs twice", () => {
  const calendar = profileCalendar(2024, [{ date: "2024-02-29", authoredCases: 2, executedCases: 3, defects: 1, runs: 2 }], "2024-03-01");
  assert.equal(calendar.days.length, 366);
  assert.equal(calendar.cells[0], null);
  assert.equal(calendar.days.find(day => day.date === "2024-02-29")?.count, 6);
  assert.equal(calendar.days.find(day => day.date === "2024-03-02")?.future, true);
  assert.equal(calendar.total, 6);
  assert.equal(calendar.months.length, 12);
});
void test("calendar scopes supplied dates to the selected year and keeps zero activity visible", () => {
  const calendar = profileCalendar(2025, [{ date: "2024-12-31", authoredCases: 99, executedCases: 0, defects: 0, runs: 0 }], "2026-01-01");
  assert.equal(calendar.days.length, 365);
  assert.equal(calendar.days.every(day => day.count === 0 && !day.future), true);
  assert.equal(calendar.total, 0);
});
