import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const notificationPreferencesWalkthrough = walkthrough("Notification categories, channels and activity", [
  shot("notifications-01-overview-20260928-en-20260928", "Choose the events you need",
    "Open **Notifications** in the sidebar and expand **Event preferences**. Enable the categories you need with their toggles. Changes save immediately and apply to Telegram and connected browsers.",
    "The example enables all six categories. This chooses events to send; it does not confirm channel connections. Neither the browser nor Telegram is connected in the screenshot.",
    "Notification screen with all six categories enabled: runs, test cases, test suites, assignments, defects and integrations."),
  shot("notifications-02-browser-20260928-en-20260928", "Check permission and channel status",
    "Select **Browser notifications** to view its status. If it asks you to allow notifications in site settings, update the browser permission first, reload Falcon and then enable the toggle.",
    "The screenshot shows notifications off, permission denied and the toggle disabled. Telegram is also unconfigured, so **Connect** is unavailable. Ask your administrator to configure the bot.",
    "Expanded browser channel showing notifications off and a request for site permission; Telegram says the bot is not connected yet."),
  shot("notifications-03-inbox-20260928-en-20260928", "Open recent events",
    "Collapse **Event preferences** and expand **Recent activity**. Select **Refresh** to load the inbox. An event title opens its linked record; the checkmark marks it read without navigating away.",
    "The practice inbox shows completion of PAY-TR-11 and a result update for PAY-TC-34. Events remain available inside Falcon even when Telegram and browser notifications are disconnected.",
    "Collapsed event preferences and open inbox showing Run completed for PAY-TR-11 and Check result updated for PAY-TC-34."),
]);
