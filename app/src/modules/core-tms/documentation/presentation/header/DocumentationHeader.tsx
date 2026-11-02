import { Menu, Moon, Search, Sun, X } from "@openai/apps-sdk-ui/components/Icon";
import type { MouseEvent } from "react";
import { useDocumentationCopy } from "../../localization/useDocumentationCopy";
import { documentationChatId } from "../../navigation/documentation-link";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import css from "./documentation-header.module.css";

export function DocumentationHeader({ navigation, chatting, treeOpen, onTreeToggle, onNavigate, onSearch, isLight, onThemeChange }: {
  navigation: ReturnType<typeof useDocumentationNavigation>; chatting: boolean; treeOpen: boolean;
  onTreeToggle: () => void; onNavigate: () => void; onSearch: () => void; isLight: boolean;
  onThemeChange: (origin: { x: number; y: number }) => void;
}) {
  const copy = useDocumentationCopy();
  const docsId = navigation.documentationId;
  const section = navigation.documentationSection;
  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string, anchor?: string) {
    navigation.navigate(event, id, anchor);
    if (event.defaultPrevented) onNavigate();
  }
  return <header className={css.header}>
    <div className={css.identity}>
      {!chatting && <button type="button" className={`${css.iconButton} ${css.treeToggle}`}
        aria-label={treeOpen ? copy.hideTree : copy.showTree} aria-expanded={treeOpen}
        aria-controls="documentation-sidebar" onClick={onTreeToggle}>
        {treeOpen ? <X width={18} height={18} /> : <Menu width={18} height={18} />}
      </button>}
      <a className={css.brand} href={navigation.link(docsId, section)} onClick={event => navigate(event, docsId, section)}>Falcon Docs</a>
    </div>
    <nav className={css.tabs} aria-label={copy.sectionsLabel}>
      <a href={navigation.link(docsId, section)} aria-current={!chatting ? "page" : undefined}
        onClick={event => navigate(event, docsId, section)}>{copy.docsTab}</a>
      <a href={navigation.link(documentationChatId)} aria-current={chatting ? "page" : undefined}
        onClick={event => navigate(event, documentationChatId)}>{copy.aiChatTab}</a>
    </nav>
    <div className={css.actions}>
      {!chatting && <button type="button" className={css.iconButton} onClick={onSearch} aria-label={copy.searchDocumentation}
        title={`${copy.searchDocumentation} (⌘K / Ctrl+K)`}><Search width={18} height={18} /></button>}
      <button type="button" className={css.iconButton} aria-label={isLight ? copy.darkTheme : copy.lightTheme}
        onClick={event => onThemeChange({ x: event.clientX, y: event.clientY })}>
        {isLight ? <Moon width={18} height={18} /> : <Sun width={18} height={18} />}
      </button>
    </div>
  </header>;
}
