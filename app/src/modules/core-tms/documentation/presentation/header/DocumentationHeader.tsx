import { Menu, Search, X } from "@openai/apps-sdk-ui/components/Icon";
import type { MouseEvent } from "react";
import { useDocumentationCopy } from "../../localization/useDocumentationCopy";
import { documentationChatId } from "../../navigation/documentation-link";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import css from "./documentation-header.module.css";

export function DocumentationHeader({ navigation, chatting, treeOpen, historyOpen = false, onTreeToggle, onNavigate, onSearch }: {
  navigation: ReturnType<typeof useDocumentationNavigation>; chatting: boolean; treeOpen: boolean;
  historyOpen?: boolean;
  onTreeToggle: () => void; onNavigate: () => void; onSearch: () => void;
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
      <button type="button" className={`${css.iconButton} ${chatting ? css.historyToggle : css.treeToggle}`}
        aria-label={chatting ? (historyOpen ? copy.hideChatHistory : copy.showChatHistory) : (treeOpen ? copy.hideTree : copy.showTree)}
        aria-expanded={chatting ? historyOpen : treeOpen} aria-controls={chatting ? "falcon-ai-history" : "documentation-sidebar"}
        onClick={onTreeToggle}>
        {!chatting && treeOpen ? <X width={18} height={18} /> : <Menu width={18} height={18} />}
      </button>
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
    </div>
  </header>;
}
