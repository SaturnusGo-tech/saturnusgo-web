import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const slackWalkthrough = walkthrough("Set up Slack channel notifications", [
  shot("slack-01-connection-20260914-en-20260928", "Provide the bot and channel",
    "Open **Hooks → Slack**. Enter the Bot token and **Channel ID**, invite the bot to the channel and select **Verify access**. The screenshot deliberately leaves the token empty.",
    "This unsaved Payments form is inactive and both connection fields are empty. With valid credentials, Verify access checks the channel; a successful check alone does not send a message.",
    "Inactive Slack connection settings in Payments with empty Bot token and Channel ID fields."),
  shot("slack-02-events-20260914-en-20260928", "Choose events the team needs",
    "Open **Automation**. You can start with run completion and stopping, defect creation and fix confirmation. GitHub notifications also require a configured GitHub connection.",
    "The screenshot shows the default event selections with Enable integration unchecked. The content card describes a possible message; no settings were saved and no message was delivered.",
    "Slack notification event list covering runs, defects and GitHub events."),
  shot("slack-03-log-20260914-en-20260928", "Find delivery records",
    "Open **Activity & links** to find delivery records. After configuring valid access, selecting events, enabling the integration and saving, perform an agreed test event and compare its log entry with the message in Slack.",
    "The screenshot is the empty activity view of an inactive, unsaved integration. No messages were sent. For a configured channel, verify that the project, build and event source match.",
    "Slack log with no deliveries in the practice project."),
]);

export const githubWalkthrough = walkthrough("Connect a repository to a test suite", [
  shot("github-01-connection-20260914-en-20260928", "Connect the intended repository",
    "In **Hooks → GitHub**, enter a token and the repository as **owner/name**. Check access, save the connection while disabled, and configure the repository's signed webhook using the instructions below.",
    "The screenshot shows an inactive, unsaved connection with empty token and repository fields. No webhook address has been created. In a configured connection, its signing secret is separate from the API token.",
    "GitHub connection settings with access, repository and callback fields."),
  shot("github-02-automation-20260914-en-20260928", "Choose the trigger event",
    "Open **Automation**. Select the relevant events and choose **Add rule**. Enabling an event alone does not specify which cases should be checked.",
    "The default events are checked, but this integration is inactive and unsaved. A rule must connect an event to an existing test suite and environment before it can create a run.",
    "GitHub automation with PR, push, release and Actions events and an Add rule button."),
  shot("github-03-rule-20260914-en-20260928", "Limit the scope of the check",
    "Enter the rule name, event, suite and environment. Add branch and changed-path prefix filters if needed. Check the filters against real repository paths and save once connection setup is complete.",
    "The new unsaved rule has an automatically generated name and the default Pull request ready for QA event. No suite or environment is selected, and the integration remains inactive; no run was created.",
    "Unsaved GitHub rule with a generated name, Pull request ready for QA event, empty suite and environment selections, and disabled integration."),
]);

export const confluenceWalkthrough = walkthrough("Publish a completed run report", [
  shot("integrations-02-communication-20260914-en-20260928", "Choose a home for QA reports",
    "Prepare a Confluence space and parent page, then open **Hooks → Confluence** in the Falcon project.",
    "The catalog entry opens configuration for Payments. This capture does not show a connected space or published report; the connector is intended to publish completed run results.",
    "Integration catalog with Confluence in the communication and knowledge group."),
  shot("confluence-01-connection-20260914-en-20260928", "Verify the space and parent page",
    "Enter the site address, email, API token, space ID and parent page ID. Select **Verify access**. Use IDs rather than the page title or a short space key.",
    "This inactive, unsaved form leaves access and destination fields empty. When configuring your own connection, the parent must belong to the selected space and the account must have publishing permission.",
    "Confluence connection settings for site access and the report publishing destination."),
  shot("confluence-02-events-20260914-en-20260928", "Review publication settings",
    "In **Automation**, review **Run completed** and the Report contents card. After you configure valid access, enable the integration and save. Then complete an agreed test run and check its log and linked page.",
    "Run completed is checked in this preview, but Enable integration is unchecked and nothing was saved or published. For an actual report, compare its title, environment, build and totals with Falcon.",
    "Confluence automation showing run.complete and the report structure description."),
]);
