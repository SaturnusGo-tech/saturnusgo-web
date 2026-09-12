import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { roundtrip } from "./fixtures/lexicalRoundtrip";
import { highlightRemarkPlugins } from "../render/remarkHighlights";
import { stripRawHtml } from "../../code/stripRawHtml";
import { highlightColors } from "../model/highlightColors";

const render = (value: string) => renderToStaticMarkup(<ReactMarkdown skipHtml remarkPlugins={[remarkGfm, ...highlightRemarkPlugins]}>{value}</ReactMarkdown>);

test("all marker colors survive editor import/export and safe Markdown display", async () => {
  for (const color of highlightColors) {
    const source = `A :highlight[слово]{color="${color}"} Z`;
    const first = await roundtrip(stripRawHtml(source));
    const next = await roundtrip(first.output);
    assert.equal(next.output, first.output);
    assert.equal(first.spans.find((span) => span.text === "слово")?.style, `--falcon-marker: ${color};`);
    assert.equal(render(first.output), `<p>A <mark data-marker="${color}">слово</mark> Z</p>`);
  }
});

test("heading, bold, italic, links and inline code keep their content and marker", async () => {
  const source = '## :highlight[**Critical** and *optional* [API](https://example.test/api) `GET`]{color="blue"}';
  const first = await roundtrip(source);
  assert.ok(first.spans.every((span) => span.style === "--falcon-marker: blue;"));
  assert.equal(first.spans.find((span) => span.text === "Critical")?.bold, true);
  assert.equal(first.spans.find((span) => span.text === "GET")?.code, true);
  const html = render(first.output);
  assert.match(html, /<h2>/);
  assert.match(html, /<strong>Critical<\/strong>/);
  assert.match(html, /<em>optional<\/em>/);
  assert.match(html, /<a href="https:\/\/example.test\/api"><mark data-marker="blue">API<\/mark><\/a>/);
  assert.match(html, /<code>GET<\/code>/);
  assert.equal((await roundtrip(first.output)).output, first.output);
});

test("outer bold survives a marker while adjacent unmarked text stays unmarked", async () => {
  const result = await roundtrip('outside **:highlight[inside]{color="pink"}** after');
  assert.equal(result.spans.find((span) => span.text === "inside")?.bold, true);
  assert.equal(result.spans.find((span) => span.text === "outside ")?.style, "");
  assert.equal(result.spans.find((span) => span.text === " after")?.style, "");
});

test("untrusted colors and attributes cannot create style, handlers, image loads or raw HTML", async () => {
  const samples = [':highlight[x]{color="red"}', ':highlight[x]{color="blue" onclick="alert(1)"}',
    ':highlight[x]{color="url(https://evil.test)"}', ':iframe[x]{src="https://evil.test"}',
    ':highlight[<script>alert(1)</script>]{color="blue"}'];
  for (const source of samples) {
    const html = render(source);
    assert.doesNotMatch(html, /<(?:script|iframe|img)\b|<[^>]*\s(?:onclick|style|src)=/);
    if (!source.includes("<script>")) assert.doesNotMatch(html, /<mark/);
    const result = await roundtrip(stripRawHtml(source));
    assert.doesNotMatch(result.output, /<script|<iframe|<img|style=/);
  }
});

test("fenced examples remain literal and do not turn into highlights", () => {
  const source = '```md\n:highlight[example]{color="blue"}\n```';
  assert.equal(stripRawHtml(source), source);
  assert.doesNotMatch(render(source), /<mark/);
  assert.match(render(source), /:highlight\[example\]/);
});


test("marked autolinks preserve exact query labels, hrefs and surrounding whitespace", async () => {
  for (const url of ["https://example.test/api/users?id=42.", "https://example.test/api/users?id=42&sort=name", "http://example.test?a=b", "www.example.test?a=b"]) {
    const prefix = "Проверьте GET  ", suffix = "   Ожидаемый статус 200. Исправте опечатки.";
    const source = `:highlight[${prefix.trimEnd()}]{color="yellow"}  [:highlight[${url}]{color="yellow"}](${url})   :highlight[${suffix.trimStart()}]{color="yellow"}`;
    const first = await roundtrip(source), next = await roundtrip(first.output);
    assert.equal(next.output, first.output);
    const html = render(first.output);
    assert.equal(html.match(/<a /g)?.length, 1, html);
    assert.ok(html.includes(`href="${url.replaceAll("&", "&amp;")}"`), html);
    assert.equal(html.replace(/<[^>]+>/g, "").replaceAll("&amp;", "&"), prefix + url + suffix);
    assert.doesNotMatch(html, /\\[=&:]/);
  }
});

test("previously escaped marked link labels display once without altering their destination", () => {
  const source = 'Проверьте GET [:highlight[https://example.test/api/users?id\\=42.]{color="yellow"}](https://example.test/api/users?id=42.) Ожидаемый статус 200.';
  const html = render(source);
  assert.equal(html.match(/<a /g)?.length, 1);
  assert.match(html, /href="https:\/\/example.test\/api\/users\?id=42\."/);
  assert.equal(html.replace(/<[^>]+>/g, ""), "Проверьте GET https://example.test/api/users?id=42. Ожидаемый статус 200.");
});

test("marker link repair does not decode literal code or change a different outer destination", async () => {
  const source = 'Keep :highlight[`https://example.test?id\\=42 &amp;`]{color="green"} '
    + '[:highlight[https://example.test?id\\=42]{color="yellow"}](https://other.test/path?literal=%5C%3D "Original title")';
  const html = render(source);
  assert.ok(html.includes('<code>https://example.test?id\\=42 &amp;amp;</code>'), html);
  assert.ok(html.includes('href="https://other.test/path?literal=%5C%3D" title="Original title"'), html);
  assert.ok(html.includes('<mark data-marker="yellow">https://example.test?id=42</mark>'), html);
  const normal = await roundtrip(source);
  assert.equal(render(normal.output), html);
});
