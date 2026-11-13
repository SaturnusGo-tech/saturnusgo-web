import type { ProductDocNode } from "../../../domain/product-docs";
import { useProductDocList } from "../../../state/tree/useProductDocList";
import { ReadState } from "../../status/ReadState";
import type { StructureProps } from "../ProductDocsStructure";
import { ProductDocsStructureRow } from "./ProductDocsStructureRow";
import repository from "../../../../folders/presentation/structure/structure.module.css";
import shared from "../../product-docs.module.css";

export type BranchProps = Pick<StructureProps, "api" | "scope" | "copy" | "refresh" | "lockedId" | "onOpen" | "lifecycle"> & {
  path: readonly ProductDocNode[];
  expanded: ReadonlySet<string>;
  renaming?: string;
  onToggle(id: string, forceOpen?: boolean): void;
  onRename(id?: string): void;
  onMove(node: ProductDocNode, path: readonly ProductDocNode[], trigger: HTMLButtonElement): void;
  onChanged(message: string): void;
};

export function ProductDocsStructureBranch(props: BranchProps) {
  const { api, scope, copy, refresh, path } = props;
  const parentId = path[path.length - 1]?.id ?? null;
  const { data, loading, error, retry, more } = useProductDocList(api, scope, { parentId, refresh, draft: true });

  if (error && !data?.nodes.length) return <ReadState copy={copy} status="error" retry={retry} />;
  if (!data) return <ReadState copy={copy} status="loading" retry={retry} />;
  return <>
    {data.nodes.length > 0 ? <ul className={path.length ? repository.children : repository.tree}>
      {data.nodes.map((node) => <ProductDocsStructureRow key={node.id} {...props} node={node} canEdit={data.canEdit} canMove={data.canPublish}
        canArchive={data.canArchive === true} canDelete={data.canDelete === true} />)}
    </ul> : <p className={repository.empty}>{path.length ? copy.noPages : copy.structureEmpty}</p>}
    {error
      ? <button type="button" className={shared.action} onClick={retry}>{copy.retry}</button>
      : data.nextCursor && <button type="button" className={shared.action} onClick={more} disabled={loading}>{copy.more}</button>}
  </>;
}
