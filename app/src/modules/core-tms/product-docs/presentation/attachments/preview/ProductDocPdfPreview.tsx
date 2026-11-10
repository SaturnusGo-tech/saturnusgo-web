"use client";

import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import { loadProductDocPdf, renderProductDocPdfPage } from "./rendering/productDocPdf";
import "./attachment-print.css";
import styles from "./attachment-preview.module.css";

type PdfSource = { url: string; blob?: never } | { url?: never; blob: Blob };

export function ProductDocPdfPreview({ url, blob, filename, ru, expanded, onDocument }: PdfSource & {
  filename: string; ru: boolean; expanded?: boolean; onDocument?(pdf: PDFDocumentProxy | null): void;
}) {
  const input = blob ?? url;
  const viewport = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<{ input: string | Blob; pdf: PDFDocumentProxy } | null>(null);
  const [number, setNumber] = useState(1);
  const [failure, setFailure] = useState<string | Blob>();
  const [ready, setReady] = useState(0);
  const pdf = source?.input === input ? source.pdf : null;
  useEffect(() => {
    const request = new AbortController();
    onDocument?.(null);
    void loadProductDocPdf(input, request.signal).then((loaded) => {
      if (request.signal.aborted) return;
      setSource({ input, pdf: loaded });
      onDocument?.(loaded);
    }, () => { if (!request.signal.aborted) setFailure(input); });
    return () => { request.abort(); onDocument?.(null); };
  }, [input, onDocument]);
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
        }, () => { if (!active.signal.aborted) setFailure(input); });
    }
    render();
    const observer = new ResizeObserver(render);
    observer.observe(surface);
    return () => { observer.disconnect(); request?.abort(); };
  }, [number, pdf, input]);

  if (failure === input) return <p role="status" className={styles.unavailable}>
    {ru ? "Не удалось показать PDF. Скачайте файл, чтобы открыть его." : "PDF preview unavailable. Download the file to open it."}
  </p>;
  const pageLabel = ru ? `Страница ${number} из ${pdf?.numPages ?? "…"}` : `Page ${number} of ${pdf?.numPages ?? "…"}`;
  const changePage = (delta: number) => { setNumber(number + delta); viewport.current?.scrollTo(0, 0); };
  return <div className={styles.pdf} data-expanded={expanded || undefined}>
    <div className={styles.pdfViewport} ref={viewport} aria-busy={ready !== number || undefined}>
      <div className={styles.paper} ref={paper} role="img" aria-label={`${filename}, ${pageLabel}`} />
      {ready !== number && <span className={styles.pdfLoading} role="status" aria-label={ru ? "Загрузка страницы" : "Loading page"}><LoadingOrb size="md" /></span>}
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
