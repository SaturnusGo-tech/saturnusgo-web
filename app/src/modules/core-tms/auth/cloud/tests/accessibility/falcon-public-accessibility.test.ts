import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { htmlLanguageForPath, isFalconPublicPath } from "../../../../../../shared/_components/route-flags";

const root = process.cwd();

test("Falcon public routes keep their Russian document language", () => {
  for (const pathname of ["/", "/signup", "/signup/", "/cloud-login/"]) {
    assert.equal(isFalconPublicPath(pathname), true);
    assert.equal(htmlLanguageForPath(pathname, "en"), "ru");
  }
  assert.equal(isFalconPublicPath("/testcases/umbrella-home/work/"), false);
  assert.equal(htmlLanguageForPath("/partners/", "es"), "es");
});

test("Falcon public header keeps direct auth actions without feature navigation", () => {
  const source = readFileSync(resolve(
    root,
    "app/src/modules/core-falcon-public/landing/FalconHeader.tsx",
  ), "utf8");

  assert.match(source, /<FalconBrand inverse \/>/);
  assert.match(source, /href=\{TMS_ADMIN_LOGIN_PATH\}>Войти<\/Link>/);
  assert.match(source, /href="\/signup\/">Попробовать<\/Link>/);
  assert.doesNotMatch(source, /const navigation/);
  assert.doesNotMatch(source, /falcon-mobile-menu/);
  assert.doesNotMatch(source, /aria-modal/);
  assert.doesNotMatch(source, />Кейсы<|>Прогоны<|>Дефекты<|>Аналитика</);
});

test("Falcon auth controls use a solid high-contrast focus indicator", () => {
  const styles = readFileSync(resolve(
    root,
    "app/src/modules/core-falcon-public/auth/cloudAuth.module.css",
  ), "utf8");

  assert.match(styles, /\.page :focus-visible \{ outline: 3px solid #171717; outline-offset: 3px; \}/);
  assert.match(styles, /\.password:focus-within \{[^}]*outline: 3px solid #171717/s);
  assert.doesNotMatch(styles, /:focus(?:-visible|-within)?[^}]*outline:\s*0/);
});
