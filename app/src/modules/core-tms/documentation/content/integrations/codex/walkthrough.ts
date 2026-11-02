import { walkthrough, type ScreenshotStep } from "../../../model/visual/walkthrough";

const shot = (name: string, title: string, instruction: string, result: string, alt: string): ScreenshotStep => ({
  title, instruction, result, image: { src: `/falcon/docs/2026-11/falcon-codex-${name}-en.jpg`, alt, width: 1280, height: 720 },
});
export const codexWalkthrough = walkthrough("Falcon connection walkthrough", [
  shot("setup", "Open the Codex setup", "In Falcon open **Integrations → AI → Codex** and check company status and seats.", "This is a synthetic company example; no account was connected.", "Falcon Codex setup for an example company."),
  shot("config", "Copy your company server URL", "Copy **Server URL** from your own company setup into Codex. The TOML and CLI examples also use this company-specific URL.", "The example.test host is demonstration data: do not copy it for your company.", "Falcon setup showing example server configuration."),
  shot("consent", "Review projects", "Sign in with your own Falcon account and select only the projects needed for this connection, including selections on other pages.", "This is a rendered example, not an approved OAuth transaction.", "Example Falcon consent screen with project selection."),
  shot("permissions", "Review permissions", "Review each requested permission for the task. For read-only use, leave optional permissions unchecked. Select write and execution permissions only when needed and authorized.", "This example displays every optional permission checked to show the available fields; it does not recommend or record approval.", "Example consent permission fields with optional permissions checked."),
]);
