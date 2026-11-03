import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const createCaseWalkthrough = walkthrough("Prepare a test case in the repository", [
  shot("organization-folder-01-tree-20260928-en-20260928", "Start with the right project",
    "Open **Test cases** and check the project in the top bar. Expand folders and select a case to read its current scenario. The round **+** button above the repository opens a separate new-case draft.",
    "The screenshot shows the real Umbrella-Host repository and an existing selected case. Opening a new draft does not modify that saved case.",
    "Umbrella-Host repository with its folder tree and an existing test case open beside it."),
  shot("case-04-ready-20260928-en-20260928", "Write the scenario and review the properties",
    "Enter a clear title, actions and verifiable expected results. Open **Description** or **Preconditions** to use the Markdown toolbar. Choose the folder and applicable fields on the right. When your own case is ready, select **Create** and review the saved title, key and scenario.",
    "This is an unsaved New test case form with the Markdown editor open. Blank or default values are not completed test instructions. No case was created or saved for this screenshot.",
    "Unsaved New test case form with its Markdown editor, scenario fields and properties."),
]);

export const editCaseWalkthrough = walkthrough("Edit a case and review its revision history", [
  shot("edit-03-history-20260913-en-20260928", "Inspect the history of a saved case",
    "To edit a field, select its text or pencil, make the intended change and apply it. Save the case when ready. Open **Change history** to inspect the author, time and saved change events.",
    "The screenshot reads an existing case’s history. No revision was created for the capture. A new saved revision does not overwrite results from runs that already captured an earlier revision.",
    "History of an existing Umbrella-Host test case, showing its recorded changes."),
]);
