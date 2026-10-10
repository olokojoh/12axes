"use client";

import { useEffect, useState } from "react";
import type { Locale } from "./i18n";
import { crossAxisReading } from "./cross-axis-copy";
import { deepCopy } from "./deep-copy";
import type { DeepReportData } from "./lib/quiz-evidence";
import { AxisBar, AxisComparisonPlot, AxisGlyph, visualCopy } from "./ResultVisuals";

export const readingPaths = ["federalism", "democracy", "liberty-positive-negative", "immigration", "war", "international-justice", "markets", "justice-distributive", "globalization", "religion-politics", "conservatism", "ethics-ai"];

export function DeepReport({ data, token, locale }: { data: DeepReportData; token: string; locale: Locale }) {
  const text = deepCopy[locale];
  const rows = data.axes.flatMap(axis => axis.rows);
  const [questionId, setQuestionId] = useState(rows[0].id);
  const [answerId, setAnswerId] = useState(rows[0].answerId);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [simulation, setSimulation] = useState<{ axes: number[]; result: { matches: { ideologyId: string; name: string; compatibility: number }[] } } | null>(null);
  useEffect(() => {
    if (!revision) return;
    const controller = new AbortController();
    async function run() {
      setBusy(true); setError(false);
      try {
        const response = await fetch("/api/report/simulate", { method: "POST", signal: controller.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ token, locale, questionId, answerId }) });
        if (!response.ok) throw new Error();
        const payload = await response.json() as NonNullable<typeof simulation>;
        if (!controller.signal.aborted) setSimulation(payload);
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }
    void run();
    return () => controller.abort();
  }, [revision, token, locale, questionId, answerId]);
  const reading = data.axes.map((axis, index) => ({ axis, index })).sort((a, b) => Math.abs(b.axis.score - 50) - Math.abs(a.axis.score - 50) || a.index - b.index).slice(0, 3);
  return <section className="deep-report">
    <h2>{text.name}</h2><p>{text.version}: {data.evidence.version}</p>
    <h3>{text.evidence}</h3><p>{text.evidenceHelp}</p><div className="evidence-overview"><AxisGlyph index={1} size={40} /><div><strong>{data.neutralCount} <small>/ {rows.length}</small></strong><p>{text.neutral}</p><div className="evidence-ratio" aria-hidden="true"><span style={{ width: `${data.neutralCount / rows.length * 100}%` }} /><span style={{ width: `${(rows.length - data.neutralCount) / rows.length * 100}%` }} /></div><div className="visual-series-legend"><span>{visualCopy[locale].neutral}: {data.neutralCount}</span><span>{visualCopy[locale].other}: {rows.length - data.neutralCount}</span></div></div></div>
    {data.neutralCount >= rows.length / 2 && <p className="result-caveat">{text.insufficient}</p>}
    <div className="answer-evidence">{data.axes.map((axis, index) => <details key={axis.id}><summary><span className="evidence-axis-title"><AxisGlyph index={index} />{axis.label}</span><AxisBar index={index} leftLabel={axis.leftPole} rightLabel={axis.rightPole} value={axis.score} compact /></summary><p>{text.neutral}: {axis.rows.filter(row => row.neutral).length} / {axis.rows.length}</p><ol>{axis.rows.map(row => <li key={row.id}><p>{row.text}</p><p><b>{text.chosen}:</b> {row.answer}</p><small>{text.contribution}</small><AxisBar index={index} leftLabel={axis.leftPole} rightLabel={axis.rightPole} value={row.left} compact /></li>)}</ol></details>)}</div>
    <h3>{text.combinations}</h3><p>{text.combinationHelp}</p>
    {[[6,7,8], [0,1,2], [9,10,3]].map((indices, index) => <article className="reflection-card" key={index}><h4>{text.combinationNames[index]}</h4><div className="cross-axis-bars">{indices.map(i => <div key={i}><p><AxisGlyph index={i} size={20} />{data.axes[i].label}</p><AxisBar index={i} leftLabel={data.axes[i].leftPole} rightLabel={data.axes[i].rightPole} value={data.axes[i].score} compact /></div>)}</div><p>{crossAxisReading(data.axes.map(axis => axis.score), locale, index)}</p><p>{text.combinationQuestions[index]}</p><ul>{indices.map(i => {
      const strongest = [...data.axes[i].rows].sort((a, b) => Math.abs(b.left - 50) - Math.abs(a.left - 50))[0];
      return <li key={i}>{strongest.text} — <b>{strongest.answer}</b></li>;
    })}</ul></article>)}
    <section className="answer-explorer"><h3>{text.explore}</h3><p>{text.exploreHelp}</p><form onSubmit={event => { event.preventDefault(); setRevision(value => value + 1); }}><label>{text.question}<select value={questionId} onChange={event => { const id = event.target.value; setQuestionId(id); setAnswerId(rows.find(row => row.id === id)!.answerId); setSimulation(null); setRevision(0); }}>{rows.map(row => <option key={row.id} value={row.id}>{row.text}</option>)}</select></label><p className="explorer-question">{rows.find(row => row.id === questionId)!.text}</p><label>{text.alternative}<select value={answerId} onChange={event => { setAnswerId(event.target.value); setSimulation(null); setRevision(0); }}>{data.answerOptions.map(answer => <option key={answer.id} value={answer.id}>{answer.label}</option>)}</select></label><button className="primary-button" disabled={busy}>{busy ? text.busy : text.simulate}</button></form>{error && <p role="alert">{text.error}</p>}{simulation && <div className="simulation-visual" aria-live="polite"><AxisComparisonPlot axes={data.axes.map((axis, index) => ({ label: axis.label, leftPole: axis.leftPole, rightPole: axis.rightPole, user: axis.score, target: simulation.axes[index] }))} locale={locale} firstLabel={text.originalScore} secondLabel={text.changedScore} /><details className="profile-number-details"><summary>{visualCopy[locale].numbers}</summary><div className="comparison-scroll"><table className="comparison-table"><thead><tr><th>{text.axes}</th><th>{text.originalScore}</th><th>{text.changedScore}</th></tr></thead><tbody>{data.axes.map((axis, index) => <tr key={axis.id}><th>{axis.label}<small>{axis.leftPole}</small></th><td>{axis.score}%</td><td>{simulation.axes[index]}%</td></tr>)}</tbody></table></div></details><ol>{simulation.result.matches.slice(0, 4).map(match => <li key={match.ideologyId}>{match.name} · {match.compatibility}%</li>)}</ol></div>}</section>
    <h3>{text.reading}</h3><p>{text.readingHelp}</p>{reading.map(({ axis, index }) => <article className="reflection-card" key={axis.id}><h4>{text.readingTopics[index]}</h4><p>{text.reason}: {axis.label}</p><AxisBar index={index} leftLabel={axis.leftPole} rightLabel={axis.rightPole} value={axis.score} /><p>{[...axis.rows].sort((a, b) => Math.abs(b.left - 50) - Math.abs(a.left - 50))[0].text}</p><p>{text.reflect}</p><a href={`https://plato.stanford.edu/entries/${readingPaths[index]}/`} target="_blank" rel="noopener noreferrer">{text.source} · Stanford Encyclopedia of Philosophy</a></article>)}
  </section>;
}
