"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const ImportExchangePreview = dynamic(() => import("../../../src/modules/core-tms/development-preview/exchange/ImportExchangePreview")
  .then(module => module.ImportExchangePreview), { ssr: false });

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ImportExchangePreview />;
}
