import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const importFoldersWalkthrough = walkthrough("Import and export test cases", [
  shot("settings-03-exchange-20260928-rows-inbox20260928-en-20260928",
    "Use the shared import and export settings",
    "Open **Settings → Import and export**, or **Import** in the repository. Check the project, open **Folder** and choose the root or an existing destination. Then select **Choose file** or drag in a JSON file. **Export test cases** at the top right downloads the selected project’s cases.",
    "The same transfer page serves both entry points. Review the project and folder before importing. JSON transfers case content and folders; it is not a complete backup and does not transfer custom field definitions, assignments, attachments or run history.",
    "Import and export settings with file upload, project and folder selectors, file history and the export action."),
]);

export const archiveFoldersWalkthrough = walkthrough("Choose the right archive scope", [
  shot("organization-folder-01-tree-20260928-en-20260928", "Distinguish selected cases from a whole branch",
    "To archive individual cases, use **Select** and the selection bar’s **Archive** action. **Unfile** keeps cases active outside folders. For a whole obsolete branch, open its **…** menu and choose **Archive folder**; this includes its active subfolders and cases, independently of individual checkboxes.",
    "The screenshot shows the current **Product guide EN** repository tree and selected saved case; no archive operation is shown. A folder’s **Restore folder** action restores records from that archive operation; cases archived separately beforehand remain archived.",
    "Current English Product guide EN folder hierarchy and selected saved GUIDE-TC-3 in Falcon Guide; no cases or branches archived."),
]);
