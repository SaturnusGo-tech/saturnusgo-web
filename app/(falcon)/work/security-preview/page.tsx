"use client";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
const Preview = dynamic(() => import("../../../src/modules/core-tms/development-preview/security/SecuritySettingsPreview").then(module => module.SecuritySettingsPreview), { ssr: false });
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Preview/>;
}
