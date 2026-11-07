import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const jiraWalkthrough = walkthrough("Connect Jira in Falcon", [
  shot("jira-01-connection-20260914-en-20260928", "Set access and the destination project",
    "Open **Settings → Plugins → Jira → Connection setup → Connection**. Enter the site address, Atlassian email, API token and project key. Select **Verify access**, then choose an issue type. Stored credentials are not revealed in the screenshot. Use **Automation** for event and transition mappings, then **Activity & links** to review delivery records after an agreed test event.",
    "This unconfigured form has empty access and destination fields. **Verify access** is available; viewing it has not verified credentials, saved a connection or created an issue.",
    "English Jira connection setup with empty site, email, token, project and issue-type fields."),
]);

export const linearWalkthrough = walkthrough("Connect a Linear team", [
  shot("linear-01-connection-20260914-en-20260928", "Connection fields",
    "Enter the **API key** and **Linear team ID** under **Service access**. Use **Incoming events** to copy the Falcon webhook URL and save Linear's signing secret.",
    "The webhook URL appears after you save the connection.",
    "Linear connection with key, team and callback fields and no secret values entered."),
]);

export const trelloWalkthrough = walkthrough("Set up a Trello board", [
  shot("integrations-01-catalog-20260914-en-20260928", "Open Trello for the project",
    "In **Integrations**, choose **Trello**. Decide which board and lists will hold new bugs, ready fixes and completed checks.",
    "The current **Plugins** catalog includes **Trello** with its setup control. Viewing the catalog does not choose a board or change any list mapping.",
    "English Falcon Plugins catalog with the Trello row and setup control."),
  shot("trello-01-connection-20260914-en-20260928", "Verify board access",
    "In **Settings → Plugins → Trello**, open **Connection setup → Connection**. Enter the API key, user token and full board ID. Select **Verify access**, choose the list for new defects and save while disabled. Register the board webhook using the instructions below.",
    "Signing uses the **Trello application secret**, separately from the user token. An arbitrary invented secret will not work.",
    "English Trello connection setup with empty API key, token, board and new-defect-list fields."),
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
    "English YouTrack Statuses controls for Android and iOS routes with unconfigured state fields and status mappings."),
]);
