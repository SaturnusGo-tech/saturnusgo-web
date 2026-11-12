"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const ApiTestingPreview = dynamic(() => import("../../../src/modules/core-tms/development-preview/api-testing/ApiTestingPreview").then(module => module.ApiTestingPreview), { ssr: false });

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ApiTestingPreview />;
}
