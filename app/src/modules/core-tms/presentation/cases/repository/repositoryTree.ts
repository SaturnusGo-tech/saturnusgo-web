import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";

export type RepositoryFolderNode = {
  path: string;
  label: string;
  cases: TestCaseSummary[];
  children: RepositoryFolderNode[];
  caseCount: number;
};

type MutableFolderNode = Omit<RepositoryFolderNode, "children"> & {
  children: MutableFolderNode[];
  childIndex: Map<string, MutableFolderNode>;
};

export function normalizeRepositoryPath(value: string) {
  const segments = value.split("/").filter(Boolean);
  return segments.length ? `/${segments.join("/")}` : "/";
}

export function isRepositoryPathBranch(path: string, currentPath: string) {
  const normalizedPath = normalizeRepositoryPath(path);
  const normalizedCurrent = normalizeRepositoryPath(currentPath);
  return normalizedPath === "/" || normalizedCurrent === normalizedPath ||
    normalizedCurrent.startsWith(`${normalizedPath}/`);
}

function createNode(path: string, label: string): MutableFolderNode {
  return {
    path,
    label,
    cases: [],
    children: [],
    childIndex: new Map(),
    caseCount: 0,
  };
}

function finishNode(node: MutableFolderNode): RepositoryFolderNode {
  const children = node.children.map(finishNode);
  return {
    path: node.path,
    label: node.label,
    cases: node.cases,
    children,
    caseCount: node.cases.length + children.reduce(
      (total, child) => total + child.caseCount,
      0,
    ),
  };
}

export function buildRepositoryTree(
  groups: Array<[string, TestCaseSummary[]]>,
): RepositoryFolderNode[] {
  const roots: MutableFolderNode[] = [];
  const rootIndex = new Map<string, MutableFolderNode>();

  for (const [folderPath, cases] of groups) {
    const normalizedPath = normalizeRepositoryPath(folderPath);
    const segments = normalizedPath === "/"
      ? ["/"]
      : normalizedPath.slice(1).split("/");
    let nodes = roots;
    let index = rootIndex;
    let path = "";
    let node: MutableFolderNode | undefined;

    for (const label of segments) {
      path = label === "/" ? "/" : `${path}/${label}`;
      node = index.get(label);
      if (!node) {
        node = createNode(path, label);
        nodes.push(node);
        index.set(label, node);
      }
      nodes = node.children;
      index = node.childIndex;
    }
    node?.cases.push(...cases);
  }

  return roots.map(finishNode);
}
