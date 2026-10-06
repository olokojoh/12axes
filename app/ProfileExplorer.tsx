"use client";
import { useEffect, useState } from "react";
import { deepCopy } from "./deep-copy";
import { plusCopy } from "./plus-copy";
import type { Locale } from "./i18n";
import type { exploreProfiles } from "./lib/matching";
import { ComparisonTable } from "./PlusReport";

export function ProfileExplorer({ token, locale, original = false }: { token: string; locale: Locale; original?: boolean }) {
  const text = deepCopy[locale];
  const [group, setGroup] = useState("ideologies");
  const [domain, setDomain] = useState("all");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [furthest, setFurthest] = useState(false);
  const [profiles, setProfiles] = useState<ReturnType<typeof exploreProfiles>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setBusy(true); setError(false);
      try {
        const response = await fetch("/api/report/explore", { method: "POST", signal: controller.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ token, locale, original, group, domain, query: submitted, filter, furthest }) });
        if (!response.ok) throw new Error();
        const payload = await response.json() as { profiles: ReturnType<typeof exploreProfiles> };
        if (!controller.signal.aborted) setProfiles(payload.profiles);
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }
    void load();
    return () => controller.abort();
  }, [token, locale, original, group, domain, filter, submitted, furthest]);
  const filterKeys = group === "countries" ? ["all", "current", "historical"] : group === "personalities" ? ["all", "politics", "philosophy", "science", "arts", "economics", "other"] : ["all"];
  return <section className="profile-explorer"><h3>{text.catalog}</h3><p>{plusCopy[locale].notice}</p><form onSubmit={event => { event.preventDefault(); setSubmitted(query); }}><label>{text.filter}<select value={group} onChange={event => { setGroup(event.target.value); setFilter("all"); }}>{["ideologies", "countries", "personalities"].map((key, i) => <option key={key} value={key}>{text.groups[i]}</option>)}</select></label><label>{text.domain}<select value={domain} onChange={event => setDomain(event.target.value)}>{["all", "political", "social", "economic"].map((key, i) => <option key={key} value={key}>{text.domains[i]}</option>)}</select></label>{filterKeys.length > 1 && <label>{text.filter}<select value={filter} onChange={event => setFilter(event.target.value)}>{filterKeys.map(key => <option key={key} value={key}>{text.filters[key as keyof typeof text.filters]}</option>)}</select></label>}<label>{text.query}<input type="search" maxLength={100} value={query} onChange={event => setQuery(event.target.value)} /></label><label className="consent-label"><input type="checkbox" checked={furthest} onChange={event => setFurthest(event.target.checked)} />{text.furthest}</label><button className="primary-button" disabled={busy}>{busy ? text.busy : text.search}</button></form>{error && <p role="alert">{text.error}</p>}{!busy && !error && !profiles.length && <p>{text.empty}</p>}<div aria-live="polite">{profiles.map(profile => <details className="explored-profile" key={profile.id}><summary>{profile.name} · {profile.compatibility}% · {text.domains[["all", "political", "social", "economic"].indexOf(domain)]}</summary><p>{profile.category} {profile.context}</p><p>{profile.description}</p><ComparisonTable axes={profile.axes} locale={locale} /></details>)}</div></section>;
}
