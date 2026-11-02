import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PluginsDevelopmentPreview } from "../../../../src/modules/core-tms/development-preview/plugins/PluginsDevelopmentPreview";

export const metadata: Metadata = {
  title: { absolute: "Falcon — local UI preview" },
  robots: { index: false, follow: false },
};

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <div data-falcon-workspace><PluginsDevelopmentPreview /></div>;
}
