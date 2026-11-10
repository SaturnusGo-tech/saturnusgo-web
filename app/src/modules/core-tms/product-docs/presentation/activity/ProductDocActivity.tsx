"use client";

import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { Button, Textarea } from "@heroui/react";
import { ArrowUp } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import type { TmsLocale } from "../../../localization/model/locale";
import { notificationTime } from "../../../notifications/inbox/model/presentation";
import { MemberAvatar } from "../../../workspace/members/avatar/MemberAvatar";
import type { ProductDocComment, ProductDocDetail, ProductDocScope, ProductDocsApi } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocResource } from "../../state/useProductDocResource";
import { ReadState } from "../status/ReadState";
import styles from "./product-doc-activity.module.css";

export function ProductDocActivity({ api, scope, document, locale, copy }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  locale: TmsLocale;
  copy: ProductDocsCopy;
}) {
  const { workspaceId, projectId } = scope;
  const { id: docId, activity, archivedAt, publishedVersion } = document;
  const published = !archivedAt && publishedVersion !== null;
  const ru = locale === "ru";
  const headingId = useId();
  const request = useCallback((signal: AbortSignal) => api.listComments(
    { workspaceId, projectId }, docId, { signal },
  ), [api, workspaceId, projectId, docId]);
  const resource = useProductDocResource(published ? request : undefined);
  const [posted, setPosted] = useState<ProductDocComment[]>([]);
  const [older, setOlder] = useState<{ comments: ProductDocComment[]; nextCursor: string | null }>();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postError, setPostError] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const intent = useRef<{ body: string; key: string } | undefined>(undefined);

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
  const rows = [
    ...(activity?.created ? [{
      id: "created", at: activity.created.at, author: activity.created, body: undefined, label: ru ? "создание страницы" : "created the page",
    }] : []),
    ...(activity?.published ? [{
      id: "published", at: activity.published.at, author: activity.published, body: undefined,
      label: ru ? `публикация версии ${document.version ?? publishedVersion}` : `published version ${document.version ?? publishedVersion}`,
    }] : []),
    ...comments.map((comment) => ({
      id: comment.id, at: comment.createdAt, author: comment.author, body: comment.body, label: undefined,
    })),
  ].sort((first, second) => Date.parse(first.at) - Date.parse(second.at));
  const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return <section className={styles.activity} tabIndex={-1} aria-labelledby={headingId} data-product-doc-activity>
    <h2 id={headingId}>{ru ? "Активность" : "Activity"}</h2>
    {published && resource.status !== "ready" && <ReadState copy={copy} status={resource.status} retry={resource.retry} />}
    {cursor && <Button type="button" variant="light" size="sm" className={styles.older} isDisabled={loadingMore}
      onPress={() => void loadOlder(cursor)}>{loadingMore ? copy.loading : ru ? "Предыдущие комментарии" : "Earlier comments"}</Button>}
    <ErrorToast message={moreError ? copy.unavailable : null} />
    {rows.length > 0 && <ol className={styles.feed} role="list">
      {rows.map((row) => <li className={styles.entry} data-comment={Boolean(row.body) || undefined} key={row.id}>
        <span className={styles.avatar} aria-hidden="true">
          <MemberAvatar workspaceId={workspaceId} identityId={row.author.identityId} name={row.author.displayName} />
        </span>
        <div className={styles.content}>
          <div className={styles.metadata}>
            <strong>{row.author.displayName}</strong>
            {row.label && <span>{ru && <span aria-hidden="true">· </span>}{row.label}</span>}
            <time dateTime={row.at} title={fullDate.format(new Date(row.at))}>{notificationTime(row.at, locale)}</time>
          </div>
          {row.body && <p>{row.body}</p>}
        </div>
      </li>)}
    </ol>}
    {rows.length === 0 && (!published || resource.status === "ready") && !data?.canComment && <p className={styles.empty}>
      {published ? copy.noComments : ru ? "Событий пока нет." : "No activity yet."}
    </p>}
    {data?.canComment && <form className={styles.composer} data-input-shell
      onSubmit={(event) => { event.preventDefault(); void post(); }}>
      <Textarea aria-label={copy.commentPlaceholder} placeholder={copy.commentPlaceholder} value={body}
        classNames={{ inputWrapper: styles.field, input: styles.input }}
        maxLength={4000} minRows={1} maxRows={10} isDisabled={posting} onValueChange={setBody} />
      <div className={styles.composerActions}>
        <ErrorToast message={postError ? copy.commentError : null} />
        <Button type="submit" isIconOnly size="sm" radius="full" disableRipple className={styles.send}
          aria-label={posting ? copy.postingComment : copy.postComment} title={copy.postComment} isLoading={posting} spinner={<LoadingOrb />} isDisabled={posting || !body.trim()}>
          <ArrowUp size={15} aria-hidden="true" />
        </Button>
      </div>
    </form>}
  </section>;
}
