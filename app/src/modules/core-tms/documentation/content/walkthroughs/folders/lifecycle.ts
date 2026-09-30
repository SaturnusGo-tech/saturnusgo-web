import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const importFoldersWalkthrough = walkthrough("Import and export test cases", [
  shot("organization-folder-05-import-20260928-en-20260928",
    "Open the import page",
    "Select **Import** in the repository header. On the **Import test cases** page, check the project and destination folder, then select **Choose file** or drag in a JSON file.",
    "The screenshot targets the Payments project root and has no file selected yet. The empty **File history** below will contain source files from new imports.",
    "Payments import page with JSON file selection, project root destination and empty source file history."),
  shot("import-02-destination-20260928-en-20260928",
    "Choose the destination",
    "Open the **Folder** field. Choose **Project root** or find a folder. The arrows beside Payments, Security and Transfers expand their nested levels.",
    "The structure from the file is added inside the selected destination. Importing does not merge several projects into one repository.",
    "Expanded import folder picker with Project root selected and Payments, Security and Transfers available below."),
  shot("settings-03-exchange-20260928-rows-inbox20260928-en-20260928",
    "Use the shared import and export settings",
    "Open **Settings → Import and export** to choose a JSON file, project and destination folder. Use **Export test cases** at the top right to download the selected project’s cases.",
    "Check that Payments is selected. JSON transfers case content and folders; it is not a complete backup and does not transfer custom field definitions, assignments, attachments or run history.",
    "Payments import screen with file upload, destination selectors and a separate export action."),
]);

export const archiveFoldersWalkthrough = walkthrough("Archive selected cases or an entire branch", [
  shot("organization-folder-03-selection-20260928-en-20260928", "Use selection for individual cases",
    "To retire only a few checks, select them across folders and choose **Archive** in the action bar. **Unfile** keeps cases active and moves them to **Unfiled**.",
    "The action bar applies to the selected cases across the project. You do not need to archive parent folders to retire a few cases.",
    "Selected PAY-TC-34 in Payments with an Archive action in the bottom bar and its case details open on the right."),
  shot("organization-folder-01-tree-20260928-en-20260928", "Open the folder menu for an entire branch",
    "If an entire area is obsolete, find it in the tree and open the **…** menu beside its name. Select **Archive folder**. This includes the folder, its active subfolders and their active cases.",
    "Before confirming, review the branch in the tree and case details. Individual case checkboxes do not determine which cases a folder archive includes.",
    "Payments project tree with Payments, Security and Transfers branches and no case selected; the folder menu is closed."),
  shot("organization-folder-06-archive-20260913-en-20260928", "Open the folder archive",
    "Select the archive icon beside **Folders**. The heading changes to **Archived folders**. The saved practice screenshot shows an empty archive; archived branches will appear here. Select the icon again to return to active folders.",
    "If an archived branch exists, open its menu and choose **Restore folder**. This restores records from that archive operation; cases archived separately beforehand stay archived.",
    "Payments repository with an empty Archived folders list and no case selected on the right."),
]);
