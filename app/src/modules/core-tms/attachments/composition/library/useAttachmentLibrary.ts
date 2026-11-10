import { useEffect, useRef, useState } from "react";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { listLibraryAttachments } from "../../data/library/attachment-library";
import type { AttachmentLibraryPage } from "../../domain/library/attachment-library";

type Filters = Parameters<typeof listLibraryAttachments>[2];
type Catalog = {
  filters: Filters;
  page: AttachmentLibraryPage | null;
  error: boolean;
  pending: boolean;
};

export function useAttachmentLibrary(http: TmsHttpClient | null, workspaceId: string, filters: Filters) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const nextPage = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!http) return;
    const request = new AbortController();
    const timer = window.setTimeout(() => {
      void listLibraryAttachments(http, workspaceId, filters, request.signal).then(
        page => { if (!request.signal.aborted) setCatalog({ filters, page, error: false, pending: false }); },
        () => { if (!request.signal.aborted) setCatalog({ filters, page: null, error: true, pending: false }); },
      );
    }, filters.search ? 180 : 0);
    return () => {
      window.clearTimeout(timer);
      request.abort();
      nextPage.current?.abort();
      nextPage.current = null;
    };
  }, [http, workspaceId, filters]);

  const current = catalog?.filters === filters ? catalog : null;
  const cursor = current?.page?.meta.nextCursor;
  async function loadMore() {
    if (!http || !current?.page || !cursor || nextPage.current) return;
    const request = new AbortController();
    nextPage.current = request;
    setCatalog({ ...current, pending: true, error: false });
    try {
      const page = await listLibraryAttachments(http, workspaceId, { ...filters, cursor }, request.signal);
      if (!request.signal.aborted) {
        const known = new Set(current.page.data.map(file => file.id));
        setCatalog({ filters, page: { ...page, data: [...current.page.data, ...page.data.filter(file => !known.has(file.id))] }, error: false, pending: false });
      }
    } catch {
      if (!request.signal.aborted) setCatalog({ ...current, error: true, pending: false });
    } finally {
      if (nextPage.current === request) nextPage.current = null;
    }
  }
  return { files: current?.page?.data ?? [], loading: !!http && !current, loadingMore: current?.pending ?? false,
    canLoadMore: !!cursor, error: current?.error ?? false, loadMore };
}
