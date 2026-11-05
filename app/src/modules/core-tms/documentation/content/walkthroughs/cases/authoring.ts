import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const createCaseWalkthrough = walkthrough("Prepare a test case in the repository", [
  shot("organization-folder-01-tree-20260928-en-20260928", "Start with the right project",
    "Open **Test cases** and check the project in the top bar. Expand folders and select a case to read its current scenario. The round **+** button above the repository opens a separate new-case draft.",
    "The screenshot shows the actual **Falcon Guide** repository, English **Product guide EN** folder tree and saved **GUIDE-TC-3 · Create a booking with a confirmed payment**. It is a fictional documentation example in **Draft**, not an execution result. Opening a new draft does not modify that saved case.",
    "Falcon Guide English folder tree beside saved GUIDE-TC-3: five-step booking sample, description, preconditions, custom fields and Draft status."),
  shot("case-04-ready-20260928-en-20260928", "Write the scenario and review the properties",
    "Enter a clear title, actions and verifiable expected results. Open **Description** or **Preconditions** to use the Markdown toolbar. Choose the folder and applicable fields on the right. When your own case is ready, select **Create** and review the saved title, key and scenario.",
    "The unsaved **Create a booking with a confirmed payment** draft contains an English description, preconditions and one action with its expected result. The folder is **Product guide EN / Bookings**; product fields remain unselected and the status is **Draft**. Inline description and precondition editors are closed. No case was created or executed for this screenshot.",
    "Filled unsaved English New test case draft: booking title, description, preconditions, one action and expected result, folder selection, properties and Create button."),
]);

export const editCaseWalkthrough = walkthrough("Edit a case and review its revision history", [
  shot("edit-03-history-20260913-en-20260928", "Inspect the history of a saved case",
    "To edit a field, select its text or pencil, make the intended change and apply it. Save the case when ready. Open **Change history** to inspect the author, time and saved change events.",
    "The **General** card of saved **GUIDE-TC-3** shows its creation and update times and revision author **Codex**. Individual **Change history** events are not shown in this capture; no revision was created for it. A new saved revision does not overwrite results from runs that already captured an earlier revision.",
    "General card of saved English GUIDE-TC-3 with creation/update timestamps and Codex revision author; no history event timeline shown."),
]);
