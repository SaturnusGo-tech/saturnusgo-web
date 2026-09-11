export async function supportScreenshot(): Promise<File> {
  const { default: render } = await import("html2canvas-pro");
  const canvas = await render(document.body, {
    x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight,
    windowWidth: window.innerWidth, windowHeight: window.innerHeight,
    scale: Math.min(1.5, window.devicePixelRatio), useCORS: true, allowTaint: false, logging: false, imageTimeout: 5000,
    ignoreElements: element => element.hasAttribute("data-support-overlay") || element.hasAttribute("data-private"),
    onclone: doc => {
      doc.querySelectorAll<HTMLInputElement>('input[type="password"],input[autocomplete="one-time-code"]').forEach(input => { input.value=""; });
      // Credentials and the feedback editor are never part of the captured viewport.
      doc.querySelectorAll('[data-support-overlay],[data-private]').forEach(node=>node.remove());
    },
  });
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("CAPTURE_FAILED")),"image/png"));
  canvas.width=canvas.height=0;
  if(blob.size>10*1024*1024) throw new Error("CAPTURE_TOO_LARGE");
  return new File([blob],`Falcon-screen-${new Date().toISOString().replace(/[:.]/g,"-")}.png`,{type:"image/png"});
}
