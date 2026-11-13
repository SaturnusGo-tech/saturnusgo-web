import { ChevronRight, FolderInput } from "lucide-react";
import { useId, useRef } from "react";
import type { ProductDocNode } from "../../../domain/product-docs";
import { ProductDocTooltip } from "../../overlay/ProductDocTooltip";
import { ProductDocItemMenu } from "../../lifecycle/menu/ProductDocItemMenu";
import { ProductDocsDisclosure } from "../../motion/ProductDocsDisclosure";
import { CreateProductDoc } from "../../toolbar/CreateProductDoc";
import { ProductDocSectionIcon } from "../../tree/appearance/ProductDocSectionIcon";
import { RenameFolder } from "../RenameFolder";
import { ProductDocsStructureBranch, type BranchProps } from "./ProductDocsStructureBranch";
import repository from "../../../../folders/presentation/structure/structure.module.css";
import shared from "../../product-docs.module.css";
import styles from "../structure.module.css";

export function ProductDocsStructureRow({ node, canEdit, canMove, canArchive, canDelete, ...props }: BranchProps & {
  node: ProductDocNode; canEdit: boolean; canMove: boolean; canArchive: boolean; canDelete: boolean;
}) {
  const { api, scope, copy, path, expanded, lockedId, renaming, onToggle, onRename, onOpen, onMove, onChanged } = props;
  const childrenId = useId();
  const title = useRef<HTMLButtonElement>(null);
  const folder = node.kind === "folder";
  const open = expanded.has(node.id);
  const canMutate = canEdit && lockedId !== node.id;
  const editing = renaming === node.id;
  const branchPath = [...path, node];

  function finishRename() {
    onRename();
    requestAnimationFrame(() => title.current?.focus({ preventScroll: true }));
  }

  return <li className={repository.branch}>
    <div className={`${repository.row} ${styles.row}`}>
      <button type="button" className={repository.disclosure}
        aria-label={`${open ? copy.collapseBranch : copy.expandBranch} ${node.title}`}
        aria-expanded={open} aria-controls={open ? childrenId : undefined} onClick={() => onToggle(node.id)}>
        <ChevronRight className={shared.disclosureChevron} size={15} aria-hidden="true" />
      </button>
      <ProductDocSectionIcon scope={scope} node={node} size={17} />
      {editing ? <RenameFolder api={api} scope={scope} copy={copy} node={node} onClose={finishRename}
        onSaved={() => onChanged(copy.structureSaved)} /> :
        <button type="button" ref={title} className={`${repository.name} ${styles.name}`}
          disabled={folder && canMutate && Boolean(renaming)}
          aria-label={folder && canMutate ? `${copy.renameItem} ${node.title}` : undefined} title={node.title}
          onClick={() => folder && canMutate ? onRename(node.id) : onOpen(node)}>{node.title}</button>}
      {!folder && node.publishedVersion === null && <span className={styles.draft}>{copy.draft}</span>}
      {canMutate && canMove && <ProductDocTooltip label={copy.move}><button type="button" className={repository.add} disabled={Boolean(renaming)}
        aria-label={`${copy.move} ${node.title}`} onClick={(event) => onMove(node, path, event.currentTarget)}>
        <FolderInput size={16} aria-hidden="true" />
      </button></ProductDocTooltip>}
      <ProductDocItemMenu context={props.lifecycle} node={node} permissions={{ canEdit, canArchive, canDelete }} tree
        disabled={Boolean(renaming) || lockedId === node.id} />
      {canMutate && !renaming && <CreateProductDoc api={api} scope={scope} copy={copy}
        kind="folder" parentId={node.id} onCreated={() => {
          onToggle(node.id, true);
          onChanged(copy.folderCreated);
        }} />}
    </div>
    <ProductDocsDisclosure id={childrenId} open={open}>
      <div className={repository.branchChildren}><ProductDocsStructureBranch {...props} path={branchPath} /></div>
    </ProductDocsDisclosure>
  </li>;
}
