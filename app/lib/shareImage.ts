// Native-canvas PNG of the private snapshot — same process as the
// CrossHeartPray / iDontCry share cards: no APIs, nothing auto-sent,
// no content in any URL. The image downloads to the device; sharing
// it (or not) stays the person's call.

import type { Reflection } from "./types";
import { MODE_LABEL } from "./types";

export type SnapshotImageSize = "square" | "portrait";

const SIZES: Record<SnapshotImageSize, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
};

// Fixed brand-dark card regardless of the on-screen theme.
const BG = "#0b1220";
const BORDER = "#26324c";
const TEXT = "#e8edf5";
const MUTED = "#94a3b8";
const BRAND = "#E879F9";

const sans = "Arial, Helvetica, sans-serif";

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Largest font (within bounds) that fits the text block into maxHeight.
function fitBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  weight: number,
  maxFont: number,
  minFont: number,
) {
  for (let size = maxFont; size >= minFont; size -= 2) {
    ctx.font = `${weight} ${size}px ${sans}`;
    const lineHeight = size * 1.4;
    const lines = wrapLines(ctx, text, maxWidth);
    if (lines.length * lineHeight <= maxHeight) return { size, lineHeight, lines };
  }
  ctx.font = `${weight} ${minFont}px ${sans}`;
  return { size: minFont, lineHeight: minFont * 1.4, lines: wrapLines(ctx, text, maxWidth) };
}

// Same content the text snapshot uses: first insight + next step.
function snapshotParts(r: Reflection) {
  const first = r.sections[0];
  const firstLine = first?.paragraphs?.[0] ?? first?.bullets?.[0] ?? "";
  const step = r.sections.find((s) => /next step|experiment/i.test(s.heading));
  const stepLine = step?.paragraphs?.[0] ?? step?.bullets?.[0] ?? "";
  return { firstLine, stepLine };
}

export function renderSnapshotImage(
  canvas: HTMLCanvasElement,
  r: Reflection,
  size: SnapshotImageSize,
) {
  const { w, h } = SIZES[size];
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // Rounded inner frame.
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 4;
  const m = 44;
  const rr = 56;
  ctx.beginPath();
  ctx.moveTo(m + rr, m);
  ctx.arcTo(w - m, m, w - m, h - m, rr);
  ctx.arcTo(w - m, h - m, m, h - m, rr);
  ctx.arcTo(m, h - m, m, m, rr);
  ctx.arcTo(m, m, w - m, m, rr);
  ctx.closePath();
  ctx.stroke();

  const padX = 108;
  const contentWidth = w - padX * 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = w / 2;
  const topY = size === "portrait" ? 180 : 150;

  // Eyebrow: mode + date.
  const date = new Date(r.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.font = `900 30px ${sans}`;
  ctx.fillStyle = BRAND;
  ctx.fillText(`${MODE_LABEL[r.mode].toUpperCase()} — ${date.toUpperCase()}`, cx, topY);

  // Title.
  const title = fitBlock(ctx, r.title, contentWidth, 240, 900, 60, 40);
  ctx.fillStyle = TEXT;
  ctx.font = `900 ${title.size}px ${sans}`;
  let y = topY + 90;
  for (const line of title.lines) {
    ctx.fillText(line, cx, y);
    y += title.lineHeight;
  }

  // Body: first insight, then the next step.
  const { firstLine, stepLine } = snapshotParts(r);
  const bodyTop = y + 40;
  const bodyMaxHeight = h - bodyTop - 280;
  const stepText = stepLine ? `Next: ${stepLine}` : "";
  const stepBudget = stepText ? bodyMaxHeight * 0.35 : 0;

  if (firstLine) {
    const body = fitBlock(ctx, firstLine, contentWidth, bodyMaxHeight - stepBudget, 700, 44, 28);
    ctx.fillStyle = TEXT;
    ctx.font = `700 ${body.size}px ${sans}`;
    let by = bodyTop + body.lineHeight / 2;
    for (const line of body.lines) {
      ctx.fillText(line, cx, by);
      by += body.lineHeight;
    }
    y = by;
  }

  if (stepText) {
    const step = fitBlock(ctx, stepText, contentWidth, stepBudget, 700, 36, 26);
    ctx.fillStyle = MUTED;
    ctx.font = `700 ${step.size}px ${sans}`;
    let sy = y + 36 + step.lineHeight / 2;
    for (const line of step.lines) {
      ctx.fillText(line, cx, sy);
      sy += step.lineHeight;
    }
  }

  // Footer.
  ctx.font = `600 28px ${sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("From a private reflection.", cx, h - 158);
  ctx.font = `900 30px ${sans}`;
  ctx.fillStyle = BRAND;
  ctx.fillText("WHATAMIAI.COM", cx, h - 92);
}

export function downloadSnapshotImage(r: Reflection, size: SnapshotImageSize) {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  renderSnapshotImage(canvas, r, size);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "reflection"}-${
      size === "portrait" ? "1080x1350" : "1080x1080"
    }.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}
