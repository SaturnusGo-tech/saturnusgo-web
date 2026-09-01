import type { Metadata } from "next";
import { TmsWorkspace } from "../../../../src/modules/core-tms";
import { TmsFavicon } from "./TmsFavicon";

export const metadata: Metadata = {
  title: "Falcon",
  description: "Falcon test management workspace",
  openGraph: {
    title: "Falcon",
    description: "Falcon test management workspace",
    url: "https://tms.saturnusgo.com/testcases/umbrella-home/work/",
    siteName: "Falcon",
  },
  twitter: {
    card: "summary",
    title: "Falcon",
    description: "Falcon test management workspace",
  },
};

export default function Page() {
  return (
    <>
      <TmsFavicon />
      <TmsWorkspace />
    </>
  );
}
