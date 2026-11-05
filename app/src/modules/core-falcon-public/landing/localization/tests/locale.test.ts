import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { landingLocaleBootstrap, resolveLandingLocale } from "../model/locale";
import { englishCopy, russianCopy } from "../content/copy";

test("only a Russian browser language selects Russian automatically", () => {
  for (const language of ["ru", "ru-RU", "ru-KZ", "RU-ru", "ru_BY"]) assert.equal(resolveLandingLocale(null, language), "ru");
  for (const language of [undefined, "", "en-US", "kk-KZ", "uk-UA", "es", "fr-CA", "russian"]) assert.equal(resolveLandingLocale(null, language), "en");
  assert.equal(resolveLandingLocale("ru", "en-US"), "ru");
  assert.equal(resolveLandingLocale("en", "ru-RU"), "en");
  assert.equal(resolveLandingLocale("invalid", "ru-RU"), "ru");
});
test("pre-paint bootstrap matches the application, including blocked storage", () => {
  for (const saved of [null, "en", "ru", "invalid"]) for (const language of ["ru-RU", "en-US", "de-DE"]) {
    const html = { dataset: {}, lang: "" };
    runInNewContext(landingLocaleBootstrap, { document: { documentElement: html }, navigator: { language }, localStorage: { getItem: () => saved } });
    assert.equal(html.lang, resolveLandingLocale(saved, language));
    assert.deepEqual(html.dataset, { falconLandingLocale: html.lang });
  }
  const html = { dataset: {}, lang: "" };
  runInNewContext(landingLocaleBootstrap, { document: { documentElement: html }, navigator: { language: "ru" }, localStorage: { getItem() { throw Error("Storage blocked"); } } });
  assert.equal(html.lang, "ru");
});
test("landing locale metadata is complete in English and Russian", () => {
  assert.deepEqual(Object.keys(englishCopy), Object.keys(russianCopy));
  assert.doesNotMatch(JSON.stringify(englishCopy), /[А-Яа-яЁё]/);
});
