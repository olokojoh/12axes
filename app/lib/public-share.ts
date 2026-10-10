import { Buffer } from "node:buffer";
import { copy, htmlLang, localePath, type Locale } from "../i18n";
import { matchResult } from "./matching";
import { runtimeEnv } from "./runtime-env";
import { decryptPayload } from "./secure-payload";
import { privateHeaders } from "./billing-input";

export const shareIdPattern = /^[A-Za-z0-9_-]{43}$/;
export const shareCopy: Record<Locale, { shared: string; view: string; take: string; match: string; axisSummary: string }> = {
  en: { shared: "Shared 12Axes result", view: "Explore this result", take: "Take the free test", match: "profile similarity", axisSummary: "Twelve-axis overview" },
  pt: { shared: "Resultado 12Axes compartilhado", view: "Explorar este resultado", take: "Fazer o teste grátis", match: "semelhança com o perfil", axisSummary: "Visão geral dos 12 eixos" },
  es: { shared: "Resultado 12Axes compartido", view: "Explorar este resultado", take: "Hacer el test gratis", match: "similitud con el perfil", axisSummary: "Resumen de los 12 ejes" },
  ru: { shared: "Опубликованный результат 12Axes", view: "Посмотреть результат", take: "Пройти бесплатный тест", match: "сходство с профилем", axisSummary: "Обзор 12 осей" },
  zh: { shared: "公开分享的 12Axes 结果", view: "查看这份结果", take: "免费测试我的观点", match: "画像相似度", axisSummary: "12 轴概览" },
};

type ShareRow = { payload: string; locale: Locale; expires_at: number; base_url: string | null; image_payload: string | null; image_bytes: number | null };

export function shareUrls(base: string, locale: Locale, id: string) {
  return { url: new URL(localePath(locale, "/share/" + id), base).href, imageUrl: new URL("/api/share/" + id + "/image.png", base).href };
}

export async function readPublicShare(id: string) {
  if (!shareIdPattern.test(id) || !runtimeEnv.DB || !runtimeEnv.REPORT_ENCRYPTION_KEY) return null;
  return runtimeEnv.DB.prepare("SELECT s.payload, s.locale, s.expires_at, c.base_url, c.image_payload, c.image_bytes FROM shared_results s LEFT JOIN share_cards c ON c.share_id = s.id WHERE s.id = ? AND s.expires_at > ?")
    .bind(id, Math.floor(Date.now() / 1000)).first<ShareRow>();
}

export function escapeShareHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));
}

export async function publicSharePage(id: string, locale: Locale, head = false) {
  const row = await readPublicShare(id);
  if (!row || row.locale !== locale || !row.base_url) return new Response("Not found", { status: 404, headers: privateHeaders });
  const decoded = await decryptPayload<{ axes: number[] }>(row.payload, runtimeEnv.REPORT_ENCRYPTION_KEY!);
  const result = matchResult(decoded.axes, locale);
  const words = shareCopy[locale], text = copy[locale];
  const urls = shareUrls(row.base_url, locale, id);
  const title = `${result.topMatch.name} · 12Axes`;
  const description = `${text.topMatch}: ${result.topMatch.name}. ${result.topMatch.compatibility}% ${words.match}. ${text.footer}`;
  const esc = escapeShareHtml;
  const imageMeta = row.image_payload ? `<meta property="og:image" content="${esc(urls.imageUrl)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(description)}"><meta name="twitter:image" content="${esc(urls.imageUrl)}"><meta name="twitter:image:alt" content="${esc(description)}">` : "";
  const resultUrl = new URL(localePath(locale, "/results") + "?share=" + id, row.base_url).href;
  const html = `<!doctype html><html lang="${htmlLang[locale]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="noindex,follow,noarchive"><link rel="canonical" href="${esc(urls.url)}"><meta property="og:type" content="website"><meta property="og:url" content="${esc(urls.url)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta name="twitter:card" content="${row.image_payload ? "summary_large_image" : "summary"}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">${imageMeta}<style>body{margin:0;background:#f5f7fc;color:#142135;font:16px/1.6 system-ui,sans-serif}main{max-width:880px;margin:auto;padding:32px 20px}header,section{background:white;border:1px solid #dce4ed;border-radius:18px;padding:24px;margin:20px 0}h1{font-size:clamp(24px,5vw,38px);line-height:1.25}h2{font-size:22px}p{overflow-wrap:anywhere}a{color:#087a3b}nav{display:flex;gap:12px;flex-wrap:wrap}nav a{background:#087a3b;color:white;text-decoration:none;padding:12px 18px;border-radius:12px}img{width:100%;height:auto;border-radius:12px}li{padding:8px 0}small{color:#516477}</style></head><body><main><a href="${esc(new URL(localePath(locale), row.base_url).href)}">12Axes</a><header><p>${esc(words.shared)}</p><h1>${esc(result.topMatch.name)}</h1><p>${esc(text.topMatch)} · ${result.topMatch.compatibility}% ${esc(words.match)}</p><p>${esc(result.topMatch.description)}</p><nav><a href="${esc(resultUrl)}">${esc(words.view)}</a><a href="${esc(new URL(localePath(locale), row.base_url).href)}">${esc(words.take)}</a></nav></header>${row.image_payload ? `<img src="${esc(urls.imageUrl)}" width="1200" height="630" alt="${esc(description)}">` : ""}<section><h2>${esc(words.axisSummary)}</h2><ul>${result.axes.map(axis => `<li><strong>${esc(axis.label)}</strong>: ${esc(axis.leftPole)} ${axis.leftPercent}% · ${esc(axis.rightPole)} ${axis.rightPercent}%</li>`).join("")}</ul></section><small>${esc(text.footer)}</small></main></body></html>`;
  return new Response(head ? null : html, { headers: { ...privateHeaders, "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, noarchive", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" } });
}

export async function publicShareImage(id: string, head = false) {
  const row = await readPublicShare(id);
  if (!row?.image_payload) return new Response("Not found", { status: 404, headers: privateHeaders });
  const decoded = await decryptPayload<{ png: string }>(row.image_payload, runtimeEnv.REPORT_ENCRYPTION_KEY!);
  const bytes = Buffer.from(decoded.png, "base64");
  return new Response(head ? null : bytes, { headers: {
    "content-type": "image/png", "content-length": String(bytes.length), "content-disposition": 'inline; filename="12axes-share.png"',
    "cache-control": "no-store",
    "x-content-type-options": "nosniff", "x-robots-tag": "noindex, noarchive", "referrer-policy": "no-referrer",
  } });
}
