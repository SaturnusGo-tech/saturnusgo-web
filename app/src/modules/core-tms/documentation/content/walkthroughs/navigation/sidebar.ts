import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const sidebarWalkthrough = walkthrough("Choose sidebar sections and width", [
  shot("navigation-expanded-en-20260928",
    "Find the section you need",
    "Open **Test cases** in the expanded sidebar. Primary testing sections remain visible; additional tools are under **More sections**.",
    "The current section is highlighted and the repository stays beside navigation.",
    "Expanded Falcon sidebar with labeled testing sections beside the English test repository and saved booking case."),
  shot("navigation-02-context-20260928-inbox20260928-en-20260928",
    "Pin a frequent destination",
    "Open **More sections** and use the pin beside a destination. Click the pin again to remove its shortcut. Right-click the sidebar and choose **All sections**, or use the Context Menu key or **Shift+F10** while navigation has focus, for the same destination list.",
    "Pinned additional tools join the primary sidebar. There is no separate contextual-mode setting.",
    "Section list with navigation destinations and pin controls."),
  shot("organization-folder-01-tree-20260928-en-20260928",
    "Adjust the sidebar width",
    "Move to the right edge until the divider highlights and horizontal arrows appear. Drag left to collapse or right to keep it expanded.",
    "After collapse, hovering a work icon temporarily reveals navigation. Moving away closes it. The avatar and notification bell remain independent.",
    "Collapsed navigation with a narrow icon rail beside the workspace."),
  shot("navigation-account-production", "Keep account tools separate",
    "Open your avatar at the bottom of the sidebar to find **My profile**, **Settings**, **Help**, **Contact us** and **Sign out**. Company administrators also see **Company administration**.",
    "The menu shows Mercury Rucks as Workspace administrator. Opening it does not change navigation width, account permissions or notification preferences.",
    "Account menu with the signed-in workspace administrator and profile, settings, support and sign-out actions."),
]);
