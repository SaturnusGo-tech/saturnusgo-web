import type { components } from "../../../../../core/tms/generated/tms-api";
import type { ProductDocScope } from "../product-docs";

export type ProductDocReviewTarget = ProductDocScope & { docId: string };
type Contract = components["schemas"];
export type ProductDocReviewDecision = Contract["ProductDocReviewDecisionInput"]["decision"];
export type ProductDocReview = Contract["ProductDocReview"];
export type ProductDocReviewPage = Contract["ProductDocReviewPage"];
export type ProductDocReviewRequest = Contract["ProductDocReviewRequestInput"];
export type ProductDocReviewResponse = Contract["ProductDocReviewDecisionInput"];
export type ProductDocReviewSection = { id: string; title: string };
export type ProductDocReviewSource =
  | { kind: "draft"; draftVersion: number; dirty: boolean; canPublish: boolean; sections: readonly ProductDocReviewSection[] }
  | { kind: "article"; sections: readonly ProductDocReviewSection[]; onOpenDraft(): void };

export interface ProductDocReviewsApi {
  list(target: ProductDocReviewTarget, options?: { cursor?: string; signal?: AbortSignal }): Promise<ProductDocReviewPage>;
  request(target: ProductDocReviewTarget, input: ProductDocReviewRequest): Promise<ProductDocReview>;
  decide(target: ProductDocReviewTarget, reviewId: string, input: ProductDocReviewResponse): Promise<ProductDocReview>;
}
