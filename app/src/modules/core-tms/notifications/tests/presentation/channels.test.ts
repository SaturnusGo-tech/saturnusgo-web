import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import type { NotificationChannels } from "../../presentation/NotificationChannels";
const model = { settings: { telegramUsername: "falcon_bot", telegramConnected: false }, permission: "default", busy: false };
for (const desktop of [false, true]) test(`channels expose honest email and platform delivery (desktop=${desktop})`, () => {
  const h = componentHarness();
  const { NotificationChannels: render } = h.load<{ NotificationChannels: typeof NotificationChannels }>(new URL("../../presentation/NotificationChannels.tsx", import.meta.url));
  const all = nodes(h.render(() => render({ model, ru: false, desktop } as never)));
  assert.equal(all.some(n => n.props["data-channel"] === "browser"), !desktop);
  assert.equal(all.some(n => n.props["data-channel"] === "email"), true);
  const email = all.find(n => n.type === "PreferenceSwitch" && n.props.label === "Email delivery");
  assert.equal(email?.props.disabled, true);
  const telegram = all.find(n => n.type === "PreferenceSwitch" && n.props.label === "Receive in Telegram");
  assert.equal(telegram?.props.selected, false, "a link is not a confirmed connection");
});
test("Telegram pending confirmation preserves the verified identity step", () => {
  const h = componentHarness();
  const { NotificationChannels: render } = h.load<{ NotificationChannels: typeof NotificationChannels }>(new URL("../../presentation/NotificationChannels.tsx", import.meta.url));
  const all = nodes(h.render(() => render({ ru: false, desktop: false, model: { ...model,
    settings: { ...model.settings, pendingTelegram: { name: "QA account" } } } } as never)));
  assert.ok(all.some(n => n.type === "TelegramConnection"), "pending identity must remain actionable");
});
