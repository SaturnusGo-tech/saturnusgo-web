import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const slackWalkthrough = walkthrough("Set up Slack channel notifications", [
  shot("slack-01-connection-20260914-en-20260928", "Provide the bot and channel",
    "In **Settings → Plugins → Slack**, open **Connection setup → Connection**. Enter the Bot token and **Channel ID**, invite the bot to the channel and select **Verify access**. A stored token is not revealed; leaving its replacement field empty preserves it. Under **Automation**, choose the run and defect events the channel needs; GitHub notifications also require a configured GitHub connection.",
    "This is the existing connection with a stored token and channel ID. A channel name such as #qa does not replace its ID. The last access check does not prove that a new message was sent.",
    "Existing Slack connection settings with Bot token and Channel ID fields; the stored secret is not shown."),
  shot("slack-03-log-20260914-en-20260928", "Find delivery records",
    "Open **Activity & links** to find delivery records. After configuring valid access, selecting events, enabling the integration and saving, perform an agreed test event and compare its log entry with the message in Slack.",
    "The real activity log already contains Delivered entries, including run creation and comment mentions. These are past deliveries; no new message or test event was sent for the screenshot.",
    "Existing Slack activity log with delivered events, timestamps and attempt counts."),
]);

export const githubWalkthrough = walkthrough("Connect a repository to a test suite", [
  shot("github-01-connection-20260914-en-20260928", "Connect the intended repository",
    "In **Settings → Plugins → GitHub → Connection setup → Connection**, enter a token and the repository as **owner/name**. Check access, save a new connection while disabled, and configure the signed webhook. In **Automation**, choose the intended event and add a rule before enabling delivery.",
    "Falcon must receive events from the intended repository. The webhook address and signing secret are separate from the GitHub API token; stored secrets are not revealed.",
    "GitHub connection settings with access, repository and callback fields."),
  shot("github-02-automation-20260914-en-20260928", "Limit the scope of the check",
    "In **Automation**, select the events your project needs, then choose **Add rule**. Set a rule name, event, suite and environment. Branch and changed-path prefix filters restrict which repository changes match. Check the filters against actual paths before saving.",
    "The screenshot shows the existing event preferences and an empty Testing rules section with Add rule. No new rule or run was saved. Choosing an event alone does not select the tests for an incoming change.",
    "GitHub Automation showing event preferences, an empty Testing rules section and Add rule."),
]);

export const confluenceWalkthrough = walkthrough("Publish a completed run report", [
  shot("confluence-01-connection-20260914-en-20260928", "Verify the space and parent page",
    "Open **Settings → Plugins → Confluence → Connection setup**. Enter the site address, email, API token, space ID and parent page ID. Select **Verify access**. Use IDs rather than a page title or short space key. Under **Automation**, choose **Run completed** and enable the configured connection; after an agreed completion event, check its delivery and linked page.",
    "The existing connection contains space and parent-page IDs. Stored email and token values are not revealed. The parent must belong to the selected space, and the configured account needs publishing permission.",
    "Confluence connection settings for site access and the report publishing destination."),
]);

export const githubImpactWalkthrough = walkthrough("Review the change before approving coverage", [
  shot("github-impact-01-list", "Find the analysis that belongs to the change",
    "Open **GitHub → Connection setup → Impact Analysis**. Check the repository, branch, commit and build status. Search the loaded analyses, use the page controls or load more, then open the intended row.",
    "The actual company list contains existing analyses with review states, risks, case counts and gaps. An analysis state and a GitHub build result describe different things; neither is proof that the proposed tests were executed.",
    "English GitHub Impact Analysis list with existing change summaries, build and review states, risks, coverage counts and the AI availability notice."),
  shot("github-impact-02-changes", "Compare the proposed scope with source evidence",
    "Open **Changes** and review affected areas and changed files. Compare an incomplete list with the source diff before approving anything. In **Verification scope**, inspect each case’s Details and saved revision before including or excluding it.",
    "This existing iOS analysis shows seven changed files, zero selected cases and a warning that the change list is incomplete. AI impact analysis is paused; the screenshot is a manual review, not a new AI assessment or approval.",
    "Changes tab for an existing iOS analysis, with seven files, affected areas, an incomplete-scope warning and the AI availability banner."),
  shot("github-impact-03-gaps", "Resolve gaps before starting a run",
    "Open **Coverage gaps**, expand an entry and inspect the missing checks and files. Use existing coverage or prepare a reviewed draft where supported. A draft does not automatically join the run. Approve scope only after resolving blockers, then review the run proposal separately.",
    "The screenshot shows one Unmapped or incomplete change scope gap covering five files with zero checks. Nothing was generated, included, approved or executed for this illustration.",
    "Coverage gaps tab with one existing unmapped or incomplete scope entry marked Needs review."),
]);
