import type { Metadata } from "next";
import { FalconLanding } from "../src/modules/core-falcon-public";

import { englishCopy } from "../src/modules/core-falcon-public/landing/localization/content/copy";
import { landingLocaleBootstrap } from "../src/modules/core-falcon-public/landing/localization/model/locale";

export const metadata: Metadata = {
  title: { absolute: englishCopy.title }, description: englishCopy.description,
  alternates: { canonical: "https://tms.saturnusgo.com/" },
  openGraph: { title: englishCopy.title, description: englishCopy.description,
    url: "https://tms.saturnusgo.com/", siteName: "Falcon", locale: "en_US", alternateLocale: "ru_RU",
    images: [{ url: "https://tms.saturnusgo.com/falcon/landing/2026-09/falcon-wing.webp", width: 1672, height: 941, alt: "Falcon test management" }] },
  twitter: { card: "summary_large_image", title: englishCopy.title, description: englishCopy.description,
    images: ["https://tms.saturnusgo.com/falcon/landing/2026-09/falcon-wing.webp"] },
};
export default function Page() {
  return <><script dangerouslySetInnerHTML={{ __html: landingLocaleBootstrap }} /><FalconLanding /></>;
}
