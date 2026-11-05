import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const sharedStepsWalkthrough = walkthrough("Review a reusable procedure", [
  shot("shared-01-library-20260914-en-20260928", "Find the procedure in its project",
    "Open **Shared steps** and check the selected project. The search magnifier opens search when you need it. Choose an existing procedure to inspect it, or use **Shared step** to prepare a new one.",
    "The library is filtered to the saved English **Booking preparation** documentation sample, with two actions, zero usages and revision 1. It contains fictional booking preparation and has not been executed.",
    "English shared-step library with the saved Booking preparation sample, two actions, zero usages and revision 1."),
  shot("shared-02-editor-assets-20260914-en-20260928", "Check the actions before reusing them",
    "Open the procedure and review its actions, expected results and materials. Select an action to edit it with the Markdown tools, and save only intended changes. To reuse it in a case, open **Scenario → Add step**, choose the shared procedure and review the resulting order before saving the case.",
    "The saved English documentation procedure is open with two actions and expected results. It has no attached materials or case usages; its fictional sample creates no booking or payment. No block was inserted into a case for this view.",
    "English Booking preparation shared procedure with two actions and fictional expected results."),
]);
