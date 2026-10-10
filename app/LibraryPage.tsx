import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deepCopy } from "./deep-copy";
import { catalogProfiles, compatibility, type ProfileGroup } from "./lib/matching";
import { htmlLang, localePath, locales, type Locale } from "./i18n";
import catalog from "./data/matching.json";
import { AxisBar, AxisGlyph, ProfileRadar } from "./ResultVisuals";
import "./content-visuals.css";

const featured: Record<ProfileGroup, string[]> = {
  ideologies: ["liberalismo", "conservadorismo", "social-democracia", "centrismo", "marxismo-leninismo", "anarquismo"],
  countries: ["brasil", "estados-unidos", "alemanha", "japao", "franca", "reino-unido"],
  personalities: ["adam-smith", "karl-marx", "john-stuart-mill", "keynes", "nelson-mandela"],
};
export function libraryItems(locale: Locale) {
  return (Object.keys(featured) as ProfileGroup[]).flatMap(group => catalogProfiles(group, locale).filter(p => featured[group].includes(p.id)).map(p => ({ ...p, group, slug: group + "--" + p.id })));
}
export function libraryMetadata(locale: Locale, base: URL, slug?: string): Metadata {
  const item = slug ? libraryItems(locale).find(p => p.slug === slug) : null;
  if (slug && !item) notFound();
  const path = "/library" + (slug ? "/" + slug : "");
  const title = item ? item.name + " — 12Axes " + deepCopy[locale].axes : "12Axes — " + deepCopy[locale].directory;
  const description = item?.description ?? deepCopy[locale].libraryHelp;
  return { metadataBase: base, title, description, alternates: { canonical: localePath(locale, path), languages: { ...Object.fromEntries(locales.map(l => [htmlLang[l], localePath(l, path)])), "x-default": path } }, robots: { index: true, follow: true }, openGraph: { title, description, url: localePath(locale, path), type: "website" } };
}
const libraryVisualCopy = {
  en: { groups: ["Ideologies", "Country profiles", "Historical personalities"], profile: "Reference profile", overview: "A profile in 12 dimensions", browse: "Explore profile", bars: "12-axis reference values", related: "Similar reference profiles", model: "These values belong to the site's reference model. They are not population survey results or personal test scores." },
  pt: { groups: ["Ideologias", "Perfis de países", "Personalidades históricas"], profile: "Perfil de referência", overview: "Um perfil em 12 dimensões", browse: "Explorar perfil", bars: "Valores de referência dos 12 eixos", related: "Perfis de referência semelhantes", model: "Estes valores pertencem ao modelo de referência do site. Não são pesquisas populacionais nem resultados pessoais." },
  es: { groups: ["Ideologías", "Perfiles de países", "Figuras históricas"], profile: "Perfil de referencia", overview: "Un perfil en 12 dimensiones", browse: "Explorar perfil", bars: "Valores de referencia de los 12 ejes", related: "Perfiles de referencia similares", model: "Estos valores pertenecen al modelo de referencia del sitio. No son encuestas de población ni resultados personales." },
  ru: { groups: ["Идеологии", "Профили стран", "Исторические личности"], profile: "Эталонный профиль", overview: "Профиль в 12 измерениях", browse: "Открыть профиль", bars: "Эталонные значения 12 осей", related: "Близкие эталонные профили", model: "Это значения справочной модели сайта, а не результаты опросов населения или личного тестирования." },
  zh: { groups: ["意识形态", "国家参考画像", "历史人物"], profile: "参考画像", overview: "用 12 个维度阅读一个画像", browse: "查看画像", bars: "12 轴参考数值", related: "相近的参考画像", model: "以下数值属于本站的参考模型，不是人口调查结果，也不是用户的测试分数。" },
} as const;

export function LibraryPage({ locale, slug }: { locale: Locale; slug?: string }) {
  const text = deepCopy[locale], visual = libraryVisualCopy[locale];
  const items = libraryItems(locale);
  const item = slug ? items.find(p => p.slug === slug) : null;
  if (slug && !item) notFound();
  const path = "/library" + (slug ? "/" + slug : "");
  const groups = Object.keys(featured) as ProfileGroup[];
  const related = item ? items.filter(p => p.slug !== item.slug && p.group === item.group).sort((a, b) => compatibility(item.vector, b.vector) - compatibility(item.vector, a.vector)).slice(0, 3) : [];
  const axes = item ? catalog.axes[locale].map((axis, index) => ({ ...axis, leftPercent: item.vector[index] })) : [];
  function profileCard(profile: typeof items[number]) {
    return <article className="reference-card" key={profile.slug}>
      <div className="reference-card-top"><span className="content-icon"><AxisGlyph index={[1, 5, 10][groups.indexOf(profile.group)]} size={26} /></span><span className="reference-category">{profile.category}</span></div>
      <h3><a href={localePath(locale, "/library/" + profile.slug)}>{profile.name}</a></h3>
      {profile.context && <p className="reference-context">{profile.context}</p>}
      <p>{profile.description}</p>
      <div className="reference-mini-bars" aria-hidden="true">{profile.vector.map((value, index) => <span key={index}><i style={{ height: value + "%" }} /><b>{index + 1}</b></span>)}</div>
      <a className="reference-explore" href={localePath(locale, "/library/" + profile.slug)}>{visual.browse}<span aria-hidden="true">↗</span></a>
    </article>;
  }
  return <main className="seo-shell content-shell"><header className="site-header"><a className="logo" href={localePath(locale)}><b>12</b><span>axes</span></a><nav className="language-links">{locales.map(l => <a key={l} className={locale === l ? "active" : ""} href={localePath(l, path)}>{l.toUpperCase()}</a>)}</nav></header>
    <article className="seo-article library-article">
      <nav className="content-breadcrumb"><a href={localePath(locale)}>12Axes</a><span aria-hidden="true">/</span><a href={localePath(locale, "/library")}>{text.directory}</a></nav>
      <header className={item ? "library-profile-hero" : "content-hero"}>
        <div><span className="eyebrow">{visual.profile} · 12Axes</span><h1>{item?.name ?? text.directory}</h1><p className="seo-lead">{item?.description ?? text.libraryHelp}</p>{item && <p className="reference-category">{item.category}{item.context && " · " + item.context}</p>}</div>
        {item ? <ProfileRadar axes={axes} label={item.name} locale={locale} /> : <div className="catalog-counts">{groups.map((group, index) => <a key={group} href={"#" + group}><AxisGlyph index={[1, 5, 10][index]} size={28} /><strong>{items.filter(p => p.group === group).length}</strong><span>{visual.groups[index]}</span></a>)}</div>}
      </header>
      {item ? <><section className="library-axis-section"><div className="content-section-heading"><div><span className="eyebrow">12 / 12</span><h2>{text.axes}</h2></div><p>{visual.model}</p></div><div className="library-axis-grid">{catalog.axes[locale].map((axis, index) => <article key={axis.id}><h3><AxisGlyph index={index} size={22} /><span>{String(index + 1).padStart(2, "0")} · {axis.label}</span></h3><AxisBar index={index} leftLabel={axis.leftPole} rightLabel={axis.rightPole} value={item.vector[index]} compact /></article>)}</div></section><section><h2>{visual.related}</h2><div className="reference-grid">{related.map(profileCard)}</div></section></> : <>{groups.map((group, index) => <section className="library-group" id={group} key={group}><div className="content-section-heading"><h2><span className="content-icon"><AxisGlyph index={[1, 5, 10][index]} size={28} /></span>{visual.groups[index]}</h2><span className="content-count">{items.filter(p => p.group === group).length}</span></div><div className="reference-grid">{items.filter(p => p.group === group).map(profileCard)}</div></section>)}<p className="content-model-note">{visual.model}</p></>}
      <div className="content-bottom-cta"><div><h2>{visual.overview}</h2><p>{text.libraryHelp}</p></div><a className="primary-button" href={localePath(locale)}>{text.takeTest}<span aria-hidden="true">→</span></a></div>
    </article>
  </main>;
}
