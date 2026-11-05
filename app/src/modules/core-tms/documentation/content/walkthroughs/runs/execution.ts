import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const createRunWalkthrough = walkthrough("Prepare a run and check its context", [
  shot("run-edit-01-selector-20260928-en-20260928", "Choose the run you need",
    "Open **Current run** to find an existing run by name or tag. Check its status before selecting it. Use **New run** when you intend to prepare a separate test execution.",
    "The selector is filtered to **Documentation example** runs in **Falcon Guide**. **Booking acceptance** is selected and its edit control is visible; all three listed runs are **Draft**. Opening the selector does not start or change a run.",
    "Current run selector with three English documentation drafts, Booking acceptance selected and its edit pencil."),
  shot("run-03-target-20260928-en-20260928", "Prepare the cases and target",
    "Select **New run**, name the iteration and choose its cases. In **Assignment**, check projects, tags, the run owner and release version. Add the Android build file or optional iOS version or link when applicable.",
    "The unsaved **New test run** form selects **GUIDE-TC-3** in **Falcon Guide**, with release **2.4.0** and optional iOS version **2.4.0 (124)**. The owner is **Not assigned**, no Android file is attached, and **Create run** is available. Nothing has been created or started.",
    "Unsaved English New test run form with one booking case selected, Assignment and build fields, and an enabled Create run button."),
  shot("run-04-started-20260928-en-20260928", "Recognize a paused run",
    "After creating a run for your own task, check its status, cases and target before execution. For an existing paused run, **Resume run** continues it when your permissions allow; **Previous** and **Next** let you inspect its cases.",
    "The existing **Smoke - Release 21 v10 -IOS** run is **Paused** and filtered to **HOST-TC-403 · Scope Budget Limit Compliance Test**. The selected case and its three steps are **Not run**, with no assignee and blank actual results. **Resume run** is available; viewing this state did not resume or complete the run.",
    "Existing paused Smoke run filtered to English HOST-TC-403, with Not run steps, stopped timer and Resume run."),
]);

export const editRunWalkthrough = walkthrough("Review run settings before changing them", [
  shot("run-edit-01-selector-20260928-en-20260928", "Open the selected run's editor",
    "Expand **Current run** and select the pencil beside the intended run. To edit another run, select it first and reopen the menu.",
    "The selector is filtered to **Documentation example** runs in **Falcon Guide**. **Booking acceptance** is selected and its edit control is visible; all three listed runs are **Draft**. Opening the selector does not start or change a run.",
    "Current run selector with three English documentation drafts, Booking acceptance selected and its edit pencil."),
  shot("run-edit-02-settings-20260928-en-20260928", "Review the current fields",
    "In **Run settings**, review the name, description, run owner, tags and build fields. Change only what your task requires, then select **Save**. Use **Cancel** to keep the saved values.",
    "**GUIDE-TR-8 · Documentation example · Booking acceptance** is open with its saved English name and description. The run owner is **Not assigned**, tags and Android/iOS fields are empty, and **Save** is disabled because nothing has changed. No build was uploaded or saved.",
    "Unchanged Run settings for GUIDE-TR-8 Booking acceptance with empty build fields and disabled Save."),
  shot("run-edit-03-saved-20260928-en-20260928", "Inspect the run context",
    "Open **About run** beside the case assignee to read the run's description, owner, environment and build context. Compare those details with the task you are testing.",
    "**About run** shows the saved **Booking acceptance** draft with **Staging**, build **documentation-example-2026.12** and no assigned owner. Its description explicitly says it is unstarted and has no recorded test results; viewing this context changes nothing.",
    "About run popover for the English Booking acceptance draft with Staging, build and unstarted description."),
]);

export const executeRunWalkthrough = walkthrough("Inspect and record execution results", [
  shot("execute-04-completed-20260928-en-20260928", "Review the saved scope and observations",
    "For an active run you are authorized to execute, perform the actions, compare the expected result, enter the actual observation and save the outcome. In a completed run, read case and step statuses, observations and **Execution history** together. Check build context before reusing a result for another release.",
    "The existing completed **Regression - product** run is filtered to **HOST-TC-403 · Scope Budget Limit Compliance Test**. The case and its three steps have saved **Passed** statuses, while **Actual result** fields are blank. These saved statuses do not supply observations, evidence or verification of a different build.",
    "Completed Regression - product run filtered to English HOST-TC-403, showing three Passed steps and blank actual results."),
  shot("run-execution-history-production", "Check who recorded the result",
    "Expand **Execution history** and use **Attempt** and **Step** to inspect the records you need. Read the event type, actor, outcome and timestamp together. A case assignee or run owner is not automatically the person who recorded its result.",
    "The existing history for **HOST-TC-403** identifies **Mercury Rucks** as the recorder of the case result and its three step results in **Attempt 1**, dated **September 11**. Reading these records created no new attempt or result. Recorded authorship does not supply the blank actual observations in the scenario.",
    "Expanded execution history for English HOST-TC-403 with recorded result author, Passed statuses, Attempt 1 and September 11 timestamps."),
]);
