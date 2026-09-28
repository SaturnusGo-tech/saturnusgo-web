import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const assistantWalkthrough = walkthrough("Prepare an AI request and handle an unavailable service", [
  shot("ai-01-request-20260913-en-20260928",
    "Prepare a request for the selected text",
    "Open the description editor in PAY-TC-34, select the sentence and choose **Ask Falcon AI**. Ask for one concise English QA verification sentence that keeps the same meaning and adds no requirements. Send it with the arrow.",
    "The dialog shows Selected text as its scope and the prepared request. Sending a request does not replace the description or save a case revision. This capture uses a demo environment without a configured AI provider.",
    "Ask Falcon AI dialog over PAY-TC-34 with an English request to rewrite the selected text as one concise QA verification sentence."),
  shot("ai-02-preview-20260913-en-20260928",
    "Read the unavailable-service message",
    "Check the response area after sending. Here Falcon displays **Falcon AI is unavailable. Try again. Your text is unchanged.** Close the dialog or retry after the service is available; no generated suggestion is ready to apply.",
    "The screenshot records the unavailable service in this demo environment. It does not mean Falcon AI is unavailable in every deployment. A configured, available service can return a suggestion for review before replacement.",
    "Falcon AI dialog showing the unavailable-service message below the English request, with no generated response."),
  shot("ai-03-replaced-20260913-en-20260928",
    "Return to the preserved original text",
    "Close the AI dialog with its top-right close control. Check the description in the editor: Verify access to the Falcon guide from the sidebar. You can continue editing manually or cancel the field edit.",
    "The original sentence and its yellow highlighting remain intact. No AI replacement was applied and no AI-generated revision was saved. The field's Apply control and the case's Save button remain separate actions.",
    "PAY-TC-34 description editor after closing Falcon AI, with the original highlighted sentence still selected and unchanged."),
]);

export const markerWalkthrough = walkthrough("Highlight text without an AI request", [
  shot("marker-01-palette-20260913-en-20260928",
    "Open the color palette",
    "Select a passage in the editor and choose **Highlight**. Pick a color in the palette; this example selects the entire description.",
    "The highlighter changes the selected text's formatting. It does not require a Falcon AI request or a rewrite of the content.",
    "Open highlighter color palette above a selected test case description."),
  shot("marker-02-preview-20260913-en-20260928",
    "Check the color before saving",
    "Clear the text selection to see the highlight color. It appears in the editor before you apply the field or save the case.",
    "The screenshot shows yellow highlighting behind the single sentence: Verify access to the Falcon guide from the sidebar. Its wording and meaning are unchanged.",
    "PAY-TC-34 description editor showing the single sentence highlighted yellow before applying and saving the change."),
  shot("edit-02-saved-20260913-en-20260928",
    "Verify the saved result",
    "Apply the field change and save the case. To remove the color, select the passage again and choose **Remove highlight** in the palette.",
    "After saving, the description displays the highlight color. Existing runs continue using their earlier case revision.",
    "Saved PAY-TC-34 case with its single description sentence highlighted yellow in reading mode."),
]);
