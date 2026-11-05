import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../../walkthroughs/media/screenshot-step";

export const codexWalkthrough = walkthrough("Connect Codex to your company’s Falcon", [
  shot("codex-v2-plugins", "Find Codex in Plugins",
    "Open the account menu → **Settings → Plugins**, then select **Codex**. Company administrators can use **Company admin** to manage the agent separately.",
    "The plugin list opens connection settings. It has no switch for activating or disabling the company agent.",
    "Falcon Plugins settings with Codex and the Company admin link."),
  shot("codex-v2-card", "Open the plugin card",
    "Review the capabilities and example QA requests. If **Install plugin** appears, select it, wait for **Installing**, then choose **Manage**.",
    "The Codex card shows example QA requests, **Manage**, **Install plugin** and the active **Falcon MCP** entry. This view does not install the plugin or establish a personal OAuth connection.",
    "English Codex plugin card with example QA requests, Manage, Install plugin and Falcon MCP."),
  shot("codex-v2-setup", "Copy the server details and authenticate",
    "Open **Falcon MCP**. Copy **Server name** and **Server URL**. In Codex, follow **Settings → Plugins → Add → Add MCP server**, choose **Streamable HTTP** and save these values. Then open **MCPs → Servers → your server name → Authenticate**.",
    "The compact guide has three steps: add the server, approve projects and permissions in your company’s Falcon, then open a new Codex chat to check the connection. Manual TOML / CLI settings remain collapsed until needed.",
    "Compact Falcon MCP setup with Server name and Server URL copy icons and three connection steps."),
  shot("codex-v2-admin", "Manage the company agent in administration",
    "Company administrators open **Company admin → Codex** at **/admin/?page=codex**. Activate the agent here before QA connect. Use **Deactivate Codex** or **Connections → Revoke access** only when you intend to end access, then confirm.",
    "Company administration shows **Codex** active, **8 of 10** seats occupied and two active connections for the signed-in user. Each collapsed connection shows its project count and expiry; no agent status or access was changed.",
    "Codex company administration with agent status, occupied seats and company connection management."),
]);
