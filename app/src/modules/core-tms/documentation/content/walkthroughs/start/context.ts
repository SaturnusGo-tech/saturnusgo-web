import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const workspaceWalkthrough = walkthrough("Project, environment and run context", [
  shot("workspace-03-project-20260913-en-20260928",
    "Select projects",
    "In the repository, click the project name in the top bar. Under **Projects**, select one or more projects and choose **Apply**. Search narrows the available list.",
    "The screenshot shows the actual Umbrella Home project list with one project selected. Apply determines the visible repository scope; cases retain their own project keys and folders. No scope change was applied for this capture.",
    "Umbrella Home project picker with search, project checkboxes and an Apply action."),
  shot("workspace-04-portfolio-20260913-en-20260928",
    "Open an entire portfolio's repository",
    "Switch to **Portfolios**, find a name and select the portfolio. Choose **Apply** to view cases from its projects.",
    "Umbrella-host-main is selected in the company picker. Applying a portfolio combines the viewing scope without moving cases or changing their project ownership. No scope change was applied for this capture.",
    "Portfolios tab of the Umbrella Home scope selector with Umbrella-host-main selected."),
  shot("workspace-v2-02-environment-20260913-en-20260928",
    "Review or add an environment",
    "Open the avatar menu → **Settings → Environments**, or use the **Open environments** plus icon in the header. Check the project before selecting **New environment**. Enter your own name, key and base URL, then save only when the destination is correct.",
    "Umbrella-Host currently lists Host QA with key LOCAL and https://www.saturnusgo.com as its default environment. The screenshot shows the saved list; no environment was created or changed. Builds are specified separately when preparing a run.",
    "Umbrella-Host environment settings showing the saved Host QA default environment and New environment action."),
  shot("run-03-target-20260928-en-20260928",
    "Review run parameters",
    "In **New run**, review the case selection and **Assignment** properties. Choose projects, tags, the run owner and release version for your task. Case executors are assigned separately. Android requires a build file; the iOS version or link is optional.",
    "The screenshot shows an unsaved form with zero selected cases and a disabled Create run button. Opening the form has not created a run or assigned a case executor.",
    "Unsaved New run form in Umbrella-Host with its case selection, Assignment and build fields."),
]);

export const dashboardWalkthrough = walkthrough("Choose metrics and inspect their records", [
  shot("dashboard-06-overview-20260913-en-20260928", "Read the current quality overview",
    "Open **Dashboard** and check the project and period. Read the widget labels before comparing values. **Customize** opens the layout draft; choose **Add widgets** to inspect the catalog. Save intended layout changes when ready, or cancel to keep the saved board.",
    "The screenshot shows Umbrella-Host’s existing Defects overview: 27 total, 16 Open, six Ready for QA and five Verified. Its values come from saved project records; no widget, result or layout was changed for this capture.",
    "Existing Umbrella-Host Defects dashboard with its status breakdown and current defect metrics."),
  shot("dashboard-02-catalog-20260913-en-20260928", "Understand a widget before adding it",
    "In the widget library, search or choose a category, then select a widget to read its description and preview. An Added label means it already belongs to the board. In customization mode, drag widgets by their handles and choose the appropriate width before saving.",
    "The library is open with Defect statuses selected. Reading a preview does not add another copy of the widget or change project records. A zero metric means no matching records, not a failed addition.",
    "Widget library with the Defect statuses description and preview selected."),
  shot("dashboard-08-records-20260928-en-20260928", "Review the records behind a number",
    "In normal dashboard mode, select **Total defects**. Use its search and filters to narrow the record list, then open the intended defect. Check the project, status and period before treating the result as relevant to a release.",
    "The screenshot shows actual Total defects records. This is a read-only drilldown into saved defects; opening it does not create a defect or change its status.",
    "Total defects detail listing for the current Umbrella-Host project."),
]);
