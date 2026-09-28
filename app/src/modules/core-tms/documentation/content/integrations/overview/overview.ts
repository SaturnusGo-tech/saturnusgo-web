import { articles, bullets, note, paragraph, section, steps, table, warning, type DocArticle } from "../../../model/article";
export const integrationOverview: DocArticle = {
  id: "integration-overview", title: "How integrations work", group: "integrations", description: "Connect testing, development, and communication: access setup, events, incoming updates, and delivery logs.",
  keywords: ["integrations", "hooks", "webhook", "connect", "services"], related: ["notifications", "slack", "github", "integration-troubleshooting"],
  sections: [
    section("available", "What is available now", table(["Service", "Purpose in Falcon", "Status"],
      ["Swagger / OpenAPI", "Project API specification and interactive requests", "Available"],
      ["YouTrack", "Defect routing, statuses, and fix confirmation", "Available"],
      ["Jira · Linear · Trello", "External defect issues and readiness updates for retesting", "Available"],
      ["GitHub + Actions", "Runs from PRs, pushes, releases, and workflow failures; results in commit status", "Available"],
      ["Slack", "Notifications for selected project events", "Available"],
      ["Confluence", "A report page for a completed run", "Available"],
      ["GitLab · Jenkins · TeamCity", "Catalog cards; automation configuration is not yet available", "Coming soon"])),
    section("access", "Before connecting", bullets("Choose a Falcon project and the corresponding service resource: a project, team, board, repository, or channel.",
      "Managing integrations requires workspace administrator or QA manager permissions. External service permissions are checked separately.",
      "Signing into a service with Google does not replace an API or bot token. Browser authentication and Falcon's API access are separate mechanisms.")),
    section("setup", "The general setup process", steps(
      ["Open the service card", "Click Hooks and select a service. Jira, Linear, Trello, GitHub, Slack, and Confluence have Connection, Automation, and Log and links sections. YouTrack has its own routing and status screens."],
      ["Enter access details", "Specify the resource and credentials. Click Check access to validate current permissions and load destination options."],
      ["Save while disabled", "For services with incoming events, the first save creates a Webhook URL. Use the address shown in your service card."],
      ["Configure incoming updates", "Create a webhook in the service and save the correct secret in Falcon. Slack and Confluence need no incoming webhook. Swagger uses a separate flow: specification URL, optional authorization, and save."],
      ["Choose automation", "Select events and configure statuses or testing rules. Enable the integration and click Save."],
      ["Verify the full cycle", "Perform an agreed test action. Check delivery, the external record, and the incoming status update where supported."])),
    section("lifecycle", "Credentials and resource changes", note("An empty secret preserves the existing value", "Falcon does not reveal a saved credential again. Enter a new one to replace it. Leaving the field empty on save preserves the existing credential."),
      paragraph("A saved connection's address and primary resource are fixed. To change the external project, use **Disconnect**, then configure a new connection. Existing external records and links are preserved; pending events are canceled. This does not revoke the credential in the external service.")),
    section("guides", "Service instructions", articles("swagger", "youtrack", "jira", "linear", "trello", "github", "slack", "confluence", "gitlab", "teamcity", "jenkins")),
  ],
};
