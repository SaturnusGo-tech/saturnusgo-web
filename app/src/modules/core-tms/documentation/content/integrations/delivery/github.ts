import { githubWalkthrough } from "../../walkthroughs/integrations/delivery";
import { code, note, paragraph, section, steps, table, warning, type DocArticle } from "../../../model/article";
export const githubArticle: DocArticle = {
  id: "github", title: "GitHub and GitHub Actions", group: "integrations", description: "Connect code changes to the right tests: automatic runs, an exact build, and QA results in commit status.",
  keywords: ["GitHub", "Actions", "CI", "PR", "pull request", "push", "release", "build failed", "workflow"], related: ["test-suites", "slack", "integration-troubleshooting"],
  sources: [{ title: "GitHub: creating a webhook", url: "https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks" },
    { title: "GitHub: access tokens", url: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" }],
  sections: [
      section("walkthrough", "Where to configure it in Falcon", githubWalkthrough),
    section("flow", "What happens automatically", table(["Event", "When Falcon creates a run"],
      ["Pull request", "Opening, reopening, a new commit, or readiness for review. The PR must be open and not a draft."],
      ["Push", "A branch change; branch deletion and tag pushes do not trigger runs."],
      ["Release", "Publishing a release."],
      ["GitHub Actions", "A workflow_run completes with failure, timed_out, action_required, or startup_failure."]),
      paragraph("The event must be enabled in the connection and match a testing rule. Each matching rule creates a run of its selected suite with the environment, build, and source link.")),
    section("access", "Prepare the repository and token", paragraph("Use a token limited to the required repository. The current connector needs **Contents: read**, **Pull requests: read**, and **Commit statuses: write**. Repository administrator permissions are separately required to configure the webhook.")),
    section("connect", "Configure the connection", steps(
      ["Fill in Hooks → GitHub", "Enter the API token and repository as owner/name. Click Check access and verify the repository."],
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
    section("verify", "Test the connection", paragraph("Open an agreed test PR matching the rule. Check webhook delivery in GitHub, Falcon's log, and the created run's contents. Execute it and check commit status. Configure Slack separately for release and failure messages.")),
  ],
};
