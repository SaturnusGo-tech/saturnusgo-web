import { githubImpactWalkthrough, githubWalkthrough } from "../../walkthroughs/integrations/delivery";
import { code, note, paragraph, section, steps, table, warning, type DocArticle } from "../../../model/article";
export const githubArticle: DocArticle = {
  id: "github", title: "GitHub and GitHub Actions", group: "integrations", description: "Connect code changes to the right tests: automatic runs, an exact build, and QA results in commit status.",
  keywords: ["GitHub", "Actions", "CI", "PR", "pull request", "push", "release", "build failed", "workflow"], related: ["test-suites", "slack", "integration-troubleshooting"],
  sources: [{ title: "GitHub: creating a webhook", url: "https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks" },
    { title: "GitHub: access tokens", url: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" }],
  sections: [
      section("open", "Open the plugin settings", paragraph("Open **More sections → Hooks** and select this service. If needed, click **Install plugin** and wait for **Installing** to finish. Choose **Manage → Uses → Connection setup**. You can return through **Settings → Plugins**; Guide opens this instruction. Installation alone does not connect or enable the service.")),
      section("walkthrough", "Where to configure it in Falcon", githubWalkthrough),
    section("flow", "What happens automatically", table(["Event", "When Falcon creates a run"],
      ["Pull request", "Opening, reopening, a new commit, or readiness for review. The PR must be open and not a draft."],
      ["Push", "A branch change; branch deletion and tag pushes do not trigger runs."],
      ["Release", "Publishing a release."],
      ["GitHub Actions", "A workflow_run completes with failure, timed_out, action_required, or startup_failure."]),
      paragraph("The event must be enabled in the connection and match a testing rule. Each matching rule creates a run of its selected suite with the environment, build, and source link.")),
    section("access", "Prepare the repository and token", paragraph("Use a token limited to the required repository. The current connector needs **Contents: read**, **Pull requests: read**, and **Commit statuses: write**. Repository administrator permissions are separately required to configure the webhook.")),
    section("connect", "Configure the connection", steps(
      ["Fill in Integrations → GitHub", "Enter the API token and repository as owner/name. Click Verify access and verify the repository."],
      ["Save while disabled", "Obtain the Webhook URL. Prepare a separate random secret of at least 32 characters."],
      ["Add a GitHub webhook", "In the repository, open Settings → Webhooks → Add webhook. Use Falcon's Payload URL, application/json as Content type, and the same Secret."],
      ["Choose events", "Select Pull requests, Pushes, Releases, and Workflow runs for the scenarios you need. Keep TLS verification enabled. Save the secret in Falcon."])),
    section("rules", "Choose which tests to run", steps(
      ["Prepare a suite and environment", "Both must exist in the current Falcon project. Make sure the suite is not empty."],
      ["Add a rule", "In Automation, select an event and click Add rule. Set a short unique name, event, test suite, and environment."],
      ["Refine filters", "Separate branches with commas. For PRs, this is the target branch; for pushes, the changed branch. Path prefixes apply to PRs and pushes; leave them empty for releases and Actions."],
      ["Enable and save", "Review every rule. One event can match several rules and create multiple targeted runs."])),
    section("example", "Example rule", code("text", "Verify checkout before merging", "Rule name: checkout-pr\nEvent: Pull request ready for review\nTest suite: Checkout smoke\nEnvironment: Staging\nBranches: main\nChanged path prefixes: src/payments/, app/checkout/"),
      note("These are prefixes, not glob patterns", "Specify the start of a repository path. Do not use **/*.test.ts instead of a directory prefix.")),
    section("result", "Send the result back to GitHub", paragraph("Execute the created run in Falcon. With completion and stop events enabled, the connector publishes the result as a commit status. Check the exact SHA for which the run was created."),
      warning("Falcon does not configure branch protection", "If QA must block merging, a GitHub administrator configures a required status check in repository rules separately. A manual Falcon result does not rerun a failed Actions workflow.")),
    section("impact-review", "Review Impact Analysis", githubImpactWalkthrough, steps(
      ["Open the analysis workspace", "In GitHub's Connection setup, choose Impact Analysis. Analyses lists reviewed changes; Repositories contains the connected repository configuration."],
      ["Find the change", "Use search and status filters in Analyses, then open a row. Lists show ten entries per page; use pagination or load more where offered. Search filters the loaded records, not an unseen complete repository history."],
      ["Review Verification scope", "Inspect proposed cases and their saved revisions. Open Details beside a case to see the reason, confidence, and related files. Include or Exclude changes that case's membership; search changes only the visible selection."],
      ["Resolve Coverage gaps", "Review uncovered behavior. Add test lets you select existing coverage or prepare a draft where supported. Check Changes for file evidence and Activity for analysis events."],
      ["Approve the scope", "Confirm the exact current selection with Approve scope. Resolve readiness blockers first. Review the resulting run proposal and its suite, environment, and build before creating or starting a run."]),
      note("AI is optional", "When the server pauses AI, a banner explains availability. Existing analyses, code-evidence recommendations, and manual review remain available. AI draft actions are hidden while paused; manual drafts still work. Unavailable AI is not a completed AI assessment."),
      paragraph("If the analysis changes during a decision, Falcon loads its current version and asks you to review again. Approval is never retried automatically. When AI is enabled, exhausted request budgets defer work until the applicable limit resets.")),
    section("verify", "Test the connection", paragraph("Open an agreed test PR matching the rule. Check webhook delivery in GitHub, Falcon's log, and the created run's contents. Execute it and check commit status. Configure Slack separately for release and failure messages.")),
  ],
};
