import { jiraWalkthrough, linearWalkthrough } from "../walkthroughs/integrations/trackers";
import { code, note, paragraph, section, steps, table, warning, type DocArticle } from "../../model/article";
export const trackerArticles: DocArticle[] = [
  { id: "jira", title: "Jira", group: "integrations", description: "Create issues from Falcon defects and return ready fixes for retesting.",
    keywords: ["Jira", "Atlassian", "jira", "API token", "JQL"], related: ["integration-overview", "retest", "integration-troubleshooting"],
    sources: [{ title: "Atlassian: API tokens", url: "https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/" },
      { title: "Jira: webhooks and signatures", url: "https://developer.atlassian.com/cloud/jira/platform/webhooks/" }],
    sections: [
      section("open", "Open the plugin settings", paragraph("Open **More sections → Hooks** and select this service. If needed, click **Install plugin** and wait for **Installing** to finish. Choose **Manage → Uses → Connection setup**. You can return through **Settings → Plugins**; Guide opens this instruction. Installation alone does not connect or enable the service.")),
      section("walkthrough", "Where to configure it in Falcon", jiraWalkthrough),
      section("prepare", "Prepare access", paragraph("The connection is designed for Jira Cloud. You need a site address, Atlassian email, and API token for an account allowed to read the project, create and edit issues, and execute workflow transitions."),
        note("Token type", "The current connector calls company.atlassian.net directly. Use a compatible API token without scopes: scoped tokens use a different Atlassian API route. Set an expiry and limit the account's access to required resources.")),
      section("connect", "Configure the connection", steps(
        ["Create an Atlassian token", "In your account's security settings, open API tokens and create a token with a clear name and expiry. Copy it into Falcon; your Google password is not used."],
        ["Open Integrations → Jira", "Enter the site address, email, API token, and Jira project key, such as QA."],
        ["Verify access", "Click Verify access. Choose an available issue type, such as Bug. If the type requires extra mandatory fields, make sure the project permits issue creation using Falcon's fields."],
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
  { id: "linear", title: "Linear", group: "integrations", description: "Connect this Falcon project to a Linear team. Send defects to Linear and bring fixes back to QA for retesting.",
    keywords: ["Linear", "team ID", "API key", "webhook", "signing secret"], related: ["retest", "integration-troubleshooting", "integration-overview"],
    sources: [{ title: "Linear API keys and webhooks", url: "https://linear.app/docs/api-and-webhooks" },
      { title: "Linear team UUIDs", url: "https://linear.app/developers/graphql#queries-and-mutations" },
      { title: "Linear webhook signatures", url: "https://linear.app/developers/webhooks" }],
    sections: [
      section("open", "Start in Connection setup", paragraph("Expand **Connection setup** for Linear and open **Connection**. Check that Falcon has the project selected whose defects should reach Linear. The connection applies to this project.")),
      section("access", "Get the API key and team ID from Linear", steps(
        ["Create a personal API key", "In Linear, go to **Settings → Account → Security & Access**. Create a key with **Read** and **Write** access and restrict it to the team that should receive defects."],
        ["Copy the team UUID", "Open that team's page in Linear. Press **⌘K** or **Ctrl+K**, search for **Copy model UUID**, and choose the team. Falcon expects the full team UUID."]),
        note("If you cannot create a key", "Ask your Linear workspace admin to grant permission to create personal API keys.")),
      section("connect", "Verify and save the connection", steps(
        ["Check access", "Under **Service access**, fill in **API key** and **Linear team ID**. Click **Verify access** and confirm that Falcon shows the intended team. This also loads its workflow statuses for the Automation tab."],
        ["Get the Falcon webhook URL", "Keep **Enable integration** off and click **Save connection**. The **Webhook URL** appears under **Incoming events**. Copy that URL for the next step."])),
      section("webhook", "Send issue updates from Linear to Falcon", steps(
        ["Create the webhook in Linear", "A Linear workspace admin opens **Settings → Administration → API → New webhook**. Paste the Falcon **Webhook URL**, select the same team, and choose **Issues** as the resource type."],
        ["Save its signing secret in Falcon", "Open the webhook you just created and copy its signing secret. Paste it in Falcon under **Incoming events → Signing secret**, then save changes. Keep the integration off until you finish the status mapping."])),
      section("workflow", "Choose when a fix returns to QA", paragraph("Open **Automation**. Keep **Defect created** selected to create Linear issues from new Falcon defects. Under **Fix workflow**, choose the Linear status that means the fix is ready for QA. Optionally, map **Verified** to a Linear status under **Update the service status**. Then turn on **Enable integration** and click **Save changes**."),
        note("Verify access again if statuses are missing", "Return to **Connection** and click **Verify access** to reload the workflow statuses for the configured team.")),
      section("verify", "Check one defect end to end", steps(
        ["Check delivery to Linear", "Create a test defect in this Falcon project. In **Activity & links**, look for a successful delivery and open the linked Linear issue. Check that the issue belongs to the intended team."],
        ["Check the return to QA", "Move the linked issue to the Linear status you mapped for retesting. Check that the Falcon defect becomes **Ready for QA**. The previous test result stays in place until a tester records a retest result."]),
        note("If the status does not return", "Check that the webhook is enabled for **Issues** in the same Linear team and that its current signing secret matches the one saved in Falcon.")),
      section("walkthrough", "Connection screen", linearWalkthrough),
    ] },
];
