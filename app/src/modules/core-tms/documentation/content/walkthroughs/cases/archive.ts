import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const archiveCaseWalkthrough = walkthrough("Check the case before archiving or restoring it", [
  shot("organization-folder-01-tree-20260928-en-20260928", "Verify the saved case",
    "Open the case details and check the project, key and title. Inspect its actions before choosing to archive it. Archiving affects the case, not an individual step, and preserves earlier run results.",
    "The capture shows an existing saved case in the current repository. No case was archived, restored or otherwise changed for the image.",
    "Current Umbrella-Host repository with an existing saved case open for review."),
  shot("archive-02-filter-20260913-en-20260928", "Find archived cases when needed",
    "Open **Filters** and use **Include archived** to find a previously archived case. Also check the search, folder and other filters. Open the intended archived case and use **Restore** only when you intend to return it to active use.",
    "The screenshot shows the current filter controls, not the result of an archive or restore operation. Recheck a restored scenario’s requirements and expected results before including it in a new run.",
    "Repository filter controls with the option to include archived test cases."),
]);
