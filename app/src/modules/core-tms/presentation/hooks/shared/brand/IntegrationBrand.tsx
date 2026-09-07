import { INTEGRATIONS, type IntegrationId } from "../../catalog/integration-definitions";

const assets: Partial<Record<IntegrationId, string>> = {
  youtrack: "youtrack.svg", jira: "jira.svg", confluence: "confluence.svg", slack: "slack.png",
};
export function IntegrationBrand({ provider }: { provider: IntegrationId }) {
  const asset = assets[provider];
  if (asset) return <img src={`/falcon/integrations/${asset}`} alt="" aria-hidden="true" />;
  const Icon = INTEGRATIONS.find((entry) => entry.id === provider)?.icon;
  return Icon ? <Icon aria-hidden="true" /> : null;
}
