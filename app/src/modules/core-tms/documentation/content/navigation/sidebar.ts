import { bullets, note, paragraph, section, steps, table, type DocArticle } from "../../model/article";
import { sidebarWalkthrough } from "../walkthroughs/navigation/sidebar";

export const navigationArticle: DocArticle = {
  id: "navigation", title: "Navigation and sidebar", group: "start",
  description: "Find your workspace section, collapse the menu, or show only the items you need.",
  keywords: ["sidebar", "side menu", "navigation", "pin", "unpin", "all sections", "contextual", "phone"],
  related: ["settings", "workspace", "permissions", "notifications"],
  sections: [
    section("walkthrough", "Try customizing the menu", sidebarWalkthrough),
    section("sections", "How the menu is organized", table(["Location", "Sections"],
      ["Main sidebar", "Dashboard, Test cases, Shared steps, Test runs, Test suites, and Reports."],
      ["More sections", "Portfolios and projects, Custom fields, API Testing, and Hooks. Hooks opens the Integrations catalog. Pin frequently used sections to the main sidebar."],
      ["Bottom controls", "Notifications and your account menu remain separate from work navigation."]),
      paragraph("The active section is highlighted. The import screen belongs to Test cases. A red dot beside Test runs means the selected project has a run in progress; it does not indicate unread notifications.")),
    section("modes", "Find a section", steps(
      ["Open More sections", "Click or hover over the three-dot control in the main sidebar. Choose a section by name."],
      ["Use All sections if needed", "Right-click the sidebar and choose All sections. With focus in the sidebar, the Context Menu key or Shift+F10 opens the same menu."],
      ["Open your destination", "Choose an available section. This does not change your project or permissions."]),
      note("One navigation list", "The sidebar keeps the primary work sections visible. Additional sections live in More sections; there is no separate All/Contextual mode to configure.")),
    section("pins", "Pin frequently used sections", paragraph("Use the pin beside a section in **More sections** or **All sections** to keep it in the main sidebar. Click the pin again to remove that shortcut. Primary work sections remain available without pinning."),
      note("Where your choices are saved", "Pins and sidebar width are saved in this browser for your account and workspace. Configure them again on another browser or device. If local storage is unavailable, the preference lasts until reload.")),
    section("collapse", "Make more room for your work", paragraph("On a desktop, move to the sidebar's right edge: its divider highlights and the pointer changes to horizontal resize arrows. Drag left to collapse or right to expand. You can also hold the sidebar and swipe in the same direction. The content adjusts with the sidebar instead of being covered by it."),
      paragraph("After manual collapse, hovering over a work icon temporarily reveals the menu. Moving away closes that preview; drag right to keep it open. Hovering over **Notifications** or your avatar opens their own controls and does not reveal the work menu."),
      paragraph("With keyboard focus on the navigation-width divider, use Left or Home to collapse and Right or End to expand. Falcon saves the chosen width in this browser.")),
    section("utilities", "Personal and utility sections", table(["Control", "Purpose"],
      ["Avatar → Settings", "Project details, environments, import and export; personal appearance, language, notifications, current session, and Plugins."],
      ["Avatar → Help", "Falcon Docs and the separate Falcon AI chat tab."],
      ["Avatar → Contact us", "Send a question, bug, or improvement request to the Falcon team."],
      ["Notifications bell", "Opens the event feed. Its settings gear opens Settings → Notifications."],
      ["Avatar → Company administration", "Manage company members and access, when your role allows it."],
      ["Avatar → My profile", "Open your profile, including the separate Devices and sessions view, when available."])),
    section("availability", "If a section is missing or a button is unavailable", bullets(
      "Open More sections or All sections first: the section may not be pinned to the sidebar.",
      "The menu reflects your company's enabled features and your permissions. Hooks requires integration management permission; API Testing requires access to integrations. Pinning does not bypass these restrictions.",
      "Most work sections require a selected project. If none is selected, open Portfolios and projects and select a project, or create one if you have permission. Help, contact, and notifications are available separately.",
      "If a feature is also missing from the full list, ask your company administrator about access.")),
    section("small-screen", "On a narrow screen", paragraph("On a phone, navigation sits at the bottom of the screen. Work icons scroll horizontally, with utility controls alongside them. All sections lets you open a section by name; it does not change your access."),
      paragraph("The menu button in the top bar shows or hides bottom navigation. Your profile appears as an avatar when available. Use Tab and Enter for keyboard navigation. The Context Menu key or Shift+F10 opens the sidebar context menu; Escape closes menus, the sections dialog, and tooltips.")),
  ],
};
