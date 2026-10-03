"use client";
import { useState } from "react";
import type { Locale } from "./i18n";

const copy = {
  en: ["Private support request", "Email", "Order reference (optional)", "Message — do not include answers or card numbers", "Submit request", "Request received. Keep this reference:", "Request could not be sent. Please try again."],
  pt: ["Pedido privado de suporte", "Email", "Referência do pedido (opcional)", "Mensagem — não inclua respostas ou cartão", "Enviar pedido", "Pedido recebido. Guarde esta referência:", "Falha no envio. Tente novamente."],
  es: ["Solicitud privada de ayuda", "Email", "Referencia del pedido (opcional)", "Mensaje — sin respuestas ni tarjeta", "Enviar solicitud", "Solicitud recibida. Guarda esta referencia:", "No se pudo enviar. Inténtalo de nuevo."],
  ru: ["Приватное обращение", "Email", "Номер заказа (необязательно)", "Сообщение — без ответов и номера карты", "Отправить", "Запрос получен. Сохраните номер:", "Не удалось отправить. Повторите попытку."],
  zh: ["私人支持请求", "邮箱", "订单编号（可选）", "问题描述，请勿包含答案或卡号", "提交请求", "已收到，请保存请求编号：", "提交失败，请重试。"],
};
export function SupportForm({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  return <section className="report-recovery"><h2>{text[0]}</h2><form onSubmit={async(event) => {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const payload = await response.json() as { id?: string };
      if (!response.ok || !payload.id) throw new Error();
      setStatus(text[5] + " " + payload.id); form.reset();
    } catch { setStatus(text[6]); } finally { setBusy(false); }
  }}><label>{text[1]}<input name="email" type="email" required maxLength={254} autoComplete="email" /></label><label>{text[2]}<input name="order" maxLength={120} /></label><label>{text[3]}<textarea name="message" required maxLength={2000} rows={5} /></label><button className="secondary-button" disabled={busy}>{busy ? "…" : text[4]}</button></form><p role="status">{status}</p></section>;
}
