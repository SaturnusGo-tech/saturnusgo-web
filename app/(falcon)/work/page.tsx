import type { Metadata } from "next";
import { falconBrandPreview } from "../../src/modules/core-falcon-public/shared/brand-metadata";
import { TmsWorkspace } from "../../src/modules/core-tms";

export const metadata: Metadata = {
  title: { absolute: "Falcon" },
  description: "Falcon test management workspace",
  openGraph: {
    title: "Falcon",
    description: "Falcon test management workspace",
    url: "https://tms.saturnusgo.com/work/",
    siteName: "Falcon",
    images: [falconBrandPreview],
  },
  twitter: {
    card: "summary",
    title: "Falcon",
    description: "Falcon test management workspace",
    images: [falconBrandPreview.url],
  },
};

export default function Page() {
  return (
    <div data-falcon-workspace>
      <TmsWorkspace />
    </div>
  );
}
