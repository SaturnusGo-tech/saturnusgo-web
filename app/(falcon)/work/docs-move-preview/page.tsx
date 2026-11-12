"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const DocsMovePreview = dynamic(() => import("../../../src/modules/core-tms/development-preview/docs/move/DocsMovePreview").then(module => module.DocsMovePreview), { ssr: false });

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DocsMovePreview />;
}
