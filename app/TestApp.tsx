"use client";

import { useEffect, useMemo, useState } from "react";
import { axisExplanations, copy, localeNames, localePath, locales, type Locale } from "./i18n";

type Question = {
  id: string;
  axisId: string;
  text: string;
  agreePole: "LEFT" | "RIGHT";
  weight: number;
};

type Axis = {
  id: string;
  label: string;
  leftPole: string;
  rightPole: string;
  leftColor: string;
  rightColor: string;
};

type AnswerOption = {
  id: string;
  label: string;
  scoreTowardAgreement: number;
};

type QuizData = {
  axes: Axis[];
  questions: Question[];
  answerOptions: AnswerOption[];
};

type Match = {
  ideologyId: string;
  name: string;
  category: string;
  description: string;
  compatibility: number;
};

type Result = {
  axes: Array<{
    axisId: string;
    label: string;
    leftPole: string;
    rightPole: string;
    leftPercent: number;
    rightPercent: number;
    dominantPole: string;
    intensity: string;
  }>;
  topMatch: Match;
  matches: Match[];
  topCountryMatch: {
    name: string;
    category: string;
    description: string;
    period: string;
    compatibility: number;
  };
  topPersonalityMatch: {
    name: string;
    role: string;
    lifespan: string;
    description: string;
    compatibility: number;
  };
};

type Mode = "home" | "format" | "quiz" | "extend" | "loading" | "results";
type Variant = "short" | "extended" | "extreme";

const shareKeys = ["est", "rep", "pod", "imi", "dip", "int", "eco", "con", "com", "rel", "mor", "tec"];

const exampleUi = {
  en: { example: "Example result", position: "Third position", match: "match", country: "Most compatible country", personality: "Most compatible personality", description: "Authoritarian nationalist movement that emerged in 1930s Brazil, with a Christian and corporatist base.", countryDescription: "Parliamentary monarchy with a strong central state.", personalityDescription: "Leader of Brazilian Integralism.", real: "Real example", title: "Here's what your result looks like" },
  pt: { example: "Resultado de exemplo", position: "Terceira posição", match: "compatível", country: "País mais compatível", personality: "Personalidade mais compatível", description: "Movimento nacionalista autoritário surgido no Brasil dos anos 1930, de base cristã e corporativista.", countryDescription: "Monarquia parlamentar com Estado central forte.", personalityDescription: "Líder do Integralismo Brasileiro.", real: "Exemplo real", title: "Veja como é o seu resultado" },
  es: { example: "Resultado de ejemplo", position: "Tercera posición", match: "coincide", country: "País más compatible", personality: "Personalidad más compatible", description: "Movimiento nacionalista autoritario surgido en Brasil en los años 1930, de base cristiana y corporativista.", countryDescription: "Monarquía parlamentaria con un Estado central fuerte.", personalityDescription: "Líder del Integralismo Brasileño.", real: "Ejemplo real", title: "Así se verá tu resultado" },
  ru: { example: "Пример результата", position: "Третья позиция", match: "совпадение", country: "Ближайшая страна", personality: "Ближайшая личность", description: "Авторитарное националистическое движение, возникшее в Бразилии в 1930-х годах.", countryDescription: "Парламентская монархия с сильным центром.", personalityDescription: "Лидер бразильского интегрализма.", real: "Пример", title: "Как выглядит результат" },
  zh: { example: "结果示例", position: "第三位置", match: "匹配", country: "最匹配的国家", personality: "最匹配的人物", description: "20 世纪 30 年代兴起于巴西的威权民族主义运动，具有基督教与法团主义基础。", countryDescription: "拥有强大中央国家的议会君主制。", personalityDescription: "巴西整合主义运动领导人。", real: "真实示例", title: "你的结果会是这样" },
} as const;

const auxiliaryUi = {
  en: { recommended: "Recommended", match: "match", how: "How it works", axes: "12 axes", spectrum: "Political spectrum", versions: "Versions", privacy: "Anonymous · Client-side scoring · No account required", loadError: "The question bank could not be loaded. Please try again.", resultError: "The result service is temporarily unavailable. Your answers remain in this browser.", answerError: "Please answer every question before viewing the result.", footer: ["All results", "Ideologies", "Privacy", "License"] },
  pt: { recommended: "Recomendado", match: "compatível", how: "Como funciona", axes: "12 eixos", spectrum: "Espectro político", versions: "Versões", privacy: "Anônimo · Pontuação no navegador · Sem conta", loadError: "Não foi possível carregar as perguntas. Tente novamente.", resultError: "O serviço de resultados está indisponível. Suas respostas continuam neste navegador.", answerError: "Responda a todas as perguntas antes de ver o resultado.", footer: ["Todos os resultados", "Ideologias", "Privacidade", "Licença"] },
  es: { recommended: "Recomendado", match: "coincide", how: "Cómo funciona", axes: "12 ejes", spectrum: "Espectro político", versions: "Versiones", privacy: "Anónimo · Cálculo en el navegador · Sin cuenta", loadError: "No se pudieron cargar las preguntas. Inténtalo de nuevo.", resultError: "El servicio de resultados no está disponible. Tus respuestas siguen en este navegador.", answerError: "Responde todas las preguntas antes de ver el resultado.", footer: ["Todos los resultados", "Ideologías", "Privacidad", "Licencia"] },
  ru: { recommended: "Рекомендуем", match: "совпадение", how: "Как это работает", axes: "12 осей", spectrum: "Политический спектр", versions: "Версии", privacy: "Анонимно · Расчёт в браузере · Без аккаунта", loadError: "Не удалось загрузить вопросы. Попробуйте ещё раз.", resultError: "Сервис результатов временно недоступен. Ответы остаются в браузере.", answerError: "Ответьте на все вопросы перед просмотром результата.", footer: ["Все результаты", "Идеологии", "Конфиденциальность", "Лицензия"] },
  zh: { recommended: "推荐", match: "匹配", how: "测试原理", axes: "12 个轴", spectrum: "政治光谱", versions: "测试版本", privacy: "匿名 · 浏览器内计分 · 无需账户", loadError: "题库加载失败，请重试。", resultError: "结果服务暂时不可用，你的回答仍保留在当前浏览器中。", answerError: "请回答全部问题后再查看结果。", footer: ["全部结果", "意识形态", "隐私", "许可"] },
} as const;

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function selectQuestions(data: QuizData, variant: Variant) {
  if (variant === "extreme") return shuffle(data.questions);
  const count = variant === "extended" ? 5 : 3;
  const groups = new Map<string, Question[]>();
  for (const question of data.questions) {
    groups.set(question.axisId, [...(groups.get(question.axisId) ?? []), question]);
  }
  const selected: Question[] = [];
  let axisIndex = 0;
  for (const questions of groups.values()) {
    const left = shuffle(questions.filter((question) => question.agreePole === "LEFT"));
    const right = shuffle(questions.filter((question) => question.agreePole === "RIGHT"));
    const leftCount = axisIndex % 2 === 0 ? Math.ceil(count / 2) : Math.floor(count / 2);
    selected.push(...left.slice(0, leftCount), ...right.slice(0, count - leftCount));
    axisIndex++;
  }
  return shuffle(selected);
}

function extraQuestions(data: QuizData, used: Set<string>) {
  const groups = new Map<string, Question[]>();
  for (const question of data.questions) {
    if (!used.has(question.id)) {
      groups.set(question.axisId, [...(groups.get(question.axisId) ?? []), question]);
    }
  }
  return shuffle(Array.from(groups.values()).flatMap((questions) => [
    shuffle(questions.filter((question) => question.agreePole === "LEFT"))[0],
    shuffle(questions.filter((question) => question.agreePole === "RIGHT"))[0],
  ]).filter(Boolean));
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function TestApp({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const [mode, setMode] = useState<Mode>("home");
  const [data, setData] = useState<QuizData | null>(null);
  const [variant, setVariant] = useState<Variant>("short");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const values = shareKeys.map((key) => new URLSearchParams(window.location.search).get(key));
    if (!window.location.pathname.endsWith("/results") || values.some((value) => value === null)) return;
    const axes = values.map(Number);
    if (axes.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) return;
    fetchResult(axes);
    // A shared result is hydrated once from the URL present when this page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    if (data) return data;
    const response = await fetch(`/data/quiz.${locale}.json`);
    const payload = await response.json() as QuizData;
    setData(payload);
    return payload;
  }

  async function chooseVariant(nextVariant: Variant) {
    setError("");
    setVariant(nextVariant);
    try {
      const payload = await loadData();
      const chosen = selectQuestions(payload, nextVariant);
      setQuestions(chosen);
      setAnswers({});
      setQuestionIndex(0);
      setResult(null);
      setMode("quiz");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(auxiliaryUi[locale].loadError);
    }
  }

  function answerQuestion(answer: string) {
    const current = questions[questionIndex];
    if (!current) return;
    const nextAnswers = { ...answers, [current.id]: answer };
    setAnswers(nextAnswers);
    if (questionIndex === questions.length - 1) {
      if (variant === "short" && questions.length === 36) {
        window.setTimeout(() => setMode("extend"), 180);
      }
      return;
    }
    window.setTimeout(() => setQuestionIndex((value) => Math.min(value + 1, questions.length - 1)), 180);
  }

  function extendQuiz() {
    if (!data) return;
    const additions = extraQuestions(data, new Set(questions.map((question) => question.id)));
    setQuestions((current) => [...current, ...additions]);
    setQuestionIndex(questions.length);
    setMode("quiz");
  }

  function calculateAxes() {
    if (!data) return [];
    const scores = new Map<string, number[]>();
    const optionScores = new Map(data.answerOptions.map((option) => [option.id, option.scoreTowardAgreement]));
    for (const question of questions) {
      const agreement = optionScores.get(answers[question.id]);
      if (agreement === undefined) continue;
      const left = question.agreePole === "LEFT" ? agreement : 1 - agreement;
      scores.set(question.axisId, [...(scores.get(question.axisId) ?? []), left]);
    }
    return data.axes.map((axis) => {
      const values = scores.get(axis.id) ?? [0.5];
      return Math.round(values.reduce((total, value) => total + value, 0) / values.length * 100);
    });
  }

  async function fetchResult(axes: number[]) {
    setMode("loading");
    setError("");
    try {
      await loadData();
      const response = await fetch(`/api/match?axes=${axes.join(",")}&lang=${locale}`);
      if (!response.ok) throw new Error();
      const payload = await response.json() as Result;
      setResult(payload);
      setMode("results");
    } catch {
      setError(auxiliaryUi[locale].resultError);
      setMode(questions.length ? "quiz" : "home");
    }
  }

  async function finish() {
    if (questions.some((question) => !answers[question.id])) {
      setError(auxiliaryUi[locale].answerError);
      const missing = questions.findIndex((question) => !answers[question.id]);
      if (missing >= 0) setQuestionIndex(missing);
      return;
    }
    const axes = calculateAxes();
    const query = shareKeys.map((key, index) => `${key}=${axes[index]}`).join("&");
    window.history.replaceState(null, "", `${localePath(locale, "/results")}?${query}`);
    await fetchResult(axes);
  }

  function reset() {
    window.history.replaceState(null, "", localePath(locale));
    setMode("format");
    setQuestions([]);
    setAnswers({});
    setQuestionIndex(0);
    setResult(null);
    setError("");
  }

  async function shareResult() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function switchLocale(next: string) {
    if (!locales.includes(next as Locale)) return;
    const currentPath = window.location.pathname.replace(/^\/(pt|es|ru|zh)(?=\/|$)/, "") || "/";
    window.location.href = localePath(next as Locale, currentPath);
  }

  const currentQuestion = questions[questionIndex];
  const currentAxis = useMemo(() => data?.axes.find((axis) => axis.id === currentQuestion?.axisId), [data, currentQuestion]);

  if (mode === "format") {
    return (
      <main className="app-shell center-shell">
        <AppHeader locale={locale} onLocale={switchLocale} compact onHome={() => setMode("home")} />
        <section className="format-panel" aria-labelledby="format-title">
          <span className="eyebrow">{text.eyebrow}</span>
          <h1 id="format-title">{text.formatTitle}</h1>
          <p>{text.formatLead}</p>
          <div className="format-grid">
            {text.formats.map(([id, label, count, description, duration]) => (
              <button className={`format-card ${id === "extended" ? "featured" : ""}`} key={id} onClick={() => chooseVariant(id as Variant)}>
                {id === "extended" && <span className="recommended">{auxiliaryUi[locale].recommended}</span>}
                <strong>{label}</strong>
                <b>{count}</b>
                <span>{description}</span>
                <small>{duration}</small>
                <i>{text.startVersion} →</i>
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (mode === "loading") {
    return (
      <main className="center-shell loading-shell">
        <div className="loading-mark"><span /></div>
        <h1>12 Axes</h1>
        <p>{text.loading}</p>
      </main>
    );
  }

  if (mode === "quiz" && currentQuestion) {
    return (
      <main className="app-shell quiz-shell">
        <AppHeader locale={locale} onLocale={switchLocale} compact onHome={() => setMode("home")} action={text.retake} onAction={reset} />
        <div className="progress-wrap" aria-label={text.progress(questionIndex + 1, questions.length)}>
          <div className="progress-copy"><span>{currentAxis?.label}</span><b>{text.progress(questionIndex + 1, questions.length)}</b></div>
          <div className="progress-track"><span style={{ width: `${(questionIndex + 1) / questions.length * 100}%` }} /></div>
        </div>
        <section className="question-card">
          <header>
            <span className="question-axis">{currentAxis?.leftPole} ↔ {currentAxis?.rightPole}</span>
            <h1>{currentQuestion.text}</h1>
          </header>
          <div className="answer-grid" role="radiogroup">
            {data?.answerOptions.map((option, index) => (
              <button
                key={option.id}
                className={answers[currentQuestion.id] === option.id ? "answer-button selected" : "answer-button"}
                role="radio"
                aria-checked={answers[currentQuestion.id] === option.id}
                onClick={() => answerQuestion(option.id)}
              >
                <span>{["＋＋", "＋", "•", "−", "−−"][index]}</span>
                <b>{option.label}</b>
              </button>
            ))}
          </div>
        </section>
        <nav className="quiz-actions">
          <button className="secondary-button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((value) => Math.max(0, value - 1))}>← {text.back}</button>
          {questionIndex < questions.length - 1
            ? <button className="primary-button" disabled={!answers[currentQuestion.id]} onClick={() => setQuestionIndex((value) => Math.min(questions.length - 1, value + 1))}>{text.next} →</button>
            : <button className="primary-button" disabled={!answers[currentQuestion.id]} onClick={() => variant === "short" && questions.length === 36 ? setMode("extend") : finish()}>{text.seeResult} →</button>}
        </nav>
        {error && <p className="inline-error" role="alert">{error}</p>}
      </main>
    );
  }

  if (mode === "extend") {
    return (
      <main className="app-shell quiz-shell">
        <AppHeader locale={locale} onLocale={switchLocale} compact onHome={() => setMode("home")} />
        <section className="question-card extend-card">
          <span className="eyebrow">{text.progress(36, 60)}</span>
          <h1>{text.extendTitle}</h1>
          <div className="answer-grid two">
            <button className="answer-button" onClick={extendQuiz}><span>✓</span><b>{text.extendYes}</b></button>
            <button className="answer-button" onClick={finish}><span>×</span><b>{text.extendNo}</b></button>
          </div>
        </section>
        <button className="secondary-button back-alone" onClick={() => { setMode("quiz"); setQuestionIndex(questions.length - 1); }}>← {text.back}</button>
      </main>
    );
  }

  if (mode === "results" && result) {
    return (
      <main className="app-shell result-shell">
        <AppHeader locale={locale} onLocale={switchLocale} compact onHome={() => setMode("home")} action={text.retake} onAction={reset} />
        <section className="result-intro">
          <span className="eyebrow">{text.resultEyebrow}</span>
          <h1>{text.resultTitle}</h1>
          <p>{text.resultLead}</p>
        </section>
        <ResultMatch match={result.topMatch} label={text.topMatch} locale={locale} large />
        <section className="axis-results" aria-label="12 axes">
          {result.axes.map((axis) => {
            const localizedAxis = data?.axes.find((item) => item.id === axis.axisId);
            return <article className="axis-result" key={axis.axisId}>
              <header><h2>{localizedAxis?.label ?? axis.label}</h2><span>{axis.intensity} · {axis.dominantPole}</span></header>
              <div className="axis-labels"><b>{localizedAxis?.leftPole ?? axis.leftPole} {Math.round(axis.leftPercent)}%</b><b>{Math.round(axis.rightPercent)}% {localizedAxis?.rightPole ?? axis.rightPole}</b></div>
              <div className="axis-bar"><span style={{ width: `${axis.leftPercent}%` }} /><i style={{ left: `${axis.leftPercent}%` }} /></div>
            </article>;
          })}
        </section>
        <section className="result-section">
          <div className="section-heading"><span className="eyebrow">{text.otherMatches}</span><h2>{text.otherMatches}</h2></div>
          <div className="match-grid">{result.matches.slice(1, 4).map((match) => <ResultMatch match={match} locale={locale} key={match.ideologyId} />)}</div>
        </section>
        <section className="entity-card">
          <div className="entity-image">◎</div>
          <div><span className="eyebrow">{text.country}</span><h2>{result.topCountryMatch.name}</h2><p className="entity-tags">{result.topCountryMatch.category} {result.topCountryMatch.period}</p><p>{result.topCountryMatch.description}</p></div>
          <strong>{Math.round(result.topCountryMatch.compatibility)}% {auxiliaryUi[locale].match}</strong>
        </section>
        <section className="entity-card">
          <div className="entity-image green">{initials(result.topPersonalityMatch.name)}</div>
          <div><span className="eyebrow">{text.personality}</span><h2>{result.topPersonalityMatch.name}</h2><p className="entity-tags">{result.topPersonalityMatch.role} {result.topPersonalityMatch.lifespan}</p><p>{result.topPersonalityMatch.description}</p></div>
          <strong>{Math.round(result.topPersonalityMatch.compatibility)}% {auxiliaryUi[locale].match}</strong>
        </section>
        <div className="result-actions">
          <button className="secondary-button" onClick={reset}>{text.retake}</button>
          <button className="primary-button" onClick={shareResult}>{copied ? text.copied : text.share} ↗</button>
        </div>
      </main>
    );
  }

  return (
    <main className="home-shell">
      <AppHeader locale={locale} onLocale={switchLocale} onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
      <section className="hero" id="content">
        <div className="hero-copy">
          <span className="eyebrow">{text.eyebrow}</span>
          <h1>{text.titleA}<br /><em>{text.titleB}</em>?</h1>
          <p>{text.lead}</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setMode("format")}>{text.start} →</button>
            <a className="secondary-button" href="#axes">{text.axesLink}</a>
          </div>
          <div className="trust-row">{text.labels.map((label) => <span key={label}>✓ {label}</span>)}</div>
        </div>
        <ExampleCard locale={locale} />
      </section>
      <section className="section-block">
        <span className="eyebrow">{text.discoverEyebrow}</span>
        <h2>{text.discoverTitle}</h2>
        <p className="section-lead">{text.discoverLead}</p>
        <div className="discovery-grid">{text.discovery.map(([title, description], index) => <article key={title}><span>{["◎", "◇", "☆", "↔", "◫", "%"][index]}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>
      <section className="section-block example-section">
        <span className="eyebrow">{exampleUi[locale].real}</span><h2>{exampleUi[locale].title}</h2>
        <ResultPreview locale={locale} />
        <button className="primary-button centered" onClick={() => setMode("format")}>{text.start} →</button>
      </section>
      <section className="section-block" id="how">
        <span className="eyebrow">{auxiliaryUi[locale].how}</span><h2>{text.howTitle}</h2><p className="section-lead">{text.howLead}</p>
        <div className="how-grid">{text.how.map(([title, description], index) => <article key={title}><b>{index + 1}</b><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>
      <section className="section-block" id="axes">
        <span className="eyebrow">{auxiliaryUi[locale].axes}</span><h2>{text.axesTitle}</h2>
        <div className="axes-grid">{axisExplanations[locale].map((axis, index) => <article key={axis}><small>{String(index + 1).padStart(2, "0")}</small><h3>{axis}</h3></article>)}</div>
      </section>
      <section className="spectrum-section" id="spectrum">
        <div className="section-block"><span className="eyebrow">{auxiliaryUi[locale].spectrum}</span><h2>{text.spectrumTitle}</h2><p className="section-lead">{text.spectrumLead}</p>
          <div className="spectrum-grid">{text.spectrum.map((item, index) => <article key={item} style={{ "--spectrum": `${index * 42}deg` } as React.CSSProperties}><span /><h3>{item}</h3></article>)}</div>
        </div>
      </section>
      <section className="section-block" id="faq">
        <span className="eyebrow">FAQ</span><h2>{text.faqTitle}</h2>
        <div className="faq-list">{text.faq.map(([question, answer]) => <details key={question}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div>
      </section>
      <section className="section-block versions-section">
        <span className="eyebrow">{auxiliaryUi[locale].versions}</span><h2>{text.versions}</h2><p className="section-lead">{text.versionsLead}</p>
        <div className="format-grid">{text.formats.map(([id, label, count, description, duration]) => <button className={`format-card ${id === "extended" ? "featured" : ""}`} key={id} onClick={() => chooseVariant(id as Variant)}><strong>{label}</strong><b>{count}</b><span>{description}</span><small>{duration}</small><i>{text.startVersion} →</i></button>)}</div>
      </section>
      <section className="support-section" id="support">
        <span className="eyebrow">{text.support}</span><h2>{text.supportTitle}</h2><p>{text.supportLead}</p>
        <div className="privacy-pill">⌁ {auxiliaryUi[locale].privacy}</div>
      </section>
      <Footer locale={locale} />
      {error && <p className="inline-error floating-error" role="alert">{error}</p>}
    </main>
  );
}

function AppHeader({ locale, onLocale, compact = false, onHome, action, onAction }: { locale: Locale; onLocale: (locale: string) => void; compact?: boolean; onHome: () => void; action?: string; onAction?: () => void }) {
  const text = copy[locale];
  return (
    <header className={`site-header ${compact ? "compact" : ""}`}>
      <button className="logo" onClick={onHome} aria-label="12 Axes home"><b>12</b><span>axes</span></button>
      {!compact && <nav aria-label="Main navigation"><a href="#how">{text.nav[0]}</a><a href="#axes">{text.nav[1]}</a><a href="#spectrum">{text.nav[2]}</a><a href="#faq">{text.nav[3]}</a><a href="#support">{text.support}</a></nav>}
      <div className="header-tools">
        {action && <button className="header-action" onClick={onAction}>{action} →</button>}
        <select aria-label="Language" value={locale} onChange={(event) => onLocale(event.target.value)}>
          {locales.map((item) => <option value={item} key={item}>{localeNames[item]}</option>)}
        </select>
      </div>
    </header>
  );
}

function ExampleCard({ locale }: { locale: Locale }) {
  const text = exampleUi[locale];
  return (
    <div className="hero-result">
      <div className="hero-result-top"><span>{text.example}</span><small>{text.position}</small><div className="mini-ring"><b>88%</b><i>{text.match}</i></div><h2>Brazilian Integralism</h2><p>{text.description}</p></div>
      <div className="teaser-grid"><article><div className="placeholder-image">◎</div><small>{text.country}</small><h3>Empire of Brazil</h3><p>{text.countryDescription}</p><b>62%</b></article><article><div className="placeholder-image green">PS</div><small>{text.personality}</small><h3>Plínio Salgado</h3><p>{text.personalityDescription}</p><b>97%</b></article></div>
    </div>
  );
}

function ResultPreview({ locale }: { locale: Locale }) {
  const text = exampleUi[locale];
  const preview = [
    ["Representation", "Democracy", 13, "Autocracy", 87],
    ["Economy", "Public", 68, "Private", 32],
    ["Morality", "Progressive", 5, "Traditionalist", 95],
  ] as const;
  return (
    <div className="result-preview">
      <div className="preview-head"><div><span>{text.position}</span><h3>Brazilian Integralism</h3><p>{text.description}</p></div><div className="mini-ring large"><b>88%</b><i>{text.match}</i></div></div>
      {preview.map(([title, left, leftValue, right, rightValue]) => <article className="axis-result" key={title}><header><h3>{title}</h3></header><div className="axis-labels"><b>{left} {leftValue}%</b><b>{rightValue}% {right}</b></div><div className="axis-bar"><span style={{ width: `${leftValue}%` }} /><i style={{ left: `${leftValue}%` }} /></div></article>)}
    </div>
  );
}

function ResultMatch({ match, locale, label, large = false }: { match: Match; locale: Locale; label?: string; large?: boolean }) {
  return (
    <article className={`match-card ${large ? "large" : ""}`}>
      {label && <span className="eyebrow">{label}</span>}
      <div className="match-title"><div><small>{match.category}</small><h2>{match.name}</h2></div><div className="mini-ring"><b>{Math.round(match.compatibility)}%</b><i>{auxiliaryUi[locale].match}</i></div></div>
      <p>{match.description}</p>
    </article>
  );
}

function Footer({ locale }: { locale: Locale }) {
  const [results, ideologies, privacy, license] = auxiliaryUi[locale].footer;
  return (
    <footer>
      <a className="logo" href={localePath(locale)}><b>12</b><span>axes</span></a>
      <p>{copy[locale].footer}</p>
      <nav><a href={localePath(locale, "/vercel-app")}>12axes Vercel app</a><a href={localePath(locale, "/results")}>{results}</a><a href={localePath(locale, "/ideologies")}>{ideologies}</a><a href={localePath(locale, "/privacy")}>{privacy}</a><a href={localePath(locale, "/license")}>{license}</a></nav>
    </footer>
  );
}
