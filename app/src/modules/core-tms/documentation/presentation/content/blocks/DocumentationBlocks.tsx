"use client";
import type { ReactNode } from "react";
import { ArrowUpRight, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { DocArticle, DocBlock } from "../../../model/article";
import type { useDocumentationNavigation } from "../../../navigation/useDocumentationNavigation";
import { InlineText } from "../InlineText";
import { DocumentationIcon } from "../../icons/DocumentationIcon";
import styles from "../../article/reading.module.css";
type Navigation = Pick<ReturnType<typeof useDocumentationNavigation>, "link" | "navigate">;

type BlockContext = {
  navigation: Navigation;
  articleById: ReadonlyMap<string, DocArticle>;
  renderWalkthrough?: (block: Extract<DocBlock, { kind: "walkthrough" }>) => ReactNode;
  renderCopy?: (value: string) => ReactNode;
};

export function DocumentationBlocks({ blocks, ...context }: { blocks: DocBlock[] } & BlockContext) {
  return <>{blocks.map((block, index) => <Block key={index} block={block} {...context} />)}</>;
}

function Block({ block, navigation, articleById, renderWalkthrough, renderCopy }: { block: DocBlock } & BlockContext) {
  switch (block.kind) {
    case "walkthrough": return renderWalkthrough ? renderWalkthrough(block) : <ol className={styles.steps} aria-label={block.title}>
      {block.steps.map(step => <li key={step.title}><h3>{step.title}</h3><p><InlineText text={step.instruction} /></p><p><InlineText text={step.result} /></p></li>)}
    </ol>;
    case "paragraph": return <p><InlineText text={block.text} /></p>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return <List className={styles.list}>{block.items.map((item, i) => <li key={i}><InlineText text={item} /></li>)}</List>;
    }
    case "steps": return <ol className={styles.steps}>{block.items.map((item, i) => <li key={i}>
      <h3>{item.title}</h3><p><InlineText text={item.text} /></p>
    </li>)}</ol>;
    case "callout": {
      const Icon = block.tone === "warning" ? TriangleAlert : block.tone === "success" ? CheckCircle2 : Info;
      return <aside className={styles.callout} data-tone={block.tone} aria-label={block.title}>
        <Icon size={16} aria-hidden="true" /><div><strong>{block.title}</strong><p><InlineText text={block.text} /></p></div>
      </aside>;
    }
    case "code": return <figure className={styles.codeBlock}>
      <figcaption><span>{block.caption}</span>{renderCopy?.(block.text)}</figcaption>
      <pre tabIndex={0} aria-label={block.caption}><code>{block.text}</code></pre><span className={styles.codeLanguage}>{block.language}</span>
    </figure>;
    case "table": return <div className={styles.tableScroll} role="region" aria-label={block.columns.join(" · ")} tabIndex={0}>
      <table><thead><tr>{block.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0
          ? <th key={j} scope="row"><InlineText text={cell} /></th> : <td key={j}><InlineText text={cell} /></td>)}</tr>)}</tbody></table>
    </div>;
    case "articles": return <div className={styles.articleLinks}>{block.ids.map((id) => {
      const article = articleById.get(id); if (!article) return null;
      return <a key={id} href={navigation.link(id)} onClick={(event) => navigation.navigate(event, id)}>
        <DocumentationIcon articleId={id} size={17} /><div><strong>{article.title}</strong><span>{article.description}</span></div><ArrowUpRight size={14} aria-hidden="true" />
      </a>;
    })}</div>;
  }
}
