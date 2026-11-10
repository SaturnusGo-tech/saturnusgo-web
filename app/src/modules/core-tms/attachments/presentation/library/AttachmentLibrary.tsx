"use client";

import { useMemo, useRef, useState } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Tab, Tabs, Tooltip, addToast } from "@heroui/react";
import { Archive, AudioLines, BookOpen, File, FileSpreadsheet, FileText, Image, LayoutGrid, List, ListFilter, Search, Star, Video } from "lucide-react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { TessiqLoader } from "../../../presentation/common/loading/TessiqLoader";
import { attachmentKinds, type AttachmentLibraryKind, type LibraryAttachment } from "../../domain/library/attachment-library";
import { useOptionalAttachmentClient } from "../context/AttachmentClientProvider";
import { attachmentLibraryCopy } from "./copy/library-copy";
import { AttachmentFilePreview } from "./preview/AttachmentFilePreview";
import { useAttachmentLibraryFile } from "../../composition/library/useAttachmentLibraryFile";
import { useAttachmentLibrary } from "../../composition/library/useAttachmentLibrary";
import { useAttachmentLibraryPreferences } from "../../state/library/useAttachmentLibraryPreferences";
import styles from "./attachment-library.module.css";

const categoryIcons = { all: BookOpen, spreadsheet: FileSpreadsheet, pdf: FileText, image: Image, video: Video,
  audio: AudioLines, archive: Archive, document: FileText, other: File };
const categories = ["all", ...attachmentKinds] as const;
const tabs = ["suggested", "favorites", "mine", "shared"] as const;
const recentFilters = { limit: 5 };
type LibraryTab = typeof tabs[number];

function FileIcon({ file }: { file: LibraryAttachment }) {
  const Icon = categoryIcons[file.kind] ?? File;
  return <span className={styles.fileIcon} data-kind={file.kind}><Icon size={17} aria-hidden /></span>;
}

export function AttachmentLibrary({ workspaceId, subject, connected }: {
  workspaceId: string;
  subject: string | null;
  connected: boolean;
}) {
  const { locale } = useTmsLocale();
  const copy = attachmentLibraryCopy(locale);
  const transport = useOptionalTmsHttpClient();
  const client = useOptionalAttachmentClient();
  const http = connected ? transport : null;
  const [category, setCategory] = useState<AttachmentLibraryKind | "all">("all");
  const [tab, setTab] = useState<LibraryTab>("suggested");
  const [query, setQuery] = useState("");
  const [grid, setGrid] = useState(false);
  const [selected, setSelected] = useState<LibraryAttachment | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const preferences = useAttachmentLibraryPreferences(workspaceId, subject);
  const { favorites } = preferences;
  const favoriteFilter = tab === "favorites" ? favorites : undefined;
  const filters = useMemo(() => ({
    search: query.trim(),
    kind: category === "all" ? undefined : category,
    uploader: tab === "mine" ? "me" as const : tab === "shared" ? "others" as const : undefined,
    ids: favoriteFilter,
  }), [category, favoriteFilter, query, tab]);
  const catalog = useAttachmentLibrary(http, workspaceId, filters);
  const recent = useAttachmentLibrary(http, workspaceId, recentFilters);
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }), [locale]);

  const { loadFile, loadDocumentText, getDownloadUrl } = useAttachmentLibraryFile(http, client, selected);

  async function download() {
    if (!selected || !http || !client) return;
    try {
      const url = await getDownloadUrl();
      const link = document.createElement("a");
      link.href = url;
      link.download = selected.filename;
      link.referrerPolicy = "no-referrer";
      document.body.append(link);
      link.click();
      link.remove();
    } catch {
      addToast({ title: copy.downloadError, severity: "danger" });
    }
  }

  function open(file: LibraryAttachment, button: HTMLButtonElement) {
    opener.current = button;
    setSelected(file);
  }

  return <section className={styles.library} aria-label={copy.title} data-testid="attachment-library">
    {selected && <AttachmentFilePreview key={selected.id}
      file={{ id: selected.id, filename: selected.filename, mimeType: selected.mimeType, sizeBytes: selected.byteSize }}
      ru={locale === "ru"}
      loadDocumentText={selected.source.kind === "product_doc" && /\.docx$/i.test(selected.filename) ? loadDocumentText : undefined}
      loadFile={loadFile} onDownload={() => void download()} onClose={() => {
        setSelected(null);
        requestAnimationFrame(() => opener.current?.focus());
      }} />}
    <div className={styles.layout} hidden={!!selected}>
      <aside className={styles.sidebar} aria-label={copy.title}>
        <h2>{copy.title}</h2>
        <nav aria-label={copy.filters} className={styles.categories}>
          {categories.map(value => {
            const Icon = categoryIcons[value];
            return <Button key={value} type="button" variant="light" size="sm" className={styles.category}
              data-current={category === value || undefined} aria-label={copy.kinds[value]} aria-pressed={category === value} onPress={() => setCategory(value)}>
              <Icon size={16} aria-hidden /><span>{copy.kinds[value]}</span>
            </Button>;
          })}
        </nav>
        {recent.files.length > 0 && <section className={styles.recents} aria-label={copy.recents}>
          <h3>{copy.recents}</h3>
          {recent.files.map(file => {
            const Icon = categoryIcons[file.kind] ?? File;
            return <button key={file.id} type="button" className={styles.recent} onClick={event => open(file, event.currentTarget)}>
              <Icon size={16} aria-hidden /><span>{file.filename}</span>
            </button>;
          })}
          {recent.canLoadMore && <Button type="button" size="sm" variant="light" className={styles.recentMore}
            isDisabled={recent.loadingMore} onPress={() => void recent.loadMore()}>{copy.more}</Button>}
        </section>}
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <h1>{copy.kinds[category]}</h1>
          <div className={styles.search} data-input-shell>
            <Input aria-label={copy.search} placeholder={copy.search} value={query} onValueChange={setQuery}
              startContent={<Search size={16} aria-hidden />} maxLength={200} size="sm" radius="full" isClearable
              classNames={{ inputWrapper: styles.searchWrapper, innerWrapper: styles.searchInner, input: styles.searchInput }} />
          </div>
        </header>
        <div className={styles.toolbar}>
          <Tabs aria-label={copy.title} selectedKey={tab} onSelectionChange={key => setTab(key as LibraryTab)}
            classNames={{ tabList: styles.tabs, tab: styles.tab, tabContent: styles.tabContent, cursor: styles.tabCursor }}>
            {tabs.map(value => <Tab key={value} title={copy[value]} aria-controls="attachment-library-results" />)}
          </Tabs>
          <div className={styles.actions}>
            <Dropdown placement="bottom-end" shouldBlockScroll={false} shouldCloseOnScroll={false}
              classNames={{ base: styles.menuPositioner, content: styles.menu }}>
              <DropdownTrigger><Button isIconOnly variant="light" radius="full" className={styles.iconButton} aria-label={copy.filters}>
                <ListFilter size={18} aria-hidden />
              </Button></DropdownTrigger>
              <DropdownMenu aria-label={copy.filters} selectionMode="single" disallowEmptySelection selectedKeys={[category]}
                classNames={{ list: styles.menuList }} itemClasses={{ base: styles.menuItem }}
                onAction={key => setCategory(key as typeof category)}>
                {categories.map(value => {
                  const Icon = categoryIcons[value];
                  return <DropdownItem key={value} startContent={<Icon size={16} aria-hidden />}>{copy.kinds[value]}</DropdownItem>;
                })}
              </DropdownMenu>
            </Dropdown>
            <span className={styles.toolbarDivider} aria-hidden />
            {([true, false] as const).map(mode => {
              const Icon = mode ? LayoutGrid : List;
              const label = mode ? copy.grid : copy.list;
              return <Tooltip key={String(mode)} content={label}><Button isIconOnly variant="light" radius="full"
                className={styles.iconButton} data-current={mode === grid || undefined} aria-label={label} aria-pressed={mode === grid}
                onPress={() => setGrid(mode)}><Icon size={17} aria-hidden /></Button></Tooltip>;
            })}
          </div>
        </div>
        <div id="attachment-library-results" className={styles.results} aria-busy={catalog.loading || catalog.loadingMore}>
          {!grid && <div className={styles.columns} aria-hidden><span>{copy.name}</span><span>{copy.source}</span><span>{copy.date}</span></div>}
          {catalog.loading ? <TessiqLoader pane label={copy.loading} /> : <>
            {catalog.files.length === 0 && <p className={styles.message} role="status">
              {catalog.error ? copy.failure : query || tab !== "suggested" || category !== "all" ? copy.noMatches : copy.empty}
            </p>}
            <ul className={grid ? styles.grid : styles.list}>
              {catalog.files.map(file => {
                const favorite = favorites.includes(file.id);
                const created = new Date(file.createdAt);
                return <li key={file.id} className={styles.row}>
                  <button type="button" className={styles.file} onClick={event => open(file, event.currentTarget)}>
                    <span className={styles.filename}><FileIcon file={file} /><span>{file.filename}</span></span>
                    <span className={styles.source}>{file.source.label ?? copy.sourceName(file.source.kind)}</span>
                    <time dateTime={file.createdAt} className={styles.date}>{Number.isNaN(created.getTime()) ? "—" : dateFormat.format(created)}</time>
                  </button>
                  <Button type="button" isIconOnly variant="light" radius="full" className={styles.favorite}
                    data-favorite={favorite || undefined} aria-label={favorite ? copy.unfavorite : copy.favorite} aria-pressed={favorite}
                    onPress={() => preferences.toggleFavorite(file.id)}><Star size={15} fill={favorite ? "currentColor" : "none"} aria-hidden /></Button>
                </li>;
              })}
            </ul>
            {catalog.error && catalog.files.length > 0 && <p className={styles.message} role="status">{copy.failure}</p>}
            {catalog.canLoadMore && <Button variant="light" size="sm" isDisabled={catalog.loadingMore} onPress={() => void catalog.loadMore()}>
              {catalog.loadingMore ? copy.loading : copy.more}
            </Button>}
          </>}
        </div>
      </div>
    </div>
  </section>;
}
