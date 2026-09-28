import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const sidebarWalkthrough = walkthrough("Choose sidebar sections and width", [
  shot("navigation-expanded-en-20260928", "Find the section you need",
    "In the expanded sidebar, find the **Testing** group and open **Test cases**. The example uses Payments: its folder tree and an open test case appear beside the sidebar.",
    "The active Test cases item is highlighted. Sections are grouped by task. Right-click the sidebar to open its context menu, then choose All sections to customize the list.",
    "Expanded Falcon sidebar with Overview, Testing, Management and Insights groups beside the Payments repository."),
  shot("navigation-01-context-action-en-20260928", "Open the sidebar context menu",
    "Right-click anywhere on the sidebar. Choose **All sections** in the small context menu to open navigation preferences. The Context Menu key or **Shift+F10** provides the same action while a sidebar control has focus.",
    "The menu contains one action and disappears when you click elsewhere or press Escape. There is no permanent All sections button taking up space in the sidebar.",
    "Falcon sidebar context menu with the All sections action above the bottom Collapse navigation control."),
  shot("navigation-02-context-20260928-en-20260928", "Choose a mode and pin a section",
    "Right-click the sidebar and choose **All sections**. With the sidebar focused, the Context Menu key or **Shift+F10** opens the same menu. Select **Contextual** and pin any section you want to keep visible. Scroll to find more sections.",
    "The screenshot shows Contextual mode; filled pins mark pinned sections. These remain visible alongside the main items and the current section group. The full list provides access to other sections.",
    "All sections menu over Settings → Account and session, with Contextual mode selected and section pin controls visible."),
  shot("navigation-03-collapsed-20260928-en-20260928", "Collapse the sidebar and keep your preferences",
    "Close the section list and select **Collapse** below **Notifications** at the bottom of the sidebar. Hover over an icon or focus it with Tab to read its label. Select the bottom expand control to restore the full sidebar.",
    "The sidebar becomes a narrow strip while Account and session stays open. Collapsing changes its width and preserves your mode and pins. Settings, Help, Contact us and Notifications remain available at the bottom.",
    "Collapsed sidebar beside Settings → Account and session, showing Anna Taylor and the Sign out control."),
]);
