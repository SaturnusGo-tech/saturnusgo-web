import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { docArticles } from "../../content/catalog";

async function icons() {
  const module = await import("../../presentation/icons/DocumentationIcon").catch(() => null);
  assert.ok(module, "The shared article icon component must exist");
  return module;
}

test("each existing guide article has its own distinct icon or integration mark", async () => {
  const { DocumentationIcon } = await icons();
  const signatures = new Map<string, string>();
  const fallback = renderToStaticMarkup(createElement(DocumentationIcon, { articleId: "future-article" }));
  for (const article of docArticles) {
    const markup = renderToStaticMarkup(createElement(DocumentationIcon, { articleId: article.id }));
    assert.notEqual(markup, fallback, `Missing article icon: ${article.id}`);
    assert.ok(!signatures.has(markup), `${article.id} repeats the icon for ${signatures.get(markup)}`);
    signatures.set(markup, article.id);
  }
});

test("article icons use a compact decorative default and accept the caller's size and class", async () => {
  const { DocumentationIcon } = await icons();
  for (const articleId of ["create-test-case", "jira", "youtrack", "codex-web-qa"]) {
    const defaultMarkup = renderToStaticMarkup(createElement(DocumentationIcon, { articleId }));
    assert.match(defaultMarkup, /width="18"/);
    assert.match(defaultMarkup, /height="18"/);
    assert.match(defaultMarkup, /aria-hidden="true"/);
    const custom = renderToStaticMarkup(createElement(DocumentationIcon, { articleId, size: 28, className: "guide-mark" }));
    assert.match(custom, /width="28"/);
    assert.match(custom, /height="28"/);
    assert.match(custom, /class="[^"]*guide-mark/);
  }
});

test("unrecognized article identifiers always render the decorative fallback", async () => {
  const { DocumentationIcon } = await icons();
  const fallback = renderToStaticMarkup(createElement(DocumentationIcon, { articleId: "future-article" }));
  for (const articleId of ["", "constructor", "toString", "__proto__"]) {
    assert.equal(renderToStaticMarkup(createElement(DocumentationIcon, { articleId })), fallback);
  }
});
