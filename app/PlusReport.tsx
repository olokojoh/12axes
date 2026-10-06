"use client";

import { useState } from "react";
import type { Locale } from "./i18n";
import type { PlusReportData, AxisComparison } from "./lib/matching";
import { plusCopy } from "./plus-copy";

function ComparisonTable({ axes, locale, friend = false }: { axes: AxisComparison; locale: Locale; friend?: boolean }) {
  const text = plusCopy[locale];
  return <div className="comparison-scroll"><table className="comparison-table"><thead><tr><th>{text.axis}</th><th>{text.you}</th><th>{friend ? text.friendTarget : text.reference}</th><th>{text.gap}</th></tr></thead><tbody>{axes.map((axis, index) => <tr key={index}><th scope="row">{axis.label}<small>{axis.leftPole} / {axis.rightPole}</small></th><td>{axis.user}%</td><td>{axis.target}%</td><td>{axis.difference}</td></tr>)}</tbody></table></div>;
}

export function PlusReport({ data, token, locale }: { data: PlusReportData; token: string; locale: Locale }) {
  const text = plusCopy[locale];
  const [shareLink, setShareLink] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [comparison, setComparison] = useState<{ axes: AxisComparison; yourQuizLength: number; friendQuizLength: number } | null>(null);
  async function compare() {
    setBusy(true); setError(false); setComparison(null);
    try {
      const url = new URL(shareLink.trim());
      if (![window.location.origin, "https://12axes.net", "https://www.12axes.net"].includes(url.origin) || !/^\/(?:pt\/|es\/|ru\/|zh\/)?results$/.test(url.pathname) || url.hash) throw new Error();
      const response = await fetch("/api/report/compare", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, shareId: url.searchParams.get("share"), locale, consent }) });
      if (!response.ok) throw new Error();
      setComparison(await response.json());
    } catch { setError(true); } finally { setBusy(false); }
  }
  return <section className="plus-report">
    <h2>{text.plus}</h2><p>{text.notice}</p><p>{text.scale}</p>
    {(["ideologies", "countries", "personalities"] as const).map((group) => <section className="plus-group" key={group}><h3>{group === "ideologies" ? text.ideology : group === "countries" ? text.countries : text.people}</h3>{data[group].map((profile, index) => {
      const sorted = [...profile.axes].sort((a, b) => a.difference - b.difference);
      return <article className="plus-profile" key={profile.id}><h4>{index + 1}. {profile.name} <span>{profile.compatibility}%</span></h4>{"context" in profile && profile.context && <p>{profile.context}</p>}<p>{profile.description}</p><p>{text.closest}: {sorted[0].label} ({sorted[0].difference}) · {text.furthest}: {sorted[sorted.length - 1].label} ({sorted[sorted.length - 1].difference})</p><details><summary>{text.details}</summary><ComparisonTable axes={profile.axes} locale={locale} /></details><div className="print-comparison"><ComparisonTable axes={profile.axes} locale={locale} /></div></article>;
    })}</section>)}
    <section className="friend-comparison"><h3>{text.friend}</h3><p>{text.friendHelp}</p><form className="friend-form" onSubmit={(event) => { event.preventDefault(); void compare(); }}><label>{text.friendInput}<input type="url" value={shareLink} onChange={(event) => { setShareLink(event.target.value); setComparison(null); }} required /></label><label className="consent-label"><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setComparison(null); }} />{text.consent}</label><button className="primary-button" disabled={!consent || busy}>{busy ? text.busy : text.compare}</button></form>{error && <p role="alert">{text.error}</p>}{comparison && <><p>{text.lengths}: {comparison.yourQuizLength} / {comparison.friendQuizLength}</p>{comparison.yourQuizLength !== comparison.friendQuizLength && <p>{text.different}</p>}<ComparisonTable axes={comparison.axes.map((axis, index) => ({ ...axis, label: data.ideologies[0].axes[index].label, leftPole: data.ideologies[0].axes[index].leftPole, rightPole: data.ideologies[0].axes[index].rightPole }))} locale={locale} friend /></>}</section>
  </section>;
}
