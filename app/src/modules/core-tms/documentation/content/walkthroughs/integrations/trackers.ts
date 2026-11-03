import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const jiraWalkthrough = walkthrough("Connect Jira in Falcon", [
  shot("jira-01-connection-20260914-en-20260928", "Set access and the destination project",
    "Open **Settings → Plugins → Jira → Connection setup → Connection**. Enter the site address, Atlassian email, API token and project key. Select **Verify access**, then choose an issue type. Stored credentials are not revealed in the screenshot. Use **Automation** for event and transition mappings, then **Activity & links** to review delivery records after an agreed test event.",
    "Verify that access resolves the intended Jira project. Save a newly configured connection while disabled to obtain its webhook address, then follow the callback instructions below. Opening these settings does not create an issue.",
    "Jira connection card with access and project fields and the integration disabled."),
]);

export const linearWalkthrough = walkthrough("Connect a Linear team", [
  shot("integrations-01-catalog-20260914-en-20260928", "Choose the service in the catalog",
    "Open **Integrations** in the current project and choose **Linear**. A plus action opens setup; a Connected label represents the saved connection state.",
    "The development team connection opens. Check that you are configuring it for the intended Falcon project.",
    "Falcon service catalog showing the available Linear integration."),
  shot("linear-01-connection-20260914-en-20260928", "Link Falcon to a team",
    "In **Settings → Plugins → Linear**, open **Connection setup → Connection**. Enter the **API key** and **Linear team ID**, then select **Verify access**. A short issue prefix does not replace the team ID. Save while disabled, create an Issues webhook for that team and copy its signing secret into Falcon.",
    "Statuses and issues belong to the chosen team. The API key and webhook signing secret have different roles and must not be interchanged.",
    "Linear connection with key, team and callback fields and no secret values entered."),
]);

export const trelloWalkthrough = walkthrough("Set up a Trello board", [
  shot("integrations-01-catalog-20260914-en-20260928", "Open Trello for the project",
    "In **Integrations**, choose **Trello**. Decide which board and lists will hold new bugs, ready fixes and completed checks.",
    "List names represent the team's workflow stages. Confirm the board's identity instead of relying on a similar name.",
    "Falcon catalog with the Trello card in the issues and planning group."),
  shot("trello-01-connection-20260914-en-20260928", "Verify board access",
    "In **Settings → Plugins → Trello**, open **Connection setup → Connection**. Enter the API key, user token and full board ID. Select **Verify access**, choose the list for new defects and save while disabled. Register the board webhook using the instructions below.",
    "Signing uses the **Trello application secret**, separately from the user token. An arbitrary invented secret will not work.",
    "Trello connection form with board access and callback settings."),
]);

export const youtrackConnectionWalkthrough = walkthrough("Inspect YouTrack access", [
  shot("youtrack-01-connection", "Check the connected YouTrack workspace",
    "Open **Settings → Plugins → YouTrack → Connection setup → Connection**. For first setup, enter the YouTrack HTTPS address and a permanent token with the required project and issue permissions. For existing access, inspect the address and use **Refresh access** when permissions change.",
    "Umbrella Home already has a saved connection to umbrella-home.youtrack.cloud with synchronization enabled and four projects available. Its permanent token is not exposed, and no access or settings were changed for this capture.",
    "Existing YouTrack connection with its workspace address, saved-token placeholder, enabled synchronization and four available projects."),
]);

export const youtrackRoutingWalkthrough = walkthrough("Inspect issue routing", [
  shot("youtrack-02-routing", "Match product areas to destination projects",
    "Open **Projects & rules**. Choose a default project where appropriate, then add component or tag rules for other destinations. Each enabled route needs the correct YouTrack project. Save only after reviewing the complete routing.",
    "The actual saved configuration has tag routes for android, ios and backend, each mapped to its corresponding Umbrella project. No default project is selected. The routes were inspected without editing or saving them.",
    "YouTrack project routing with three enabled tag rules and their Android, iOS and backend destinations."),
]);

export const youtrackStatusesWalkthrough = walkthrough("Inspect lifecycle mappings", [
  shot("youtrack-03-statuses", "Distinguish returned fixes from completed defects",
    "Open **Statuses** for each configured destination. Load its state field, choose **Ready for testing** values that return work to QA and **Completed** values that close the defect. Use **Other transitions** only where the workflow requires an outgoing state change.",
    "This page shows the existing three routes with state fields and status selections still unconfigured. It illustrates the required mapping controls, not a working retest lifecycle or confirmation that an external fix was tested.",
    "YouTrack Statuses page with per-route state fields, Ready for testing, Completed and optional transition controls."),
]);
