import { ChevronRight } from "lucide-react";
import type { ProductDocNode } from "../../../domain/product-docs";
import { useProductDocList } from "../../../state/tree/useProductDocList";
import { ProductDocsDisclosure } from "../../motion/ProductDocsDisclosure";
import { ReadState } from "../../status/ReadState";
import styles from "../../product-docs.module.css";
import { ProductDocSectionAppearance } from "../appearance/ProductDocSectionAppearance";
import { ProductDocSectionIcon } from "../appearance/ProductDocSectionIcon";
import { ProductDocItemMenu } from "../../lifecycle/menu/ProductDocItemMenu";
import type { TreeProps } from "../ProductDocsTree";
import treeStyles from "../product-docs-tree.module.css";

export function ProductDocsTreeBranch(props: TreeProps & {
  parentId: string | null;
  depth: number;
  open: ReadonlySet<string>;
  onToggle(id: string): void;
  onChoose(node: ProductDocNode): void;
}) {
  const { data, loading, error, retry, more } = useProductDocList(props.api, props.scope, {
    parentId: props.parentId,
    refresh: props.refresh,
    draft: props.draft,
  });

  if (!data && loading) return <ReadState copy={props.copy} status="loading" retry={retry} />;
  if (error && !data?.nodes.length) return <ReadState copy={props.copy} status="error" retry={retry} />;

  return <>
    {data?.nodes.length ? <ul className={treeStyles.branch}>
      {data.nodes.map((node) => {
        const expanded = props.open.has(node.id);
        const selected = props.selectedId === node.id;
        const section = node.kind === "folder";
        const knownParent = props.path?.some((ancestor) => ancestor.id === node.id);
        return <li key={node.id}>
          <div className={treeStyles.row} data-current={selected || undefined}>
            {section && <div className={treeStyles.sectionMark}>
              {props.draft && data.canEdit
                ? <ProductDocSectionAppearance api={props.api} scope={props.scope} node={node} locale={props.locale}
                  onChanged={props.onAppearanceSaved} />
                : <ProductDocSectionIcon scope={props.scope} node={node} size={17} />}
            </div>}
            <button type="button" className={treeStyles.node} aria-current={selected ? "page" : undefined}
              onClick={() => props.onChoose(node)}>
              <span className={treeStyles.label}>{node.title}</span>
              {!section && node.publishedVersion === null && <small>{props.copy.draft}</small>}
            </button>
            <button type="button" className={treeStyles.disclosure}
              data-quiet={(!section && !knownParent && !expanded) || undefined}
              aria-label={`${expanded ? props.copy.collapseBranch : props.copy.expandBranch} ${node.title}`}
              aria-expanded={expanded} onClick={() => props.onToggle(node.id)}>
              <ChevronRight size={13} aria-hidden="true" />
            </button>
            <div className={treeStyles.itemActions}><ProductDocItemMenu context={props.lifecycle} node={node} permissions={data} tree /></div>
          </div>
          <ProductDocsDisclosure open={expanded}>
            <div className={treeStyles.nested} data-flat={props.depth >= 4 || undefined}>
              <ProductDocsTreeBranch {...props} parentId={node.id} depth={props.depth + 1} />
            </div>
          </ProductDocsDisclosure>
        </li>;
      })}
    </ul> : <p className={styles.treeEmpty}>{props.copy.noPages}</p>}
    {error
      ? <button type="button" className={styles.action} onClick={retry}>{props.copy.retry}</button>
      : data?.nextCursor && <button type="button" className={styles.action} disabled={loading} onClick={more}>{props.copy.more}</button>}
  </>;
}
