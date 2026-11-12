import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { hooksCopy } from "../../../shared/hooks-copy";
import type { WebhookSection } from "../../sections/webhook/WebhookSection";

const copy = hooksCopy(false);
test("webhook token stays masked until reveal and copying uses its exact value without a settings write", async () => {
  const copied: string[] = [];
  const h = componentHarness(undefined, { navigator: { clipboard: { writeText: async (value: string) => { copied.push(value); } } } });
  Object.assign(h.window, { setTimeout() {} });
  const { WebhookSection: View } = h.load<{ WebhookSection: typeof WebhookSection }>(new URL("../../sections/webhook/WebhookSection.tsx", import.meta.url));
  const setup = { callbackUrl: "https://callback.example/hook", connectionRevision: 1, authentication: { headerName: "X-YouTrack-Token", headerValue: "sample-SECRET-exact" } } as Parameters<typeof View>[0]["setup"];
  const render = () => nodes(h.render(() => View({ copy, setup, status: "ready" })));
  const token = () => render().find(node => node.props.label === copy.webhookToken)!;
  assert.equal(token().props.type, "password");
  await invoke(token(), "onCopy"); assert.deepEqual(copied, ["sample-SECRET-exact"]);
  const reveal = nodes(token().props.action).find(node => node.type === "IntegrationButton")!;
  assert.ok(reveal); invoke(reveal, "onPress"); assert.equal(token().props.type, "text");
  invoke(nodes(token().props.action).find(node => node.type === "IntegrationButton")!, "onPress");
  assert.equal(token().props.type, "password");
});
