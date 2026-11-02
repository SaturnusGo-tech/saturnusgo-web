import { isProvider, type Provider } from "../../connectors/model/connector-types";
export type IntegrationScreen = "catalog" | "youtrack" | "codex" | Provider;
export function integrationScreen(search: string): IntegrationScreen {
  const selected = new URLSearchParams(search).get("integration");
  return selected && (isProvider(selected) || selected === "youtrack" || selected === "codex") ? selected : "catalog";
}
