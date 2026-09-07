import type { Link } from "../connector-types";

function readableStatus(value: string | undefined) {
  const text = value?.trim();
  if (!text || /^\d+$/.test(text) || /^[a-f0-9]{24}$/i.test(text)
    || /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(text)) return null;
  return text;
}

export function connectorLinkDisplay(link: Pick<Link, "url" | "remoteStatus" | "metadata">) {
  const { hostname, pathname } = new URL(link.url);
  const domain = (name: string) => hostname === name || hostname.endsWith(`.${name}`);
  const provider = domain("linear.app") ? "Linear" : domain("github.com") ? "GitHub"
    : domain("trello.com") ? "Trello" : domain("slack.com") ? "Slack"
    : domain("atlassian.net") ? pathname.startsWith("/wiki/") ? "Confluence" : "Jira" : hostname;
  return { provider, status: readableStatus(link.metadata.remoteStatusName) ?? readableStatus(link.remoteStatus) };
}
