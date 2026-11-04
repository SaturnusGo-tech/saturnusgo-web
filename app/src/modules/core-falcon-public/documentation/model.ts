import type { DocArticle, DocBlock, DocSection } from "../../core-tms/documentation/model/article";

export type PublicDocLocale = "en" | "ru";
export type PublicDocBlock = Exclude<DocBlock, { kind: "walkthrough" }>;
export type PublicDocSection = Omit<DocSection, "blocks"> & { blocks: PublicDocBlock[] };
export type PublicDocArticle = Omit<DocArticle, "sections" | "sources" | "adminOnly"> & {
  sections: PublicDocSection[];
  adminOnly?: never;
};
export type PublicDocGroup = { id: string; title: string };
export type PublicDocCatalog = { articles: PublicDocArticle[]; groups: PublicDocGroup[] };
