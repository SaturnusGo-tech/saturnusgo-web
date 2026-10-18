import { useState } from "react";
import { reviewPage } from "../../model/review/review-page";

export function useReviewList<T>(items: readonly T[], text: (item: T) => string) {
  const [query, updateQuery] = useState("");
  const [requestedPage, setPage] = useState(1);
  const page = reviewPage(items, query, requestedPage, text);
  const setQuery = (value: string) => { updateQuery(value); setPage(1); };
  return { ...page, query, setQuery, setPage };
}
