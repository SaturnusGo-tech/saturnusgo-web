import { suiteWalkthrough } from "../walkthroughs/runs/suites";
import { note, paragraph, section, steps, table, type DocArticle } from "../../model/article";
export const suitesArticle: DocArticle = {
  id: "test-suites", title: "Test suites", group: "runs", description: "Prepare repeatable test selections for smoke tests, regression, and CI events.",
  keywords: ["suite", "suite", "test set", "regression", "smoke", "folders", "Falcon AI"], related: ["create-run", "github", "organize-cases"],
  sections: [
    section("walkthrough", "Walkthrough", suiteWalkthrough),
    section("purpose", "What a suite is for", paragraph("A suite collects tests for repeated runs: smoke testing after a build, regression before release, or testing one product area. Editing a suite does not rewrite existing runs.")),
    section("catalog", "Find a suite", paragraph("The catalog shows the selected project's suites as compact rows with the name, key, selection method, case count, and last update date."),
      table(["Element", "How to use it"],
        ["Find suite", "Searches the name, description, and key. Multiple words refine the results."],
        ["Suite filters", "The menu beside search selects manual or dynamic suites and the sort order."],
        ["Name", "Opens the suite's contents organized by repository folders."],
        ["Round blue run button", "Opens New run with the suite selected. No run is created until confirmation."]),
      note("Case count", "For a dynamic suite, a dash means the current count has not loaded yet. Opening it retrieves the server's count of available, nonarchived cases. If some cases have not yet loaded in the interface, a warning appears beside the contents; running uses the complete server-side selection.")),
    section("create", "Create a suite", steps(
      ["Click New suite", "Enter the name directly. In an existing suite, click the title to edit it in place."],
      ["Add a description", "Click the description or Add description. The shared Markdown editor opens with headings, highlighting, and Falcon AI."],
      ["Choose the cases", "Click How to collect cases or its current value. For manual suites, select cases and entire folders; for dynamic suites, specify required tags."],
      ["Save", "Click Create suite, or Save suite in configuration mode. Changes apply after saving the entire form."])),
    section("edit", "View and edit contents", steps(
      ["Open the suite", "The list follows the repository tree: folders, subfolders, and cases. Click a case to open its details."],
      ["Find relevant tests", "Use standard search, QL, and the filters beside search. They refine the view without changing the suite's contents."],
      ["Configure the selection", "Customize uses the same folder tree. Selecting a folder applies to its visible cases; Select all applies to the current selection. Checked cases outside the filter remain selected."],
      ["Cancel an unwanted edit", "The cross beside an edited field restores its previous value. Cancel at the bottom closes the entire form without saving."]),
      note("Dynamic suites", "The server determines their contents from saved rules. Previously configured folder, priority, status, and text conditions appear separately and are retained when you edit the name, description, or tags. Manual selection checkboxes are unavailable for dynamic suites.")),
    section("launch", "Create a run from a suite", steps(
      ["Open New run", "Click the round blue run button in the catalog or suite details."],
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
