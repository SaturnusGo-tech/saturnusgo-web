import type { Metadata } from "next";
import { FalconSupportPage } from "../../src/modules/core-falcon-public/support/FalconSupportPage";

export const metadata: Metadata = {
  title: "Contact support",
  description: "Ask Falcon support a product question, report a problem or share feedback.",
  alternates: {
    canonical: "/contact-support/",
    languages: { en: "/contact-support/", ru: "/ru/contact-support/" },
  },
  robots: { index: true, follow: true },
};

export default function ContactSupportPage() {
  return <FalconSupportPage locale="en" />;
}
