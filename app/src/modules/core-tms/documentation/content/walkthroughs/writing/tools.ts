import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const assistantWalkthrough = walkthrough("Review an AI request before sending", [
  shot("ai-01-request-20260913-en-20260928",
    "Prepare a request for the field",
    "Open a case field’s Markdown editor and choose **Ask Falcon AI**. It can use the entire field; select a passage first when the request should target only that text. Describe the change and review the scope before sending. A returned suggestion must be reviewed before applying it; applying a suggestion and saving the case are separate actions.",
    "The screenshot shows the request interface set to **Entire field** over an unsaved new-case draft in the real company. No AI request was sent, no suggestion was generated or applied, and no case revision was saved to create this image. If the service is unavailable, preserve the original text and retry later.",
    "Ask Falcon AI request composer above an unsaved test-case description."),
]);

export const markerWalkthrough = walkthrough("Highlight text without an AI request", [
  shot("marker-01-palette-20260913-en-20260928",
    "Choose and review a highlight",
    "Select a passage in the Markdown editor and choose **Highlight** to open the palette. Select a color, then clear the text selection to review it. Apply and save only when you intend to update the case. To remove the color, select the passage again and choose **Remove highlight**.",
    "The palette is shown in an unsaved editor. Highlighting formats selected text without requesting an AI rewrite. No saved revision was changed for this capture; existing runs retain their snapshotted case revisions.",
    "Five-color Highlight palette with Remove highlight open over an unsaved English test-case description."),
]);
