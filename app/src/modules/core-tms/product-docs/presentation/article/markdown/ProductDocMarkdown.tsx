"use client";

import type { Root } from "mdast";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import type { ProductDocsCopy } from "../../../localization/copy";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { remarkHighlights } from "../../../../presentation/cases/inspector/markdown/highlight/render/remarkHighlights";
import markerStyles from "../../../../presentation/cases/inspector/markdown/highlight/highlight.module.css";
import { readProductDocImageTitle } from "../../draft/media/codec/productDocImageReference";
import { useProductDocImage } from "../../draft/media/productDocImageSource";
import styles from "../../product-docs.module.css";
import { ProductDocCodeSnippet } from "../../draft/blocks/snippet/ProductDocCodeSnippet";
import blockStyles from "../../draft/blocks/productDocBlocks.module.css";
import layoutStyles from "../../draft/layouts/layouts.module.css";
import { layoutColumnName, productDocColumnCount, productDocLayoutRatio } from "../../draft/layouts/productDocLayoutBlocks";

function renderDocumentBlocks() {
  return (tree: Root) => {
    function visit(node: Root["children"][number] | Root, insideLayout = false) {
      let layout = false;
      if (node.type === "containerDirective") {
        const mode = node.attributes?.mode;
        layout = !insideLayout && Boolean(productDocColumnCount(node));
        if (layout) {
          node.data = { hName: "div", hProperties: { "data-doc-columns": "", "data-doc-layout-ratio": productDocLayoutRatio(node) } };
        } else if (insideLayout && node.name === layoutColumnName) {
          node.data = { hName: "div", hProperties: { "data-doc-column": "" } };
        } else if (node.name === "falcon-align" && (mode === "left" || mode === "center" || mode === "right")) {
          node.data = { hName: "div", hProperties: { "data-doc-align": mode } };
        } else if (["note", "tip", "info", "caution", "danger"].includes(node.name)) {
          node.data = { hName: "blockquote", hProperties: { "data-tone": node.name } };
        }
      }
      if (node.type === "textDirective" && node.name === "falcon-color") {
        const tone = node.attributes?.tone;
        if (tone && ["muted", "info", "success", "warning", "danger"].includes(tone)) {
          node.data = { hName: "span", hProperties: { "data-doc-color": tone } };
        }
      }
      if (node.type === "textDirective" && node.name === "falcon-underline") node.data = { hName: "u" };
      if ("children" in node) node.children.forEach((child) => visit(child, layout));
    }
    visit(tree);
  };
}

function ImageReference({ alt, src, title, copy }: { alt?: string; src?: string; title?: string; copy: ProductDocsCopy }) {
  const ru = useTmsLocale().locale === "ru";
  const [revealed, setRevealed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const image = useProductDocImage(src, revealed);
  const settings = readProductDocImageTitle(title);
  if (unavailable || image.unavailable) {
    return image.remoteUrl
      ? <a href={image.remoteUrl} target="_blank" rel="noopener noreferrer">{alt || copy.openImage}</a>
      : <span>{alt || (ru ? "Изображение недоступно" : "Image unavailable")}</span>;
  }
  if (image.remoteUrl && !revealed) return <button className={styles.imageReveal} type="button" onClick={() => setRevealed(true)}>
    {alt ? copy.loadImage + " · " + alt : copy.loadImage}
  </button>;
  if (!image.src) return <span aria-busy={image.pending}>{alt}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={styles.articleImage} src={image.src} alt={alt || ""} title={settings.title || undefined}
    width={settings.width} loading="lazy" referrerPolicy="no-referrer" onError={() => setUnavailable(true)} />;
}

export function ProductDocMarkdown({ markdown, copy }: { markdown: string; copy: ProductDocsCopy }) {
  return <div className={`${layoutStyles.articleLayouts} ${markerStyles.surface}`}><ReactMarkdown skipHtml
    remarkPlugins={[remarkGfm, remarkDirective, [remarkHighlights, { preserveOtherDirectives: true }], renderDocumentBlocks]}
    components={{
      h1: ({ children }) => <h3>{children}</h3>,
      h2: ({ children }) => <h4>{children}</h4>,
      hr: () => <hr className={blockStyles.divider} />,
      pre: ({ node, children }) => {
        const block = node?.children[0];
        if (block?.type !== "element" || block.tagName !== "code") return <pre>{children}</pre>;
        const classes = block.properties.className;
        const language = Array.isArray(classes) ? classes.find((value) => String(value).startsWith("language-")) : "";
        const code = block.children.map((child) => child.type === "text" ? child.value : "").join("").replace(/\n$/, "");
        const meta = block.data?.meta;
        return <ProductDocCodeSnippet code={code} language={String(language ?? "").slice(9)} meta={typeof meta === "string" ? meta : ""} />;
      },
      img: ({ alt, src, title }) => <ImageReference key={typeof src === "string" ? src : undefined} alt={alt} title={title}
        src={typeof src === "string" ? src : undefined} copy={copy} />,
    }}>
    {markdown}
  </ReactMarkdown></div>;
}
