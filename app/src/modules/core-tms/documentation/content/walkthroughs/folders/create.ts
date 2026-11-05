import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const folderWalkthrough = walkthrough("Organize cases and review a move", [
  shot("organization-folder-01-tree-20260928-en-20260928", "Read the project’s folder tree",
    "Open **Test cases**, expand folders and select a case. Vertical lines show nesting. To add a folder, choose **New folder** in the header or **New subfolder** in a parent’s menu, enter its name and select the intended parent under **Location** before creating it.",
    "The real repository and an existing selected case are shown. Expanding a branch or opening a case changes the view; it does not move records or create folders. You do not need slashes in a folder name to create nesting.",
    "Expanded English Product guide EN folder hierarchy beside saved GUIDE-TC-3 in Falcon Guide, with nesting lines and folder actions."),
  shot("organization-folder-04-move-20260928-en-20260928", "Confirm the selection and destination",
    "Use **Select** above the tree to check cases across folders, then choose **Move**. Search or expand the destination tree and review the selected count before confirming. You can also drag a selected case onto a folder to move the selection; a harder press is not required.",
    "One case is selected and **Product guide EN** is highlighted in the destination preview. The search shows its English subfolders and **Move** is available; no move was confirmed. **Back to test cases** leaves the preview without changing case locations.",
    "Move test cases preview with one selected case, Product guide EN search/destination and English subfolders, before confirmation."),
]);
