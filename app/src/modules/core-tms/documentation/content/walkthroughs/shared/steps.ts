import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const sharedStepsWalkthrough = walkthrough("Review a reusable procedure", [
  shot("shared-01-library-20260914-en-20260928", "Find the procedure in its project",
    "Open **Shared steps** and check the selected project. The search magnifier opens search when you need it. Choose an existing procedure to inspect it, or use **Shared step** to prepare a new one.",
    "The real library includes an existing UX audit procedure with three actions, six usages and revision 1. These are saved records; no procedure was created or revised for the image.",
    "Shared-step library with an existing UX audit procedure and its revision, action count and usages."),
  shot("shared-02-editor-assets-20260914-en-20260928", "Check the actions before reusing them",
    "Open the procedure and review its actions, expected results and materials. Select an action to edit it with the Markdown tools, and save only intended changes. To reuse it in a case, open **Scenario → Add step**, choose the shared procedure and review the resulting order before saving the case.",
    "The existing three-action procedure is open for inspection. Its usages identify cases that reuse it. No action was edited and no shared block was inserted or saved in another case for this capture.",
    "Existing shared procedure open with its three actions and expected results."),
]);
