import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type {
  ProductDocReview, ProductDocReviewPage, ProductDocReviewsApi, ProductDocReviewTarget,
} from "../../domain/review/productDocReview";

const reviewsPath = ({ workspaceId, projectId, docId }: ProductDocReviewTarget) =>
  `/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/product-docs/${encodeURIComponent(docId)}/reviews`;

export function createProductDocReviewsApi(http: TmsHttpClient): ProductDocReviewsApi {
  return {
    async list(target, options) {
      const query = new URLSearchParams({ limit: "30" });
      if (options?.cursor) query.set("cursor", options.cursor);
      return (await http.getResource<ProductDocReviewPage>(`${reviewsPath(target)}?${query}`, options?.signal)).data;
    },
    async request(target, input) {
      return (await http.mutateResource<ProductDocReview>(reviewsPath(target), "POST", input)).data;
    },
    async decide(target, reviewId, input) {
      const path = `${reviewsPath(target)}/${encodeURIComponent(reviewId)}/decision`;
      return (await http.mutateResource<ProductDocReview>(path, "POST", input)).data;
    },
  };
}
