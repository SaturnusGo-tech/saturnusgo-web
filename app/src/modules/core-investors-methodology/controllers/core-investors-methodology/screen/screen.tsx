import { Suspense } from "react";
import MethodologyClient from "../../../ui/methodology-client";

export const metadata = {
  title: "Revenue Methodology — SaturnusGo",
  description:
    "Transparent SaturnusGo investor methodology: assumptions, formulas, revenue split, stream allocation, and calculation guardrails.",
};

export default function Page({
  searchParams,
}: {
  searchParams?: { h?: string };
}) {
  const h =
    searchParams?.h === "5" ? "5" : searchParams?.h === "10" ? "10" : "3";
  return <Suspense fallback={null}>
    <MethodologyClient initialH={h} />
  </Suspense>;
}
