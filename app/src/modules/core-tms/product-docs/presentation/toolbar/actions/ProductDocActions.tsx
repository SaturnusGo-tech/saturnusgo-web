"use client";

import { Check, Clock3, Download, Ellipsis, FolderInput, Link2, MessageSquare, Pencil, Star } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { writeClipboardText } from "../../../../../../shared/lib/clipboard";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocDetail, ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import type { ProductDocsCopy } from "../../../localization/copy";
import { MoveProductDoc } from "../MoveProductDoc";
import { ProductDocSectionAppearance } from "../../tree/appearance/control/ProductDocSectionAppearance";
import { exportProductDocHeading } from "../../draft/sections/productDocMarkdown";
import shared from "../../product-docs.module.css";
import styles from "./reader-actions.module.css";

type Props = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  path?: readonly ProductDocNode[];
  copy: ProductDocsCopy;
  locale: TmsLocale;
  starred: boolean;
  discussionButton: RefObject<HTMLButtonElement | null>;
  discussionOpen: boolean;
  showDiscussion: boolean;
  onDiscussion(): void;
  onEdit(): void;
  onStar(): void;
  onVersion(version?: number): void;
  onMoved(): void;
};

export function ProductDocActions({
  api, scope, document: page, path, copy, locale, starred, discussionButton, discussionOpen, showDiscussion,
  onDiscussion, onEdit, onStar, onVersion, onMoved,
}: Props) {
  const [open, setOpen] = useState<"history" | "link" | "more">();
  const [moving, setMoving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  const [limit, setLimit] = useState(20);
  const root = useRef<HTMLDivElement>(null);
  const shareLink = useRef<HTMLInputElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const latest = page.publishedVersion;
  const hasPublication = page.version !== null;
  const canChange = page.canEdit && page.version === latest;

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(undefined);
    }
    window.addEventListener("pointerdown", dismiss);
    return () => window.removeEventListener("pointerdown", dismiss);
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (open !== "link") return;
    shareLink.current?.focus();
    shareLink.current?.select();
  }, [open]);

  function closeMenu() {
    setOpen(undefined);
    opener.current?.focus({ preventScroll: true });
  }

  function toggleMenu(menu: "history" | "more", trigger: HTMLButtonElement) {
    opener.current = trigger;
    setOpen(open === menu ? undefined : menu);
  }

  async function copyAddress(trigger: HTMLButtonElement) {
    const url = window.location.href;
    opener.current = trigger;
    setOpen(undefined);
    try {
      await writeClipboardText(url);
      setCopied(true);
    } catch {
      if (window.location.href !== url) return;
      setLink(url);
      setOpen("link");
    }
  }

  return <div ref={root} className={styles.controls} onKeyDown={(event) => {
    if (event.key !== "Escape" || !open) return;
    event.stopPropagation();
    closeMenu();
  }}>
    {canChange && page.kind === "folder" && <ProductDocSectionAppearance key={page.id} scope={scope} node={page} locale={locale} />}
    {canChange && <button type="button" className={styles.icon}
      aria-label={page.kind === "folder" ? copy.renameFolder : copy.edit}
      title={page.kind === "folder" ? copy.renameFolder : copy.edit} onClick={onEdit}>
      <Pencil size={16} aria-hidden="true" />
    </button>}
    {hasPublication && latest !== null && <div className={styles.control}>
      <button type="button" className={styles.icon} aria-label={copy.versionHistory} title={copy.versionHistory}
        aria-expanded={open === "history"} onClick={(event) => toggleMenu("history", event.currentTarget)}>
        <Clock3 size={16} aria-hidden="true" />
      </button>
      {open === "history" && <section className={styles.popover} aria-label={copy.versionHistory}>
        <h3>{copy.versionHistory}</h3>
        <div className={styles.versions}>
          {Array.from({ length: Math.min(latest, limit) }, (_, index) => latest - index).map((version) => (
            <button type="button" className={styles.menuRow} key={version} aria-current={version === page.version ? "true" : undefined}
              onClick={() => { closeMenu(); onVersion(version === latest ? undefined : version); }}>
              {copy.version} {version}
              <small>{version === page.version ? copy.currentVersion : version === latest ? copy.latestVersion : null}</small>
            </button>
          ))}
        </div>
        {latest > limit && <button type="button" className={styles.menuRow} onClick={() => setLimit((value) => value + 20)}>{copy.more}</button>}
      </section>}
    </div>}
    {showDiscussion && <button ref={discussionButton} type="button" className={styles.icon}
      aria-expanded={discussionOpen} aria-label={copy.discussion} title={copy.discussion} onClick={onDiscussion}>
      <MessageSquare size={16} aria-hidden="true" />
    </button>}
    {hasPublication && <div className={styles.control}>
      <button type="button" className={styles.icon} aria-label={copied ? copy.copiedLink : copy.copyLink}
        title={copied ? copy.copiedLink : copy.copyLink} onClick={(event) => void copyAddress(event.currentTarget)}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={17} aria-hidden="true" />}
      </button>
      {open === "link" && <section className={styles.popover} aria-label={copy.copyLink}>
        <h3>{copy.copyLink}</h3>
        <input ref={shareLink} className={shared.textInput} value={link} readOnly aria-label={copy.copyLink}
          onFocus={(event) => event.currentTarget.select()} />
        <p className={styles.copyFallback}>{copy.copyLinkFailed}</p>
      </section>}
    </div>}
    {(hasPublication || (canChange && page.canPublish)) && <div className={styles.control}>
      <button type="button" className={styles.icon} ref={moreButton} aria-label={copy.pageActions} title={copy.pageActions}
        aria-expanded={open === "more"} onClick={(event) => toggleMenu("more", event.currentTarget)}>
        <Ellipsis size={18} aria-hidden="true" />
      </button>
      {open === "more" && <section className={styles.popover} aria-label={copy.pageActions}>
        {hasPublication && <button type="button" className={styles.menuRow} aria-pressed={starred}
          onClick={() => { onStar(); closeMenu(); }}>
          <Star className={styles.starIcon} size={16} fill={starred ? "var(--product-doc-star)" : "none"} aria-hidden="true" />{starred ? copy.unstar : copy.star}
        </button>}
        {canChange && page.canPublish && <button type="button" className={styles.menuRow} onClick={() => { setOpen(undefined); setMoving(true); }}>
          <FolderInput size={16} aria-hidden="true" />{copy.move}
        </button>}
        {hasPublication && <button type="button" className={styles.menuRow} onClick={() => { closeMenu(); downloadMarkdown(page); }}>
          <Download size={16} aria-hidden="true" />{copy.exportMarkdown}
        </button>}
      </section>}
    </div>}
    {moving && <MoveProductDoc api={api} scope={scope} document={page} copy={copy} path={path} onMoved={onMoved}
      onClose={() => {
        setMoving(false);
        moreButton.current?.focus({ preventScroll: true });
      }} />}
    <span role="status" className={shared.screenReader}>{copied ? copy.copiedLink : ""}</span>
  </div>;
}

function downloadMarkdown(page: ProductDocDetail) {
  const contents = [exportProductDocHeading(page.title, 1, page.titleHighlights), ...page.sections.map((section) =>
    [section.title ? exportProductDocHeading(section.title, 2, section.titleHighlights) : "", section.markdown]
      .filter(Boolean).join("\n\n"))].join("\n\n");
  const url = URL.createObjectURL(new Blob([contents], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.download = (page.title.replace(/[\\/:*?"<>|]/g, "-").trim() || "article") + ".md";
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
