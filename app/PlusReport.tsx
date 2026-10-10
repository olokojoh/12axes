"use client";

import { ProfileExplorer } from "./ProfileExplorer";
import { useState } from "react";
import type { Locale } from "./i18n";
import type { PlusReportData, AxisComparison } from "./lib/matching";
import { plusCopy } from "./plus-copy";
import { AxisComparisonPlot, MatchGauge, visualCopy } from "./ResultVisuals";

export function ComparisonTable({ axes, locale, friend = false }: { axes: AxisComparison; locale: Locale; friend?: boolean }) {
  const text = plusCopy[locale];
  return <div className="comparison-scroll"><table className="comparison-table"><thead><tr><th>{text.axis}</th><th>{text.you}</th><th>{friend ? text.friendTarget : text.reference}</th><th>{text.gap}</th></tr></thead><tbody>{axes.map((axis, index) => <tr key={index}><th scope="row">{axis.label}<small>{axis.leftPole} / {axis.rightPole}</small></th><td>{axis.user}%</td><td>{axis.target}%</td><td>{axis.difference}</td></tr>)}</tbody></table></div>;
}

export function PlusReport({ data, token, locale, original = false }: { data: PlusReportData; token: string; locale: Locale; original?: boolean }) {
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
      const publicShare = url.pathname.match(/^\/(?:pt\/|es\/|ru\/|zh\/)?share\/([A-Za-z0-9_-]{43})$/);
      const legacyShare = /^\/(?:pt\/|es\/|ru\/|zh\/)?results$/.test(url.pathname) ? url.searchParams.get("share") : null;
      if (![window.location.origin, "https://12axes.net", "https://www.12axes.net"].includes(url.origin) || url.hash || (!publicShare && !legacyShare)) throw new Error();
      const response = await fetch("/api/report/compare", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, shareId: publicShare?.[1] ?? legacyShare, locale, consent, original }) });
      if (!response.ok) throw new Error();
      setComparison(await response.json());
    } catch { setError(true); } finally { setBusy(false); }
  }
  return <section className="plus-report">
    <h2>{text.plus}</h2><p>{text.notice}</p><p>{text.scale}</p>
    <ProfileExplorer token={token} locale={locale} original={original} />
    {(["ideologies", "countries", "personalities"] as const).map((group) => <section className="plus-group" key={group}><h3>{group === "ideologies" ? text.ideology : group === "countries" ? text.countries : text.people}</h3>{data[group].map((profile, index) => {
      const sorted = [...profile.axes].sort((a, b) => a.difference - b.difference);
      return <article className="plus-profile" key={profile.id}><div className="profile-visual-heading"><MatchGauge value={profile.compatibility} label={profile.name} size={72} /><div><span className="profile-rank">{String(index + 1).padStart(2, "0")}</span><h4>{profile.name}</h4>{"context" in profile && profile.context && <p>{profile.context}</p>}</div></div><p>{profile.description}</p><div className="profile-gap-highlights">{[{ axis: sorted[0], label: text.closest }, { axis: sorted[sorted.length - 1], label: text.furthest }].map(({ axis, label }) => <div key={label}><small>{label}</small><b>{axis.label} · {axis.difference}</b><span className="profile-gap-track" aria-hidden="true"><i style={{ width: `${axis.difference}%` }} /></span></div>)}</div><details><summary>{text.details}</summary><AxisComparisonPlot axes={profile.axes} locale={locale} /><details className="profile-number-details"><summary>{visualCopy[locale].numbers}</summary><ComparisonTable axes={profile.axes} locale={locale} /></details></details><div className="print-comparison"><ComparisonTable axes={profile.axes} locale={locale} /></div></article>;
    })}</section>)}
    <section className="friend-comparison"><h3>{text.friend}</h3><p>{text.friendHelp}</p><form className="friend-form" onSubmit={(event) => { event.preventDefault(); void compare(); }}><label>{text.friendInput}<input type="url" value={shareLink} onChange={(event) => { setShareLink(event.target.value); setComparison(null); }} required /></label><label className="consent-label"><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setComparison(null); }} />{text.consent}</label><button className="primary-button" disabled={!consent || busy}>{busy ? text.busy : text.compare}</button></form>{error && <p role="alert">{text.error}</p>}{comparison && <><p>{text.lengths}: {comparison.yourQuizLength} / {comparison.friendQuizLength}</p>{comparison.yourQuizLength !== comparison.friendQuizLength && <p>{text.different}</p>}<AxisComparisonPlot axes={comparison.axes.map((axis, index) => ({ ...axis, label: data.ideologies[0].axes[index].label, leftPole: data.ideologies[0].axes[index].leftPole, rightPole: data.ideologies[0].axes[index].rightPole }))} locale={locale} secondLabel={text.friendTarget} /><details className="profile-number-details"><summary>{visualCopy[locale].numbers}</summary><ComparisonTable axes={comparison.axes.map((axis, index) => ({ ...axis, label: data.ideologies[0].axes[index].label, leftPole: data.ideologies[0].axes[index].leftPole, rightPole: data.ideologies[0].axes[index].rightPole }))} locale={locale} friend /></details></>}</section>
  </section>;
}
