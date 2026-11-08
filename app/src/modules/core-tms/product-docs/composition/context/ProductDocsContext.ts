import { createContext, useContext } from "react";
import type { ProductDocsApi, ProductDocScope, ProductDocSelection } from "../../domain/product-docs";

import type { ProductDocRunSelection } from "../../state/run/inspector/useProductDocRunModel";

type Context = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  openRun?(selection: ProductDocRunSelection): void;
  openCase?(id: string, trigger: HTMLElement): void;
  openDocument?(selection: ProductDocSelection, trigger: HTMLElement): void;
  open(selection: ProductDocSelection, trigger: HTMLElement): void;
};

export const ProductDocsContext = createContext<Context | null>(null);
export const useProductDocsWorkspace = () => useContext(ProductDocsContext);
