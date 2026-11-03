import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const notificationPreferencesWalkthrough = walkthrough("Notification categories, channels and activity", [
  shot("notifications-01-overview-20260928-rows-inbox20260928-en-20260928", "Choose the events you need",
    "Open the avatar menu → **Settings**, then **Notifications** under **Personal settings**. Expand **Event preferences** and enable the categories you need. Changes save immediately and apply to Telegram and connected browsers.",
    "The account has seven event categories enabled and Telegram connected. Browser notifications are off in this browser. Selecting an event category does not connect a delivery channel or grant browser permission.",
    "Notifications settings with separate delivery channels and event preferences."),
  shot("notifications-02-browser-20260928-rows-inbox20260928-en-20260928", "Check permission and channel status",
    "In the same settings section, select **Browser notifications** to view its status. If it asks you to allow notifications in site settings, update the browser permission first, reload Falcon and then enable the toggle.",
    "The expanded browser channel reports that notifications are off. Telegram is connected separately. No browser permission was requested and no channel was disconnected for this screenshot.",
    "Browser notification channel settings with permission and delivery status."),
  shot("notifications-03-inbox-20260928-rows-inbox20260928-en-20260928", "Open recent events",
    "Click the **Notifications** bell in the main sidebar. Select an event to mark it read and open its linked record. Use **Mark all read** to mark your unread events together, or **Clear read** to hide only the events you have already read.",
    "The inbox shows the current account’s existing notifications. No event was marked read or cleared for this screenshot. Clear read affects read events in this feed; the settings action opens **Notification settings**.",
    "Existing notification inbox beside the sidebar, with event icons, timestamps and notification actions."),
]);
