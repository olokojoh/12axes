import type { Locale } from "./i18n";
import { AxisBar, AxisGlyph, ProfileRadar } from "./ResultVisuals";
import { visualAxes } from "./visual-axis-data";

export const visualCopy = {
  en: { sample: "A profile, in twelve dimensions", sampleLabel: "Illustrative profile", overview: "Your political map", axes: "12 independent axes", read: "Read the shape. Explore each axis.", detail: "How to read this axis", questions: "Questions", complete: "Answered", profile: "Profile", compare: "Compare", share: "Share", scale: "Each axis measures a different trade-off. Neither end is a better score." },
  pt: { sample: "Um perfil em doze dimensões", sampleLabel: "Perfil ilustrativo", overview: "Seu mapa político", axes: "12 eixos independentes", read: "Veja o desenho. Explore cada eixo.", detail: "Como ler este eixo", questions: "Perguntas", complete: "Respondidas", profile: "Perfil", compare: "Comparar", share: "Compartilhar", scale: "Cada eixo mede uma escolha diferente. Nenhuma extremidade é uma pontuação melhor." },
  es: { sample: "Un perfil en doce dimensiones", sampleLabel: "Perfil ilustrativo", overview: "Tu mapa político", axes: "12 ejes independientes", read: "Observa la forma. Explora cada eje.", detail: "Cómo leer este eje", questions: "Preguntas", complete: "Respondidas", profile: "Perfil", compare: "Comparar", share: "Compartir", scale: "Cada eje mide una disyuntiva diferente. Ningún extremo es una puntuación mejor." },
  ru: { sample: "Профиль в двенадцати измерениях", sampleLabel: "Пример профиля", overview: "Ваша политическая карта", axes: "12 независимых осей", read: "Посмотрите на форму. Изучите каждую ось.", detail: "Как читать эту ось", questions: "Вопросы", complete: "Отвечено", profile: "Профиль", compare: "Сравнить", share: "Поделиться", scale: "Каждая ось отражает отдельный выбор. Ни один из полюсов не означает лучший результат." },
  zh: { sample: "十二个维度，组成一幅画像", sampleLabel: "示例画像", overview: "你的政治观点地图", axes: "12 个独立维度", read: "先看整体轮廓，再探索每个维度。", detail: "理解这个维度", questions: "题目", complete: "已回答", profile: "观点画像", compare: "画像对比", share: "分享结果", scale: "每个维度描述一种不同的取舍，两端都不代表分数更好。" },
};

export function ConceptMark({ kind, size = 32 }: { kind: "profile" | "globe" | "person" | "compare" | "share" | "report"; size?: number }) {
  const paths = {
    profile: <><path d="m12 3 8 5v8l-8 5-8-5V8Z" /><path d="m12 7 4 3v5l-4 2-5-4 2-4Z" /><path d="M12 3v4m8 1-4 2m4 6-4-1m-4 6v-4m-8-1 3-3M4 8l5 1" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 6.5h14M5 17.5h14" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2M8 15l4 4 4-4" /></>,
    compare: <><path d="M4 5h16M4 12h16M4 19h16" /><circle cx="9" cy="5" r="2" fill="currentColor" /><circle cx="16" cy="12" r="2" fill="currentColor" /><circle cx="7" cy="19" r="2" fill="currentColor" /></>,
    share: <><circle cx="5" cy="12" r="3" /><circle cx="18" cy="5" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8 10 7-4M8 14l7 4" /></>,
    report: <><path d="M6 3h9l4 4v14H6ZM14 3v5h5M9 12h7M9 16h7" /><path d="M3 7v14" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

const sampleValues = [40, 84, 34, 30, 29, 68, 60, 56, 40, 70, 75, 46];

export function HomeProfilePreview({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const text = visualCopy[locale];
  const axes = visualAxes[locale].map((axis, index) => ({ ...axis, leftPercent: sampleValues[index] }));
  return <div className={`home-profile-preview ${compact ? "compact-preview" : ""}`}>
    <header><span className="sample-tag"><span />{text.sampleLabel}</span><ConceptMark kind="profile" /></header>
    <h2>{text.sample}</h2>
    <div className="home-profile-chart"><ProfileRadar axes={axes} label={text.sampleLabel} locale={locale} compact /></div>
    <div className="home-profile-bars">{(compact ? [1, 10] : [1, 6, 10]).map(index => <div key={index}><strong><AxisGlyph index={index} size={18} />{axes[index].label}</strong><AxisBar index={index} leftLabel={axes[index].leftPole} rightLabel={axes[index].rightPole} value={sampleValues[index]} compact /></div>)}</div>
    <div className="profile-preview-footer"><span><ConceptMark kind="profile" size={18} />{text.profile}</span><span><ConceptMark kind="compare" size={18} />{text.compare}</span><span><ConceptMark kind="share" size={18} />{text.share}</span></div>
  </div>;
}

export function AxisGuide({ locale }: { locale: Locale }) {
  return <div className="visual-axis-guide">{visualAxes[locale].map((axis, index) => <article key={axis.label}>
    <header><span className="axis-guide-symbol"><AxisGlyph index={index} size={28} /></span><span className="axis-guide-number">{String(index + 1).padStart(2, "0")}</span></header>
    <h3>{axis.label}</h3>
    <div className="axis-guide-poles"><span>{axis.leftPole}</span><span aria-hidden="true">↔</span><span>{axis.rightPole}</span></div>
    <div className={`axis-guide-track axis-palette-${index}`} aria-hidden="true"><span /><span /></div>
  </article>)}</div>;
}

export function FormatIllustration({ level }: { level: number }) {
  return <svg className="format-illustration" viewBox="0 0 160 64" aria-hidden="true">
    {[0, 1, 2].map((row) => Array.from({ length: 12 }, (_, column) => <rect key={`${row}-${column}`} x={column * 13} y={row * 21} width="8" height="14" rx="3" className={column < [4, 8, 12][level] ? "filled" : "empty"} />))}
  </svg>;
}

export function AnswerMark({ index }: { index: number }) {
  return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" />{index < 2 ? <path d={index === 0 ? "m7 16 5 5 6-8m-1 5 3 3 5-8" : "m10 16 4 4 8-9"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : index === 2 ? <path d="M10 14h12M10 19h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : <path d={index === 3 ? "M10 16h12" : "m11 11 10 10m0-10L11 21"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}</svg>;
}
