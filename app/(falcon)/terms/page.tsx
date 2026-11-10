import type { Metadata } from "next";
import { FalconLegalPage } from "../../src/modules/core-falcon-public/legal/FalconLegalPage";
import { readLegalDocument } from "../../src/modules/core-falcon-public/legal/readLegalDocument";

export const metadata: Metadata = { title: { absolute: "Falcon · Terms of Service" }, robots: { index: true, follow: true } };

export default function Page() {
  return <FalconLegalPage document="terms" versions={readLegalDocument("terms")} />;
}
