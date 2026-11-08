"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocComment, ProductDocScope, ProductDocsApi } from "../../../domain/product-docs";
import type { ProductDocsCopy } from "../../../localization/copy";
import { useProductDocResource } from "../../../state/useProductDocResource";
import { ReadState } from "../../status/ReadState";
import styles from "./discussion.module.css";
import docsStyles from "../../product-docs.module.css";

export function ProductDocComments({ api, scope, docId, locale, copy, onClose }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  docId: string;
  locale: TmsLocale;
  copy: ProductDocsCopy;
  onClose(): void;
}) {
  const { workspaceId, projectId } = scope;
  const request = useCallback((signal: AbortSignal) => api.listComments(
    { workspaceId, projectId }, docId, { signal },
  ), [api, workspaceId, projectId, docId]);
  const resource = useProductDocResource(request);
  const [posted, setPosted] = useState<ProductDocComment[]>([]);
  const [older, setOlder] = useState<{ comments: ProductDocComment[]; nextCursor: string | null }>();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postError, setPostError] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const intent = useRef<{ body: string; key: string } | undefined>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "nearest" });
  }, []);

  async function post() {
    const message = body.trim();
    if (!message || posting) return;
    if (intent.current?.body !== message) intent.current = { body: message, key: crypto.randomUUID() };
    setPosting(true);
    setPostError(false);
    try {
      const comment = await api.postComment(scope, docId, message, { idempotencyKey: intent.current.key });
      setPosted((items) => [comment, ...items]);
      setBody("");
      intent.current = undefined;
    } catch {
      setPostError(true);
    } finally {
      setPosting(false);
    }
  }

  async function loadOlder(cursor: string) {
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await api.listComments(scope, docId, { cursor });
      setOlder((previous) => ({ comments: [...(previous?.comments ?? []), ...page.comments], nextCursor: page.nextCursor }));
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const data = resource.status === "ready" ? resource.data : undefined;
  const cursor = older ? older.nextCursor : data?.nextCursor;
  const comments = Array.from(new Map(
    [...posted, ...(data?.comments ?? []), ...(older?.comments ?? [])].map((item) => [item.id, item]),
  ).values());
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return <section className={styles.discussion} aria-label={copy.discussion}>
    <header className={styles.heading}>
      <h2 ref={heading} tabIndex={-1}>{copy.discussion}</h2>
      <button type="button" className={docsStyles.iconButton} aria-label={copy.cancel} onClick={onClose}>
        <X size={15} aria-hidden="true" />
      </button>
    </header>
    {resource.status !== "ready" && <ReadState copy={copy} status={resource.status} retry={resource.retry} />}
    {data?.canComment && <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); void post(); }}>
      <textarea aria-label={copy.commentPlaceholder} placeholder={copy.commentPlaceholder} value={body}
        maxLength={4000} rows={3} disabled={posting} onChange={(event) => setBody(event.target.value)} />
      {postError && <p className={docsStyles.error} role="alert">{copy.commentError}</p>}
      <button type="submit" className={docsStyles.primary} disabled={posting || !body.trim()}>
        {posting ? copy.postingComment : copy.postComment}
      </button>
    </form>}
    {data && comments.length === 0 && <p className={styles.empty}>{copy.noComments}</p>}
    {comments.length > 0 && <ol className={styles.feed}>
      {comments.map((comment) => <li className={styles.entry} key={comment.id}>
        <span aria-hidden="true" className={styles.avatar}>{comment.author.displayName.trim().slice(0, 1).toLocaleUpperCase(locale)}</span>
        <div className={styles.content}>
          <strong>{comment.author.displayName}</strong>
          <time dateTime={comment.createdAt}>{format.format(new Date(comment.createdAt))}</time>
          <p>{comment.body}</p>
        </div>
      </li>)}
    </ol>}
    {moreError && <p role="alert" className={docsStyles.error}>{copy.unavailable}</p>}
    {cursor && <button type="button" className={docsStyles.action} disabled={loadingMore} onClick={() => void loadOlder(cursor)}>
      {loadingMore ? copy.loading : copy.more}
    </button>}
  </section>;
}
