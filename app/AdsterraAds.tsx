/* eslint-disable @next/next/no-sync-scripts -- Adsterra requires its vendor snippet without async or defer. */
import type { Locale } from "./i18n";

const smartlink = "https://www.profitableratecpmnetwork.com/s6exmzvg7?key=f515338cffcc25dfc402c9d90fd1bd01";
const labels: Record<Locale, { ads: string; sponsored: string }> = {
  en: { ads: "Advertisements", sponsored: "Sponsored link" },
  pt: { ads: "Anúncios", sponsored: "Link patrocinado" },
  es: { ads: "Anuncios", sponsored: "Enlace patrocinado" },
  ru: { ads: "Реклама", sponsored: "Спонсорская ссылка" },
  zh: { ads: "广告", sponsored: "赞助链接" },
};

type Placement = "home" | "format" | "quiz" | "extend" | "results";

export function AdsterraAdBlock({ locale, placement }: { locale: Locale; placement: Placement }) {
  return (
    <section className={`adsterra-placement adsterra-placement-${placement}`} aria-label={labels[locale].ads} data-ad-placement={placement}>
      <span>{labels[locale].ads}</span>
      <div className="adsterra-banner" data-ad-unit-id="30951437">
        <script dangerouslySetInnerHTML={{ __html: "atOptions = { 'key' : '82007f0af8ba71f54644b287807fe713', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };" }} />
        <script src="https://www.highrevenueformat.com/82007f0af8ba71f54644b287807fe713/invoke.js" />
      </div>
      <a href={smartlink} target="_blank" rel="sponsored noopener noreferrer">{labels[locale].sponsored} ↗</a>
    </section>
  );
}
