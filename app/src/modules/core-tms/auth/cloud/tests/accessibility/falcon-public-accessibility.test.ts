import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
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
  assert.match(source, /href="\/signup\/">Создать аккаунт<\/Link>/);
  assert.doesNotMatch(source, /const navigation/);
  assert.doesNotMatch(source, /falcon-mobile-menu/);
  assert.doesNotMatch(source, /aria-modal/);
  assert.doesNotMatch(source, />Кейсы<|>Прогоны<|>Дефекты<|>Аналитика</);
});

test("Falcon landing uses plain product labels and marks future integrations honestly", () => {
  const hero = readFileSync(resolve(
    root,
    "app/src/modules/core-falcon-public/landing/FalconHeroCinema.tsx",
  ), "utf8");
  const landing = readFileSync(resolve(
    root,
    "app/src/modules/core-falcon-public/landing/FalconLanding.tsx",
  ), "utf8");
  const integrations = readFileSync(resolve(
    root,
    "app/src/modules/core-falcon-public/landing/FalconIntegrations.tsx",
  ), "utf8");

  assert.match(hero, /Система управления ручным тестированием/);
  assert.match(hero, /Создавайте тест-кейсы, проводите тест-раны, регистрируйте дефекты/);
  for (const title of [
    "Создавайте тест-кейсы и обновляйте сценарии",
    "Собирайте тест-раны и фиксируйте результаты",
    "Регистрируйте дефекты во время тестирования",
    "Отслеживайте состояние тестирования на дашборде",
  ]) {
    assert.match(landing, new RegExp(`title="${title}"`));
  }

  for (const staleCopy of [
    "Тест-кейсы, прогоны и дефекты с общей историей",
    "Сценарий читается с первого взгляда",
    "Ревизия фиксируется в момент запуска",
    "Дефект уходит в YouTrack",
    "Метрика ведёт к причине",
    "Перенесите первый сценарий в Falcon",
    "Кейс изменился. Старый прогон — нет.",
    "Сценарий не отрывается от результата",
    "Шаги, подшаги и ожидаемый результат",
    "Прогон не переписывается задним числом",
    "Баг-репорт начинается с неуспешного шага",
    "Любую цифру можно раскрыть",
  ]) {
    assert.equal(`${hero}\n${landing}\n${integrations}`.includes(staleCopy), false);
  }

  assert.match(integrations, /План интеграций/);
  assert.match(integrations, /Перечисленные интеграции запланированы/);
  for (const service of [
    "YouTrack",
    "Jira",
    "Slack",
    "Confluence",
    "Trello",
    "GitHub",
    "GitLab",
    "Jenkins",
    "TeamCity",
    "Linear",
    "Sentry",
  ]) {
    assert.match(integrations, new RegExp(`name: "${service}"`));
  }
  assert.match(integrations, /REST API и вебхуки/);

  const youTrackMark = resolve(root, "public/falcon/integrations/youtrack.svg");
  assert.equal(existsSync(youTrackMark), true);
  assert.ok(statSync(youTrackMark).size > 0);
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
