import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const defectWalkthrough = walkthrough("Prepare a bug report from a test case", [
  shot("defect-01-context-20260913-en-20260928",
    "Check the source case",
    "Open **PAY-TC-34 · Open Falcon help** and review its scenario and expected result. Use the case's **More actions** menu to start a bug report when an observed discrepancy needs to be recorded.",
    "The screenshot shows the saved case before its action menu is opened. The following report is explicitly hypothetical; no actual defect was discovered, saved or sent to a tracker in this example.",
    "Saved PAY-TC-34 Open Falcon help case with its highlighted description, scenario and expected result before opening More actions."),
  shot("defect-02-fields-20260913-en-20260928",
    "Separate actual and expected results",
    "In **New bug report**, enter a specific title and describe the observation under **Actual result**. Keep the intended behavior in **Expected result**. This example is titled **Example only: guide search does not appear** and labels its observation as hypothetical.",
    "The unsaved form inherits the case description. It describes a visible article list with a missing search field, while the expected result requires both. The top checkmark creates the report; it has not been used in this example.",
    "Unsaved bug report for PAY-TC-34 with a hypothetical missing-search observation and separate actual and expected results."),
  shot("defect-routing-light-20260914-en-20260928",
    "Check properties and delivery",
    "Review the component, severity, priority, reproducibility and assignee, then open **Delivery**. This example uses Transfers QA, High severity, Medium priority, Always and Not assigned. When a tracker is connected and available, choose the intended delivery route.",
    "Only **Automatic** appears in this demo because no tracker is enabled. The screenshot does not show an external destination or successful delivery. The example remains unsaved with no defect key, and no external message was sent.",
    "Hypothetical bug report with the Delivery picker expanded and Automatic as its only available option."),
]);
