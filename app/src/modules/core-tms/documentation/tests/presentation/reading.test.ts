import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import { documentationCatalog } from "../../localization/catalog/locale-catalog";
import { documentationCopy } from "../../localization/ui-copy";
import { documentationArticleImage } from "../../model/library";
import type { DocumentationHome } from "../../presentation/home/DocumentationHome";
import type { DocumentationArticleContent, DocumentationArticleSections } from "../../presentation/article/DocumentationArticleContent";

test("the shared home uses the supplied locale and visible catalog without requiring authenticated context", () => {
  for (const locale of ["en", "ru"] as const) {
    const h = componentHarness();
    try {
      const catalog = documentationCatalog(locale, false);
      const { DocumentationHome: render } = h.load<{ DocumentationHome: typeof DocumentationHome }>(new URL("../../presentation/home/DocumentationHome.tsx", import.meta.url), name => {
        if (/useDocumentationCatalog|useDocumentationCopy/.test(name)) throw new Error("The shared home must use only its supplied catalog and navigation");
      });
      const visited: string[] = [];
      let introductionRendered = false;
      const all = nodes(h.render(() => render({ catalog, href: id => `/docs/${locale}/${id}/`,
        onNavigate: (_event, id) => visited.push(id),
        renderIntroduction: article => { introductionRendered = article.id === "introduction"; return null; } })));
      assert.equal(all.find(node => node.type === "h1")?.props.children, "Falcon Docs");
      const anchors = all.filter(node => node.type === "a");
      assert.ok(anchors.length > 4);
      for (const anchor of anchors) {
        const parts = String(anchor.props.href).split("/").filter(Boolean), id = parts[parts.length - 1];
        assert.ok(catalog.articleById.has(id));
        assert.notEqual(catalog.articleById.get(id)?.adminOnly, true);
      }
      const quickStart = anchors.find(anchor => anchor.props.href === `/docs/${locale}/quick-start/`)!;
      invoke(quickStart, "onClick", {});
      assert.deepEqual(visited, ["quick-start"]);
      assert.equal(introductionRendered, true);
      assert.ok(all.some(node => node.type === "h2" && node.props.children === (locale === "ru" ? "Основы Falcon" : "Falcon basics")));
    } finally { h.dispose(); }
  }
});

test("shared article and section renderers preserve article headings and supplied route links", () => {
  const h = componentHarness();
  try {
    const { DocumentationArticleContent: render, DocumentationArticleSections: sections } = h.load<{
      DocumentationArticleContent: typeof DocumentationArticleContent;
      DocumentationArticleSections: typeof DocumentationArticleSections;
    }>(new URL("../../presentation/article/DocumentationArticleContent.tsx", import.meta.url), name => name.endsWith("model/library") ? { documentationArticleImage } : undefined);
    const catalog = documentationCatalog("en", false), article = catalog.articleById.get("quick-start")!;
    const navigation = { link: (id: string, section?: string) => `/docs/en/${id}/${section ? `#${section}` : ""}`, navigate() {} };
    const articleNodes = nodes(h.render(() => render({ article, navigation, copy: documentationCopy.en, renderBlocks: () => null })));
    assert.equal(articleNodes.find(node => node.type === "h1")?.props.children, article.title);
    assert.equal(articleNodes.find(node => node.type === "img")?.props.src, documentationArticleImage(article.id)?.src);
    assert.equal(articleNodes.some(node => node.props.className === "articleMeta"), false);
    const sectionNodes = nodes(h.render(() => sections({ article, navigation, sectionLinkLabel: "Link to section", renderBlocks: () => null })));
    assert.deepEqual(sectionNodes.filter(node => node.props["data-doc-section"] !== undefined).map(node => node.props.id), article.sections.map(section => section.id));
    assert.deepEqual(sectionNodes.filter(node => node.type === "a").map(node => node.props.href), article.sections.map(section => navigation.link(article.id, section.id)));
  } finally { h.dispose(); }
});
