import { articles, bullets, note, paragraph, section, steps, table, type DocArticle } from "../../model/article";
import { portfoliosWalkthrough } from "../walkthroughs/organization/portfolios";

export const portfoliosArticle: DocArticle = {
  id: "portfolios", title: "Portfolios and projects", group: "start",
  description: "Create portfolios and projects on dedicated pages, and keep statuses, checklists, files, and discussions alongside the project's test repository.",
  keywords: ["portfolio", "portfolio", "create project", "assignee", "assign", "no portfolio", "archive", "catalog", "Markdown", "pencil", "test plan", "status", "checklist", "attachments", "files"],
  related: ["workspace", "organize-cases", "create-test-case", "falcon-ai-writing", "import-export"],
  sections: [
    section("walkthrough", "Walkthrough: portfolio, project, and test cases", portfoliosWalkthrough),
    section("structure", "What a portfolio groups together", table(["Level", "Purpose"],
      ["Workspace", "Shared team access, members, portfolios, and projects."],
      ["Portfolio", "A group of related projects, such as payment services or mobile apps."],
      ["Project", "The test repository, shared steps, runs, environments, and integrations for a specific product."],
      ["Folder", "A section of test cases within a project."]),
      paragraph("A project can exist **without a portfolio**. Adding it to a portfolio preserves its cases and history. Assigning an owner identifies a team contact and does not change access permissions.")),
    section("catalog", "Open the catalog", steps(
      ["Select Portfolios and projects", "Open the section in the global sidebar. All shows portfolios and projects; Portfolios shows groups; No portfolio shows independent projects."],
      ["Find the name you need", "Enter a name in search. Search narrows the loaded rows; if the record is missing, click Load more. To find archived objects, change the status to Archived."],
      ["Open the page", "Click the portfolio or project name. Breadcrumbs above the title take you back to the portfolio and full catalog."])),
    section("editor-controls", "Saving and required fields", paragraph("When creating a project or portfolio, the round blue checkmark at the right of the header saves it; the cross cancels creation. If a field is invalid, click the checkmark to show the error beside the field. A project key is required: 2–12 Latin letters or digits, starting with a letter. Status and assignee appear below the portfolio description; project properties sit below the test plan. The Test cases tab opens the repository up to the global header, without an extra project header.")),
    section("create-portfolio", "Create a portfolio", steps(
      ["Click New portfolio", "A dedicated creation page opens. Enter its name in the heading. Click the description field to add text, then click Done. Controls to create or cancel the entire page are at the top."],
      ["Assign an owner", "Open Assignee. Find an active workspace member by name or email. You can leave it Unassigned."],
      ["Save the portfolio", "Click the blue Create portfolio checkmark at the right of the header. Its dedicated page opens; the Projects tab offers actions to create or add projects."])),
    section("create-project", "Create a project", steps(
      ["Choose a location", "Click Create project in the catalog, project selector, or portfolio page. A dedicated page opens. When opened from a portfolio, that portfolio is already selected; change it or choose No portfolio if needed."],
      ["Enter the name and key", "The key starts with a Latin letter, contains 2–12 Latin letters or digits, and forms part of case and run identifiers. The key is permanent after creation."],
      ["Add context", "The pencil next to Description or Test plan opens a Markdown editor. Describe the testing scope, priorities, and acceptance criteria, then click Done. Set the portfolio and assignee below the test plan. You can fill these in later; environments and integrations are not required at creation."],
      ["Open the test repository", "After creation, the project page opens. Select Test cases: the tree, list, and editor are embedded in the project. Click New case or import JSON. Case creation uses the same fields and save actions as Test cases in the sidebar."]),
      note("An environment identifies where tests run", "You can create cases immediately. Before the first run, configure an active environment in project Settings."), articles("create-test-case", "import-export", "workspace")),
    section("edit-text", "Edit details in place", steps(
      ["Open the details", "For a portfolio, choose **About portfolio**; for a project, choose **Overview**. Portfolio details are read-only on the **Projects** tab."],
      ["Change the name", "Click the title to edit it in place. The checkmark saves it; the cross or Escape cancels the edit."],
      ["Edit the description or plan", "Click the text or empty-field prompt. Falcon's shared Markdown editor opens. **Save** below the field applies the edit and returns to reading view; **Cancel** keeps the previous text. If saving fails, the draft stays open."],
      ["Set properties", "Status and assignee appear below the description, or below the test plan for a project. Selecting a new value saves it immediately. Properties stay in the same location while editing."]),
      note("During creation", "Fields on a new page remain a draft until you click the blue checkmark in the header. Done beside the description or plan collapses the editor and keeps the text in that draft.")),
    section("attach", "Add an existing project", steps(
      ["Open the portfolio", "On the Projects tab, click Add existing."],
      ["Choose a project without a portfolio", "Find a project by name or key, select one row, and click Add project. Its cases and results stay where they are."],
      ["Check the list", "The project appears on the portfolio page. To change or remove its portfolio, open the project's Overview and choose a new value in Portfolio."])),
    section("overview", "Use the project page", bullets(
      "Overview shows the description, checklist, files, test plan, and discussion. Status, key, portfolio, assignee, and creation date appear below the plan.",
      "Test cases opens the same repository inside the project page. Folder creation, import, selection, moving cases, and the shared case editor work here. Returning to Overview preserves project context.",
      "Click the name, description, or plan to edit it in place. Each edit has save and cancel controls. The key stays permanent; status, portfolio, and assignee save on selection.",
      "Configure environments and integrations separately in the selected project's corresponding sections.")),
    section("workflow", "Track work status", paragraph("Projects and portfolios have **New**, **In progress**, **In review**, **Completed**, and **On hold** statuses. Select a status in the properties below the description or plan, or above the comment editor. On a saved page, the change is sent to the server immediately; during creation, it stays in the draft until you click the top save control."),
      note("Status and archive are separate actions", "Completed does not hide the object or close access to its test repository. Archiving makes the object read-only; restoring it does not reset its work status.")),
    section("checklist", "Maintain a checklist", steps(
      ["Open Checklist", "The action appears below a project's or portfolio's description. Enter an item and click plus or press Enter. You can add up to 100 items of 500 characters each."],
      ["Mark progress", "Check completed items. The pencil edits wording; the trash icon deletes an item. The counter shows how many items are complete."],
      ["Save changes", "On an existing page, changes save immediately. On a creation page, use the blue checkmark at the top. If an error occurs, the item remains in the input for another attempt. Refresh data loads the latest object version while preserving open drafts."])),
    section("files", "Attach and download files", steps(
      ["Create the object first", "Files require a saved project or portfolio. During creation, a hint appears below the description; Attach files becomes available after saving."],
      ["Choose files", "Click Attach files and select up to 20 files at a time. Upload progress appears beside each filename. On failure, click Retry; confirmed uploads are not uploaded again."],
      ["Open an attachment", "Click a completed file's name to download it. The trash icon removes it after confirmation. Reading and managing files require the corresponding permissions; archived files remain readable."]),
      paragraph("Files belong to the selected project or portfolio. Project attachments are separate from evidence in case steps and runs. File changes save immediately, independently of description drafts.")),
    section("discussion", "Discuss a project or portfolio", steps(
      ["Open the discussion", "For a project, it is on Overview; for a portfolio, it is under About portfolio. Comments belong only to the page you have opened."],
      ["Write a message", "Use Falcon's shared Markdown editor for emphasis, lists, and links. The object's status appears above it and saves separately from the comment. After you enter text, **Send** appears inside the bottom left of the editor. Click it to publish. The saved message shows its author and time. Posting requires project management permission; archived objects do not accept new messages."],
      ["Edit your own comment", "Click the pencil to the right of your message, edit it, and click **Save**. You cannot edit other people's messages. The latest text and an edited label are displayed; earlier versions remain in data history. A concurrent edit produces an error and preserves your draft. Comments on archived objects are read-only."],
      ["Read earlier messages", "Refresh the discussion using the button beside its heading. If Load more is available, click it to retrieve earlier messages. If sending fails, your text remains in the input for another attempt."])),
    section("detach-remove", "Remove a project or delete an empty portfolio", paragraph("In a project row, open the three-dot menu to the right of the chevron and choose **Remove from portfolio**. The project moves to **No portfolio** while retaining its cases, history, and status. This also works for archived projects."), paragraph("An empty portfolio's menu offers **Delete empty portfolio**. You cannot delete a portfolio containing any project, including archived ones. After confirmation, the empty portfolio disappears from the catalog and cannot be restored.")),
    section("archive", "Archive or restore a portfolio", steps(
      ["Open the portfolio page", "Click Archive at the right of the header and confirm. The portfolio and all its active projects are archived in one operation. Cases, runs, and history are preserved. The same action is available in the three-dot menu at the right of its catalog row."],
      ["Find the archived portfolio", "Return to the catalog and select Archived status. Open the portfolio you need."],
      ["Restore if needed", "Click Restore at the right of the header. The portfolio and projects archived with it return to the active list. Projects that were already archived remain archived."]),
      note("If a change was not saved", "Check the message below the form. If someone edited the object concurrently, refresh its page and apply your change to the latest data. Creation and editing require the corresponding workspace permissions.")),
  ],
};
