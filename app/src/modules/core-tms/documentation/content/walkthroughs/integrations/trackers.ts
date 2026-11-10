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
    "Enter the **API key** and either the team key or UUID in **Linear team ID or key** under **Service access**. Select **Verify access** and confirm the returned team before saving. Use **Incoming events** to copy the Falcon webhook URL and save Linear's signing secret.",
    "The webhook URL appears after you save the connection.",
    "Linear connection with key, team and callback fields and no secret values entered."),
]);

export const linearAccessWalkthrough = walkthrough("Get access details in Linear", [
  shot("linear-api-key-mac16", "Create a team-scoped API key",
    "Open **Settings → Account → Security & Access → New API key**. Under **Only select permissions**, choose **Read** for the access check. Add **Create and update issues** if Falcon will create issues or change their statuses. Under **Only select teams**, select the team that should receive defects, then create the key.",
    "The example shows **Read** and a single team selected. Copy the new key into Falcon's **API key** field.",
    "Linear personal API key form showing permission choices and the team scope."),
  shot("linear-identifier-mac16", "Find the short team identifier",
    "Open the **···** menu beside the team name in the Linear sidebar and choose **Team settings → General**. Copy **Identifier**. For an issue such as **QA-42**, the identifier is **QA**.",
    "The **Identifier** field in team settings contains the short key for this team.",
    "Linear team settings General page with the short Identifier field."),
  shot("linear-command-mac16", "Open Copy model UUID",
    "Open the team's **Issues** page from the Linear sidebar. Press **⌘K** on macOS or **Ctrl+K** on Windows, search for **Copy model UUID**, and open the command.",
    "Linear opens a list of records you can select to copy their UUIDs.",
    "Linear command menu with the Copy model UUID command ready to open."),
  shot("linear-team-uuid-mac16", "Copy the UUID from the Team row",
    "Type the team's name to narrow the results, then select the row marked **(Team)**. Paste that UUID into Falcon. Linear can also list **UserAccount**, **User** and **Organization** records in the same picker.",
    "Select the **(Team)** row so the clipboard contains the UUID Falcon expects.",
    "Linear UUID picker filtered by team name, with a single result marked Team."),
]);

export const linearConnectWalkthrough = walkthrough("Verify the Linear team in Falcon", [
  shot("linear-verify-access-mac16", "Check access to the team",
    "Under **Service access**, paste the personal key into **API key** and enter the short key or full UUID in **Linear team ID or key**. Click **Verify access**.",
    "Falcon checks read access and loads workflow statuses for the **Automation** tab.",
    "Falcon Linear connection settings with the API key, team identifier and Verify access controls."),
  shot("linear-access-verified-mac16", "Confirm the team before saving",
    "Compare the team name and UUID shown under **Where results go** with the team you selected in Linear.",
    "The verification result identifies the destination. If it shows a different team, correct the team before saving.",
    "Falcon Verify access result showing the Linear team's name and UUID."),
]);

export const linearWebhookWalkthrough = walkthrough("Set up incoming Linear events", [
  shot("linear-webhook-mac16", "Choose the team and Issues",
    "As a Linear workspace admin, open **Settings → Administration → API → New webhook**. Paste Falcon's **Webhook URL**, select the same team and choose **Issues** as the resource type. Save the webhook.",
    "The form shows the team and resource controls used to limit incoming issue updates.",
    "Linear New webhook form showing the team and Issues resource settings."),
]);

export const linearWorkflowWalkthrough = walkthrough("Map the retest workflow", [
  shot("linear-automation-mac16", "Choose the Linear status for retesting",
    "Open **Automation**. Keep **Defect created** selected if you want new Falcon defects to create issues in Linear. In **Fix workflow**, select the status that means a fix is ready for QA. To send verification back, optionally map **Verified** under **Update the service status**.",
    "The **Fix workflow** mapping determines which incoming status returns the defect to QA.",
    "Falcon Linear Automation tab with defect events and the Fix workflow controls."),
]);

export const linearVerifyWalkthrough = walkthrough("Check the test delivery", [
  shot("linear-activity-mac16", "Check deliveries and linked issues",
    "With the integration enabled, create an agreed test defect in Falcon using sample data. Open **Activity & links**, find a successful delivery, and open its linked issue. Confirm that the issue is in the intended Linear team.",
    "An empty log is shown here. After the test, look for a successful delivery and a linked issue in the intended team.",
    "Falcon Linear Activity and links tab where deliveries and linked issues appear."),
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
