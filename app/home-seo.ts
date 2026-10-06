import { copy, htmlLang, localePath, type Locale } from "./i18n";

export const homeTitles: Record<Locale, string> = {
    en: "12 Axes Political Test — Free 12Axes Quiz",
    pt: "12 Axes — Teste político grátis em 12 eixos",
    es: "12 Axes — Test político gratis de 12 ejes",
    ru: "12 Axes — Бесплатный политический тест по 12 осям",
    zh: "12 Axes 中文版 — 免费 12 轴政治测试 | 12Axes",
  };
export const homeDescriptions: Record<Locale, string> = {
    en: "Take the free 12 axes political test: 36, 60 or 240 questions. See your 12-axis results and ideology matches instantly. No account; paid reports are optional.",
    pt: "Faça o teste 12axes grátis com 36, 60 ou 240 perguntas e descubra sua ideologia política em 12 eixos.",
    es: "Haz el test 12axes gratis con 36, 60 o 240 preguntas y descubre tu ideología política en 12 ejes.",
    ru: "Пройдите бесплатный тест 12axes из 36, 60 или 240 вопросов и определите политический профиль по 12 осям.",
    zh: "免费完成 36、60 或 240 题 12Axes 中文版政治测试，查看 12 个轴、意识形态、国家与人物匹配结果。",
  };

export function homeSchema(locale: Locale, base: URL) {
  const text = copy[locale];
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "12 Axes Political Test",
      alternateName: "12Axes",
      url: new URL(localePath(locale), base).toString(),
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
      inLanguage: htmlLang[locale],
      isAccessibleForFree: true,
      description: text.lead,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: text.faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];
}
