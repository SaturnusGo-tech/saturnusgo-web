"use client";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
const Preview = dynamic(() => import("../../../src/modules/core-tms/development-preview/notifications/NotificationSettingsPreview").then(module => module.NotificationSettingsPreview), { ssr: false });
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Preview/>;
}
