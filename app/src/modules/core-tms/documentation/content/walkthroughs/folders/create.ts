import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const folderWalkthrough = walkthrough("Organize cases and review a move", [
  shot("organization-folder-01-tree-20260928-en-20260928", "Read the project’s folder tree",
    "Open **Test cases**, expand folders and select a case. Vertical lines show nesting. To add a folder, choose **New folder** in the header or **New subfolder** in a parent’s menu, enter its name and select the intended parent under **Location** before creating it.",
    "The real repository and an existing selected case are shown. Expanding a branch or opening a case changes the view; it does not move records or create folders. You do not need slashes in a folder name to create nesting.",
    "Umbrella-Host folder tree beside an existing test case."),
  shot("organization-folder-04-move-20260928-en-20260928", "Confirm the selection and destination",
    "Use **Select** above the tree to check cases across folders, then choose **Move**. Search or expand the destination tree and review the selected count before confirming. You can also drag a selected case onto a folder to move the selection; a harder press is not required.",
    "One case is selected and Unfiled is highlighted in this destination preview; no move was completed. **Cancel** preserves the current locations. After a real move, the confirmation toast offers **Undo** for a limited time.",
    "Move test cases destination picker with one selected case and Unfiled highlighted before confirmation."),
]);
