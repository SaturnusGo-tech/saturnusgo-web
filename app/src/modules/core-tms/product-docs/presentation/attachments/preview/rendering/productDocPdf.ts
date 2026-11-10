import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export async function loadProductDocPdf(source: string | Blob, signal: AbortSignal) {
  const pdf = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const input = typeof source === "string" ? { url: source } : { data: new Uint8Array(await source.arrayBuffer()) };
  signal.throwIfAborted();
  let worker: Worker | undefined;
  try {
    // Next emits a dedicated same-origin worker. The local preview falls back to PDF.js's own fake worker.
    worker = new Worker(new URL("./productDocPdfWorker.ts", import.meta.url), { type: "module" });
  } catch {
    // @ts-expect-error The worker entry is distributed without TypeScript declarations.
    await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  }
  const sharedWorker = worker && pdf.PDFWorker.create({ port: worker });
  const task = pdf.getDocument({ ...input, worker: sharedWorker, enableXfa: false, useWasm: false,
    maxImageSize: 16_000_000, canvasMaxAreaInBytes: 32 * 1024 * 1024 });
  const destroy = () => {
    void task.destroy().finally(() => { sharedWorker?.destroy(); worker?.terminate(); }).catch(() => undefined);
  };
  signal.addEventListener("abort", destroy, { once: true });
  if (signal.aborted) destroy();
  try { return await task.promise; }
  catch (error) {
    if (!signal.aborted) destroy();
    throw error;
  }
}

export async function renderProductDocPdfPage(pdf: PDFDocumentProxy, pageNumber: number, canvas: HTMLCanvasElement,
  width: number, signal: AbortSignal) {
  const page = await pdf.getPage(pageNumber);
  signal.throwIfAborted();
  const natural = page.getViewport({ scale: 1 });
  const scale = Math.min(width / natural.width, 2700 / natural.height, 3);
  const viewport = page.getViewport({ scale });
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const render: RenderTask = page.render({ canvas, viewport });
  const abort = () => render.cancel();
  signal.addEventListener("abort", abort, { once: true });
  try { await render.promise; }
  finally { signal.removeEventListener("abort", abort); }
}

export async function printProductDocPdf(pdf: PDFDocumentProxy, signal: AbortSignal) {
  if (pdf.numPages > 200) throw new Error("PDF too long for in-app printing");
  const sheet = document.createElement("div");
  sheet.dataset.falconPdfPrint = "";
  let encodedSize = 0;
  for (let page = 1; page <= pdf.numPages; page++) {
    const canvas = document.createElement("canvas");
    await renderProductDocPdfPage(pdf, page, canvas, 1000, signal);
    // Keep bounded encoded pages, freeing each decoded surface before rendering the next.
    const image = document.createElement("img");
    image.src = canvas.toDataURL("image/png");
    canvas.width = canvas.height = 1;
    encodedSize += image.src.length;
    if (encodedSize > 64 * 1024 * 1024) throw new Error("PDF exceeds the in-app print size limit");
    sheet.appendChild(image);
    await image.decode();
  }
  signal.throwIfAborted();
  document.body.appendChild(sheet);
  document.body.dataset.falconPdfPrinting = "";
  const cleanup = () => {
    window.clearTimeout(fallback);
    signal.removeEventListener("abort", cleanup);
    window.removeEventListener("afterprint", cleanup);
    delete document.body.dataset.falconPdfPrinting;
    sheet.remove();
  };
  const fallback = window.setTimeout(cleanup, 60_000);
  signal.addEventListener("abort", cleanup, { once: true });
  window.addEventListener("afterprint", cleanup, { once: true });
  try { window.print(); }
  catch (error) { cleanup(); throw error; }
}
