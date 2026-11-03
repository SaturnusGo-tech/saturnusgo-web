import { walkthrough, type ScreenshotStep } from "../../../../model/visual/walkthrough";

const shot = (file: string, height: number, title: string, instruction: string, result: string, alt: string): ScreenshotStep => ({
  title, instruction, result,
  image: { src: `/falcon/docs/2026-11/codex-desktop-${file}-user20261103.jpg`, width: 2880, height, alt },
});

export const codexDesktopWalkthrough = walkthrough("The actual Codex app: Plugins → MCPs → Authenticate", [
  shot("add-server", 1794, "In Codex: Plugins → Add → Add MCP server",
    "Open **Settings** in the **Codex desktop app**, then **Plugins** in the left settings navigation. Click **Add** at the upper right and choose **Add MCP server**. The Add menu is available from this settings page; it is not the Falcon website or the Falcon plugin’s Manage page.",
    "This user-supplied screenshot shows the real Add menu. Its option is named **Add MCP server**. The selected Apps tab in this capture does not mean you need to create an app or a new plugin.",
    "Codex Settings → Plugins with Add open and the Add MCP server option visible."),
  shot("transport", 1800, "Switch Type from STDIO to Streamable HTTP",
    "In **Connect to a custom MCP**, enter your company’s server name in **Name**. Click **Streamable HTTP** to the right of **STDIO**. Then paste **Server URL** from your own Falcon setup. Leave Bearer token, token environment variables and Headers empty for Falcon OAuth. Save the server; restart only if Codex prompts you.",
    "The supplied screenshot shows the form BEFORE switching: **STDIO is selected**. For Falcon, switch to **Streamable HTTP** first. Command to launch, Arguments and STDIO environment fields shown here are not the Falcon URL fields; the HTTP form is not pictured.",
    "Connect to a custom MCP form in Codex with STDIO selected and the Streamable HTTP option beside it."),
  shot("authenticate", 1788, "Open MCPs and authenticate your named server",
    "In the **Codex app**, go to **Settings → Plugins → MCPs**, the tab next to Plugins and Apps. Under **Servers**, find the name you saved. In this example it is **falcon-umbrella**. Click **Authenticate** on the right of THAT row. In the browser, sign in to your company’s Falcon and review projects and permissions before approving access.",
    "The real server row shows **Auto**, **Authenticate**, a settings gear and an enabled toggle. Authenticate is here, not inside the Falcon skill plugin card. After approval return to Codex and start a new chat, then check the company and available projects before requesting changes.",
    "Codex Plugins → MCPs → Servers with the falcon-umbrella row and its Authenticate button."),
  shot("settings-search", 1800, "If you use settings search: choose the Plugins result",
    "The direct route is **Settings → Plugins**. If you instead search for MCP server in settings, choose **MCP servers** with the subtitle **Plugins**. Do not select **MCP server — Hooks** or **Configure MCP servers — Keyboard shortcuts**; those open different settings.",
    "This screenshot demonstrates the navigation trap: search returns several similarly named items and Keyboard shortcuts is currently open. Choose the result whose subtitle says Plugins, then select the **MCPs** tab and your named server row.",
    "Codex settings search results distinguish MCP servers under Plugins from Hooks and Keyboard shortcuts."),
]);
