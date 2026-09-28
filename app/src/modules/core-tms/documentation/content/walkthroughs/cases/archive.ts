import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const archiveCaseWalkthrough = walkthrough("Archive and restore a test case", [
  shot("case-05-saved-20260913-en-20260928", "Check the case and select Quarantine",
    "Open the case details. Verify the project, key and title, especially when similar scenarios exist. **Quarantine** applies to the whole case rather than an individual step.",
    "Falcon removes the case from the active repository. Results from previous runs are preserved.",
    "The Quarantine button is visible at the top of the PAY-TC-34 case details."),
  shot("archive-01-removed-20260913-en-20260928", "Confirm the case is archived",
    "After the action, the case displays **Archived** and the archive action becomes **Restore**. Close the case details to return to the list.",
    "The case no longer appears in the normal active selection. You can restore it without creating it again.",
    "Archived test case details with Archived status and the Restore action."),
  shot("archive-02-filter-20260913-en-20260928", "Find the archived case later",
    "In the list, open **Filters** and enable **Include archived**. If the case is missing, also check the search text, folder, tags and other filters.",
    "The selection may contain both active and archived cases. Use the key and status to choose the correct one.",
    "Expanded test case filters with the Include archived toggle available."),
  shot("archive-03-restore-20260913-en-20260928", "Return a current scenario to use",
    "Open the archived case and select **Restore**. Then reread its preconditions and expectations: restoring a case does not verify that its requirements are current.",
    "PAY-TC-34 returns to the active repository with Draft status and the same key. The Quarantine action is available again, and you can include the case in runs.",
    "Restored PAY-TC-34 case appears in the active repository with Draft status."),
]);
