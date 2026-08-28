import assert from "node:assert/strict";
import test from "node:test";
import {
  TMS_LOCALE_STORAGE_KEY,
  isTmsLocale,
  resolveTmsLocale,
  tmsLanguageTag,
} from "../model/locale";
import { formatCount } from "../format/count";
import { localizedLabel } from "../format/labels";

test("uses the dedicated TMS preference key", () => {
  assert.equal(TMS_LOCALE_STORAGE_KEY, "tms.locale.v1");
});

test("a valid saved locale wins over browser language", () => {
  assert.equal(resolveTmsLocale("en", "ru-RU"), "en");
  assert.equal(resolveTmsLocale("ru", "en-US"), "ru");
});

test("Russian browser variants default to Russian", () => {
  assert.equal(resolveTmsLocale(null, "ru"), "ru");
  assert.equal(resolveTmsLocale(undefined, "RU-ru"), "ru");
});

test("unsupported or absent browser languages default to English", () => {
  assert.equal(resolveTmsLocale("de", "de-DE"), "en");
  assert.equal(resolveTmsLocale(null, undefined), "en");
});

test("locale guards and language tags remain aligned", () => {
  assert.equal(isTmsLocale("ru"), true);
  assert.equal(isTmsLocale("fr"), false);
  assert.equal(tmsLanguageTag("en"), "en-US");
  assert.equal(tmsLanguageTag("ru"), "ru-RU");
});

test("Russian counts follow one, few, and many forms", () => {
  const forms = ["кейс", "кейса", "кейсов"] as const;
  assert.equal(formatCount("ru", 1, ["case", "cases"], forms), "1 кейс");
  assert.equal(formatCount("ru", 2, ["case", "cases"], forms), "2 кейса");
  assert.equal(formatCount("ru", 5, ["case", "cases"], forms), "5 кейсов");
  assert.equal(formatCount("ru", 11, ["case", "cases"], forms), "11 кейсов");
  assert.equal(formatCount("ru", 21, ["case", "cases"], forms), "21 кейс");
});

test("stable enum values receive locale-aware labels", () => {
  assert.equal(localizedLabel("en", "in_progress"), "In progress");
  assert.equal(localizedLabel("ru", "in_progress"), "В процессе");
  assert.equal(localizedLabel("ru", "critical"), "Критический");
});
