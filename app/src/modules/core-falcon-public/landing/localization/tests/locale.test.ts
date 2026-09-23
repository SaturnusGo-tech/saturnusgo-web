import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { landingLocaleBootstrap, resolveLandingLocale } from "../model/locale";
import { englishCopy, russianCopy } from "../content/copy";
import * as english from "../../content/demos.en";
import * as russian from "../../content/demos";

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
test("English copy is complete and each demo uses its own localized media", () => {
  assert.deepEqual(Object.keys(englishCopy), Object.keys(russianCopy));
  assert.doesNotMatch(JSON.stringify(englishCopy), /[А-Яа-яЁё]/);
  assert.doesNotMatch(JSON.stringify(english), /[А-Яа-яЁё]/);
  assert.equal(Object.keys(english.demos).length, 7);
  for (const key of Object.keys(russian.demos) as (keyof typeof russian.demos)[]) {
    assert.notEqual(english.demos[key].src, russian.demos[key].src);
    assert.match(english.demos[key].captions, /2026-09-english-final\/.+\.vtt$/);
  }
});

test("each English demo ships a video, poster and English caption track", async () => {
  const { readFile, stat } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  for (const demo of Object.values(english.demos)) {
    for (const file of [demo.src, demo.poster, demo.captions]) {
      assert.ok((await stat(resolve(process.cwd(), "public", file.slice(1)))).size > 0, file);
    }
    const captions = await readFile(resolve(process.cwd(), "public", demo.captions.slice(1)), "utf8");
    assert.ok(captions.startsWith("WEBVTT\n"));
    assert.match(captions, /\d{2}:\d{2}:\d{2}\.\d{3} --> /);
    assert.doesNotMatch(captions, /[А-Яа-яЁё]/);
  }
});
