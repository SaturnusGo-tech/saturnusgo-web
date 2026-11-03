import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const createRunWalkthrough = walkthrough("Prepare a run and check its context", [
  shot("run-edit-01-selector-20260928-en-20260928", "Choose the run you need",
    "Open **Current run** to find an existing run by name or tag. Check its status before selecting it. Use **New run** when you intend to prepare a separate test execution.",
    "The selector lists saved runs from the current project. Opening it does not start, complete or create a run.",
    "Current run selector in Umbrella-Host with saved runs and their current statuses."),
  shot("run-03-target-20260928-en-20260928", "Prepare the cases and target",
    "Select **New run**, name the iteration and choose its cases. In **Assignment**, check projects, tags, the run owner and release version. Add the Android build file or optional iOS version or link when applicable.",
    "This is an unsaved preparation form. No cases are selected and Create run is disabled. The run owner and individual case assignees are separate; opening the form creates nothing.",
    "Unsaved New run form for Umbrella-Host with its case tree, Assignment and build fields, zero selected cases and disabled Create run."),
  shot("run-04-started-20260928-en-20260928", "Recognize a paused run",
    "After creating a run for your own task, check its status, cases and target before execution. For an existing paused run, **Resume run** continues it when your permissions allow; **Previous** and **Next** let you inspect its cases.",
    "The screenshot shows an existing paused Smoke run, not a run created for this guide. Its selected case is Not run and has no assignee. A paused timer does not add elapsed testing time.",
    "Existing paused Smoke run in Umbrella-Host with its case list, stopped timer and Resume run control."),
]);

export const editRunWalkthrough = walkthrough("Review run settings before changing them", [
  shot("run-edit-01-selector-20260928-en-20260928", "Open the selected run's editor",
    "Expand **Current run** and select the pencil beside the intended run. To edit another run, select it first and reopen the menu.",
    "The editor belongs to the selected run. Check its name and key before changing metadata; simply opening the selector does not save a change.",
    "Current run selector with the edit control beside an existing selected run."),
  shot("run-edit-02-settings-20260928-en-20260928", "Review the current fields",
    "In **Run settings**, review the name, description, run owner, tags and build fields. Change only what your task requires, then select **Save**. Use **Cancel** to keep the saved values.",
    "HOST-TR-31 is open with its existing Smoke name and description. The owner is Not assigned and the Android and iOS fields are empty. Save is disabled because nothing has changed; no version was uploaded or saved for this capture.",
    "Unchanged settings of the existing HOST-TR-31 Smoke run, with no assigned run owner, empty build fields and disabled Save."),
  shot("run-edit-03-saved-20260928-en-20260928", "Inspect the run context",
    "Open **About run** beside the case assignee to read the run's description, owner, environment and build context. Compare those details with the task you are testing.",
    "The completed Regression - product run shows Host QA, build local-current, no run owner and the saved description smoke execution. This read-only view does not demonstrate a version change or a new execution.",
    "About run popover displaying the selected existing run's description and target context."),
]);

export const executeRunWalkthrough = walkthrough("Inspect and record execution results", [
  shot("execute-04-completed-20260928-en-20260928", "Review the saved scope and observations",
    "For an active run you are authorized to execute, perform the actions, compare the expected result, enter the actual observation and save the outcome. In a completed run, read case and step statuses, observations and **Execution history** together. Check build context before reusing a result for another release.",
    "The existing Regression - product run contains four cases marked Passed; HOST-TC-11 is selected. Its visible Actual result fields are blank. These saved statuses do not supply observations, evidence or verification of a different build.",
    "Completed Regression - product run with four passed cases and HOST-TC-11 open, showing the scenario and blank Actual result fields."),
  shot("run-execution-history-production", "Check who recorded the result",
    "Expand **Execution history** and use **Attempt** and **Step** to inspect the records you need. Read the event type, actor, outcome and timestamp together. A case assignee or run owner is not automatically the person who recorded its result.",
    "Existing records for HOST-TC-11 identify Mercury Rucks for the case and five step results in Attempt 1 on September 11. Reading them did not create another attempt or result. The history identifies recorded authorship; it does not fill the blank actual observations shown in the scenario.",
    "Expanded execution history for HOST-TC-11 with recorded result authors, step numbers, Attempt 1 and timestamps."),
]);
