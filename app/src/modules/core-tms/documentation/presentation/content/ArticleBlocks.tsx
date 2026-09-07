import { ArrowUpRight, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { DocBlock } from "../../model/article";
import { articleById } from "../../content/catalog";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import { CopyButton } from "../controls/CopyButton";
import { InlineText } from "./InlineText";
import styles from "../documentation.module.css";
type Navigation = ReturnType<typeof useDocumentationNavigation>;

export function ArticleBlocks({ blocks, navigation }: { blocks: DocBlock[]; navigation: Navigation }) {
  return <>{blocks.map((block, index) => <Block key={index} block={block} navigation={navigation} />)}</>;
}
function Block({ block, navigation }: { block: DocBlock; navigation: Navigation }) {
  switch (block.kind) {
    case "paragraph": return <p><InlineText text={block.text} /></p>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return <List className={styles.list}>{block.items.map((item, i) => <li key={i}><InlineText text={item} /></li>)}</List>;
    }
    case "steps": return <ol className={styles.steps}>{block.items.map((item, i) => <li key={i}>
      <span className={styles.stepNumber} aria-hidden="true">{i + 1}</span>
      <div><h3>{item.title}</h3><p><InlineText text={item.text} /></p></div>
    </li>)}</ol>;
    case "callout": {
      const Icon = block.tone === "warning" ? TriangleAlert : block.tone === "success" ? CheckCircle2 : Info;
      return <aside className={styles.callout} data-tone={block.tone} aria-label={block.title}>
        <Icon size={18} aria-hidden="true" /><div><strong>{block.title}</strong><p><InlineText text={block.text} /></p></div>
      </aside>;
    }
    case "code": return <figure className={styles.codeBlock}>
      <figcaption><span>{block.caption}</span><CopyButton value={block.text} label="Копировать пример" /></figcaption>
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
        <div><strong>{article.title}</strong><span>{article.description}</span></div><ArrowUpRight size={17} aria-hidden="true" />
      </a>;
    })}</div>;
  }
}
