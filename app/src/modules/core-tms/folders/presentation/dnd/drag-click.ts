import { createContext } from "react";
import type { MutableRefObject } from "react";

export const DragClickContext = createContext<MutableRefObject<number>>({ current: 0 });

export const RepositoryDragSelectionContext = createContext<{
  active: boolean; caseIds: ReadonlySet<string>; folderId: string | null;
}>({ active: false, caseIds: new Set(), folderId: null });
