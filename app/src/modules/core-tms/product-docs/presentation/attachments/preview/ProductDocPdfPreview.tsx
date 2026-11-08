"use client";

import { Button, Spinner } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import { loadProductDocPdf, renderProductDocPdfPage } from "./rendering/productDocPdf";
import "./attachment-print.css";
import styles from "./attachment-preview.module.css";

export function ProductDocPdfPreview({ url, filename, ru, expanded, onDocument }: {
  url: string; filename: string; ru: boolean; expanded?: boolean; onDocument?(pdf: PDFDocumentProxy | null): void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<{ url: string; pdf: PDFDocumentProxy } | null>(null);
  const [number, setNumber] = useState(1);
  const [failure, setFailure] = useState<string>();
  const [ready, setReady] = useState(0);
  const pdf = source?.url === url ? source.pdf : null;
  useEffect(() => {
    const request = new AbortController();
    onDocument?.(null);
    void loadProductDocPdf(url, request.signal).then((loaded) => {
      if (request.signal.aborted) return;
      setSource({ url, pdf: loaded });
      onDocument?.(loaded);
    }, () => { if (!request.signal.aborted) setFailure(url); });
    return () => { request.abort(); onDocument?.(null); };
  }, [url, onDocument]);
  useEffect(() => {
    const surface = paper.current;
    if (!pdf || !surface) return;
    let request: AbortController | undefined;
    let lastWidth = 0;
    function render() {
      if (!surface || !pdf) return;
      const width = Math.floor(surface.clientWidth);
      if (!width || width === lastWidth) return;
      lastWidth = width;
      request?.abort();
      const active = new AbortController();
      request = active;
      // Each render uses a new canvas, allowing the previous page to stay visible while resizing.
      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      void renderProductDocPdfPage(pdf, number, canvas, width * Math.min(window.devicePixelRatio || 1, 2), active.signal)
        .then(() => {
          if (active.signal.aborted) return;
          surface.replaceChildren(canvas);
          setReady(number);
        }, () => { if (!active.signal.aborted) setFailure(url); });
    }
    render();
    const observer = new ResizeObserver(render);
    observer.observe(surface);
    return () => { observer.disconnect(); request?.abort(); };
  }, [number, pdf, url]);

  if (failure === url) return <p role="status" className={styles.unavailable}>
    {ru ? "Не удалось показать PDF. Скачайте файл, чтобы открыть его." : "PDF preview unavailable. Download the file to open it."}
  </p>;
  const pageLabel = ru ? `Страница ${number} из ${pdf?.numPages ?? "…"}` : `Page ${number} of ${pdf?.numPages ?? "…"}`;
  const changePage = (delta: number) => { setNumber(number + delta); viewport.current?.scrollTo(0, 0); };
  return <div className={styles.pdf} data-expanded={expanded || undefined}>
    <div className={styles.pdfViewport} ref={viewport} aria-busy={ready !== number || undefined}>
      <div className={styles.paper} ref={paper} role="img" aria-label={`${filename}, ${pageLabel}`} />
      {ready !== number && <span className={styles.pdfLoading} role="status"><Spinner size="sm" aria-label={ru ? "Загрузка страницы" : "Loading page"} /></span>}
    </div>
    {pdf && pdf.numPages > 1 && <div className={styles.pager}>
      <Button size="sm" isIconOnly variant="light" isDisabled={number === 1} onPress={() => changePage(-1)}
        aria-label={ru ? "Предыдущая страница" : "Previous page"}><ChevronLeft size={16} /></Button>
      <span aria-live="polite">{pageLabel}</span>
      <Button size="sm" isIconOnly variant="light" isDisabled={number === pdf.numPages} onPress={() => changePage(1)}
        aria-label={ru ? "Следующая страница" : "Next page"}><ChevronRight size={16} /></Button>
    </div>}
  </div>;
}
