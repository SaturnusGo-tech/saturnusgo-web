import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const defectWalkthrough = walkthrough("Prepare a report, inspect its context and plan verification", [
  shot("defect-00-list", "Find the report in its project context",
    "Open **Bug reports** and check the project. Use **Active**, **Closed** or **All**, then search by key, title, component or label. Expand the intended component and open a report, or choose **New bug report** for a new observation.",
    "**Falcon Guide**’s **All** view contains two saved English demo reports under **Core product**, one **Verified** and one **Ready for QA**. The page shows one open report and no critical reports. Reading the list does not close a report or verify a fix.",
    "Falcon Guide Bug reports list with All selected and two English demo reports grouped under Core product."),
  shot("defect-02-fields-20260913-en-20260928", "Describe the discrepancy",
    "In **Bug reports**, choose **New bug report**. Enter a specific title and click a text field to open the Markdown editor. Describe the observation under **Actual result** and the intended behavior under **Expected result**. Review component, severity, priority, reproducibility, assignee and delivery below the attachments before saving.",
    "The unsaved English documentation example contains a title, description, actual result and expected result. Component is **Documentation examples**, severity and priority are **High**, delivery has no route selected and no files are attached. The text editors are collapsed; **Create bug report** would save the whole report. Nothing was created or sent to a tracker.",
    "Filled unsaved English bug report with fictional booking observations, collapsed text editors and report properties."),
  shot("defect-routing-light-20260914-en-20260928", "Prepare a retest",
    "Open the saved report and check its key, status, results and tracker link. Select **Retest**, choose an environment and enter the fixed build in the inline section. Review the linked cases before using **Create run**.",
    "Saved **GUIDE-BUG-001** is **Ready for QA**, with **High** severity, **Medium** priority and its existing YouTrack issue link. The unsaved **Retest** section selects **Staging** and contains fixed build **2.4.1 (148)**, but shows zero linked cases. No retest run was created and no fix was confirmed.",
    "English GUIDE-BUG-001 with inline Retest, Staging, entered fixed build and zero linked cases."),
]);
