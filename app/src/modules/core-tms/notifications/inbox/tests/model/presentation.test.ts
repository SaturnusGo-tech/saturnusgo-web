import assert from "node:assert/strict";
import { test } from "node:test";
import { notificationHref, notificationTime } from "../../model/presentation";

const current = "http://localhost:4542/testcases/umbrella-home/work/?workspaceId=w&view=cases";
const target = "/testcases/umbrella-home/work/?workspaceId=w&projectId=p&view=runs&runId=r&runItemId=i";
test("production notification links rebase to the current Falcon origin without losing exact entity context", () => {
  const url = notificationHref(`https://tms.saturnusgo.com${target}`, current, "w");
  assert.equal(url, `http://localhost:4542${target}`); assert.equal(notificationHref(target, current, "w"), url);
  const account = "/testcases/umbrella-home/work/?workspaceId=w&view=config&settings=account";
  assert.equal(notificationHref(account, current, "w"), `http://localhost:4542${account}`);
});

test("managed company notifications rebase to the current origin with their exact authorized workspace and entity", () => {
  const path = target.replace("workspaceId=w", "workspaceId=workspace_umbrella_home");
  for (const host of ["umbrella-falcon.saturnusgo.com", "qa-tools-falcon.saturnusgo.com"])
    for (const origin of ["https://tms.saturnusgo.com", "https://umbrella-falcon.saturnusgo.com", "http://localhost:4542"])
      assert.equal(notificationHref(`https://${host}${path}`, `${origin}${path}`, "workspace_umbrella_home"), `${origin}${path}`);
});

test("managed origin acceptance never includes lookalike domains, unowned hostnames, ports, HTTP or another workspace", () => {
  for (const origin of ["https://evil.example", "https://api.saturnusgo.com", "https://falcon.saturnusgo.com",
    "https://umbrella-falcon.saturnusgo.com.evil.example", "https://evil.umbrella-falcon.saturnusgo.com",
    "https://-umbrella-falcon.saturnusgo.com", "https://umbrella--home-falcon.saturnusgo.com",
    "https://umbrella-falcon.saturnusgo.com:444", "http://umbrella-falcon.saturnusgo.com", "https://user:pass@umbrella-falcon.saturnusgo.com"])
    assert.equal(notificationHref(`${origin}${target}`, current, "w"), null, origin);
  const managed = `https://umbrella-falcon.saturnusgo.com${target}`;
  assert.equal(notificationHref(managed, current, "other"), null);
  assert.equal(notificationHref(`${managed}&workspaceId=other`, current, "w"), null);
});

test("malicious or cross-workspace URLs never enter client navigation", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,bad", `https://evil.example${target}`, `//evil.example${target}`,
    `https://tms.saturnusgo.com.evil.example${target}`, `https://user:pass@tms.saturnusgo.com${target}`,
    target.replace("workspaceId=w", "workspaceId=other"), target.replace("workspaceId=w&", ""), "/api/private?workspaceId=w",
    `${target}&workspaceId=other`, "https://[broken"]) {
    assert.equal(notificationHref(value, current, "w"), null, value);
  }
});

test("relative times cover exact boundaries in both languages and reject invalid dates", () => {
  const now = Date.UTC(2026, 8, 28, 12), before = (seconds: number) => new Date(now - seconds * 1000).toISOString();
  assert.equal(notificationTime(before(59), "en", now), "Just now"); assert.equal(notificationTime(before(-60), "ru", now), "Только что");
  assert.equal(notificationTime(before(60), "en", now), "1 minute ago"); assert.equal(notificationTime(before(120), "ru", now), "2 минуты назад");
  assert.equal(notificationTime(before(3600), "en", now), "1 hour ago"); assert.equal(notificationTime(before(86400), "en", now), "yesterday");
  const date = before(7 * 86400);
  assert.equal(notificationTime(date, "en", now), new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(date)));
  assert.equal(notificationTime("not-a-date", "en", now), "");
});
