import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deepCopy } from "./deep-copy";
import { catalogProfiles, compatibility, type ProfileGroup } from "./lib/matching";
import { htmlLang, localePath, locales, type Locale } from "./i18n";
import catalog from "./data/matching.json";

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
export function LibraryPage({ locale, slug }: { locale: Locale; slug?: string }) {
  const text = deepCopy[locale];
  const items = libraryItems(locale);
  const item = slug ? items.find(p => p.slug === slug) : null;
  if (slug && !item) notFound();
  const path = "/library" + (slug ? "/" + slug : "");
  const related = item ? items.filter(p => p.slug !== item.slug && p.group === item.group).sort((a, b) => compatibility(item.vector, b.vector) - compatibility(item.vector, a.vector)).slice(0, 3) : [];
  return <main className="seo-shell"><header className="site-header"><a className="logo" href={localePath(locale)}><b>12</b><span>axes</span></a><nav className="language-links">{locales.map(l => <a key={l} href={localePath(l, path)}>{l.toUpperCase()}</a>)}</nav></header><article className="seo-article"><nav><a href={localePath(locale)}>12Axes</a> / <a href={localePath(locale, "/library")}>{text.directory}</a></nav><h1>{item?.name ?? text.directory}</h1><p>{text.libraryHelp}</p>{item ? <><p>{item.category} {item.context}</p><p>{item.description}</p><h2>{text.axes}</h2><div className="comparison-scroll"><table className="comparison-table"><tbody>{catalog.axes[locale].map((axis, index) => <tr key={axis.id}><th>{axis.label}</th><td>{axis.leftPole} {item.vector[index]}%</td><td>{axis.rightPole} {Math.round((100 - item.vector[index]) * 10) / 10}%</td></tr>)}</tbody></table></div><h2>{text.related}</h2><ul>{related.map(p => <li key={p.slug}><a href={localePath(locale, "/library/" + p.slug)}>{p.name}</a></li>)}</ul></> : <div className="library-grid">{items.map(p => <article key={p.slug}><h2><a href={localePath(locale, "/library/" + p.slug)}>{p.name}</a></h2><p>{p.description}</p></article>)}</div>}<a className="primary-button" href={localePath(locale)}>{text.takeTest}</a></article></main>;
}
