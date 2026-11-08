"use client";

import { useCallback, useRef, useState } from "react";
import { productDocErrorCode } from "../../domain/errors/product-doc-response";
import type {
  ProductDocReview, ProductDocReviewPage, ProductDocReviewsApi, ProductDocReviewRequest, ProductDocReviewResponse, ProductDocReviewTarget,
} from "../../domain/review/productDocReview";
import { useProductDocResource } from "../useProductDocResource";

export function useProductDocReviews(api: ProductDocReviewsApi, target: ProductDocReviewTarget, revision?: number) {
  const { workspaceId, projectId, docId } = target;
  const request = useCallback((signal: AbortSignal) => api.list({ workspaceId, projectId, docId }, { signal }),
    [api, workspaceId, projectId, docId, revision]);
  const resource = useProductDocResource(request);
  const data = resource.status === "ready" ? resource.data : undefined;
  const [older, setOlder] = useState<{ root?: ProductDocReviewPage; page: ProductDocReviewPage }>();
  const [moreState, setMoreState] = useState<"loading" | "error">();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const running = useRef(false);
  const intent = useRef<{ key: string; payload: string } | undefined>(undefined);
  const appended = older?.root === data ? older?.page : undefined;
  const reviews = [...(data?.reviews ?? []), ...(appended?.reviews ?? [])];
  const cursor = appended ? appended.nextCursor : data?.nextCursor;

  async function loadMore() {
    if (!data || !cursor || moreState === "loading") return;
    setMoreState("loading");
    try {
      const page = await api.list(target, { cursor });
      setOlder({ root: data, page: { ...page, reviews: [...(appended?.reviews ?? []), ...page.reviews] } });
      setMoreState(undefined);
    } catch {
      setMoreState("error");
    }
  }

  async function send(payload: object, action: (commandId: string) => Promise<ProductDocReview>) {
    if (running.current) return false;
    const fingerprint = JSON.stringify(payload);
    if (intent.current?.payload !== fingerprint) intent.current = { key: crypto.randomUUID(), payload: fingerprint };
    running.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await action(intent.current.key);
      intent.current = undefined;
      resource.retry();
      return true;
    } catch (failure) {
      const code = productDocErrorCode(failure) ?? "UNKNOWN";
      setError(code);
      if (code === "PRODUCT_DOC_STALE_DRAFT" || code === "PRODUCT_DOC_REVIEW_CONFLICT") resource.retry();
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return { data, reviews, resource, cursor, moreState, loadMore, busy, error,
    clearError: () => setError(undefined),
    request: (input: Omit<ProductDocReviewRequest, "commandId">) => send(input, (commandId) => api.request(target, { ...input, commandId })),
    decide: (reviewId: string, input: Omit<ProductDocReviewResponse, "commandId">) =>
      send({ reviewId, ...input }, (commandId) => api.decide(target, reviewId, { ...input, commandId })),
  };
}
