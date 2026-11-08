"use client";

import type { Element } from "hast";
import type { Root } from "mdast";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import type { ProductDocsCopy } from "../../../localization/copy";
import { FalconCheckbox } from "../../../../presentation/common/checkbox/FalconCheckbox";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { remarkHighlights } from "../../../../presentation/cases/inspector/markdown/highlight/render/remarkHighlights";
import markerStyles from "../../../../presentation/cases/inspector/markdown/highlight/highlight.module.css";
import { readProductDocImageTitle } from "../../draft/media/codec/productDocImageReference";
import { useProductDocImage } from "../../draft/media/productDocImageSource";
import styles from "../../product-docs.module.css";
import { ProductDocDashboard } from "../../dashboard/card/ProductDocDashboard";
import { dashboardDirectiveName, markProductDocDashboard } from "../../dashboard/markdown/dashboardDirective";
import { ProductDocRunEvidence } from "../../run/card/ProductDocRunEvidence";
import { markProductDocRun, readRunEmbedPlacement, runDirectiveName } from "../../run/markdown/runDirective";
import { ProductDocAttachment } from "../../attachments/ProductDocAttachment";
import { markProductDocAttachment, productDocAttachmentName, readProductDocAttachment } from "../../../domain/attachments/productDocAttachment";
import { ProductDocSmartLink } from "../links/ProductDocSmartLink";
import tableStyles from "./article-table.module.css";
import { ProductDocRadioReader } from "../../draft/blocks/radio/ProductDocRadio";
import { productDocRadioName, readRadioOptions } from "../../draft/blocks/radio/radioOptions";
import { ProductDocCodeSnippet } from "../../draft/blocks/snippet/ProductDocCodeSnippet";
import { ProductDocCollapseReader } from "../../draft/blocks/collapse/ProductDocCollapse";
import { ProductDocStructuredBlockReader } from "../../draft/blocks/structured/reader/ProductDocStructuredBlockReader";
import { markProductDocCollapse, productDocCollapseName, structuredBlockKind } from "../../../domain/structured/structuredMarkdown";
import { ProductDocCallout, isProductDocCalloutTone } from "../../draft/blocks/callout/surface/ProductDocCallout";
import calloutStyles from "../../draft/blocks/callout/product-doc-callout.module.css";
import blockStyles from "../../draft/blocks/productDocBlocks.module.css";
import layoutStyles from "../../draft/layouts/layouts.module.css";
import { layoutColumnName, productDocColumnCount, productDocLayoutRatio } from "../../draft/layouts/productDocLayoutBlocks";

function renderDocumentBlocks() {
  return (tree: Root) => {
    function visit(node: Root["children"][number] | Root, insideLayout = false) {
      let layout = false;
      if (node.type === "leafDirective" && (markProductDocDashboard(node) || markProductDocRun(node) || markProductDocAttachment(node))) return;
      if (node.type === "containerDirective") {
        markProductDocCollapse(node);
        const mode = node.attributes?.mode;
        layout = !insideLayout && Boolean(productDocColumnCount(node));
        if (node.name === productDocRadioName) {
          const { options, selected } = readRadioOptions(node);
          node.data = { hName: productDocRadioName, hProperties: { options, choice: String(selected) } };
          return;
        }
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

function MarkdownDashboard({ snapshot }: { snapshot?: string }) {
  return <ProductDocDashboard snapshotId={snapshot ?? ""} />;
}
function MarkdownRun({ snapshot, width, align }: { snapshot?: string; width?: string | number; align?: string }) {
  return <ProductDocRunEvidence snapshotId={snapshot ?? ""} placement={readRunEmbedPlacement({ width, align })} />;
}
const embedRenderers = { [dashboardDirectiveName]: MarkdownDashboard, [runDirectiveName]: MarkdownRun,
  [productDocAttachmentName]: (props: { attachment?: string; width?: string | number }) =>
    <ProductDocAttachment {...readProductDocAttachment(props)} />,
  [productDocCollapseName]: ({ heading, children }: { heading?: string; children?: ReactNode }) =>
    <ProductDocCollapseReader heading={heading}>{children}</ProductDocCollapseReader>,
  [productDocRadioName]: ({ node }: { node?: Element }) => {
    const options = node?.properties.options;
    return <ProductDocRadioReader options={Array.isArray(options) ? options.map(String) : []}
      selected={Number(node?.properties.choice)} />;
  } };

export function ProductDocMarkdown({ markdown, copy }: { markdown: string; copy: ProductDocsCopy }) {
  const ru = useTmsLocale().locale === "ru";
  return <div className={`${layoutStyles.articleLayouts} ${markerStyles.surface} ${calloutStyles.prose}`}><ReactMarkdown skipHtml
    remarkPlugins={[remarkGfm, remarkDirective, [remarkHighlights, { preserveOtherDirectives: true }], renderDocumentBlocks]}
    components={{
      ...embedRenderers,
      blockquote: ({ children, node }) => {
        const tone = node?.properties["data-tone"];
        return isProductDocCalloutTone(tone)
          ? <ProductDocCallout tone={tone}>{children}</ProductDocCallout>
          : <blockquote>{children}</blockquote>;
      },
      a: ProductDocSmartLink,
      input: ({ type, checked }) => type === "checkbox"
        ? <span className={styles.taskControl}><FalconCheckbox isReadOnly isSelected={checked}
          aria-label={ru ? "Состояние задачи" : "Task status"} /></span>
        : null,
      table: ({ children }) => <div className={tableStyles.scroll}><table>{children}</table></div>,
      hr: () => <hr className={blockStyles.divider} />,
      pre: ({ node, children }) => {
        const block = node?.children[0];
        if (block?.type !== "element" || block.tagName !== "code") return <pre>{children}</pre>;
        const classes = block.properties.className;
        const language = Array.isArray(classes) ? classes.find((value) => String(value).startsWith("language-")) : "";
        const code = block.children.map((child) => child.type === "text" ? child.value : "").join("").replace(/\n$/, "");
        const languageName = String(language ?? "").slice(9);
        const kind = structuredBlockKind(languageName);
        if (kind) return <ProductDocStructuredBlockReader kind={kind} source={code} />;
        const meta = block.data?.meta;
        return <ProductDocCodeSnippet code={code} language={languageName} meta={typeof meta === "string" ? meta : ""} />;
      },
      img: ({ alt, src, title }) => <ImageReference key={typeof src === "string" ? src : undefined} alt={alt} title={title}
        src={typeof src === "string" ? src : undefined} copy={copy} />,
    }}>
    {markdown}
  </ReactMarkdown></div>;
}
