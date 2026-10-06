"use client";

import { useEffect, useState } from "react";
import { htmlLang, type Locale } from "./i18n";

const currencies = { en: "USD", pt: "BRL", es: "EUR", ru: "RUB", zh: "CNY" } as const;
const labels = {
  en: ["Approx.", "Exchange rate", "Charged in USD"],
  pt: ["Aprox.", "Câmbio", "Cobrança em USD"],
  es: ["Aprox.", "Tipo de cambio", "Cobro en USD"],
  ru: ["Примерно", "Курс", "Оплата в USD"],
  zh: ["约", "参考汇率", "实际以美元扣款"],
};

export function CurrencyEstimate({ locale, amount = 4.99 }: { locale: Locale; amount?: number }) {
  const [estimate, setEstimate] = useState<{ rates: Record<string, number>; date: string } | null>(null);
  useEffect(() => {
    if (locale === "en") return;
    const controller = new AbortController();
    fetch("/api/pricing", { signal: controller.signal }).then(async (response) => {
      if (response.ok) setEstimate(await response.json());
    }).catch(() => {});
    return () => controller.abort();
  }, [locale]);
  if (locale === "en" || !estimate) return null;
  const currency = currencies[locale];
  const text = labels[locale];
  return <span className="currency-estimate" data-currency={currency}>
    <span>{text[0]} {new Intl.NumberFormat(htmlLang[locale], { style: "currency", currency }).format(estimate.rates[currency] * amount)}</span>
    <small>{text[2]} · <a href="https://www.exchangerate-api.com" title={`${text[1]}: ${estimate.date}`}>{text[1]} {estimate.date}</a></small>
  </span>;
}
