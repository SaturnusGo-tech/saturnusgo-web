import type { Metadata } from "next";
import { FalconSupportPage } from "../../../src/modules/core-falcon-public/support/FalconSupportPage";

export const metadata: Metadata = {
  title: "Связаться с поддержкой",
  description: "Задайте вопрос о Falcon, сообщите о проблеме или оставьте отзыв.",
  alternates: {
    canonical: "/ru/contact-support/",
    languages: { en: "/contact-support/", ru: "/ru/contact-support/" },
  },
  robots: { index: true, follow: true },
};

export default function ContactSupportPage() {
  return <FalconSupportPage locale="ru" />;
}
