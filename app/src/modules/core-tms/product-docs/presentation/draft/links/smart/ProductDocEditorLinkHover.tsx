"use client";

import { editorRootElementRef$, rootEditor$ } from "@mdxeditor/editor";
import { useCellValues } from "@mdxeditor/gurx";
import { useEffect, useId, useLayoutEffect } from "react";
import { useProductDocLinkHover } from "../../../../state/links/hover/useProductDocLinkHover";
import { useProductDocLinkPreview } from "../../../../state/links/useProductDocLinkPreview";
import { ProductDocLinkHoverCard } from "../../../article/links/preview/ProductDocLinkHoverCard";
import styles from "../../../article/links/smart-link.module.css";

function editableLink(target: EventTarget | null) {
  const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
  return link?.closest("[contenteditable]")?.getAttribute("contenteditable") === "true" ? link : null;
}

function markEditorLinks(element: Element) {
  if (element instanceof HTMLAnchorElement) element.toggleAttribute("data-doc-editor-link", Boolean(editableLink(element)));
  else for (const link of element.querySelectorAll("a[href]")) link.toggleAttribute("data-doc-editor-link", Boolean(editableLink(link)));
}

export function ProductDocEditorLinkHover({ blocked }: { blocked: boolean }) {
  const [editor, popup] = useCellValues(rootEditor$, editorRootElementRef$);
  const { anchor, trigger, close, hide, show, retain } = useProductDocLinkHover();
  const href = blocked ? undefined : anchor?.getAttribute("href") ?? undefined;
  const { target, preview, previewPending, workspace } = useProductDocLinkPreview(href);
  const id = useId();

  useEffect(() => {
    if (!editor) return;
    let changes: MutationObserver | undefined;
    const unregister = editor.registerRootListener((root, previous) => {
      changes?.disconnect();
      previous?.classList.remove(styles.editorScope);
      if (!root) return;
      root.classList.add(styles.editorScope);
      markEditorLinks(root);
      changes = new MutationObserver(records => {
        for (const record of records) {
          if (record.type === "attributes" && record.target instanceof HTMLAnchorElement) {
            record.target.removeAttribute("data-link-status");
            markEditorLinks(record.target);
            if (trigger.current === record.target) close();
          }
          for (const node of record.addedNodes) if (node instanceof Element) markEditorLinks(node);
        }
      });
      changes.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });
    });
    return () => { changes?.disconnect(); unregister(); };
  }, [close, editor, trigger]);

  useEffect(() => {
    close();
    if (!editor || blocked) return;
    let events: AbortController | undefined;
    const register = editor.registerRootListener((root) => {
      events?.abort();
      if (!root) return;
      events = new AbortController();
      const options = { signal: events.signal };
      root.addEventListener("pointerover", (event) => {
        const link = editableLink(event.target);
        if (event.pointerType !== "touch" && link && link !== editableLink(event.relatedTarget)) show(link);
      }, options);
      root.addEventListener("pointerout", (event) => {
        const link = editableLink(event.target);
        if (link && link !== editableLink(event.relatedTarget)) hide(link);
      }, options);
      root.addEventListener("focusin", (event) => {
        const link = editableLink(event.target);
        if (link?.matches(":focus-visible")) show(link, 0);
      }, options);
      root.addEventListener("focusout", (event) => {
        const link = editableLink(event.target);
        if (link && link !== editableLink(event.relatedTarget)) hide(link);
      }, options);
    });
    const unregisterUpdates = editor.registerUpdateListener(() => {
      if (trigger.current && !trigger.current.isConnected) close();
    });
    return () => {
      events?.abort();
      register();
      unregisterUpdates();
    };
  }, [blocked, close, editor, hide, show, trigger]);

  useLayoutEffect(() => {
    if (!anchor || !href) return;
    const previous = anchor.getAttribute("aria-describedby");
    anchor.setAttribute("aria-describedby", previous ? previous + " " + id : id);
    return () => {
      if (previous) anchor.setAttribute("aria-describedby", previous);
      else anchor.removeAttribute("aria-describedby");
    };
  }, [anchor, href, id]);
  useLayoutEffect(() => {
    if (anchor && preview?.status) anchor.dataset.linkStatus = preview.status;
  }, [anchor, preview?.status]);

  return anchor && href ? <ProductDocLinkHoverCard key={href} anchor={anchor} trigger={trigger} id={id} href={href} authoredText={anchor.textContent ?? undefined}
    hint={anchor.getAttribute("title") ?? undefined}
    target={target} preview={preview} previewPending={previewPending} workspaceId={workspace?.scope.workspaceId} portalContainer={popup?.current ?? undefined}
    onPointerEnter={retain} onPointerLeave={() => hide()} onClose={close} /> : null;
}
