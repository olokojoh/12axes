"use client";

import type { CSSProperties } from "react";
import type { Locale } from "./i18n";
import "./result-visuals.css";

const glyphs = [
  "M12 3v6M5 15v6m14-6v6M4 12h16M5 12V9h14v3M9 3h6M2 21h6m8 0h6",
  "M4 10h16M5 10v10m5-10v10m4-10v10m5-10v10M3 21h18M3 7l9-5 9 5H3Z",
  "M12 2 4 5v6c0 5 8 11 8 11s8-6 8-11V5l-8-3Zm-4 9 3 3 5-6",
  "M8 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM2 21v-5a5 5 0 0 1 10 0v5m1-9a5 5 0 0 1 8 4v5",
  "m5 3 14 18M19 3 5 21M3 6l4-3m10 0 4 3M3 18l4 3m10 0 4-3",
  "M5 22V3m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0",
  "M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7",
  "M3 20h18M5 16v-4h3v4m3 0V8h3v8m3 0V3h3v13",
  "M3 12h18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c-5 5-5 13 0 18 5-5 5-13 0-18Z",
  "M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  "M5 20h14M12 3v17M4 9l8-6 8 6M5 10l-3 6h6l-3-6Zm14 0-3 6h6l-3-6Z",
  "M8 2v4m8-4v4M8 18v4m8-4v4M2 8h4m-4 8h4m12-8h4m-4 8h4M6 6h12v12H6V6Zm4 4h4v4h-4v-4Z",
];

export const visualCopy = {
  en: { axisKey: "Axis key and scale", overview: "Your 12-axis profile", scale: "Values show the left pole of each axis, from 0 to 100%. A larger shape is not a better result; this is a model, not a scientific assessment.", you: "Your result", reference: "Reference", details: "Read the interpretation", numbers: "View exact values", neutral: "Neutral / depends", other: "Other answers", comparison: "Axis comparison", changed: "Explored answer", saved: "Saved result" },
  pt: { axisKey: "Legenda dos eixos e escala", overview: "Seu perfil nos 12 eixos", scale: "Os valores indicam o polo esquerdo de cada eixo, de 0 a 100%. Uma área maior não significa um resultado melhor; este é um modelo, não uma avaliação científica.", you: "Seu resultado", reference: "Referência", details: "Ler a interpretação", numbers: "Ver valores exatos", neutral: "Neutro / depende", other: "Outras respostas", comparison: "Comparação por eixo", changed: "Resposta explorada", saved: "Resultado salvo" },
  es: { axisKey: "Leyenda de ejes y escala", overview: "Tu perfil en los 12 ejes", scale: "Los valores indican el polo izquierdo de cada eje, de 0 a 100%. Una figura mayor no es un resultado mejor; es un modelo, no una evaluación científica.", you: "Tu resultado", reference: "Referencia", details: "Leer la interpretación", numbers: "Ver valores exactos", neutral: "Neutral / depende", other: "Otras respuestas", comparison: "Comparación por eje", changed: "Respuesta explorada", saved: "Resultado guardado" },
  ru: { axisKey: "Обозначения осей и шкала", overview: "Ваш профиль по 12 осям", scale: "Значения показывают левый полюс каждой оси от 0 до 100%. Большая площадь не означает лучший результат: это модель, а не научная оценка.", you: "Ваш результат", reference: "Профиль сравнения", details: "Читать толкование", numbers: "Точные значения", neutral: "Нейтрально / зависит", other: "Другие ответы", comparison: "Сравнение по осям", changed: "Изменённый ответ", saved: "Сохранённый результат" },
  zh: { axisKey: "查看轴标与刻度说明", overview: "你的 12 轴画像", scale: "数值表示每个轴左侧立场的百分比，范围为 0–100%。图形面积更大不代表更好；这是模型展示，不是科学测评。", you: "你的结果", reference: "参考画像", details: "阅读解读", numbers: "查看准确数值", neutral: "中立 / 视情况", other: "其他回答", comparison: "逐轴对比", changed: "探索后的答案", saved: "已保存结果" },
};

export function AxisGlyph({ index, size = 24 }: { index: number; size?: number }) {
  return <svg className={`axis-glyph axis-palette-${index % 12}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={glyphs[index % 12]} /></svg>;
}

export function AxisBar({ index, leftLabel, rightLabel, value, compact = false }: { index: number; leftLabel: string; rightLabel: string; value: number; compact?: boolean }) {
  return <div className={`visual-axis-bar axis-palette-${index % 12}${compact ? " compact" : ""}`}>
    <div className="visual-axis-labels"><span>{leftLabel} <b>{Math.round(value)}%</b></span><span><b>{Math.round(100 - value)}%</b> {rightLabel}</span></div>
    <div className="visual-axis-track" aria-hidden="true" style={{ "--axis-value": `${value}%` } as CSSProperties}><span /><i /><b /></div>
  </div>;
}

export function MatchGauge({ value, label, size = 96 }: { value: number; label: string; size?: number }) {
  return <div className="match-gauge" style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="gauge-track" cx="50" cy="50" r="42" /><circle className="gauge-value" cx="50" cy="50" r="42" pathLength="100" strokeDasharray={`${value} 100`} transform="rotate(-90 50 50)" /></svg>
    <span><strong>{Math.round(value)}<small>%</small></strong><span className="visual-sr-only"> {label}</span></span>
  </div>;
}

type RadarAxis = { label: string; leftPole: string; rightPole: string; leftPercent: number };

export function ProfileRadar({ axes, label, comparison, locale = "en", compact = false }: { axes: RadarAxis[]; label: string; comparison?: number[]; locale?: Locale; compact?: boolean }) {
  const text = visualCopy[locale];
  const point = (index: number, value: number) => {
    const angle = index * Math.PI * 2 / axes.length - Math.PI / 2;
    return [150 + Math.cos(angle) * value * 1.12, 150 + Math.sin(angle) * value * 1.12];
  };
  const polygon = (values: number[]) => values.map((value, index) => point(index, value).join(",")).join(" ");
  const key = <><ol className="radar-axis-key">{axes.map((axis, index) => <li key={axis.label}><span>{String(index + 1).padStart(2, "0")}</span><span>{axis.label}<small>{axis.leftPole}</small></span><b>{Math.round(axis.leftPercent)}%{comparison && <small> / {Math.round(comparison[index])}%</small>}</b></li>)}</ol><p className="visual-scale-note">{text.scale}</p></>;
  return <figure className={`profile-radar${compact ? " compact" : ""}`}>
    <figcaption>{label}</figcaption>
    <svg viewBox="0 0 300 300" role="img" aria-label={label + ". " + text.scale}>
      {[25, 50, 75, 100].map(value => <polygon className={`radar-grid${value === 50 ? " radar-midpoint" : ""}`} key={value} points={polygon(axes.map(() => value))} />)}
      {axes.map((axis, index) => { const [x, y] = point(index, 100); const [tx, ty] = point(index, 119); return <g key={axis.label}><line className="radar-spoke" x1="150" y1="150" x2={x} y2={y} /><text className="radar-index" x={tx} y={ty} dy=".35em" textAnchor="middle">{String(index + 1).padStart(2, "0")}</text></g>; })}
      {comparison && <polygon className="radar-reference" points={polygon(comparison)} />}
      <polygon className="radar-profile" points={polygon(axes.map(axis => axis.leftPercent))} />
      {axes.map((axis, index) => { const [x, y] = point(index, axis.leftPercent); return <circle className="radar-point" key={axis.label} cx={x} cy={y} r="3.5" />; })}
      <text className="radar-tick" x="155" y="39">100</text><text className="radar-tick" x="155" y="94">50</text><text className="radar-tick" x="155" y="148">0</text>
    </svg>
    {comparison && <div className="visual-series-legend"><span><i className="series-dot" />{text.you}</span><span><i className="series-diamond" />{text.reference}</span></div>}
    {compact ? <details className="radar-key-details"><summary>{text.axisKey}</summary>{key}</details> : key}
  </figure>;
}

export function AxisComparisonPlot({ axes, locale, firstLabel, secondLabel }: { axes: { label: string; leftPole: string; rightPole: string; user: number; target: number }[]; locale: Locale; firstLabel?: string; secondLabel?: string }) {
  const text = visualCopy[locale];
  return <div className="axis-comparison-plot">
    <div className="visual-series-legend"><span><i className="series-dot" />{firstLabel ?? text.you}</span><span><i className="series-diamond" />{secondLabel ?? text.reference}</span></div>
    {axes.map((axis, index) => <div className={`comparison-plot-row axis-palette-${index % 12}`} key={axis.label}>
      <div className="comparison-plot-label"><AxisGlyph index={index} size={18} /><span>{axis.label}<small>{axis.leftPole} ↔ {axis.rightPole}</small></span><b>{Math.round(axis.user)}% <span>/ {Math.round(axis.target)}%</span></b></div>
      <div className="comparison-plot-track" aria-hidden="true"><span className="comparison-gap" style={{ left: `${Math.min(axis.user, axis.target)}%`, width: `${Math.abs(axis.user - axis.target)}%` }} /><i className="comparison-user" style={{ left: `${axis.user}%` }} /><i className="comparison-target" style={{ left: `${axis.target}%` }} /><b /></div>
    </div>)}
    <p className="visual-scale-note">{text.scale}</p>
  </div>;
}
