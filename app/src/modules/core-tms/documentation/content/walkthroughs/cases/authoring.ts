import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const createCaseWalkthrough = walkthrough("Create a test case from the repository", [
  shot("organization-folder-01-tree-20260928-en-20260928", "Start with the right project",
    "Open **Test cases** and check the project in the top bar. The example uses Payments. To add a check, select the round **+** button above the repository tree.",
    "The screenshot shows the Payments repository with no case selected. The + button opens a new draft; selecting an existing row opens that case instead.",
    "Payments repository with its folder tree, no case selected and the round add-case button."),
  shot("case-04-ready-20260928-en-20260928", "Write the scenario and set properties",
    "Name the case **Open Falcon help**. Add the step **Open Help from the sidebar.** with the expected result **The Falcon guide opens with its article list and search.** On the right, select a folder, **Mobile banking**, **Transfers QA**, regression **false** and status **Draft**. If the check requires an initial state, describe it in **Preconditions**.",
    "The draft contains one step with a verifiable expected result and selected properties. Description and preconditions are empty in the screenshot; the case has not been saved yet.",
    "New Open Falcon help case with one step, its expected result, Mobile banking, Transfers QA and regression false."),
  shot("case-05-saved-20260928-en-20260928", "Create the case and check the result",
    "Select **Create** at the bottom right and wait for the saved case to open. Check the title, action, expected result and field values on the right.",
    "The saved example is **PAY-TC-34**, with **Draft** status, one step, Mobile banking, Transfers QA and regression false. Its description was also filled in: Verify access to the Falcon guide from the sidebar.",
    "Saved PAY-TC-34 Open Falcon help case with Draft status, one step and product group, product and regression values."),
]);

export const editCaseWalkthrough = walkthrough("Edit a case and review its revision history", [
  shot("revision-01-edit-20260913-en-20260928",
    "Open a field for editing",
    "In the case details, select a field's text or pencil icon. This example edits the description of the existing PAY-TC-34 case.",
    "The field opens in the Markdown editor. The other sections stay in the case details; you do not need to create a separate case copy.",
    "Description editor open for the existing PAY-TC-34 practice test case."),
  shot("edit-02-saved-20260913-en-20260928",
    "Save the change",
    "Select **Apply** below the field, then the main **Save** button. The example description reads: Verify access to the Falcon guide from the sidebar. The saved example also applies yellow highlighting using the editor’s Highlight control.",
    "The saved text appears in reading mode. Runs created earlier continue to use their captured case revision.",
    "Saved PAY-TC-34 description with yellow highlighting on the sentence about accessing the guide from the sidebar."),
  shot("edit-03-history-20260913-en-20260928",
    "Review the history",
    "Open the **Change history** tab. Check the author, time and change event; use the history to follow the sequence of edits.",
    "History links changes to their authors. A new case revision does not overwrite results of checks already performed.",
    "PAY-TC-34 Change history showing its creation and two revision events by Anna Taylor."),
]);
