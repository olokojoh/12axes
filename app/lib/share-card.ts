import { toCanvas } from "qrcode/lib/browser";
import type { Locale } from "../i18n";
import { shareCopy } from "../share-copy";

export type ShareResult = {
  topMatch: { name: string; compatibility: number };
  axes: { axisId: string; label: string; leftPole: string; rightPole: string; leftPercent: number; rightPercent: number }[];
};
export type ShareImageFormat = "portrait" | "landscape";

function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, weight = "400") {
  let fontSize = size;
  do { ctx.font = `${weight} ${fontSize}px sans-serif`; fontSize--; }
  while (ctx.measureText(text).width > width && fontSize >= size * .65);
  ctx.fillText(text, x, y, width);
}

export async function generateShareCard(result: ShareResult, locale: Locale, publicUrl: string, format: ShareImageFormat): Promise<Blob> {
  await document.fonts.ready;
  const portrait = format === "portrait", width = portrait ? 1080 : 1200, height = portrait ? 1920 : 630;
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const text = shareCopy[locale], pad = portrait ? 72 : 48;
  ctx.fillStyle = "#f3f8f4"; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#148344"; ctx.fillRect(0, 0, width, 12);
  ctx.fillStyle = "#153c2b";
  fitText(ctx, "12Axes", pad, portrait ? 120 : 72, 300, portrait ? 56 : 36, "700");
  ctx.fillStyle = "#496356";
  fitText(ctx, text.match, pad, portrait ? 192 : 115, portrait ? 936 : 890, portrait ? 30 : 22);
  ctx.fillStyle = "#123d28";
  fitText(ctx, result.topMatch.name, pad, portrait ? 266 : 162, portrait ? 936 : 880, portrait ? 58 : 38, "700");
  ctx.fillStyle = "#187947";
  fitText(ctx, `${result.topMatch.compatibility}% · ${text.matchScore}`, pad, portrait ? 322 : 195, portrait ? 936 : 870, portrait ? 32 : 22);

  result.axes.forEach((axis, index) => {
    const column = portrait ? 0 : Math.floor(index / 6), row = portrait ? index : index % 6;
    const x = portrait ? pad : pad + column * 564, y = portrait ? 390 + row * 96 : 244 + row * 56;
    const barWidth = portrait ? 936 : 516;
    ctx.fillStyle = "#153c2b";
    fitText(ctx, axis.label, x, y, barWidth, portrait ? 31 : 20, "700");
    const valuesY = y + (portrait ? 33 : 22);
    ctx.fillStyle = "#385b49";
    fitText(ctx, `${axis.leftPole} ${Math.round(axis.leftPercent)}%`, x, valuesY, barWidth * .49, portrait ? 25 : 17);
    ctx.textAlign = "right";
    fitText(ctx, `${Math.round(axis.rightPercent)}% ${axis.rightPole}`, x + barWidth, valuesY, barWidth * .49, portrait ? 25 : 17);
    ctx.textAlign = "left";
    const barY = valuesY + (portrait ? 14 : 6), barHeight = portrait ? 15 : 6;
    ctx.fillStyle = "#c8d7e2"; ctx.fillRect(x, barY, barWidth, barHeight);
    ctx.fillStyle = "#188549"; ctx.fillRect(x, barY, barWidth * axis.leftPercent / 100, barHeight);
  });

  const qrSize = portrait ? 210 : 122, qrX = portrait ? width - pad - qrSize : width - pad - qrSize, qrY = portrait ? 1590 : 44;
  const qr = document.createElement("canvas");
  await toCanvas(qr, publicUrl, { width: qrSize, margin: 2, errorCorrectionLevel: "M", color: { dark: "#153c2b", light: "#ffffff" } });
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);
  ctx.fillStyle = "#153c2b";
  if (portrait) {
    fitText(ctx, text.invite, pad, 1634, 660, 37, "700");
    fitText(ctx, text.scan, pad, 1690, 660, 27);
    fitText(ctx, new URL(publicUrl).host, pad, 1744, 660, 28);
    ctx.fillStyle = "#496356"; fitText(ctx, text.disclaimer, pad, 1850, 936, 25);
  } else {
    fitText(ctx, text.invite, pad, 588, 620, 24, "700");
    ctx.textAlign = "right"; fitText(ctx, new URL(publicUrl).host, width - pad, 588, 400, 22); ctx.textAlign = "left";
    ctx.fillStyle = "#496356"; fitText(ctx, text.disclaimer, pad, 613, 1104, 16);
  }
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png"));
}
