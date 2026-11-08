"use client";

import { useMemo } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { createProductDocReviewsApi } from "../../data/review/productDocReviewsApi";

export function useProductDocReviewsApi() {
  const http = useOptionalTmsHttpClient();
  return useMemo(() => http ? createProductDocReviewsApi(http) : null, [http]);
}
