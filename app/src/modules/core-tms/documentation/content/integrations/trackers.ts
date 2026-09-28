import { jiraWalkthrough, linearWalkthrough } from "../walkthroughs/integrations/trackers";
import { code, note, paragraph, section, steps, table, warning, type DocArticle } from "../../model/article";
export const trackerArticles: DocArticle[] = [
  { id: "jira", title: "Jira", group: "integrations", description: "Create issues from Falcon defects and return ready fixes for retesting.",
    keywords: ["Jira", "Atlassian", "jira", "API token", "JQL"], related: ["integration-overview", "retest", "integration-troubleshooting"],
    sources: [{ title: "Atlassian: API tokens", url: "https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/" },
      { title: "Jira: webhooks and signatures", url: "https://developer.atlassian.com/cloud/jira/platform/webhooks/" }],
    sections: [
      section("walkthrough", "Where to configure it in Falcon", jiraWalkthrough),
      section("prepare", "Prepare access", paragraph("The connection is designed for Jira Cloud. You need a site address, Atlassian email, and API token for an account allowed to read the project, create and edit issues, and execute workflow transitions."),
        note("Token type", "The current connector calls company.atlassian.net directly. Use a compatible API token without scopes: scoped tokens use a different Atlassian API route. Set an expiry and limit the account's access to required resources.")),
      section("connect", "Configure the connection", steps(
        ["Create an Atlassian token", "In your account's security settings, open API tokens and create a token with a clear name and expiry. Copy it into Falcon; your Google password is not used."],
        ["Open Hooks → Jira", "Enter the site address, email, API token, and Jira project key, such as QA."],
        ["Check access", "Click Check access. Choose an available issue type, such as Bug. If the type requires extra mandatory fields, make sure the project permits issue creation using Falcon's fields."],
        ["Save while disabled", "Copy the Webhook URL from Incoming updates."])),
      section("webhook", "Configure incoming events", steps(
        ["Create a Jira webhook", "A Jira administrator opens system webhooks and creates one. Paste the exact URL from Falcon."],
        ["Limit events to the project", "Enable issue creation and updates and add a JQL filter for the relevant project. Do not exclude the event body."],
        ["Configure the signature", "Set a separate random secret of at least 32 characters. Save the same secret in Jira and Falcon's Signing secret field."])),
      section("mapping", "Configure the fix workflow", paragraph("In **Automation**, select defect events. Under **Fix workflow**, choose Jira statuses that mean ready for retest. Map outgoing transitions to Falcon statuses or leave Do not change."),
        code("JQL", "Example webhook filter for one project", "project = QA"),
        warning("Respect Jira's workflow", "The selected target status must be reachable through a transition from the issue's current state. If workflow rules or permissions block the transition, the log reports an error; a status appearing in the list does not guarantee a valid transition.")),
      section("verify", "Verify the full cycle", paragraph("Enable the integration and save. Create a test defect in Falcon; the log should show successful delivery and a Jira issue link. Move that issue to the selected readiness status and check that the defect returns for retesting. After a successful retest, confirm the fix and check the outgoing transition.")),
    ] },
  { id: "linear", title: "Linear", group: "integrations", description: "Send defects to the engineering team and receive fix readiness through Issues webhooks.",
    keywords: ["Linear", "linear", "team", "team", "API key"], related: ["integration-overview", "retest", "integration-troubleshooting"],
    sources: [{ title: "Linear: webhooks", url: "https://linear.app/developers/webhooks" }, { title: "Linear: API access", url: "https://linear.app/developers/graphql" }],
    sections: [
      section("walkthrough", "Where to configure it in Falcon", linearWalkthrough),
      section("access", "Prepare the team and key", paragraph("You need an **API key** with access to the selected team and permission to read and manage issues, plus the **Linear team ID**. Limit the key to the relevant team. Creating a webhook requires a Linear workspace administrator.")),
      section("connect", "Connect Falcon", steps(
        ["Create a key", "In Linear, open Security & access settings and create a personal API key for Falcon. Grant the permissions needed to create, update, and read issues."],
        ["Fill in the service card", "In Hooks → Linear, enter the key and team ID. Do not use a project identifier or short issue prefix instead of the team ID."],
        ["Check access", "Click Check access and verify the displayed team and statuses."],
        ["Save while disabled", "Copy the Webhook URL from incoming update settings."])),
      section("webhook", "Add a Linear webhook", steps(
        ["Open API settings", "In Linear, create a New webhook. Enter the Falcon URL and a descriptive connection name."],
        ["Choose events", "Limit the webhook to the required team and the Issues resource type."],
        ["Copy the signing secret", "Copy the secret from Linear's webhook page into Falcon's Signing secret. This is separate from the API key."])),
      section("workflow", "Configure statuses", paragraph("In **Automation**, select defect events and team statuses that indicate readiness for retest. Set outgoing mappings for a verified fix and return to work. Enable the integration and save."),
        note("Statuses belong to a team", "Use the options loaded by Check access. Status names and IDs from another team are not valid.")),
      section("verify", "Test the connection", paragraph("Create a defect in the connected Falcon project. Open its linked Linear issue. Move it to the readiness status and refresh Falcon: the defect should return for retesting, while the test result remains unchanged until execution is repeated.")),
    ] },
];
