import { MODE_FRAMES, paintFrame, resolvePreset } from "thinking-orbs/engine";

const artboard = 224;
const center = artboard / 2;
const markCenter = 65.5;
const markScale = 1.5;
const cycleSeconds = 6.5;
const settledPhase = 3.15;

const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

function smooth(value: number) {
  const progress = Math.max(0, Math.min(1, value));
  return progress * progress * (3 - 2 * progress);
}

type Artwork = { source: string; contours: SVGPathElement[] };
let artwork: Promise<Artwork> | undefined;

function loadArtwork(url: string) {
  artwork ??= fetch(url).then(async response => {
    if (!response.ok) throw new Error("Falcon mark could not load");
    const svg = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
    const source = svg.querySelector("path")?.getAttribute("d");
    if (!source) throw new Error("Falcon mark path is missing");
    const contours = source.trim().split(/(?=M)/).map(segment => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", segment.trim());
      return path;
    });
    return { source, contours };
  }).catch(error => {
    artwork = undefined;
    throw error;
  });
  return artwork;
}

function sampleContours(contours: SVGPathElement[], count: number) {
  const lengths = contours.map(contour => contour.getTotalLength());
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let allocated = 0;
  let cumulative = 0;
  return contours.flatMap((contour, index) => {
    const length = lengths[index];
    cumulative += length;
    const nextAllocation = Math.round(count * cumulative / total);
    const samples = nextAllocation - allocated;
    allocated = nextAllocation;
    return Array.from({ length: samples }, (_, i) => {
      const point = contour.getPointAtLength(length * i / Math.max(1, samples - 1));
      return { x: center + (point.x - markCenter) * markScale, y: center + (point.y - markCenter) * markScale };
    });
  });
}

export async function createFalconAssembly(canvas: HTMLCanvasElement, url: string) {
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext || typeof Path2D === "undefined") return null;
  const context = canvasContext;
  const { source, contours } = await loadArtwork(url);
  const fill = new Path2D(source);
  const miniature = canvas.clientWidth <= 48;
  const size = miniature ? 32 : 64;
  const zoom = miniature ? 5 : 2.7;
  const preset = resolvePreset("solving", size);
  const orb = (elapsed: number) => MODE_FRAMES[preset.mode](size, elapsed * preset.speed, preset.opts);
  const still = orb(1.5).dots.map(dot => ({
    ...dot, x: center + (dot.x - size / 2) * zoom, y: center + (dot.y - size / 2) * zoom, r: dot.r * zoom,
  }));
  const available = sampleContours(contours, still.length);
  // Fix the matching once so engine depth sorting cannot shuffle the silhouette mid-morph.
  const matched = still.map(dot => {
    let target = 0;
    let distance = Infinity;
    available.forEach((point, index) => {
      const next = (point.x - dot.x) ** 2 + (point.y - dot.y) ** 2;
      if (next < distance) {
        target = index;
        distance = next;
      }
    });
    return { dot, point: available.splice(target, 1)[0] };
  });

  let resolution = 0;
  let dark = true;
  let ink = "";
  function resize() {
    resolution = Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2));
    if (canvas.width !== resolution) canvas.width = resolution;
    if (canvas.height !== resolution) canvas.height = resolution;
  }
  function readTheme() {
    const theme = getComputedStyle(canvas);
    ink = theme.color;
    const channels = ink.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    dark = channels
      ? 0.2126 * Number(channels[1]) + 0.7152 * Number(channels[2]) + 0.0722 * Number(channels[3]) > 128
      : theme.colorScheme !== "light";
  }
  function draw(elapsed: number, intro: boolean) {
    if (!resolution) return;
    const phase = (intro ? 1.4 + elapsed * 1.28 : settledPhase + elapsed) % cycleSeconds;
    const morph = smooth((phase - 1.5) / 1.05) * (1 - smooth((phase - 4) / 1));
    context.setTransform(resolution / artboard, 0, 0, resolution / artboard, 0, 0);
    context.clearRect(0, 0, artboard, artboard);
    context.save();
    if (!morph) {
      const travel = phase < 1.5 ? (1.5 - phase) / 1.5 : (phase - 5) / 1.5;
      context.translate(center - size * zoom / 2, center - size * zoom / 2);
      context.scale(zoom, zoom);
      paintFrame(context, orb(1.5 + smooth(travel) * .9), dark);
    } else {
      const settle = smooth((phase - 2.35) / .58) * (1 - smooth((phase - 3.72) / .49));
      if (settle < 1) {
        const dots = matched.map(({ dot, point }, i) => {
          const flicker = .5 + .5 * Math.sin(phase * 3.2 - point.x * .034 - point.y * .026);
          const bow = Math.sin(morph * Math.PI) * ((i % 9) - 4) * (miniature ? 1 : 2.1);
          return {
            x: mix(dot.x, point.x, morph) + bow,
            y: mix(dot.y, point.y, morph) - bow * .62,
            z: dot.z,
            r: mix(dot.r, miniature ? 2.9 + flicker * .8 : 1.58 + flicker * .51, morph),
            white: mix(dot.white, .25 - .19 * flicker, morph),
            a: mix(dot.a ?? 1, .68 + .30 * flicker, morph) * (1 - settle),
          };
        });
        paintFrame(context, { dots, lines: [] }, dark);
      }
      if (settle > 0) {
        context.translate(center - markCenter * markScale, center - markCenter * markScale);
        context.scale(markScale, markScale);
        context.fillStyle = ink;
        context.globalAlpha = settle;
        context.fill(fill, "evenodd");
      }
    }
    context.restore();
  }
  return { resize, readTheme, draw, cycleSeconds };
}
