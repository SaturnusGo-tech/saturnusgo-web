import { bullets, note, paragraph, section, steps, table, type DocArticle } from "../../model/article";
import { sidebarWalkthrough } from "../walkthroughs/navigation/sidebar";

export const navigationArticle: DocArticle = {
  id: "navigation", title: "Navigation and sidebar", group: "start",
  description: "Find your workspace section, collapse the menu, or show only the items you need.",
  keywords: ["sidebar", "side menu", "navigation", "pin", "unpin", "all sections", "contextual", "phone"],
  related: ["settings", "workspace", "permissions", "notifications"],
  sections: [
    section("walkthrough", "Try customizing the menu", sidebarWalkthrough),
    section("sections", "How the menu is organized", table(["Group", "Sections"],
      ["Overview", "Dashboard."],
      ["Testing", "Test cases, Shared steps, Test runs, Suites."],
      ["Management", "Portfolios and projects, Custom fields, API Testing, Hooks."],
      ["Insights", "Reports."]),
      paragraph("The active section is highlighted. The import screen belongs to Test cases. A red dot next to Test runs means the selected project has a run in progress; it does not indicate unread notifications.")),
    section("modes", "Show all sections or just the ones you need", steps(
      ["Open All sections", "Right-click the sidebar to open its context menu, then choose All sections. With keyboard focus in the sidebar, press the Context Menu key or Shift+F10 to open the same menu."],
      ["Choose a mode", "All sections shows every work section available to you. Contextual keeps the core sections, the current group, and pinned items visible."],
      ["Open a section", "The dialog lists every available section, including those hidden by contextual mode. Click a name to open it."]),
      note("What stays visible in contextual mode", "The core sections are Dashboard, Test cases, Test runs, and Reports, when available to your account. The current section's entire group also remains visible. For example, Shared steps and Test suites stay visible while you work with cases.")),
    section("pins", "Pin frequently used sections", paragraph("In **All sections**, click the pin next to a section name. Pinned items stay in the sidebar when the context changes. Click again to unpin. Pinning does not change the order of sections."),
      paragraph("In All sections mode, pinning makes no visible difference because every item is already shown. Switch to Contextual to check your pins. An unpinned item may remain visible if it is a core section or belongs to the current group."),
      note("Where your choices are saved", "The mode and pins are saved in this browser for your account and workspace. Set them again when using another browser or device. If the browser blocks local storage, your choices last until the page reloads.")),
    section("collapse", "Make more room for your work", paragraph("On a desktop, click **Collapse** below **Notifications** at the bottom of the sidebar. The collapsed menu shows icons; hover over an icon or focus it with Tab to see its label. Use the same control to expand the menu. Your collapsed view preference is saved in the browser."),
      paragraph("Collapsing the menu and choosing contextual mode are independent: one changes its width, the other changes which items appear. Settings, help, contact, notifications, and the available profile remain at the bottom.")),
    section("utilities", "Personal and utility sections", table(["Item", "Purpose"],
      ["Settings", "The selected project's details, environments, import and export, theme, language, and current session."],
      ["Help", "This guide, with search, a table of contents, and article links."],
      ["Contact us", "Contact details for the Falcon team. This is separate from notification settings."],
      ["Notifications", "The event feed and your delivery channel preferences."],
      ["Admin panel", "Company and employee access management, when available to your account."],
      ["Name and photo", "Open your personal profile, if supported by your sign-in method."])),
    section("availability", "If a section is missing or a button is unavailable", bullets(
      "Open All sections first: contextual mode may have hidden the item from the sidebar.",
      "The menu reflects your company's enabled features and your permissions. Hooks requires integration management permission; API Testing requires access to integrations. Pinning does not bypass these restrictions.",
      "Most work sections require a selected project. If none is selected, open Portfolios and projects and select a project, or create one if you have permission. Help, contact, and notifications are available separately.",
      "If a feature is also missing from the full list, ask your company administrator about access.")),
    section("small-screen", "On a narrow screen", paragraph("On a phone, navigation sits at the bottom of the screen. Work icons scroll horizontally, with utility controls alongside them. All sections lets you open a section by name and change the menu mode."),
      paragraph("The menu button in the top bar shows or hides bottom navigation. Your profile appears as an avatar when available. Use Tab and Enter for keyboard navigation. The Context Menu key or Shift+F10 opens the sidebar context menu; Escape closes menus, the sections dialog, and tooltips.")),
  ],
};
