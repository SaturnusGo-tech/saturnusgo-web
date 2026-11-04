"use client";

import { useState, type MouseEvent } from "react";
import type { DocumentationFolder } from "../../core-tms/documentation/model/library";
import { DocumentationIcon } from "../../core-tms/documentation/presentation/icons/DocumentationIcon";
import type { DocArticle } from "../../core-tms/documentation/model/article";
import { PublicDocsIcon } from "./PublicDocsIcon";
import styles from "./documentation.module.css";

function Folder({ folder, articles, activeId, href, onNavigate, depth = 0 }: {
  folder: DocumentationFolder; articles: readonly DocArticle[]; activeId: string; href: (id: string, section?: string) => string; onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) => void; depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = `public-folder-${folder.id.replace(/[^a-z0-9-]/gi, "-")}`;
  return <div className={styles.navFolder} data-depth={depth}>
    <button type="button" className={styles.folderToggle} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(value => !value)}>
      <span>{folder.title}</span><PublicDocsIcon name="chevron" />
    </button>
    <div className={styles.folderPanel} data-expanded={expanded} id={panelId} aria-hidden={!expanded} ref={node => { node?.toggleAttribute("inert", !expanded); }}>
      <div className={styles.folderContents}>
        {folder.articleIds.map(id => {
          const article = articles.find(item => item.id === id);
          return article ? <a key={id} href={href(id)} className={styles.navArticle} aria-current={activeId === id ? "page" : undefined} onClick={event => onNavigate(event, id)}>
            <DocumentationIcon articleId={id} size={16} /><span>{article.title}</span>
          </a> : null;
        })}
        {folder.children.map(child => <Folder key={child.id} folder={child} articles={articles} activeId={activeId} href={href} onNavigate={onNavigate} depth={depth + 1} />)}
      </div>
    </div>
  </div>;
}

export function PublicDocsNavigation(props: { folders: DocumentationFolder[]; articles: readonly DocArticle[]; activeId: string; href: (id: string, section?: string) => string; onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) => void }) {
  return <nav className={styles.navigation}>{props.folders.map(folder => <Folder key={folder.id} folder={folder} {...props} />)}</nav>;
}
