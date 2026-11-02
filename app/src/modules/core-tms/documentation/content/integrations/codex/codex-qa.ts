import { articles, bullets, note, paragraph, section, steps, table, warning, type DocArticle } from "../../../model/article";

export const codexQaArticle: DocArticle = {
  id: "codex-web-qa", title: "Codex: connected web QA", group: "integrations",
  description: "Connect Codex to your company, review a web QA plan, run observed checks, and resume with authoritative Falcon records.",
  keywords: ["Codex", "QA", "virtual employee", "Figma", "PDF", "URL", "existing cases", "browser", "consent", "resume", "retest"],
  related: ["integration-overview", "falcon-ai-writing", "execute-run", "integration-troubleshooting"],
  sections: [
    section("purpose", "Choose the right assistant", paragraph("Help → Falcon AI chat answers questions from this handbook. The editor's Falcon AI improves selected text. The connected Falcon plugin in Codex can perform authorized QA actions and save results in Falcon."),
      note("Initial availability", "Connected web QA is introduced in Codex Lab. Your company's available features, current role, connection permissions, and the supported browser in your Codex host determine what you can do.")),
    section("company", "One Codex employee for the company", bullets(
      "A company has one stable Codex employee and one occupied billable seat across projects, chats, clients, and personal connections.",
      "Only a user with permission to manage integrations can activate or disable company Codex. A full seat quota requires administrator action; activation does not buy a seat automatically.",
      "Testers, QA managers, and workspace administrators can connect within their current rights when the company integration is active. There is no separate per-person allowlist.",
      "Assigning work to Codex does not start a browser or run checks. History identifies the Codex actor and the human who initiated the action separately.")),
    section("connect", "Connect your own account", steps(
      ["Check company availability", "Open company Codex settings. If needed, an integration manager uses Activate Codex. Review the seat count and the active status."],
      ["Open your connection", "Use My Codex connection → Connect Codex, or open the existing private Falcon plugin. Sign in with your company account and complete any required password change or MFA."],
      ["Review consent", "Select the intended projects and only the permissions requested for your task. An existing read-only connection does not acquire write permissions or employee binding by refreshing tools."],
      ["Approve an additional operation when needed", "If Codex requests another permission, review the same Falcon connection's authorization screen. You may refuse. Refusal must leave Falcon unchanged; roles or disabled company access cannot be fixed by repeatedly granting scopes."]),
      warning("If no authorization screen appears", "Refreshing tools is discovery, not consent. Use the existing App's supported connection/settings flow or ask your administrator to resolve the saved connection configuration. Do not create a duplicate integration or share tokens, session cookies, or MFA codes in chat.")),
    section("plan", "Prepare the QA task", steps(
      ["Choose the basis and target", "A URL can start read-only research. If adequate reviewed Falcon cases already exist, execute their exact immutable revisions without an extra website capture, PDF or Figma. Otherwise provide explicit requirements or review proposed expectations and assumptions from URL research; PDF/Figma remain supported. State the website area, permitted origins and disposable effects."],
      ["Capture research privately", "Before a workflow exists, Codex may inspect the requested area without business or test effects, messages, payments, accounts or verdicts. URL research pins an actual private project file, content SHA, capture time and source URL. In the web source, source.scope names the website area, not OAuth permissions. The observed page describes today's implementation; matching its own capture does not prove a requirement. Review complete proposed cases and expectations before case writes."],
      ["Select the environment and build", "Use a suitable existing environment whose base URL origin is permitted; a different display name or path alone is not a mismatch. Codex can propose typed environment creation/update only within current rights and exact review; otherwise an authorized person supplies the missing setup. An unversioned public site may use a declared live-site build/deployment marker, clearly labelled as declared."],
      ["Review the manifest", "Check assumptions, source anchors, complete cases and expected results, immutable case/shared-step revisions, environment and build. Existing-case sources pin the same case ID/revision as the selected case; approved changes use the actual returned revision before execution. Confirm the exact plan before preparation or execution writes."],
      ["Prepare Falcon records", "Codex can create or revise cases, organize folders and suites, configure environments, and prepare a draft run within your rights. Run creation snapshots reviewed revisions; it does not execute tests."],
      ["Confirm execution", "Use a supported host browser and approve required actions when they occur. The workflow must be assigned, bound to the intended run, and have a current lease before verified execution is recorded."])),
    section("results", "Record what actually happened", table(["Record", "What it means"],
      ["Manual result", "A manually supplied status; it is not proof of observed browser execution."],
      ["Verified workflow result", "A result linked to the current workflow action, run item, attempt, deployment, and persisted evidence. Actual test actions follow saved intent, current authorization, observed result, private evidence and confirmed Falcon commands; a declared build stays declared in reports."],
      ["Private attachment", "Uploaded through an expiring capability and finalized against its declared content digest. Keep the Falcon attachment ID, not a signed URL."],
      ["Defect and retest", "Create or link a defect from the observed failure. Retest creates a new attempt and preserves earlier attempts; fix confirmation requires current execution rights."]),
      paragraph("Codex can manage the single-project run batch within Falcon's existing rules: one run per project per batch. This integration does not orchestrate multiple runs from one project in a batch or cross-project batches.")),
    section("resume", "Pause, interrupt, and resume safely", bullets(
      "A closed host is not background execution. If the browser is unavailable, record the blocker before promising an active run.",
      "Resume from the saved workflow and reconcile the last command ID after an uncertain response. Do not repeat a browser action just because its response was lost.",
      "A pause, reassignment, material change to reviewed scope, expectations or build, expired lease, or changed plan may require renewed review. Check remaining work before continuing; a previous review does not authorize a changed plan.",
      "The reviewed web capture is an immutable research baseline. Expected navigation, result transitions and volatile page text are observations; they do not require a new source capture and review after every click.",
      "Use Falcon's run, attempt, evidence, defect, and workflow links for the report. Keep observed results separate from assumptions, blocked checks, and checks that were not run.")),
    section("access", "Change or end access", paragraph("Use Revoke connection to end your personal link. An integration manager can Disable for company. Current rights are checked again for every action; a demotion, expiry, revocation, inactive employee, or unavailable company feature can stop work immediately. Access tokens last five minutes and the approved connection is bounded to seven days."),
      articles("integration-overview", "falcon-ai-writing", "integration-troubleshooting")),
  ],
};
