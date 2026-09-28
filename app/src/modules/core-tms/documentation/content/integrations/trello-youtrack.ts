import { trelloWalkthrough } from "../walkthroughs/integrations/trackers";
import { code, note, paragraph, section, steps, table, warning, type DocArticle } from "../../model/article";
export const boardAndYouTrack: DocArticle[] = [
  { id: "trello", title: "Trello", group: "integrations", description: "Create defect cards and use board lists as stages for fixing and retesting.",
    keywords: ["Trello", "trello", "board", "Power-Up", "card", "webhook"], related: ["integration-overview", "retest", "integration-troubleshooting"],
    sources: [{ title: "Trello: webhooks", url: "https://developer.atlassian.com/cloud/trello/guides/rest-api/webhooks/" },
      { title: "Trello: API keys and authorization", url: "https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/" }],
    sections: [
      section("walkthrough", "Where to configure it in Falcon", trelloWalkthrough),
      section("prepare", "Prepare the board and access", table(["Value", "Purpose"],
        ["API key Power-Up", "Identifies the Trello application."], ["User API token", "Grants read/write access to the required board."],
        ["Trello application secret", "Verifies webhook signatures; obtain it in Power-Up settings."],
        ["Board ID", "Identifies the connection's single board."], ["New defects list", "The destination for newly created cards."])),
      section("connect", "Configure the connection", steps(
        ["Create Power-Up access", "In Power-Up administration, obtain an API key and authorize a user token with read/write access. Save the application secret separately."],
        ["Fill in Hooks → Trello", "Enter the API key, token, and full board ID. The board's short browser address is not always its full API ID."],
        ["Check access", "Click Check access and choose a list for new defects."],
        ["Prepare the callback", "Save the connection while disabled and obtain the Webhook URL. Enter the application secret in Falcon and save again while disabled before registering the webhook."])),
      section("webhook", "Register the board webhook", paragraph("Trello registers webhooks through its API. Use Falcon's exact callbackURL and the board's full idModel. During registration, Trello checks the address with HEAD and expects 200."),
        code("JSON", "Trello API webhook registration fields; replace placeholders with your values", '{\n  "description": "Falcon — QA board events",\n  "callbackURL": "<Webhook URL from Falcon>",\n  "idModel": "<full board ID>"\n}'),
        paragraph("Send these fields when creating a webhook through `POST /1/webhooks`, using the Trello API key and user token. Request and authorization formats are in the official instructions below."),
        warning("Use the application secret", "Do not generate an arbitrary secret or use the user token for this field: Trello signs events with the application secret. The callback must match the registered URL.")),
      section("lists", "Map lists", paragraph("In **Automation**, choose defect events. Map a list such as **Ready for QA** to retest readiness and **Done** to the outgoing state after fix confirmation. Lists are loaded as the board's status options.")),
      section("verify", "Check the card and incoming update", paragraph("Enable the integration and save. Create a test defect and open the resulting card from the log. Move it to the selected retest list and check readiness in Falcon. After verification, confirm that the outgoing mapping moved the card to the correct list.")),
    ] },
  { id: "youtrack", title: "YouTrack", group: "integrations", description: "Configure destination projects, defect routing, and an agreed fix lifecycle.",
    keywords: ["YouTrack", "youtrack", "you track", "UTrack", "perm", "Webhook Triggers"], related: ["create-defect", "retest", "integration-troubleshooting"],
    sources: [{ title: "YouTrack: permanent tokens", url: "https://www.jetbrains.com/help/youtrack/cloud/manage-permanent-token.html" },
      { title: "YouTrack: Webhook Triggers", url: "https://www.jetbrains.com/help/youtrack/server/webhook-triggers.html" }],
    sections: [
      section("access", "Connect YouTrack", steps(
        ["Get a permanent token", "Open your YouTrack profile → account security → tokens. Create a Falcon token with the YouTrack scope. Its owner must have access to the required projects and issue operations."],
        ["Open the YouTrack card", "Go to Hooks → YouTrack → Connection. Enter the YouTrack HTTPS address and permanent token. Installations under /youtrack/ are supported."],
        ["Connect", "Click Connect and wait for available projects. For an existing connection, use Refresh access to reload permissions and fields."])),
      section("routing", "Configure destination projects", paragraph("Open **Projects and rules** and select the primary project under **Where to create issues**. Add **component** or **tag** rules if different teams support different product areas. Set a destination project for every route; do not duplicate identical conditions.")),
      section("states", "Map statuses", steps(
        ["Choose the status field", "Open Statuses. For each destination project, choose the field that represents its workflow."],
        ["Set readiness", "Under Ready for verification, select statuses that return the fix to the tester."],
        ["Set completion", "Under Completed, choose final statuses. Configure other incoming and outgoing transitions under Other transitions."],
        ["Save settings", "Make sure a status does not belong to conflicting stages and every active route is configured."])),
      section("webhook", "Receive issue updates", paragraph("After saving, open **Webhook**. **Updates from YouTrack** provides a URL, HTTP header name, and webhook token. In YouTrack, connect **Webhook Triggers** to the relevant projects and copy these values for issue change and deletion events."),
        note("YouTrack uses its own webhook authentication", "Use the header and token shown by Falcon. Do not replace them with another service's signing secret. Disconnecting YouTrack changes the webhook token.")),
      section("verify", "Verify the lifecycle", paragraph("Create a defect with a routed component or tag. Check the created issue's project, incoming readiness, and confirmation after retesting. Transition sent does not yet mean YouTrack confirmed it: Falcon shows these stages separately."),
        warning("Final status and verified retest", "An incoming final YouTrack status can close the Falcon defect. If a matching retest was not recorded, the interface reports this separately. Do not treat a final status as proof of test execution.")),
    ] },
];
