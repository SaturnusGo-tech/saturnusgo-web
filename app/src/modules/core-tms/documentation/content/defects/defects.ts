import { defectWalkthrough } from "../walkthroughs/defects/report";
import { bullets, code, note, paragraph, section, steps, table, warning, type DocArticle } from "../../model/article";
export const defectArticles: DocArticle[] = [
  { id: "create-defect", title: "Create a defect", group: "defects", description: "Record a reproducible problem with its test context and evidence for the developer.",
    keywords: ["defect", "bug", "bug", "bug report", "create bug", "error"], related: ["link-defect", "retest", "integration-overview"],
    sections: [
      section("walkthrough", "Walkthrough: complete a bug report", defectWalkthrough),
      section("from-run", "Create from a failure", steps(
        ["Save the failed result", "In an active run, select a case, mark the failed step, and record actual behavior."],
        ["Click Report bug", "The form receives the run, case, and step context. Check that the problem belongs to the selected action."],
        ["Clarify the description", "Enter a clear title, severity, component, and reproducibility. Check the expected and actual results."],
        ["Add evidence", "Attach screenshots, video, or logs and, if needed, a link to the affected screen. Then save the bug."],
        ["Check the link", "Confirm that a defect key was created. Open it in Reports and check the link to the original run."])),
      section("from-case", "Create from a test case", steps(
        ["Open the test case", "In the three-dot menu beside Quarantine, choose Create bug report. You do not need to start a run."],
        ["Describe the problem", "The form prefills the case title, description, component, and priority. Clarify the problem, actual and expected results, and add evidence."],
        ["Save the bug report", "The defect is saved in the selected case's project and appears in its history. You can return to the test case from the bug report."])),
      section("standalone", "Create without a run", paragraph("For a problem found outside a run, open **Reports → New bug report**. Include the context in the description. This bug is not automatically linked to a specific step.")),
      section("browse", "Find a bug in Reports", paragraph("In **Reports**, bugs are grouped by component in the selected project. Components start expanded; collapse unneeded sections with the chevron. Beside each name are total and open counts, plus open critical bugs when any exist. Records without a component appear in **No component**."),
        paragraph("Search checks the key, title, description, component, tags, and assignee across the project. Counters reflect the query. The button to the right of search changes severity order. Use **Show more** in large sections and **Show more sections** for additional components. Section counts include all matching bugs, including pages not yet expanded.")),
      section("form", "Fill in the side panel", paragraph("The creation form opens on the right. Enter the title, defect properties, description, and evidence. Click text or a pencil to open the Markdown editor. Descriptions, steps, and results support headings, highlights, and Falcon AI. The round checkmark in the header saves the report. **Assignee** finds colleagues by name or email; **Unassigned** leaves the bug without an executor. The menu closes on selection, outside click, or Escape. Use **?** beside **Routing** for an explanation of delivery. The tooltip can open this guide while preserving the form in the current tab.")),
      section("content", "What the developer needs to understand", code("text", "Example bug report", "Title: A blank screen appears after sign-in\nEnvironment: Staging\nBuild: 2026.09.07-42\nReproducibility: always\n\nAction: sign in as an active test user\nExpected: a workspace showing available projects\nActual: a blank screen and a loading error in the console\nEvidence: screenshot and log with the reproduction time"),
        bullets("Describe observed behavior, not an assumed cause.", "Provide the minimum steps needed to reproduce it.", "Keep independent problems in separate bug reports.")),
      section("discussion", "Discussion and links", paragraph("A bug report's **Overview** has the same comments as test cases: Markdown, attachments, quoted replies, colleague mentions, and editing or deleting your own messages. Mentioned employees receive notifications through their connected channels when **Defects** is enabled."),
        paragraph("**Copy defect link** in the header copies the bug report address. Comments span the full width below the description and properties. The message menu copies a link to a specific comment; Falcon opens the report and scrolls to it. The round blue Play button opens the linked test run when the report has run context.")),
      section("routing", "Send to an external tracker", paragraph("Routing is chosen in the form and through project integration settings. YouTrack can use component and tag rules. Jira, Linear, and Trello receive the events selected for their connection."),
        note("Saving and delivery are separate stages", "A Falcon defect key means the bug is registered. The external issue link appears after successful integration processing. A delivery error does not require creating the defect again.")),
    ] },
  { id: "link-defect", title: "Defect links", group: "defects", description: "Distinguish test context, external issues, and evidence: each link serves a different purpose.",
    keywords: ["link defect", "linked issue", "links", "external issue", "association", "occurrence"], related: ["create-defect", "retest", "integration-troubleshooting"],
    sections: [
      section("kinds", "Types of links", table(["Link", "How it is created"],
        ["Bug → test case", "Through the test case menu. No run or step is created."],
        ["Bug → run → case → step", "By reporting a defect during execution. Preserves the precise discovery point."],
        ["Bug → Jira / Linear / Trello / YouTrack issue", "After publishing through a configured integration."],
        ["Bug → external link or attachment", "Through form evidence. This is supporting material, not automatic status synchronization."])),
      section("test", "Link a problem to a test", steps(
        ["Open the relevant run and case", "Choose the context where the error was reproduced. Check the build and environment."],
        ["Report the bug from a step", "Use Report bug. Check that the form identifies the correct step: this is the context that will be saved."],
        ["Open case history", "Find the linked bug, its status, and context. Use Open bug in Falcon to view the full report."])),
      section("external", "Check the external issue", paragraph("Open the linked service in defect details. **Hooks → service → Log and links** shows deliveries and linked records. Compare the external issue key with the defect key and project."),
        warning("An ordinary link does not enable synchronization", "Pasting an arbitrary issue URL into evidence does not make it a managed integration link. The current interface does not provide universal manual linking of any existing bug to any case.")),
      section("recovery", "Restore a missing link", paragraph("If the log shows **Needs reconciliation**, check whether a record appeared in the service. Then use **Restore link**, enter that record's ID, and click **Check and link**. This recovers a specific delivery; it does not import an arbitrary issue.")),
    ] },
];
