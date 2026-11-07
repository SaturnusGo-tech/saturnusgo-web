import { createContext, useContext } from "react";
import type { ProductDocsApi, ProductDocScope, ProductDocSelection } from "../../domain/product-docs";

type Context = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  open(selection: ProductDocSelection, trigger: HTMLElement): void;
};

export const ProductDocsContext = createContext<Context | null>(null);
export const useProductDocsWorkspace = () => useContext(ProductDocsContext);
