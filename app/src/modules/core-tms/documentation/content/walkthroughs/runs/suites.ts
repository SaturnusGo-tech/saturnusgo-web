import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const suiteWalkthrough = walkthrough("Inspect a suite and prepare its selection", [
  shot("suite-02-list-20260913-en-20260928", "Find the intended suite",
    "Open **Suites**. Each row shows the key, selection method and case count. Use the search magnifier or filters when needed, then open the intended suite. **New suite** prepares a separate selection.",
    "The listing contains existing project suites. Reading their membership or opening their details does not start testing or modify the suite.",
    "Actual Umbrella-Host test suite catalog with membership types, case counts and run actions."),
  shot("suite-03-detail-20260913-en-20260928", "Review the saved membership",
    "Open the suite and inspect its description and case tree. **Configure** edits its definition; **Run suite** opens the new-run form with that suite selected. Review the run’s iteration, build and ownership before creating it.",
    "The screenshot shows an existing suite with six Android cases. No suite was created, configured or launched to produce this frame.",
    "Existing Umbrella-Host suite detail with six Android cases and Configure and Run suite controls."),
  shot("suite-01-create-20260913-en-20260928", "Prepare a new suite without changing existing ones",
    "Select **New suite**, enter its name and choose **Manual selection** or **Automatic**. Manual selection lets you choose exact cases or folders; an automatic suite uses its configured rules. Review the resolved scope before saving your own suite.",
    "The unsaved draft is named Android smoke · next release, with Manual selection and zero selected cases. It does not show a newly saved suite or a started run. Cancel returns without creating it.",
    "Unsaved New suite form with manual and automatic selection choices and zero selected cases."),
]);
