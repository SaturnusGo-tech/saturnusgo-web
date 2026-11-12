import type { ProductDocLinkPreview } from "../product-docs";
import type { ProductDocSmartTarget } from "../../navigation/product-doc-smart-link";

export type ProductDocSmartPreview = Omit<ProductDocLinkPreview, "kind"> & {kind: ProductDocSmartTarget["kind"]};
