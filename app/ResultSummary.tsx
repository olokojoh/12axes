"use client";

import type { MouseEvent } from "react";
import type { Locale } from "./i18n";
import type { ReportPlan } from "./lib/report-access";
import { deepCopy } from "./deep-copy";
import { plusCopy } from "./plus-copy";
import { axisReading } from "./report-copy";
import { resultSummaryCopy } from "./result-summary-copy";

type SummaryResult = {
  topMatch: { name: string; compatibility: number; description: string };
  axes: {
    axisId: string;
    label: string;
    leftPole: string;
    rightPole: string;
    leftPercent: number;
    rightPercent: number;
  }[];
};

export function ResultSummary({ locale, result, quizLength, paid, plan }: {
  locale: Locale;
  result: SummaryResult;
  quizLength: number;
  paid: boolean;
  plan: ReportPlan;
}) {
  if (!paid) return null;

  const text = resultSummaryCopy[locale];
  const planName = plan === "deep" ? deepCopy[locale].name : plan === "plus" ? plusCopy[locale].plus : plusCopy[locale].basic;
  const strongest = result.axes.map((axis, index) => ({ axis, index, distance: Math.abs(axis.leftPercent - 50) }))
    .filter(({ distance }) => distance >= 7.5)
    .sort((a, b) => b.distance - a.distance || a.index - b.index)
    .slice(0, 3);
  const balanced = result.axes.filter(axis => Math.abs(axis.leftPercent - 50) < 7.5).length;

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById(event.currentTarget.hash.slice(1))?.scrollIntoView();
  }

  return <section className="result-summary" aria-labelledby="result-summary-title">
    <header className="result-summary-header">
      <p className="eyebrow">{planName} · {text.answers.replace("{count}", String(quizLength))}</p>
      <span className="result-summary-status">{text.unlocked}</span>
    </header>
    <h1 id="result-summary-title">{text.title}</h1>
    <div className="result-summary-match">
      <p>{text.match}</p>
      <h2>{result.topMatch.name}</h2>
      <p className="result-summary-similarity">{text.similarity.replace("{score}", String(Math.round(result.topMatch.compatibility)))}</p>
      <p>{result.topMatch.description}</p>
    </div>
    {strongest.length > 0 ? <>
      <h2>{text.strongest}</h2>
      <div className="result-summary-axes">{strongest.map(({ axis, index }) => <article key={axis.axisId}>
        <h3>{axis.label} · {axis.leftPercent >= 50 ? axis.leftPole : axis.rightPole} {Math.round(Math.max(axis.leftPercent, axis.rightPercent))}%</h3>
        <p>{axisReading(locale, index, axis.leftPercent, axis.leftPole, axis.rightPole)}</p>
      </article>)}</div>
    </> : <p className="result-summary-neutral">{text.neutral}</p>}
    <p className="result-summary-balanced">{text.balanced.replace("{count}", String(balanced)).replace("{total}", String(result.axes.length))}</p>
    <p className="result-summary-caveat">{text.caveat}</p>
    <nav className="result-summary-nav" aria-label={text.navigate}>
      <a href="#axis-readings" onClick={navigate}>{text.axes} ↓</a>
      <a href="#ideology-matches" onClick={navigate}>{text.ideologies} ↓</a>
      {(plan === "plus" || plan === "deep") && <a href="#report-comparisons" onClick={navigate}>{text.comparisons} ↓</a>}
      {plan === "deep" && <a href="#answer-evidence" onClick={navigate}>{text.evidence} ↓</a>}
    </nav>
  </section>;
}
