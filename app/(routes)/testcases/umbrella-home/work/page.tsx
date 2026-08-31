import type { Metadata } from "next";
import { TmsWorkspace } from "../../../../src/modules/core-tms";

export const metadata: Metadata = {
  title: "TESSIQ",
  description: "TESSIQ test management workspace",
};

export default function Page() {
  return <TmsWorkspace />;
}
