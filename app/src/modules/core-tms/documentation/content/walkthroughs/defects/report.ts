import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const defectWalkthrough = walkthrough("Prepare a report, inspect its context and plan verification", [
  shot("defect-00-list", "Find the report in its project context",
    "Open **Bug reports** and check the project. Use **Active**, **Closed** or **All**, then search by key, title, component or label. Expand the intended component and open a report, or choose **New bug report** for a new observation.",
    "The screenshot shows Umbrella-Host’s existing active reports grouped by component, with their keys, severity, status and assignee. Reading the list does not close a report or verify a fix.",
    "Existing Umbrella-Host bug report list grouped by component, with state tabs, search and report identities."),
  shot("defect-02-fields-20260913-en-20260928", "Describe the discrepancy",
    "In **Bug reports**, choose **New bug report**. Enter a specific title and click a text field to open the Markdown editor. Describe the observation under **Actual result** and the intended behavior under **Expected result**. Review component, severity, priority, reproducibility, assignee and delivery below the attachments before saving.",
    "The screenshot shows an unsaved report with its description editor open. The field checkmark finishes editing that field; the report’s Create action saves the whole report. No defect was created or sent to a tracker for this illustration.",
    "Unsaved New bug report page with the Markdown description editor and report properties below attachments."),
  shot("defect-routing-light-20260914-en-20260928", "Prepare a retest",
    "Open the saved report and check its key, status, results and tracker link. Select **Retest**, choose an environment and enter the fixed build in the inline section. Review the linked cases before using **Create run**.",
    "Existing HOST-BUG-023 is Ready for QA with High severity and priority and a YouTrack issue link. Its inline Retest section shows Host QA, one linked case and an empty Fixed build field. No run was created and no fix was confirmed for the screenshot.",
    "Inline retest setup above HOST-BUG-023, with environment, fixed-build field, linked cases and Create run action."),
]);
