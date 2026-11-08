"use client";

import { addToast, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Popover, PopoverContent } from "@heroui/react";
import { Archive, Clock3, Download, Ellipsis, FolderInput, Link2, MessageSquare, Pencil, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { writeClipboardText } from "../../../../../../shared/lib/clipboard";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocDetail, ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import type { ProductDocsCopy } from "../../../localization/copy";
import { MoveProductDoc } from "../MoveProductDoc";
import { ArchiveProductDoc } from "../../archive/ArchiveProductDoc";
import { ProductDocReviewAction } from "../../review/ProductDocReviewAction";
import { ProductDocSectionAppearance } from "../../tree/appearance/ProductDocSectionAppearance";
import { exportProductDocHeading } from "../../draft/sections/productDocMarkdown";
import { ProductDocTooltip } from "../../overlay/ProductDocTooltip";
import styles from "./reader-actions.module.css";

type Props = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  path?: readonly ProductDocNode[];
  copy: ProductDocsCopy;
  locale: TmsLocale;
  starred: boolean;
  showDiscussion: boolean;
  onDiscussion(): void;
  onEdit(): void;
  onStar(): void;
  onVersion(version?: number): void;
  onChanged(): void;
  onArchived(): void;
};

export function ProductDocActions({
  api, scope, document: page, path, copy, locale, starred, showDiscussion,
  onDiscussion, onEdit, onStar, onVersion, onChanged, onArchived,
}: Props) {
  const [moving, setMoving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [link, setLink] = useState("");
  const [limit, setLimit] = useState(20);
  const shareLink = useRef<HTMLInputElement>(null);
  const linkButton = useRef<HTMLButtonElement>(null!);
  const moreButton = useRef<HTMLButtonElement>(null);
  const latest = page.publishedVersion;
  const hasPublication = page.version !== null;
  const canChange = page.canEdit && !page.archivedAt && page.version === latest;

  useEffect(() => {
    if (link) shareLink.current?.select();
  }, [link]);

  async function copyAddress() {
    const url = window.location.href;
    try {
      await writeClipboardText(url);
      addToast({ title: copy.copiedLink, severity: "success" });
    } catch {
      if (window.location.href === url) setLink(url);
    }
  }

  const menuClasses = { base: styles.positioner, content: styles.popover };
  const listClasses = { base: styles.versions, list: styles.list };
  const itemClasses = { base: styles.menuRow, selectedIcon: styles.selectedIcon, title: styles.menuTitle };
  const editLabel = page.kind === "folder" ? copy.renameFolder : copy.edit;
  const pageActions = [
    ...(hasPublication ? [{ key: "star", label: starred ? copy.unstar : copy.star, icon: <Star className={styles.starIcon} size={16}
      fill={starred ? "var(--falcon-caution-solid)" : "none"} aria-hidden="true" />, run: onStar }] : []),
    ...(canChange && page.canPublish ? [{ key: "move", label: copy.move, icon: <FolderInput size={16} aria-hidden="true" />, run: () => setMoving(true) }] : []),
    ...(hasPublication ? [{ key: "export", label: copy.exportMarkdown, icon: <Download size={16} aria-hidden="true" />, run: () => downloadMarkdown(page) }] : []),
    ...(canChange && page.canPublish ? [{ key: "archive", label: copy.archiveItem, icon: <Archive size={16} aria-hidden="true" />, run: () => setArchiving(true) }] : []),
  ];
  return <div className={styles.controls}>
    {canChange && page.kind === "folder" && <ProductDocSectionAppearance key={page.id} api={api}
      scope={scope} node={page} locale={locale} onChanged={onChanged} />}
    {canChange && <ProductDocTooltip label={editLabel}><Button isIconOnly size="sm" variant="light" className={styles.icon}
      aria-label={editLabel} onPress={onEdit}><Pencil size={16} aria-hidden="true" /></Button></ProductDocTooltip>}
    {hasPublication && latest !== null && <Dropdown placement="bottom-end" classNames={menuClasses} shouldCloseOnScroll={false}>
      <DropdownTrigger>
        <Button isIconOnly size="sm" variant="light" className={styles.icon} aria-label={copy.versionHistory}>
          <Clock3 size={16} aria-hidden="true" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label={copy.versionHistory} classNames={listClasses} itemClasses={itemClasses}
        onAction={(key) => {
          if (key === "more") setLimit((value) => value + 20);
          else {
            const version = Number(key);
            onVersion(!page.archivedAt && version === latest ? undefined : version);
          }
        }}>
        {[...Array.from({ length: Math.min(latest, limit) }, (_, index) => latest - index).map((version) => (
          <DropdownItem key={String(version)} textValue={`${copy.version} ${version}`} aria-current={version === page.version ? "true" : undefined}>
            {copy.version} {version}
            <small>{version === page.version ? copy.currentVersion : version === latest ? copy.latestVersion : null}</small>
          </DropdownItem>
        )), ...(latest > limit ? [<DropdownItem key="more" closeOnSelect={false}>{copy.more}</DropdownItem>] : [])]}
      </DropdownMenu>
    </Dropdown>}
    {canChange && page.kind === "page" && <ProductDocReviewAction target={{ ...scope, docId: page.id }}
      source={{ kind: "article", sections: page.sections, onOpenDraft: onEdit }} locale={locale} />}
    {showDiscussion && <ProductDocTooltip label={copy.discussion}><Button isIconOnly size="sm" variant="light" className={styles.icon}
      aria-label={copy.discussion} onPress={onDiscussion}>
      <MessageSquare size={16} aria-hidden="true" />
    </Button></ProductDocTooltip>}
    {hasPublication && <Popover isOpen={Boolean(link)} triggerRef={linkButton} onOpenChange={(open) => { if (!open) setLink(""); }}
      placement="bottom-end" classNames={menuClasses} shouldBlockScroll={false}>
      <Button isIconOnly size="sm" variant="light" ref={linkButton} className={styles.icon} aria-label={copy.copyLink}
        onPress={() => void copyAddress()}><Link2 size={17} aria-hidden="true" /></Button>
      <PopoverContent className={styles.linkFallback} aria-label={copy.copyLink}>
        <Input autoFocus ref={shareLink} value={link} isReadOnly aria-label={copy.copyLink}
          classNames={{ inputWrapper: styles.linkInput }} onFocus={(event) => event.currentTarget.select()} />
        <p className={styles.copyFallback}>{copy.copyLinkFailed}</p>
      </PopoverContent>
    </Popover>}
    {pageActions.length > 0 && <Dropdown placement="bottom-end" classNames={menuClasses} shouldCloseOnScroll={false}>
      <DropdownTrigger>
        <Button isIconOnly size="sm" variant="light" className={styles.icon} ref={moreButton} aria-label={copy.pageActions}>
          <Ellipsis size={18} aria-hidden="true" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label={copy.pageActions} classNames={listClasses} itemClasses={itemClasses}
        onAction={(key) => pageActions.find((item) => item.key === key)?.run()}>
        {pageActions.map((item) => <DropdownItem key={item.key} textValue={item.label} startContent={item.icon}>{item.label}</DropdownItem>)}
      </DropdownMenu>
    </Dropdown>}
    {moving && <MoveProductDoc api={api} scope={scope} document={page} copy={copy} path={path} onMoved={onChanged}
      onClose={() => {
        setMoving(false);
        moreButton.current?.focus({ preventScroll: true });
      }} />}
    {archiving && <ArchiveProductDoc api={api} scope={scope} node={page} copy={copy}
      onArchived={() => { setArchiving(false); onArchived(); }}
      onClose={(stale) => {
        setArchiving(false);
        if (stale) onChanged();
        moreButton.current?.focus({ preventScroll: true });
      }} />}
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
