import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const notificationPreferencesWalkthrough = walkthrough("Notification categories, channels and activity", [
  shot("notifications-01-overview-20260928-rows-inbox20260928-en-20260928", "Choose the events you need",
    "Open **Settings**, then **Notifications** under **Personal settings**. Expand **Event preferences** and enable the categories you need. Changes save immediately and apply to Telegram and connected browsers.",
    "The example has all seven categories enabled, including Access and roles. Browser delivery and Telegram are not connected; selecting categories does not connect those channels.",
    "Settings → Notifications with separate delivery channels and all seven event categories enabled."),
  shot("notifications-02-browser-20260928-rows-inbox20260928-en-20260928", "Check permission and channel status",
    "In the same settings section, select **Browser notifications** to view its status. If it asks you to allow notifications in site settings, update the browser permission first, reload Falcon and then enable the toggle.",
    "In this example, browser permission is blocked and the switch is unavailable. Telegram's bot is not configured, so Connect is also unavailable; ask your administrator to configure it.",
    "Expanded browser channel with delivery off and a site-permission instruction; Telegram's bot is not connected."),
  shot("notifications-03-inbox-20260928-rows-inbox20260928-en-20260928", "Open recent events",
    "Click the **Notifications** bell in the main sidebar. Select an event to mark it read and open its linked record. Use **Mark all read** to mark your unread events together, or **Clear read** to hide only the events you have already read.",
    "The light-theme example shows read case and run events from the practice workspace, so Mark all read is disabled. Clear read hides read events only and leaves other employees' feeds unchanged. The gear opens **Notification settings**.",
    "Light notification feed beside the sidebar with read case and run events, event icons, times and header actions."),
]);
