"use client";

import { TmsLocaleProvider } from "../../localization/context/TmsLocaleProvider";
import { ExchangePreviewWorkspace } from "./surface/ExchangePreviewWorkspace";

export function ImportExchangePreview() {
  return <TmsLocaleProvider initialLocale="en"><ExchangePreviewWorkspace /></TmsLocaleProvider>;
}
