import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../../walkthroughs/media/screenshot-step";

export const codexWalkthrough = walkthrough("From the plugin to your company’s Falcon MCP settings", [
  shot("codex-01-plugins", "Find Codex in plugin settings",
    "Open the account menu → **Settings → Plugins**, then select **Codex**. The integration directory also lists it under **AI**. Open **Manage** to inspect the company connection before changing any setting.",
    "These are the actual Umbrella Home plugin settings. The Company Codex agent switch is on. A listed or installed plugin alone does not grant a person access to every project.",
    "Umbrella-Host Plugins settings with Codex enabled and the current integration states."),
  shot("codex-02-card", "Review the plugin’s capabilities",
    "Read the description and example QA requests. For a first installation, choose **Install plugin**, wait for **Installing**, then open **Manage**. Installation in Falcon and OAuth authorization in Codex are separate steps.",
    "The screenshot shows the existing Codex plugin card. Its examples describe supported tasks; viewing the card has not created cases, started a run or granted access.",
    "Codex plugin detail card in Falcon with example QA tasks and its connection entry."),
  shot("codex-03-manage", "Inspect company and personal access",
    "In **Plugin settings → Codex**, select **Falcon MCP** to expand connection setup. **Guide** opens this documentation and **View details** returns to the plugin card. Review company status and occupied seats before activation or revocation.",
    "At capture time, company Codex is Active with 8 of 10 seats occupied and one existing personal connection covering 12 projects. This page was inspected without activating, disabling or revoking access.",
    "Codex management in Umbrella Home showing Active company status, 8 of 10 seats and one existing account connection."),
  shot("codex-04-mcp", "Copy the settings from your own company",
    "Expand **Falcon MCP** and copy **Server URL**. Use a distinct server name for each company. In the Codex app follow **Settings → Plugins → Add → Add MCP server**, select **Streamable HTTP**, then **Plugins → MCPs → Servers → Authenticate**. The next section shows those exact Codex screens.",
    "This Falcon capture predates the navigation wording correction: use it to locate the company URL and config.toml/CLI, and follow the NEXT section for the Codex menu path. Umbrella Home uses https://umbrella-falcon.saturnusgo.com/api/v1/mcp; copy the address from your own company’s settings.",
    "Expanded Falcon MCP setup with the actual company server URL, OAuth instructions and TOML and CLI examples."),
]);
