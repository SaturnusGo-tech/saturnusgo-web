"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const DocsReadingPreview = dynamic(() => import("../../../src/modules/core-tms/development-preview/docs/DocsReadingPreview").then(module => module.DocsReadingPreview), { ssr: false });

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DocsReadingPreview />;
}
