import { productDocTaxonomyInput } from "../../../domain/product-doc-taxonomy";
import { productDocPropertiesInput } from "../../../domain/properties/product-doc-properties";
import type { ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import { trimTitleHighlights } from "../../../presentation/draft/title/model/productDocTitleHighlights";
import type { BufferedProductDocDraft } from "../draft-buffer";

export async function saveProductDocDraft(api: ProductDocsApi, scope: ProductDocScope, id: string,
  draft: BufferedProductDocDraft, untitled: string): Promise<BufferedProductDocDraft["baseline"]> {
  const sections = draft.sections.map(section => ({ ...section, title: section.title.trim(),
    ...(!section.titleHighlights?.length && draft.baseline.sections.some(old => old.id === section.id && old.titleHighlights?.length)
      ? { titleHighlights: [] } : {}) }));
  const title = draft.title.trim() || untitled;
  const titleHighlights = trimTitleHighlights(draft.title, draft.titleHighlights ?? []);
  const result = await api.save(scope, id, { title, titleHighlights, sections,
    expectedDraftVersion: draft.baseline.version, taxonomy: productDocTaxonomyInput(draft.taxonomy),
    properties: productDocPropertiesInput(draft.properties) });
  const { baseline: _previous, blocked: _blocked, ...content } = draft;
  return { ...content, version: result.draftVersion };
}
