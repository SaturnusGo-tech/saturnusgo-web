import { suiteWalkthrough } from "../walkthroughs/runs/suites";
import { note, paragraph, section, steps, table, type DocArticle } from "../../model/article";
export const suitesArticle: DocArticle = {
  id: "test-suites", title: "Test suites", group: "runs", description: "Prepare repeatable test selections for smoke tests, regression, and CI events.",
  keywords: ["suite", "suite", "test set", "regression", "smoke", "folders", "Falcon AI"], related: ["create-run", "github", "organize-cases"],
  sections: [
    section("walkthrough", "Walkthrough", suiteWalkthrough),
    section("purpose", "What a suite is for", paragraph("A suite collects tests for repeated runs: smoke testing after a build, regression before release, or testing one product area. Editing a suite does not rewrite existing runs.")),
    section("catalog", "Find a suite", paragraph("The selected project's suites appear as compact rows with a key, name, description, membership, case count, and update date."),
      table(["Element", "How to use it"],
        ["Search suites", "Click the magnifier to reveal Find a suite. Search matches the name, description, and key; multiple words refine results."],
        ["Suite filters", "Choose manual or automatic membership and the sort order."],
        ["Membership", "Manual means explicitly selected cases; Automatic means saved rules; Archived identifies a retired suite."],
        ["Suite name", "Opens contents organized by repository folders."],
        ["Run suite play icon", "Opens New run with the suite selected. No run is created before confirmation."]),
      note("Case count", "An automatic suite shows View cases until its current contents are resolved. Open it to retrieve the server's nonarchived selection. If some cases have not loaded in the interface, a warning appears beside the contents; launching uses the complete server-side selection.")),
    section("create", "Create a suite", steps(
      ["Click New suite", "Enter the name directly. For an existing suite, choose Configure before changing its name."],
      ["Add a description", "Click the description or Add description. The shared Markdown editor opens with headings, highlighting, and Falcon AI."],
      ["Choose the cases", "Under membership, choose Manual selection or Automatic. Select individual cases and folders for a manual suite; enter required comma-separated tags for an automatic suite. Cases must match all supplied tags."],
      ["Save", "Click Create suite, or Save suite in configuration mode. Changes apply after saving the entire form."])),
    section("edit", "View and edit contents", steps(
      ["Open the suite", "The list follows the repository tree: folders, subfolders, and cases. Click a case to open its details."],
      ["Find relevant tests", "Use standard search, QL, and the filters beside search. They refine the view without changing the suite's contents."],
      ["Configure the selection", "Configure opens the same folder tree. Selecting a folder applies to its visible cases; Select all applies to the current selection. Checked cases outside the filter remain selected."],
      ["Cancel an unwanted edit", "Cancel at the bottom closes configuration without saving the form. Review unsaved changes before leaving."]),
      note("Dynamic suites", "The server determines their contents from saved rules. Previously configured folder, priority, status, and text conditions appear separately and are retained when you edit the name, description, or tags. Manual selection checkboxes are unavailable for dynamic suites.")),
    section("launch", "Create a run from a suite", steps(
      ["Open New run", "Click the Run suite play icon in the catalog or Run suite in its detail page."],
      ["Choose an iteration", "Use an existing iteration or enter a new name. Iterations group runs."],
      ["Check the settings", "The suite is already selected. In the right panel, specify projects, the run assignee, and optional Android/iOS builds. The run assignee does not replace case executors. You can add tests from other projects; builds are configured separately for each project."],
      ["Create the run", "Click Create run. Then start it from the runs screen. Closing the form creates nothing."])),
    section("return", "Return after viewing a case", paragraph("Test suites in the case view returns to the catalog, preserving search, filters, and scroll position. Back and Forward in the global header and browser navigate between the case and suite.")),
    section("maintenance", "Maintain suites", table(["Repository change", "What to check"],
      ["New cases added", "Whether needed tests are included and match the suite's rules."],
      ["Cases archived", "Whether the suite became empty or lost a critical area."],
      ["Tags or folders changed", "Whether the dynamic selection still makes sense."]),
      note("Integrations", "GitHub creates runs using the same server-side suite selection. Keep suites up to date before automatic runs.")),
  ],
};
