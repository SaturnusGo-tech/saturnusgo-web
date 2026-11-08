import { useLayoutEffect, useState } from "react";
import { productDocTaxonomyInput } from "../../../domain/product-doc-taxonomy";
import { productDocPropertiesInput } from "../../../domain/properties/product-doc-properties";
import type { BufferedProductDocDraft, DraftContent, ProductDocDraftBuffer } from "../draft-buffer";

export function useBufferedProductDocDraft(drafts: ProductDocDraftBuffer, key: string,
  initialBaseline: BufferedProductDocDraft["baseline"], content: DraftContent) {
  const [baseline, setBaseline] = useState(initialBaseline);
  const { title, titleHighlights, sections, taxonomy, properties } = content;
  const titleFormattingChanged = JSON.stringify(titleHighlights) !== JSON.stringify(baseline.titleHighlights ?? []);
  const draftTaxonomy = productDocTaxonomyInput(taxonomy);
  const baseTaxonomy = productDocTaxonomyInput(baseline.taxonomy);
  const taxonomyChanged = draftTaxonomy.productGroupId !== baseTaxonomy.productGroupId || draftTaxonomy.productId !== baseTaxonomy.productId;
  const draftProperties = productDocPropertiesInput(properties);
  const propertiesChanged = JSON.stringify(draftProperties) !== JSON.stringify(productDocPropertiesInput(baseline.properties));
  const dirty = title !== baseline.title || titleFormattingChanged || taxonomyChanged || propertiesChanged
    || JSON.stringify(sections) !== JSON.stringify(baseline.sections);

  useLayoutEffect(() => {
    if (!dirty) {
      drafts.delete(key);
      return;
    }
    const current = drafts.get(key);
    if (current?.title !== title || current.titleHighlights !== titleHighlights || current.sections !== sections
      || current.taxonomy !== taxonomy || current.properties !== properties || current.baseline !== baseline) {
      drafts.set(key, { title, titleHighlights, sections, taxonomy, properties, baseline });
    }
  }, [baseline, key, dirty, drafts, sections, taxonomy, properties, title, titleHighlights]);

  return { baseline, setBaseline, dirty, titleFormattingChanged, taxonomyChanged, draftTaxonomy, propertiesChanged, draftProperties };
}
