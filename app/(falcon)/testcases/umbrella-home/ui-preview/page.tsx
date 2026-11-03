import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: { absolute: "Falcon — local UI preview" },
  robots: { index: false, follow: false },
};

export default async function Page() {
  if (process.env.NODE_ENV !== "production") {
    const { PluginsDevelopmentPreview } = await import("../../../../src/modules/core-tms/development-preview/plugins/PluginsDevelopmentPreview");
    return <div data-falcon-workspace><PluginsDevelopmentPreview /></div>;
  }
  notFound();
}
