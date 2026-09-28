import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";
export const settingsWalkthrough = walkthrough("Settings by task", [
  shot("settings-01-general-20260928-rows-inbox20260928-en-20260928", "Check the project",
    "Open **Settings** in the global sidebar. Under **General**, check the project name, key and status. Select **Edit** to open its properties.",
    "The screenshot shows Payments with key PAY and Active status. Other settings sections are available on the left.",
    "Payments general settings with its description, PAY key, Active status and archive action."),
  shot("settings-04-edit-project-20260928-inbox20260928-en-20260928", "Edit project properties",
    "In General, select **Edit**. Set the name, description, portfolio and owner. The permanent key appears separately and is used in case and run IDs. Select **Save changes** after editing.",
    "The example shows Payments in Northstar Banking with Anna Taylor as owner. No changes have been made yet, so saving is unavailable.",
    "Edit project form with Payments, its description, Northstar Banking portfolio, Anna Taylor and key PAY."),
  shot("settings-02-appearance-20260928-inbox20260928-en-20260928", "Choose a theme and language",
    "Open **Appearance and language** on the left. Select the light or dark theme card, then English or Russian. Changes apply immediately without a separate save action.",
    "Theme and language preferences are saved for this browser and applied to Falcon's workspace screens.",
    "Appearance and language settings with the light theme and English selected and the dark theme and Russian available."),
  shot("settings-03-exchange-20260928-rows-inbox20260928-en-20260928", "Transfer your test repository",
    "Open **Import and export** in the project group. **Export JSON** downloads a file. **Import cases** opens a separate page for choosing a file, project and folder.",
    "The import page includes source file history, the current operation's result and partial-import continuation. JSON does not transfer all project data; review the limits in the import and export article.",
    "Payments Import and export settings with separate Export JSON and Import cases actions."),
  shot("settings-05-session-20260928-inbox20260928-en-20260928", "Check the current account",
    "Open **Account and session**. Check the account name you are working under; the screenshot shows Anna Taylor.",
    "**Sign out** ends the current session. Theme and language preferences belong to your browser.",
    "Account and session settings with Anna Taylor's name and the Sign out button."),
]);
