import type { Metadata } from "next";
import { FalconTrialTermsPage } from "../../src/modules/core-falcon-public/trial-terms/FalconTrialTermsPage";
export const metadata: Metadata = { title: { absolute: "Falcon · Personal trial terms" }, robots: { index: true, follow: true } };
export default function Page() { return <FalconTrialTermsPage />; }
