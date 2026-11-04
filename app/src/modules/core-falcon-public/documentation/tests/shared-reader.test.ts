import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { componentHarness, invoke, nodes } from "../../../core-tms/portfolios/tests/support/component-harness";
import { publicDocumentationCatalog } from "../catalog";
import { publicDocLabels } from "../copy";
import { buildDocumentationFolders } from "../../../core-tms/documentation/model/library";
import { documentationCopy } from "../../../core-tms/documentation/localization/ui-copy";
import type { DocumentationReader } from "../PublicDocumentation";
import type { PublicDocsNavigation } from "../PublicDocsNavigation";

test("the common reader receives its catalog and uses the supplied home, article and AI navigation", () => {
  const h = componentHarness();
  try {
    const { DocumentationReader: render } = h.load<{ DocumentationReader: typeof DocumentationReader }>(new URL("../PublicDocumentation.tsx", import.meta.url), name => {
      if (name.endsWith("model/library")) return { buildDocumentationFolders };
      if (name.endsWith("./copy")) return { publicDocLabels };
      if (name.endsWith("localization/ui-copy")) return { documentationCopy };
      if (name.endsWith("DocumentationHome")) return { DocumentationHome: "SharedHome" };
      if (name.endsWith("DocumentationArticleContent")) return { DocumentationArticleContent: "SharedArticle", DocumentationArticleSections: "SharedSections" };
    });
    Object.assign(h.window, { requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
    const catalog = publicDocumentationCatalog("en");
    let asks = 0;
    const languages: string[] = [];
    const visited: string[] = [];
    const props = { catalog, locale: "en" as const, activeId: "introduction", embedded: true,
      href: (id: string, section?: string) => `/guide/?article=${id}${section ? `#${section}` : ""}`,
      onNavigate: (_event: unknown, id: string) => { visited.push(id); }, onAskAI: () => { asks++; }, onLocaleChange: (locale: "en" | "ru") => languages.push(locale) };
    const home = nodes(h.render(() => render(props)));
    assert.equal(home[0].props["data-embedded"], true);
    const sharedHome = home.find(node => node.type === "SharedHome")!;
    assert.equal((sharedHome.props.catalog as { docArticles: unknown }).docArticles, catalog.articles);
    assert.equal(typeof sharedHome.props.renderIntroduction, "function");
    invoke(home.find(node => node.props.className === "aiPill")!, "onClick", { preventDefault() {} });
    assert.equal(asks, 1);
    let languageNavigationPrevented = false;
    invoke(home.find(node => node.type === "a" && node.props.lang === "ru")!, "onClick", { preventDefault() { languageNavigationPrevented = true; } });
    assert.deepEqual(languages, ["ru"]);
    assert.equal(languageNavigationPrevented, true);
    invoke(home.find(node => node.props.className === "docLabel")!, "onClick", {});
    assert.deepEqual(visited, ["introduction"]);
    const article = nodes(h.render(() => render({ ...props, activeId: "create-test-case" })));
    assert.equal((article.find(node => node.type === "SharedArticle")?.props.article as { id: string }).id, "create-test-case");
    assert.ok(article.some(node => node.type === "a" && String(node.props.href).startsWith("/guide/?article=create-test-case#")));
  } finally { h.dispose(); }
});

test("documentation folders begin collapsed and expose only supplied article routes when expanded", () => {
  const h = componentHarness();
  try {
    const { PublicDocsNavigation: render } = h.load<{ PublicDocsNavigation: typeof PublicDocsNavigation }>(new URL("../PublicDocsNavigation.tsx", import.meta.url));
    const catalog = publicDocumentationCatalog("en"), folders = buildDocumentationFolders(catalog.articles, catalog.groups, "en");
    const tree = nodes(render({ folders, articles: catalog.articles, activeId: "introduction", href: id => `?article=${id}`, onNavigate() {} }));
    const folder = tree[1] as unknown as { type: (props: unknown) => unknown; props: unknown };
    const view = () => folder.type(folder.props);
    let all = nodes(h.render(view));
    assert.equal(all.find(node => node.type === "button")?.props["aria-expanded"], false);
    assert.equal(all.find(node => node.props.className === "folderPanel")?.props["aria-hidden"], true);
    invoke(all.find(node => node.type === "button")!, "onClick");
    all = nodes(h.render(view));
    assert.equal(all.find(node => node.type === "button")?.props["aria-expanded"], true);
    const ids = new Set(catalog.articles.map(article => article.id));
    for (const anchor of all.filter(node => node.type === "a")) assert.ok(ids.has(String(anchor.props.href).replace("?article=", "")));
  } finally { h.dispose(); }
});

test("search uses a modal dialog, restores focus and keeps keyboard selection in the same navigation flow", async () => {
  const source = await readFile(new URL("../PublicDocsSearch.tsx", import.meta.url), "utf8");
  assert.match(source, /dialog\?\.showModal\(\)/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /previousFocus\?\.focus\(\)/);
  assert.match(source, /onCancel=/);
  assert.match(source, /ArrowDown/);
  assert.match(source, /ArrowUp/);
  assert.match(source, /event.key === "Enter"/);
  assert.doesNotMatch(source, /fetch\s*\(|HttpClient|TmsSession|useDocumentationCatalog/);
});
