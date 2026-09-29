import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";
export const folderWalkthrough = walkthrough("Folders, cases and moves step by step", [
  shot("organization-folder-01-tree-20260928-en-20260928", "Open a project branch",
    "Open **Test cases** from the main sidebar or the project page tab. Expand a folder to see its subfolders and cases directly in the tree. Select a case to open its details on the right. The example shows the Payments tree before a case is selected.",
    "Vertical lines show nesting; selecting the line of an expanded branch collapses it. Drag the repository's right edge to make long names easier to read.",
    "Payments repository with expanded branches, PAY-TC-9 and PAY-TC-34 visible in the tree and no case selected."),
  shot("organization-folder-02-create-20260928-en-20260928", "Create a folder at the right level",
    "Select **New folder** in the repository header or **New subfolder** in a parent folder's menu. Enter a name, then choose its parent in the **Location** tree. The screenshot uses Release checks inside Payments.",
    "The folder has not been created yet. Check the path Payments → Release checks and select **Create folder**. You do not need slashes in the name to create nesting.",
    "Unsaved Release checks folder form with Payments selected as its parent and the resulting path shown below."),
  shot("organization-folder-03-selection-20260928-en-20260928", "Select cases across folders",
    "Select **Select** above the tree to show checkboxes. Check cases and move between folders; your selection is preserved. A folder checkbox selects the available cases in its branch.",
    "The bottom bar shows the total and actions for Move, Create test run, Status, Priority, Unfile and Archive. The close icon clears the selection while keeping the case details open.",
    "PAY-TC-34 Open Falcon help is selected with its details open; the bottom bar shows one selected case."),
  shot("organization-folder-04-move-20260928-en-20260928", "Check the shared destination",
    "Select **Move**, expand the destination tree or search for a folder, and check the number of selected cases. To move without a dialog, drag a case onto a folder without holding or pressing harder; dragging a selected case moves the entire selection.",
    "The screenshot has **Unfiled** selected for one case; the move is not confirmed yet. Choose the intended destination and select **Move**. **Cancel** preserves the existing location.",
    "Move test cases dialog with one selected case, Unfiled as the destination, the folder tree and a confirmation button."),
]);
