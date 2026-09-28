import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import { guideRemarkPlugins } from "../../presentation/formatting/guide-formatting";

function render(content: string, streaming = false) {
  return renderToStaticMarkup(<ReactMarkdown skipHtml remarkPlugins={guideRemarkPlugins(streaming)}
    disallowedElements={["img", "input", "iframe", "video", "audio"]} urlTransform={() => ""}
    components={{ a: ({ children }) => <span>{children}</span> }}>{content}</ReactMarkdown>);
}
const mark = (text: string, color = "yellow") => `:highlight[${text}]{color="${color}"}`;

test("Falcon answers preserve readable procedures, labels, literal values and the shared yellow marker", () => {
  const html = render(`Open **Runs**. ${mark("Keep the original file")} before replacing it.\n\n1. Choose **Edit**.\n2. Enter \`2.4.0\` and save.`);
  assert.match(html, /<strong>Runs<\/strong>/);
  assert.match(html, /<mark data-marker="yellow">Keep the original file<\/mark>/);
  assert.match(html, /<ol>/); assert.match(html, /<code>2.4.0<\/code>/);
});

test("excessive, long, colored and heading highlights become readable text without losing information", () => {
  const html = render(`## ${mark("Overview")}\n\nBefore ${mark("first")} and ${mark("second")} then ${mark("third")}.\n\n${mark("Other", "purple")} ${mark("x".repeat(81))}`);
  assert.equal((html.match(/<mark /g) ?? []).length, 2);
  assert.match(html, /<h2>Overview<\/h2>/); assert.match(html, /third/); assert.match(html, /Other/);
  assert.ok(html.includes("x".repeat(81))); assert.doesNotMatch(html, /:highlight|purple/);
});

test("raw HTML, unsafe attributes and remote media remain inert; code examples remain literal", () => {
  const html = render(':highlight[Keep]{color="yellow" onclick="alert(1)"} <script>alert(1)</script> ![remote](https://example.com/x)\n\n`' + mark("literal") + '`');
  assert.doesNotMatch(html, /<script|<img|onclick=|<mark/);
  assert.match(html, /Keep/); assert.match(html, /<code>:highlight\[literal\]/);
});

test("each streamed marker prefix hides control syntax while preserving the arriving label", () => {
  const source = mark("**Keep** this file");
  for (let end = 1; end <= source.length; end++) {
    const html = render(`Before ${source.slice(0, end)}`, true);
    assert.doesNotMatch(html, /:high|\{co|\[|\]/, `prefix ${source.slice(0, end)}`);
    if (end >= source.indexOf(" this")) assert.match(html, /Keep/);
  }
  assert.match(render(`Before ${source}`, true), /<mark data-marker="yellow"><strong>Keep<\/strong> this file<\/mark>/);
});

test("ordinary punctuation and literal marker examples are not consumed during streaming", () => {
  assert.match(render("Time: 12:30", true), /12:30/);
  assert.match(render('`' + mark("literal") + '`', true), /<code>:highlight/);
  assert.match(render("```text\n:highlight[example", true), /:highlight\[example/);
});
