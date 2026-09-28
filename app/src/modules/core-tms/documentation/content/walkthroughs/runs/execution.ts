import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const createRunWalkthrough = walkthrough("Practice run: creation and settings", [
  shot("run-01-library-20260928-en-20260928", "Choose an iteration and select a case",
    "Select **New run**, choose a new iteration and enter its name and description. The example is English guide walkthrough in Payments. Find PAY-TC-34 and check the Open Falcon help case.",
    "The screenshot shows one matching practice case and zero selected cases. Searching alone does not include it in the run; check its checkbox before continuing.",
    "New test run form with the English guide walkthrough iteration and PAY-TC-34 search result before selecting the case."),
  shot("run-03-target-20260928-en-20260928", "Set properties on the right",
    "In **Assignment**, add the guide and documentation tags and select Anna Taylor as the run owner. The example uses release version 3.0.0-guide and iOS version 3.0.0 (128). Android is empty.",
    "The owner applies to the run as a whole. The case assignee does not change. The iOS version is plain text; no Android file was uploaded in this example.",
    "Practice run settings with Anna Taylor, guide and documentation tags, release 3.0.0-guide and iOS 3.0.0 (128)."),
  shot("run-04-started-20260928-en-20260928", "Create and inspect the run",
    "Select **Create run**. Open English guide walkthrough · 1 and check its cases and iOS version in the top bar. Select **About run** to view its description and owner.",
    "The screenshot shows the created run already Active with a running timer. Its case is still Not run and Not assigned: choosing Anna Taylor as run owner did not assign her to execute the case.",
    "Active English guide walkthrough with the single Open Falcon help case, no case assignee and iOS 3.0.0 (128) in the header."),
]);

export const editRunWalkthrough = walkthrough("Correct a version before testing", [
  shot("run-edit-01-selector-20260928-en-20260928", "Open the selected run's editor",
    "Expand **Current run**. In the selected English guide walkthrough · 1 row, select the pencil left of the checkmark. To edit a different run, select it first and reopen the menu.",
    "The pencil opens settings for the selected run. This screenshot shows an Active run whose case is still Not run; editing is available when your permissions allow it.",
    "Open Current run menu with a pencil beside the selected active English guide walkthrough run."),
  shot("run-edit-02-settings-20260928-en-20260928", "Correct the relevant field",
    "In **Run settings**, scroll to iOS and change 3.0.0 (128) to 3.0.0 (129). Check the owner and tags. Keep the other parameters unchanged, then select **Save**.",
    "The screenshot shows the new version in the form before saving. Android remains empty. To replace Android in your own run, upload a file and wait for it to finish before saving.",
    "PAY-TR-12 run editor with unsaved iOS 3.0.0 (129), owner Anna Taylor and guide and documentation tags."),
  shot("run-edit-03-saved-20260928-en-20260928", "Verify the saved details",
    "After the editor closes, check iOS 3.0.0 (129) in the top bar. Select **About run** beside the case assignee to view the description and owner of the entire run.",
    "The header shows the corrected version and About run shows Anna Taylor. The run remains Active and the case is still Not run with no assignee. Editing the run owner does not change the case assignee.",
    "Saved iOS 3.0.0 (129) in the header with About run showing Anna Taylor and the Help check description."),
]);

export const executeRunWalkthrough = walkthrough("Record results and complete a run", [
  shot("execute-01-result-20260928-en-20260928", "Execute the step and save your observation",
    "If the practice run is still a draft, start it with the play button. Open **Help**, verify that the article tree and search are present, then return to the run. Mark the step passed, enter the **Actual result** and select **Save result**.",
    "The screenshot shows the single step passed and its observation saved. The case outcome is not set yet. Before execution, iOS was corrected to 3.0.0 (129), as shown in the editing walkthrough.",
    "Active English guide walkthrough with the Help step passed and a saved actual result describing the article tree and search."),
  shot("execute-03-complete-action-20260928-en-20260928", "Complete the case and find its result",
    "After saving the successful step, select **Pass** at the bottom. Expand **Current run** and **Archived runs**. Find English guide walkthrough · 1 with Completed status.",
    "This run contains one case, so passing it completed the run automatically. Falcon opened another active run; the completed English guide walkthrough remains available under Archived runs.",
    "Run selector over Run ownership QA with the completed English guide walkthrough · 1 visible in the expanded Archived runs group."),
  shot("execute-04-completed-20260928-en-20260928", "Open the saved check",
    "Choose **English guide walkthrough · 1** under **Archived runs**. Open the **Open Falcon help** case and review its outcome, saved actual result and the version used during testing.",
    "The run is Completed, the case and step are Passed, and the observation is saved. The timer has stopped and iOS remains 3.0.0 (129). Create another run to test a different build; this result does not verify it.",
    "Completed English guide walkthrough with passed PAY-TC-34, its saved actual result and iOS 3.0.0 (129)."),
]);
