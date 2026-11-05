import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const suiteWalkthrough = walkthrough("Inspect a suite and prepare its selection", [
  shot("suite-02-list-20260913-en-20260928", "Find the intended suite",
    "Open **Suites**. Each row shows the key, selection method and case count. Use the search magnifier or filters when needed, then open the intended suite. **New suite** prepares a separate selection.",
    "The listing contains existing project suites. Reading their membership or opening their details does not start testing or modify the suite.",
    "Falcon Guide suite catalog filtered to three English documentation examples, showing manual membership, case counts and run actions."),
  shot("suite-03-detail-20260913-en-20260928", "Review the saved membership",
    "Open the suite and inspect its description and case tree. **Configure** edits its definition; **Run suite** opens the new-run form with that suite selected. Review the run’s iteration, build and ownership before creating it.",
    "**GUIDE-1** contains twelve manually selected English booking and payment cases, all **Draft**. Its description identifies fictional documentation examples and makes no execution claim. **Configure** and **Run suite** are available; this view changes nothing.",
    "English Booking and payments suite with twelve Draft cases and Configure and Run suite controls."),
  shot("suite-01-create-20260913-en-20260928", "Prepare a new suite without changing existing ones",
    "Select **New suite**, enter its name and choose **Manual selection** or **Automatic**. Manual selection lets you choose exact cases or folders; an automatic suite uses its configured rules. Review the resolved scope before saving your own suite.",
    "The unsaved suite draft is named **Release readiness · Smoke** in **Incident verification 20260828** and manually selects one existing **Critical** case, **VERIFY28-TC-1**. **Create suite** is available, but no suite was saved and no case or run was executed.",
    "Unsaved English Create test suite form with Manual selection and one Critical case selected."),
]);
