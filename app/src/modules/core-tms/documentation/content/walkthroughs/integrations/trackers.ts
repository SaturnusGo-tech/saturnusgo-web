import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const jiraWalkthrough = walkthrough("Connect Jira in Falcon", [
  shot("jira-01-connection-20260914-en-20260928", "Set access and the destination project",
    "Open **Hooks → Jira → Connection**. Enter the site address, Atlassian email, API token and project key. Select **Verify access**, then choose an issue type. The screenshot leaves credentials empty.",
    "This Payments form is inactive and unsaved, with empty credentials and project fields. With valid details, verify the project and save while disabled to obtain a webhook address before following the callback instructions below.",
    "Jira connection card with access and project fields and the integration disabled."),
  shot("jira-02-automation-20260914-en-20260928", "Choose events and fix transitions",
    "Open **Automation**. Keep the events that should reach Jira. Once statuses load, configure retest readiness and outgoing transitions; status names depend on your project's workflow.",
    "The screenshot shows default event choices for an inactive integration; no mappings or connection were saved. Configure the webhook and loaded status mappings before enabling and saving your own connection.",
    "Jira Automation tab showing the list of defect events."),
  shot("jira-03-log-20260914-en-20260928", "Check the result in the log",
    "After an agreed test action, open **Activity & links**. Check delivery and the issue link, then verify that changing the Jira issue status returns readiness to Falcon.",
    "This unsaved integration was not enabled, so its log is empty and no external issue was created. For a live connection, verify both successful delivery and the correct linked issue.",
    "Empty Jira connection log with delivery and issue link sections."),
]);

export const linearWalkthrough = walkthrough("Connect a Linear team", [
  shot("integrations-01-catalog-20260914-en-20260928", "Choose the service in the catalog",
    "Open **Hooks** in the current project and choose **Linear**. Available means the integration can be configured, not that it is already connected.",
    "The development team connection opens. Check that you are configuring it for the intended Falcon project.",
    "Falcon service catalog showing the available Linear integration."),
  shot("linear-01-connection-20260914-en-20260928", "Link Falcon to a team",
    "Enter the **API key** and **Linear team ID**, then select **Verify access**. A short issue prefix does not replace the team ID. Save while disabled, create an Issues webhook for that team and copy its signing secret into Falcon.",
    "This inactive, unsaved form has no API key or team ID entered. In your configured connection, statuses belong to the chosen team; the API key and signing secret have different roles.",
    "Linear connection with key, team and callback fields and no secret values entered."),
  shot("linear-02-events-20260914-en-20260928", "Configure the defect workflow",
    "In **Automation**, choose events and map the team's loaded statuses. After configuring callbacks, enable the integration and save. Test with a separate, agreed issue.",
    "The capture shows event settings only, with the integration inactive and unsaved. After a real connection is configured, verify the defect link and incoming retest readiness; this preview created no Linear issue.",
    "Linear Automation tab with defect event choices."),
]);

export const trelloWalkthrough = walkthrough("Set up a Trello board", [
  shot("integrations-01-catalog-20260914-en-20260928", "Open Trello for the project",
    "In **Hooks**, choose **Trello**. Decide which board and lists will hold new bugs, ready fixes and completed checks.",
    "List names represent the team's workflow stages. Confirm the board's identity instead of relying on a similar name.",
    "Falcon catalog with the Trello card in the issues and planning group."),
  shot("trello-01-connection-20260914-en-20260928", "Verify board access",
    "Enter the API key, user token and full board ID. Select **Verify access**, choose the list for new defects and save while disabled. Register the board webhook using the instructions below.",
    "The screenshot is an inactive, unsaved form with empty credentials and board fields. For your connection, signing uses the **Trello application secret**, separately from the user token; an arbitrary secret will not work.",
    "Trello connection form with board access and callback settings."),
  shot("trello-02-events-20260914-en-20260928", "Map lists to fix stages",
    "Open **Automation**, choose events and map board lists. After configuring the webhook, enable and save the connection. Check card creation and movement to the ready list.",
    "The capture shows default events in an inactive, unsaved integration. No board lists were loaded and no card was created or moved. In a configured connection, moving a linked card to the retest list signals readiness; execution verifies the fix.",
    "Trello automation with defect creation and update events."),
]);
