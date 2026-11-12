import type { Metadata } from "next";
import { NotificationPreferencesEntry } from "../../../src/modules/core-tms/notifications/composition/standalone/NotificationPreferencesEntry";
export const metadata: Metadata = { title: "Notification preferences", robots: { index: false, follow: false } };
export default function Page() { return <NotificationPreferencesEntry/>; }
