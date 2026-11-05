import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const workspaceWalkthrough = walkthrough("Project, environment and run context", [
  shot("workspace-03-project-20260913-en-20260928",
    "Select projects",
    "In the repository, click the project name in the top bar. Under **Projects**, select one or more projects and choose **Apply**. Search narrows the available list.",
    "The **Projects** tab is filtered by **Falcon** and **Falcon Guide** is checked; the count shows one selected project and **Apply** is available. No scope change was applied for the capture. Cases retain their project keys and folder structure.",
    "Projects tab with Falcon search, Falcon Guide checked, one selected project and an enabled Apply button."),
  shot("workspace-04-portfolio-20260913-en-20260928",
    "Open an entire portfolio's repository",
    "Switch to **Portfolios**, find a name and select the portfolio. Choose **Apply** to view cases from its projects.",
    "Umbrella-host-main is selected in the company picker. Applying a portfolio combines the viewing scope without moving cases or changing their project ownership. No scope change was applied for this capture.",
    "Portfolios tab of the Umbrella Home scope selector with Umbrella-host-main selected."),
  shot("workspace-v2-02-environment-20260913-en-20260928",
    "Review or add an environment",
    "Open the avatar menu → **Settings → Environments**, or use the **Open environments** plus icon in the header. Check the project before selecting **New environment**. Enter your own name, key and base URL, then save only when the destination is correct.",
    "**Falcon Guide** lists the existing **Staging** environment with key **GUIDE-STAGING** and base URL **https://staging.example.com**. The **New environment** form is open with empty fields; this draft has not been saved. Builds are specified separately when preparing a run.",
    "Falcon Guide environment settings filtered to Staging, with an empty unsaved New environment form and the existing Staging environment below."),
  shot("run-03-target-20260928-en-20260928",
    "Review run parameters",
    "In **New run**, review the case selection and **Assignment** properties. Choose projects, tags, the run owner and release version for your task. Case executors are assigned separately. Android requires a build file; the iOS version or link is optional.",
    "The unsaved **New test run** form selects **GUIDE-TC-3** in **Falcon Guide**, with release **2.4.0** and optional iOS version **2.4.0 (124)**. The owner is **Not assigned**, no Android file is attached, and **Create run** is available. Nothing has been created or started.",
    "Unsaved English New test run form with one booking case selected, Assignment and build fields, and an enabled Create run button."),
]);

export const dashboardWalkthrough = walkthrough("Choose metrics and inspect their records", [
  shot("dashboard-06-overview-20260913-en-20260928", "Read the current quality overview",
    "Open **Dashboard** and check the project and period. Read the widget labels before comparing values. **Customize** opens the layout draft; choose **Add widgets** to inspect the catalog. Save intended layout changes when ready, or cancel to keep the saved board.",
    "**Falcon Guide**’s saved **Release quality** dashboard is open on **Defects**: two total and linked defects, one **Ready for QA** and one **Verified**; the other statuses are zero. The period selector is **30 days**. These aggregate values come from saved demonstration records.",
    "English Falcon Guide Release quality dashboard, Defects section: two total defects, Ready for QA one, Verified one and current status metrics."),
  shot("dashboard-02-catalog-20260913-en-20260928", "Understand a widget before adding it",
    "In the widget library, search or choose a category, then select a widget to read its description and preview. An Added label means it already belongs to the board. In customization mode, drag widgets by their handles and choose the appropriate width before saving.",
    "The **Defects** category is selected and the **Defect statuses** preview is open for **Falcon Guide**. **Defect statuses** and **Total defects** are already marked **Added**; the preview explains current-project data and overlap. Viewing this preview changes no project records.",
    "Widget library with the Defect statuses description and preview selected."),
  shot("dashboard-08-records-20260928-en-20260928", "Review the records behind a number",
    "In normal dashboard mode, select **Total defects**. Use its search and filters to narrow the record list, then open the intended defect. Check the project, status and period before treating the result as relevant to a release.",
    "The screenshot shows actual Total defects records. This is a read-only drilldown into saved defects; opening it does not create a defect or change its status.",
    "Falcon Guide Total defects drilldown with two English demo defects, statuses, priorities and record links."),
]);
