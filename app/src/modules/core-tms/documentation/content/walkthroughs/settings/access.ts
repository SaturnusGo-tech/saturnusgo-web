import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";
export const settingsWalkthrough = walkthrough("Settings by task", [
  shot("settings-01-general-20260928-rows-inbox20260928-en-20260928", "Check the project",
    "Open the avatar menu → **Settings**. Under **General**, check the project name, key and status. Select **Edit** to open its properties.",
    "Review the selected project’s saved name, permanent key and status. The left navigation opens the other settings sections.",
    "General settings for Falcon Guide: permanent GUIDE key, no description, unassigned owner, no portfolio, Active status and project actions."),
  shot("settings-04-edit-project-20260928-inbox20260928-en-20260928", "Edit project properties",
    "In General, select **Edit**. Set the name, description, portfolio and owner. The permanent key appears separately and is used in case and run IDs. Select **Save changes** after editing.",
    "Opening the editor does not save a change. Check the current portfolio and responsible person; cancel to retain the saved values.",
    "Project property editor with name, description, portfolio and responsible-person fields."),
  shot("settings-02-appearance-20260928-inbox20260928-en-20260928", "Choose a theme and language",
    "Open **Appearance and language** on the left. Select **Light** or **Dark** under **Theme**, then English or Russian. Changes apply immediately without a separate save action.",
    "Theme and language preferences are saved for this browser and applied to Falcon's workspace screens.",
    "Appearance and language settings with Dark and English selected in the Theme and Language options."),
  shot("settings-05-session-20260928-inbox20260928-en-20260928", "Check the current account",
    "Open **Account and session**. Check the account you are using before editing shared project information.",
    "**Sign out** ends the current session. Theme and language preferences belong to your browser.",
    "Account and session settings displaying the signed-in account and session controls."),
]);
