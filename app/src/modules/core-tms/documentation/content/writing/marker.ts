import { markerWalkthrough } from "../walkthroughs/writing/tools";
import { paragraph, section, steps, type DocArticle } from "../../model/article";

export const coloredMarkerArticle: DocArticle = {
  id: "colored-marker", title: "Colored highlighter", group: "cases",
  description: "Highlight important text, preview the result before saving, and remove highlighting.",
  keywords: ["highlighter", "color", "selection", "highlight", "highlight"],
  related: ["create-test-case", "edit-test-case", "falcon-ai-writing"],
  sections: [
    section("walkthrough", "Walkthrough", markerWalkthrough),
    section("marker", "Highlight important text", steps(
      ["Select text", "Select a character, word, phrase, or heading and click **Highlighter** on the Markdown toolbar."],
      ["Choose a color", "Yellow, blue, green, pink, and lilac are available. The color appears immediately, before saving. The translucent stroke works with bold text, links, and other formatting. In a scenario, choosing a color shows the formatted draft; click it to continue editing."],
      ["Save or remove highlighting", "The color remains after saving and reopening the field, in both light and dark themes. To remove it, select the relevant text, open **Highlighter**, and click **Remove highlight**."])),
    section("runs", "Colors in a run", paragraph("Highlights appear in the case description, preconditions, and scenario within a run. The run uses its captured revision; later source case changes do not alter an existing run.")),
    section("independent", "Highlighting works without Falcon AI", paragraph("Choosing a color does not send an AI request. It is a text formatting tool. Use the separate blue Ask Falcon AI orb to change the wording.")),
  ],
};
