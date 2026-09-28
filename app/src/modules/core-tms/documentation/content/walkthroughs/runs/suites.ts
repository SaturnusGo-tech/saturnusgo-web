import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const suiteWalkthrough = walkthrough("Prepare a test suite and inspect an existing suite", [
  shot("suite-01-create-20260913-en-20260928",
    "Choose the suite's cases",
    "Open **Suites → New suite**, enter a name and choose how to build it. For a manual suite, choose **Choose exact cases** and select cases or folders in the tree. The example name is Guide checks.",
    "The form contains 15 selected cases and has not been saved. **Create suite** saves the selection; **Cancel** leaves the catalog unchanged. This example was canceled before the next screenshot.",
    "Unsaved Guide checks suite form in Payments with Choose exact cases and 15 selected cases."),
  shot("suite-02-list-20260913-en-20260928",
    "Find an existing suite",
    "Return to the catalog and find **Release smoke**. Each row shows the suite key, selection method and case count. Use search to narrow the list or select **New suite** to prepare another selection.",
    "The catalog contains three existing suites: Account security with 6 cases, Transfer regression with 12 and Release smoke with 15. Guide checks was not created by the preceding example.",
    "Payments suite catalog with Account security, Transfer regression and Release smoke and their case counts."),
  shot("suite-03-detail-20260913-en-20260928",
    "Review the cases and create a run",
    "Open **Release smoke**. Read its description and inspect the 15 cases in the repository tree. **Configure** edits this suite; the round play button opens the new-run form with the suite selected.",
    "The screenshot shows the saved Release smoke suite, not the unsaved Guide checks example. Review the new run's iteration, build, owner and selected cases before creating it.",
    "Saved Release smoke suite with its Release checks description, 15 cases and Configure and run controls."),
]);
