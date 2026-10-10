"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { commerceSlugs, commerceLabels } from "./CommercePage";
import { ReportRecovery } from "./ReportRecovery";
import { reportUi, axisReading, privateLinkLabel } from "./report-copy";
import { trackEvent, rememberCheckout, trackPurchase } from "./Analytics";
import { DeepReport } from "./DeepReport";
import { deepCopy, compactPlanFeatures } from "./deep-copy";
import { quizVersion } from "./lib/quiz-version";
import type { DeepReportData, QuizEvidence } from "./lib/quiz-evidence";
import type { ReportPlan } from "./lib/report-access";
import { PlusReport } from "./PlusReport";
import { plusCopy } from "./plus-copy";
import { resultOfferCopy } from "./result-offer-copy";
import { SharePanel } from "./SharePanel";
import { ResultSummary } from "./ResultSummary";
import { resultSummaryCopy } from "./result-summary-copy";
import type { PlusReportData } from "./lib/matching";
import { homeTitles, homeDescriptions, homeSchema } from "./home-seo";
import { CurrencyEstimate } from "./CurrencyEstimate";
import { axisExplanations, contactLabels, copy, htmlLang, localeNames, localePath, locales, publicContactUrl, type Locale } from "./i18n";

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
type SavedTest = { version: string; savedAt: number; mode: "quiz" | "extend" | "results"; variant: Variant; questionIds: string[]; answers: Record<string, string>; questionIndex: number };
const savedTestKey = "12axes-local-test";


function deviceClass() {
  return window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop";
}

const exampleUi = {
  en: { example: "Example result", position: "Third position", match: "match", country: "Most compatible country", personality: "Most compatible personality", description: "Authoritarian nationalist movement that emerged in 1930s Brazil, with a Christian and corporatist base.", countryDescription: "Parliamentary monarchy with a strong central state.", personalityDescription: "Leader of Brazilian Integralism.", real: "Real example", title: "Here's what your result looks like" },
  pt: { example: "Resultado de exemplo", position: "Terceira posição", match: "compatível", country: "País mais compatível", personality: "Personalidade mais compatível", description: "Movimento nacionalista autoritário surgido no Brasil dos anos 1930, de base cristã e corporativista.", countryDescription: "Monarquia parlamentar com Estado central forte.", personalityDescription: "Líder do Integralismo Brasileiro.", real: "Exemplo real", title: "Veja como é o seu resultado" },
  es: { example: "Resultado de ejemplo", position: "Tercera posición", match: "coincide", country: "País más compatible", personality: "Personalidad más compatible", description: "Movimiento nacionalista autoritario surgido en Brasil en los años 1930, de base cristiana y corporativista.", countryDescription: "Monarquía parlamentaria con un Estado central fuerte.", personalityDescription: "Líder del Integralismo Brasileño.", real: "Ejemplo real", title: "Así se verá tu resultado" },
  ru: { example: "Пример результата", position: "Третья позиция", match: "совпадение", country: "Ближайшая страна", personality: "Ближайшая личность", description: "Авторитарное националистическое движение, возникшее в Бразилии в 1930-х годах.", countryDescription: "Парламентская монархия с сильным центром.", personalityDescription: "Лидер бразильского интегрализма.", real: "Пример", title: "Как выглядит результат" },
  zh: { example: "结果示例", position: "第三位置", match: "匹配", country: "最匹配的国家", personality: "最匹配的人物", description: "20 世纪 30 年代兴起于巴西的威权民族主义运动，具有基督教与法团主义基础。", countryDescription: "拥有强大中央国家的议会君主制。", personalityDescription: "巴西整合主义运动领导人。", real: "真实示例", title: "你的结果会是这样" },
} as const;

const previewAxes = {
  en: [["Representation", "Democracy", 13, "Autocracy", 87], ["Economy", "Public", 68, "Private", 32], ["Morality", "Progressive", 5, "Traditionalist", 95]],
  pt: [["Representação", "Democracia", 13, "Autocracia", 87], ["Economia", "Público", 68, "Privado", 32], ["Moralidade", "Progressista", 5, "Tradicionalista", 95]],
  es: [["Representación", "Democracia", 13, "Autocracia", 87], ["Economía", "Público", 68, "Privado", 32], ["Moralidad", "Progresista", 5, "Tradicionalista", 95]],
  ru: [["Представительство", "Демократия", 13, "Автократия", 87], ["Экономика", "Общественное", 68, "Частное", 32], ["Мораль", "Прогрессизм", 5, "Традиционализм", 95]],
  zh: [["政治代表", "民主", 13, "威权", 87], ["经济", "公共", 68, "私营", 32], ["道德", "进步", 5, "传统", 95]],
} as const;

const auxiliaryUi = {
  en: { recommended: "Recommended", match: "match", how: "How it works", axes: "12 axes", spectrum: "Political spectrum", versions: "Versions", privacy: "No account · Scoring in this browser", loadError: "The question bank could not be loaded. Please try again.", resultError: "The result service is temporarily unavailable. Your answers remain in this browser.", answerError: "Please answer every question before viewing the result.", fallbackNote: "", footer: ["All results", "Ideologies", "Privacy", "License"] },
  pt: { recommended: "Recomendado", match: "compatível", how: "Como funciona", axes: "12 eixos", spectrum: "Espectro político", versions: "Versões", privacy: "Sem conta · Pontuação neste navegador", loadError: "Não foi possível carregar as perguntas. Tente novamente.", resultError: "O serviço de resultados está indisponível. Suas respostas continuam neste navegador.", answerError: "Responda a todas as perguntas antes de ver o resultado.", fallbackNote: "", footer: ["Todos os resultados", "Ideologias", "Privacidade", "Licença"] },
  es: { recommended: "Recomendado", match: "coincide", how: "Cómo funciona", axes: "12 ejes", spectrum: "Espectro político", versions: "Versiones", privacy: "Sin cuenta · Cálculo en este navegador", loadError: "No se pudieron cargar las preguntas. Inténtalo de nuevo.", resultError: "El servicio de resultados no está disponible. Tus respuestas siguen en este navegador.", answerError: "Responde todas las preguntas antes de ver el resultado.", fallbackNote: "", footer: ["Todos los resultados", "Ideologías", "Privacidad", "Licencia"] },
  ru: { recommended: "Рекомендуем", match: "совпадение", how: "Как это работает", axes: "12 осей", spectrum: "Политический спектр", versions: "Версии", privacy: "Без аккаунта · Расчёт в браузере", loadError: "Не удалось загрузить вопросы. Попробуйте ещё раз.", resultError: "Сервис результатов временно недоступен. Ответы остаются в браузере.", answerError: "Ответьте на все вопросы перед просмотром результата.", fallbackNote: "", footer: ["Все результаты", "Идеологии", "Конфиденциальность", "Лицензия"] },
  zh: { recommended: "推荐", match: "匹配", how: "测试原理", axes: "12 个轴", spectrum: "政治光谱", versions: "测试版本", privacy: "无需账户 · 浏览器内计分", loadError: "题库加载失败，请重试。", resultError: "结果服务暂时不可用，你的回答仍保留在当前浏览器中。", answerError: "请回答全部问题后再查看结果。", fallbackNote: "", footer: ["全部结果", "意识形态", "隐私", "许可"] },
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

export function TestApp({ locale: initialLocale }: { locale: Locale }) {
  const [locale, setLocale] = useState(initialLocale);
  const [dataLocale, setDataLocale] = useState(initialLocale);
  const [resultLocale, setResultLocale] = useState(initialLocale);
  const text = copy[locale];
  const [mode, setMode] = useState<Mode>("home");
  const [data, setData] = useState<QuizData | null>(null);
  const [variant, setVariant] = useState<Variant>("short");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerPending, setAnswerPending] = useState(false);
  const advanceTimer = useRef<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [privateLinkCopied, setPrivateLinkCopied] = useState(false);
  const [reportToken, setReportToken] = useState<string | null>(null);
  const [resultAxes, setResultAxes] = useState<number[]>([]);
  const [resultQuizLength, setResultQuizLength] = useState(0);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [reportConsent, setReportConsent] = useState(true);
  const [reportPending, setReportPending] = useState(false);
  const resultOfferRef = useRef<HTMLElement>(null);
  const resultEntry = useRef("quiz");
  const seenResultEvents = useRef(new Set<string>());
  const viewedReportToken = useRef<string | null>(null);
  const quizMeasurement = useRef<{ id: string; entry: string; seen: Set<string> } | null>(null);
  const measurementEntry = useRef("midway");
  const [paid, setPaid] = useState(false);
  const [plan, setPlan] = useState<ReportPlan>("basic");
  const [plus, setPlus] = useState<PlusReportData | null>(null);
  const plusText = plusCopy[locale];
  const deepText = deepCopy[locale];
  const offerText = resultOfferCopy[locale];
  const [deep, setDeep] = useState<DeepReportData | null>(null);
  const [answerConsent, setAnswerConsent] = useState(true);
  const [hasOriginal, setHasOriginal] = useState(false);
  const [originalView, setOriginalView] = useState(false);
  const [entitlement, setEntitlement] = useState<ReportPlan>("basic");
  const [upgradeContext, setUpgradeContext] = useState<{ token: string; plan: ReportPlan } | null>(null);
  const [savedTest, setSavedTest] = useState<SavedTest | null>(null);
  const [saveLocal, setSaveLocal] = useState(true);
  const [localSaved, setLocalSaved] = useState(false);
  const currentEvidence: QuizEvidence | null = deep?.evidence ?? (questions.length > 0 && questions.every(q => answers[q.id]) ? { version: quizVersion, questionIds: questions.map(q => q.id), answers: questions.map(q => answers[q.id]) } : null);
  const neutralCount = deep?.neutralCount ?? questions.filter(q => data?.answerOptions.find(a => a.id === answers[q.id])?.scoreTowardAgreement === 0.5).length;

  const measureQuiz = useCallback((name: string, length: number, params: Record<string, string | number> = {}) => {
    try {
      if (!window.gtag || window.localStorage.getItem("12axes:analytics-consent") !== "granted") return false;
      if (!quizMeasurement.current) {
        quizMeasurement.current = { id: crypto.randomUUID(), entry: measurementEntry.current, seen: new Set() };
        if (!["quiz_start", "quiz_resume", "quiz_observation_start"].includes(name)) {
          quizMeasurement.current.seen.add("quiz_observation_start:" + length + ":");
          trackEvent("quiz_observation_start", { variant: "baseline", language: locale, device: deviceClass(), quiz_length: length, quiz_run_id: quizMeasurement.current.id, measurement_entry: measurementEntry.current });
        }
      }
      const measurement = quizMeasurement.current;
      const key = name + ":" + length + ":" + (params.progress_stage ?? params.choice ?? "");
      if (measurement.seen.has(key)) return true;
      trackEvent(name, { variant: "baseline", language: locale, device: deviceClass(), quiz_length: length, quiz_run_id: measurement.id, measurement_entry: measurement.entry, ...params });
      measurement.seen.add(key);
      return true;
    } catch { return false; }
  }, [locale]);

  useEffect(() => {
    if (!["quiz", "extend"].includes(mode)) return;
    const observe = () => {
      if (!quizMeasurement.current) measureQuiz("quiz_observation_start", questions.length);
      const stage = Math.floor(Object.keys(answers).length / questions.length * 4) * 25;
      if (stage > 0) measureQuiz("quiz_progress", questions.length, { progress_stage: stage });
      if (mode === "extend") measureQuiz("quiz_extend_view", questions.length);
    };
    observe();
    window.addEventListener("analytics-ready", observe);
    return () => window.removeEventListener("analytics-ready", observe);
  }, [mode, questions.length, answers, measureQuiz]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
    try {
      const value = JSON.parse(localStorage.getItem(savedTestKey) || "null");
      if (value && value.version === quizVersion && Date.now() - value.savedAt < 30 * 86400000 && ["quiz", "extend", "results"].includes(value.mode) && ["short", "extended", "extreme"].includes(value.variant) && Array.isArray(value.questionIds) && [36, 60, 240].includes(value.questionIds.length) && new Set(value.questionIds).size === value.questionIds.length && value.answers && typeof value.answers === "object" && Number.isInteger(value.questionIndex) && value.questionIndex >= 0 && value.questionIndex < value.questionIds.length) setSavedTest(value);
      else localStorage.removeItem(savedTestKey);
    } catch { /* Storage may be blocked by the browser. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!saveLocal || paid || !questions.length || !["quiz", "extend", "results"].includes(mode)) return;
    const value: SavedTest = { version: quizVersion, savedAt: Date.now(), mode: mode as SavedTest["mode"], variant, questionIds: questions.map(q => q.id), answers, questionIndex };
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(savedTestKey, JSON.stringify(value)); setLocalSaved(true); }
      catch { setLocalSaved(false); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [saveLocal, paid, questions, answers, questionIndex, mode, variant]);

  function discardLocal() {
    try { localStorage.removeItem(savedTestKey); } catch { /* Storage can be disabled. */ }
    setSavedTest(null); setSaveLocal(false); setLocalSaved(false);
  }

  async function resumeTest() {
    if (!savedTest) return;
    try {
      const bank = await loadData();
      const selected = savedTest.questionIds.map(id => bank.questions.find(q => q.id === id));
      if (selected.some(q => !q) || Object.entries(savedTest.answers).some(([id, value]) => !savedTest.questionIds.includes(id) || !bank.answerOptions.some(option => option.id === value))) throw new Error();
      quizMeasurement.current = null; measurementEntry.current = "resume";
      if (savedTest.mode !== "results" && !measureQuiz("quiz_resume", selected.length)) measurementEntry.current = "midway";
      setQuestions(selected as Question[]); setAnswers(savedTest.answers); setQuestionIndex(savedTest.questionIndex); setVariant(savedTest.variant); setSaveLocal(true); setSavedTest(null);
      setPrivateLinkCopied(false);
      if (savedTest.mode === "results" && selected.every(q => savedTest.answers[q!.id])) await fetchResult(calculateAxes(selected as Question[], savedTest.answers, bank), selected.length, "local_resume");
      else setMode(savedTest.mode === "extend" ? "extend" : "quiz");
    } catch { setError(deepText.resumeError); discardLocal(); }
  }

  function prepareDeepRetake() {
    const previous = paid && reportToken ? { token: reportToken, plan: entitlement } : upgradeContext;
    reset(); setUpgradeContext(previous);
    if (previous) window.history.replaceState(null, "", localePath(locale) + "#upgrade=" + previous.token);
  }

  async function downloadImage() {
    if (!result) return;
    setError("");
    try {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = 1080; canvas.height = 1450;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#f8faf7"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#143c28"; ctx.font = "bold 46px sans-serif"; ctx.fillText("12Axes", 60, 82);
      ctx.font = "bold 34px sans-serif"; ctx.fillText(result.topMatch.name, 60, 143, 960);
      ctx.font = "24px sans-serif"; ctx.fillText("12axes.net · " + result.topMatch.compatibility + "% " + auxiliaryUi[locale].match, 60, 190);
      result.axes.forEach((axis, index) => {
        const y = 255 + index * 91;
        ctx.fillStyle = "#143c28"; ctx.font = "bold 24px sans-serif"; ctx.fillText(axis.label, 60, y, 900);
        ctx.font = "20px sans-serif"; ctx.fillText(axis.leftPole + " " + Math.round(axis.leftPercent) + "%", 60, y + 28, 450);
        ctx.textAlign = "right"; ctx.fillText(Math.round(axis.rightPercent) + "% " + axis.rightPole, 1020, y + 28, 450); ctx.textAlign = "left";
        ctx.fillStyle = "#d3dacf"; ctx.fillRect(60, y + 42, 960, 18); ctx.fillStyle = "#187b49"; ctx.fillRect(60, y + 42, 960 * axis.leftPercent / 100, 18);
      });
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("PNG export failed")), "image/png"));
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a"); link.href = url; link.download = "12axes-result.png"; link.click();
      } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
      try { trackEvent("download_result", { variant: experimentVariant, language: locale, device: deviceClass(), quiz_length: resultQuizLength }); }
      catch { /* Analytics must not affect a completed download. */ }
    } catch { setError(resultOfferCopy[locale].downloadError); }
  }

  const experimentVariant = "baseline";
  const paidText = reportUi[locale];

  useEffect(() => () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
  }, []);

  function cancelAdvance() {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setAnswerPending(false);
  }

  function goToQuestion(index: number) {
    cancelAdvance();
    setQuestionIndex(index);
  }

  async function loadData() {
    if (data && dataLocale === locale) return data;
    const response = await fetch(`/data/quiz.${locale}.json`);
    const payload = await response.json() as QuizData;
    if (!response.ok) throw new Error();
    setData(payload);
    setDataLocale(locale);
    return payload;
  }

  async function chooseVariant(nextVariant: Variant) {
    setError("");
    setVariant(nextVariant);
    try {
      const payload = await loadData();
      const chosen = selectQuestions(payload, nextVariant);
      setSaveLocal(true);
      setLocalSaved(false);
      setPrivateLinkCopied(false);
      setPaid(false); setPlan("basic"); setPlus(null); setDeep(null); setReportToken(null); setHasOriginal(false); setOriginalView(false); setEntitlement("basic"); setAnswerConsent(true);
      setQuestions(chosen);
      setAnswers({});
      setQuestionIndex(0);
      setResult(null);
      setMode("quiz");
      quizMeasurement.current = null; measurementEntry.current = "start";
      if (!measureQuiz("quiz_start", chosen.length)) measurementEntry.current = "midway";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(auxiliaryUi[locale].loadError);
    }
  }

  function answerQuestion(answer: string) {
    const current = questions[questionIndex];
    if (!current || advanceTimer.current !== null) return;
    setAnswers((previous) => ({ ...previous, [current.id]: answer }));
    setError("");
    const lastQuestion = questionIndex === questions.length - 1;
    if (lastQuestion && !(variant === "short" && questions.length === 36)) return;
    setAnswerPending(true);
    // Lock synchronously so rapid clicks cannot queue multiple advances before rendering.
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null;
      setAnswerPending(false);
      if (lastQuestion) setMode("extend");
      else setQuestionIndex(questionIndex + 1);
    }, 180);
  }

  function extendQuiz() {
    if (!data) return;
    measureQuiz("quiz_extend_choice", questions.length, { choice: "extend" });
    const additions = extraQuestions(data, new Set(questions.map((question) => question.id)));
    setQuestions((current) => [...current, ...additions]);
    setQuestionIndex(questions.length);
    setMode("quiz");
  }

  function calculateAxes(selected = questions, chosen = answers, bank = data) {
    if (!bank) return [];
    const scores = new Map<string, number[]>();
    const optionScores = new Map(bank.answerOptions.map((option) => [option.id, option.scoreTowardAgreement]));
    for (const question of selected) {
      const agreement = optionScores.get(chosen[question.id]);
      if (agreement === undefined) continue;
      const left = question.agreePole === "LEFT" ? agreement : 1 - agreement;
      scores.set(question.axisId, [...(scores.get(question.axisId) ?? []), left]);
    }
    return bank.axes.map((axis) => {
      const values = scores.get(axis.id) ?? [0.5];
      return Math.round(values.reduce((total, value) => total + value, 0) / values.length * 100);
    });
  }

  async function fetchResult(axes: number[], length = questions.length, entryType = "quiz") {
    setMode("loading");
    setError("");
    setResultAxes(axes);
    setResultQuizLength(length);
    seenResultEvents.current.clear();
    viewedReportToken.current = null;
    resultEntry.current = entryType;
    try {
      await loadData();
      const response = await fetch("/api/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ axes, locale }) });
      if (!response.ok) throw new Error();
      const payload = await response.json() as Result;
      setResult(payload);
      setResultLocale(locale);
      setMode("results");
    } catch {
      trackEvent("result_load_error", { language: locale, device: deviceClass(), quiz_length: length, entry_type: entryType, error_type: "request_failed" });
      setError(auxiliaryUi[locale].resultError);
      setMode(questions.length || entryType === "local_resume" ? "quiz" : "home");
    }
  }

  async function finish() {
    cancelAdvance();
    if (questions.some((question) => !answers[question.id])) {
      setError(auxiliaryUi[locale].answerError);
      const missing = questions.findIndex((question) => !answers[question.id]);
      if (missing >= 0) setQuestionIndex(missing);
      setMode("quiz");
      return;
    }
    const axes = calculateAxes();
    measureQuiz("quiz_complete", questions.length);
    await fetchResult(axes);
  }

  async function fetchSharedResult(id: string) {
    setMode("loading");
    try {
      const response = await fetch("/api/share?id=" + encodeURIComponent(id));
      if (!response.ok) throw new Error();
      const payload = await response.json() as { axes: number[]; quizLength: number };
      await fetchResult(payload.axes, payload.quizLength, "share");
    } catch {
      setError(auxiliaryUi[locale].resultError);
      setMode("home");
    }
  }

  async function fetchPaidReport(token: string, preview = false, original = originalView) {
    setMode("loading");
    setError("");
    try {
      const response = await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, preview, locale, original }) });
      const payload = await response.json() as { status: string; axes: number[]; result: Result; quizLength: number; plan: ReportPlan; plus: PlusReportData | null; deep: DeepReportData | null; hasOriginal: boolean; entitlement: ReportPlan; evidence?: QuizEvidence };
      if (payload.status === "preview") {
        setReportPending(false);
        if (payload.evidence?.version === quizVersion) {
          const bank = await loadData();
          const evidence = payload.evidence;
          setQuestions(evidence.questionIds.map(id => bank.questions.find(q => q.id === id)!));
          setAnswers(Object.fromEntries(evidence.questionIds.map((id, index) => [id, evidence.answers[index]])));
        }
        trackEvent("checkout_cancel", { language: locale, device: deviceClass(), quiz_length: payload.quizLength });
        await fetchResult(payload.axes, payload.quizLength, "checkout_cancel");
        return;
      }
      if (payload.status === "pending") { setReportPending(true); return; }
      if (!response.ok || payload.status !== "paid") throw new Error();
      await loadData();
      if (viewedReportToken.current !== token) seenResultEvents.current.clear();
      viewedReportToken.current = token;
      resultEntry.current = "paid_report";
      setPaid(true);
      setPlan(payload.plan);
      setPlus(payload.plus);
      setDeep(payload.deep); setHasOriginal(payload.hasOriginal); setEntitlement(payload.entitlement);
      setReportPending(false);
      setResultAxes(payload.axes);
      setResultQuizLength(payload.quizLength);
      setResult(payload.result);
      setResultLocale(locale);
      setMode("results");
    } catch {
      setReportPending(false);
      setError(paidText.reportError);
      setMode("home");
    }
  }

  useEffect(() => {
    if (!paid || !reportToken || !new URLSearchParams(window.location.search).has("paid")) return;
    const measure = () => { void trackPurchase(reportToken); };
    measure();
    window.addEventListener("analytics-ready", measure);
    return () => window.removeEventListener("analytics-ready", measure);
  }, [paid, reportToken]);

  async function startCheckout(selectedPlan: ReportPlan) {
    if (!result || checkoutBusy || !reportConsent) return;
    if (selectedPlan === "deep" && (!currentEvidence || !answerConsent)) return;
    setCheckoutBusy(true);
    setError("");
    trackEvent("checkout_start", { plan: selectedPlan, variant: experimentVariant, language: locale, device: deviceClass(), quiz_length: resultQuizLength });
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ axes: resultAxes, locale, variant: experimentVariant, quizLength: resultQuizLength, consent: reportConsent, plan: selectedPlan, ...(selectedPlan === "deep" ? { evidence: currentEvidence, answerConsent } : {}), ...(paid && reportToken ? { upgradeToken: reportToken } : selectedPlan === "deep" && upgradeContext ? { upgradeToken: upgradeContext.token } : {}) }) });
      if (!response.ok) throw new Error();
      const payload = await response.json() as { url: string; orderId: string };
      trackEvent("checkout_create_success", { plan: selectedPlan, variant: experimentVariant, language: locale, device: deviceClass(), quiz_length: resultQuizLength });
      rememberCheckout(payload.orderId);
      window.location.assign(payload.url);
    } catch {
      trackEvent("checkout_create_error", { plan: selectedPlan, variant: experimentVariant, language: locale, device: deviceClass(), quiz_length: resultQuizLength, error_type: "request_failed" });
      setError(paidText.checkoutError);
      setCheckoutBusy(false);
    }
  }

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("upgrade");
    if (!token) return;
    const controller = new AbortController();
    async function restoreUpgrade() {
      try {
        const response = await fetch("/api/report", { method: "POST", signal: controller.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
        const payload = await response.json() as { status: string; entitlement: ReportPlan };
        if (!controller.signal.aborted && response.ok && payload.status === "paid" && payload.entitlement !== "deep") setUpgradeContext({ token: token!, plan: payload.entitlement });
      } catch { /* A revoked report cannot receive an upgrade discount. */ }
    }
    void restoreUpgrade();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!window.location.pathname.endsWith("/results")) return;
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("share");
    const report = new URLSearchParams(window.location.hash.slice(1)).get("report");
    const timeout = window.setTimeout(() => {
      if (report) {
        setReportToken(report);
        void fetchPaidReport(report, params.has("cancelled"));
      } else if (shared) {
        void fetchSharedResult(shared);
      } else if (params.has("est")) {
        const axes = ["est", "rep", "pod", "imi", "dip", "int", "eco", "con", "com", "rel", "mor", "tec"].map((key) => Number(params.get(key)));
        window.history.replaceState(null, "", localePath(locale, "/results"));
        if (axes.every((value) => Number.isFinite(value) && value >= 0 && value <= 100)) void fetchResult(axes, 0, "legacy_share");
      }
    }, 0);
    return () => window.clearTimeout(timeout);
    // Initial URL hydration only; subsequent quiz actions manage their own state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "results" || !resultOfferRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (!window.gtag || window.localStorage.getItem("12axes:analytics-consent") !== "granted") return;
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
        const element = entry.target as HTMLElement;
        const event = element.dataset.measureEvent!;
        const plan = element.dataset.plan;
        const key = event + ":" + (plan ?? "");
        if (seenResultEvents.current.has(key)) continue;
        trackEvent(event, { variant: experimentVariant, language: locale, device: deviceClass(), quiz_length: resultQuizLength, entry_type: resultEntry.current, ...(plan ? { plan, plan_state: element.dataset.planState! } : {}) });
        if (event === "plan_view" && plan === "basic") trackEvent("paywall_view", { variant: experimentVariant, language: locale, device: deviceClass(), quiz_length: resultQuizLength });
        seenResultEvents.current.add(key);
      }
    }, { threshold: 0.5 });
    const observe = () => {
      if (window.gtag && window.localStorage.getItem("12axes:analytics-consent") === "granted" && !seenResultEvents.current.has("result_view")) {
        const params = { variant: experimentVariant, language: locale, device: deviceClass(), quiz_length: resultQuizLength, entry_type: resultEntry.current };
        if (paid) trackEvent("full_report_view", { ...params, plan });
        else if (["quiz", "local_resume"].includes(resultEntry.current)) {
          if (!quizMeasurement.current && resultEntry.current !== "local_resume") measurementEntry.current = "result";
          measureQuiz("result_preview_view", resultQuizLength, params);
        } else trackEvent("result_preview_view", params);
        seenResultEvents.current.add("result_view");
      }
      observer.disconnect();
      resultOfferRef.current?.querySelectorAll("[data-measure-event]").forEach(element => observer.observe(element));
    };
    observe();
    window.addEventListener("analytics-ready", observe);
    return () => { observer.disconnect(); window.removeEventListener("analytics-ready", observe); };
  }, [mode, paid, plan, locale, resultQuizLength, result, measureQuiz]);

  useEffect(() => {
    if (mode === "results") window.scrollTo({ top: 0, behavior: "instant" });
  }, [mode]);

  function reset() {
    cancelAdvance();
    window.history.replaceState(null, "", localePath(locale));
    setMode("format");
    quizMeasurement.current = null; measurementEntry.current = "midway";
    setQuestions([]);
    setAnswers({});
    setQuestionIndex(0);
    setResult(null);
    setResultAxes([]);
    setPaid(false);
    setPlan("basic");
    setPlus(null); setDeep(null); setHasOriginal(false); setOriginalView(false); setEntitlement("basic"); setAnswerConsent(true); setUpgradeContext(null);
    discardLocal();
    setReportToken(null);
    setReportPending(false);
    setReportConsent(true);
    setError("");
  }

  function switchLocale(next: string) {
    if (!locales.includes(next as Locale)) return;
    const currentPath = window.location.pathname.replace(/^\/(pt|es|ru|zh)(?=\/|$)/, "") || "/";
    window.history.replaceState(window.history.state, "", localePath(next as Locale, currentPath) + window.location.search + window.location.hash);
    const target = next as Locale;
    setLocale(target);
    setError(current => {
      for (const source of locales) {
        if (current === resultOfferCopy[source].downloadError) return resultOfferCopy[target].downloadError;
        for (const key of ["loadError", "resultError", "answerError"] as const) if (current === auxiliaryUi[source][key]) return auxiliaryUi[target][key];
        for (const key of ["reportError", "checkoutError", "shareError"] as const) if (current === reportUi[source][key]) return reportUi[target][key];
      }
      return current;
    });
    if (currentPath === "/" || currentPath === "/results") {
      const title = currentPath === "/" ? homeTitles[target] : `${copy[target].resultTitle} — 12Axes`;
      const description = currentPath === "/" ? homeDescriptions[target] : copy[target].resultLead;
      document.title = title;
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);
      const canonical = new URL(localePath(target, currentPath), window.location.origin).href;
      document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
      for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) document.querySelector(selector)?.setAttribute("content", title);
      for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) document.querySelector(selector)?.setAttribute("content", description);
      document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
      homeSchema(target, new URL(window.location.origin)).forEach((schema, index) => {
        const node = document.querySelector(`script[data-home-schema="${index}"]`);
        if (node) node.textContent = JSON.stringify(schema);
      });
    }
    document.documentElement.lang = htmlLang[next as Locale];
    window.dispatchEvent(new CustomEvent("locale-change", { detail: next }));
  }

  useEffect(() => {
    const controller = new AbortController();
    async function translate() {
      try {
        if (data && dataLocale !== locale) {
          const response = await fetch(`/data/quiz.${locale}.json`, { signal: controller.signal });
          if (!response.ok) throw new Error();
          const translated = await response.json() as QuizData;
          if (controller.signal.aborted) return;
          const byId = new Map(translated.questions.map(question => [question.id, question]));
          setData(translated);
          setDataLocale(locale);
          setQuestions(current => current.map(question => byId.get(question.id)!));
        }
        if (result && resultLocale !== locale) {
          const response = await fetch(paid ? "/api/report" : "/api/match", {
            method: "POST", signal: controller.signal, headers: { "content-type": "application/json" },
            body: JSON.stringify(paid ? { token: reportToken, locale, original: originalView } : { axes: resultAxes, locale }),
          });
          if (!response.ok) throw new Error();
          const payload = await response.json() as Result & { status: string; result: Result; plus: PlusReportData | null; deep: DeepReportData | null };
          if (controller.signal.aborted) return;
          if (paid && payload.status !== "paid") throw new Error();
          setResult(paid ? payload.result : payload);
          if (paid) { setPlus(payload.plus); setDeep(payload.deep); }
          setResultLocale(locale);
        }
      } catch {
        if (!controller.signal.aborted) setError(auxiliaryUi[locale].loadError);
      }
    }
    void translate();
    return () => controller.abort();
  }, [locale, data, dataLocale, result, resultLocale, paid, reportToken, resultAxes, originalView]);

  const currentQuestion = questions[questionIndex];
  const currentAxis = useMemo(() => data?.axes.find((axis) => axis.id === currentQuestion?.axisId), [data, currentQuestion]);

  if (mode === "format") {
    return (
      <main className="app-shell center-shell">
        <AppHeader locale={locale} onLocale={switchLocale} compact onHome={() => setMode("home")} />
      {savedTest && <section className="resume-test"><p>{deepText.saved}</p><button className="primary-button" onClick={resumeTest}>{deepText.resume}</button><button className="text-button" onClick={discardLocal}>{deepText.discard}</button></section>}
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
        <AppHeader locale={locale} onLocale={switchLocale} compact onHome={() => setMode("home")} />
        <div className="loading-mark"><span /></div>
        <h1>12 Axes</h1>
        <p>{reportPending ? paidText.pending : text.loading}</p>
        {reportPending && reportToken && <button className="primary-button" onClick={() => fetchPaidReport(reportToken)}>{paidText.retry}</button>}
        {reportPending && <ReportRecovery locale={locale} />}
      </main>
    );
  }

  if (mode === "quiz" && currentQuestion) {
    return (
      <main className="app-shell quiz-shell">
        <AppHeader locale={locale} onLocale={switchLocale} compact onHome={() => { cancelAdvance(); setMode("home"); }} action={text.retake} onAction={reset} />
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
                aria-disabled={answerPending}
                onClick={() => answerQuestion(option.id)}
              >
                <span>{["＋＋", "＋", "•", "−", "−−"][index]}</span>
                <b>{option.label}</b>
              </button>
            ))}
          </div>
        </section>
        <nav className="quiz-actions">
          <button className="secondary-button" disabled={questionIndex === 0} onClick={() => goToQuestion(questionIndex - 1)}>← {text.back}</button>
          {questionIndex < questions.length - 1
            ? <button className="primary-button" disabled={!answers[currentQuestion.id]} onClick={() => goToQuestion(questionIndex + 1)}>{text.next} →</button>
            : <button className="primary-button" disabled={!answers[currentQuestion.id]} onClick={() => {
              cancelAdvance();
              if (variant === "short" && questions.length === 36) setMode("extend");
              else void finish();
            }}>{text.seeResult} →</button>}
        </nav>
        {saveLocal && localSaved && <p className="local-save-note">{deepText.saved} <button className="text-button" onClick={discardLocal}>{deepText.discard}</button></p>}
        {error && <p className="inline-error" role="alert">{error}</p>}
      </main>
    );
  }

  if (mode === "extend") {
    return (
      <main className="app-shell quiz-shell">
        <AppHeader locale={locale} onLocale={switchLocale} compact onHome={() => setMode("home")} />
        <section className="question-card extend-card">
          <span className="eyebrow">{text.progress(36, 36)}</span>
          <h1>{text.extendTitle}</h1>
          <p>{offerText.extendTime}</p>
          <div className="answer-grid two">
            <button className="answer-button" onClick={extendQuiz}><span>✓</span><b>{text.extendYes}</b></button>
            <button className="answer-button" onClick={() => { measureQuiz("quiz_extend_choice", questions.length, { choice: "result" }); void finish(); }}><span>→</span><b>{text.extendNo}</b></button>
          </div>
        </section>
        <button className="secondary-button back-alone" onClick={() => { setMode("quiz"); setQuestionIndex(questions.length - 1); }}>← {text.back}</button>
      </main>
    );
  }

  if (mode === "results" && result) {
    return (
      <main className="app-shell result-shell" ref={resultOfferRef}>
        <AppHeader locale={locale} onLocale={switchLocale} compact onHome={() => setMode("home")} action={text.retake} onAction={reset} />
        <div className="result-offer">
          {paid ? <ResultSummary locale={locale} result={result} quizLength={resultQuizLength} paid={paid} plan={plan} /> : <ResultMatch match={result.topMatch} label={text.topMatch} locale={locale} large />}
          <div className="result-quick-actions">
            <a className="secondary-button" href="#free-results" onClick={event => { event.preventDefault(); trackEvent("free_result_click", { language: locale, device: deviceClass(), quiz_length: resultQuizLength }); document.getElementById("free-results")?.scrollIntoView(); }}>{paid ? resultSummaryCopy[locale].readReport : deepText.freeResults} ↓</a>
            <button className="secondary-button" onClick={downloadImage}>{deepText.download}</button>
            <SharePanel key={resultAxes.join(",") + ":" + resultQuizLength} locale={resultLocale} axes={resultAxes} quizLength={resultQuizLength} result={result} />
          </div>
          <section className="paid-report-cta">
            <h2>{paid ? plan === "deep" ? deepText.name : plan === "plus" ? plusText.plus : paidText.unlocked : plusText.choose}</h2>
            <p>{paid ? resultSummaryCopy[locale].contents[plan] : plusText.optional}</p>
            {paid ? <>{hasOriginal && <p>{deepText.retestNote} <button className="text-button" onClick={() => { const original = !originalView; setOriginalView(original); void fetchPaidReport(reportToken!, false, original); }}>{originalView ? deepText.latest : deepText.original}</button></p>}<div className="result-actions">
              <button className="primary-button" onClick={() => window.print()}>{paidText.pdf}</button>
              <button className="secondary-button" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.origin + localePath(locale, "/results") + "?paid=1#report=" + reportToken);
                  setPrivateLinkCopied(true);
                  window.setTimeout(() => setPrivateLinkCopied(false), 1800);
                } catch { setError(paidText.shareError); }
              }}>{privateLinkCopied ? text.copied : privateLinkLabel[locale]}</button>
            </div></> : <>
              <label className="consent-label purchase-consent"><input type="checkbox" checked={reportConsent} onChange={(event) => setReportConsent(event.target.checked)} /><span>{paidText.consent} <a href={localePath(locale, "/privacy")}>{paidText.privacy}</a></span></label>
              {currentEvidence && <label className="consent-label purchase-consent answer-consent"><input type="checkbox" checked={answerConsent} onChange={event => setAnswerConsent(event.target.checked)} /><span>{deepText.consent}</span></label>}
              <div className="plan-options three-plans result-plan-options">
                {(["basic", "plus", "deep"] as const).map((reportPlan) => (
                  <article id={`report-${reportPlan}`} className={reportPlan === "deep" ? "deep-plan-card" : reportPlan === "plus" ? "plus-plan-card" : undefined} key={reportPlan}>
                    <span className="plan-attention-star" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 1.75 2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 16.82l-5.9 3.1 1.13-6.58-4.78-4.66 6.6-.96L12 1.75Z" /></svg></span>
                    <h3>{reportPlan === "deep" ? deepText.name : reportPlan === "basic" ? plusText.basic : plusText.plus}</h3>
                    <div className="plan-summary"><p>{offerText.purpose[reportPlan]}</p>{reportPlan === "deep" && !currentEvidence && <p className="plan-requirement">{deepText.needsQuiz}</p>}</div>
                    <p className="plan-price">{reportPlan === "deep" ? upgradeContext ? `US$${upgradeContext.plan === "plus" ? "5" : "10"}` : deepText.amount : reportPlan === "basic" ? plusText.basicAmount : plusText.plusAmount}</p>
                    <button data-measure-event="plan_view" data-plan={reportPlan} data-plan-state={reportPlan === "deep" && !currentEvidence ? "requires_quiz" : "ready"} className="primary-button report-buy-button" disabled={!reportConsent || checkoutBusy || (reportPlan === "deep" && !!currentEvidence && !answerConsent)} onClick={() => reportPlan === "deep" && !currentEvidence ? prepareDeepRetake() : startCheckout(reportPlan)}>
                      <span>{checkoutBusy ? paidText.wait : reportPlan === "deep" && !currentEvidence ? deepText.retake : <>{plusText.purchase} · <b>{reportPlan === "deep" ? upgradeContext ? `US$${upgradeContext.plan === "plus" ? "5" : "10"}` : deepText.amount : reportPlan === "basic" ? plusText.basicAmount : plusText.plusAmount}</b></>}<span aria-hidden="true"> →</span></span>
                    </button>
                    <div className="plan-estimate" data-estimated={locale !== "en"}><CurrencyEstimate locale={locale} amount={reportPlan === "deep" ? upgradeContext ? upgradeContext.plan === "plus" ? 5 : 10 : 14.99 : reportPlan === "basic" ? 4.99 : 9.99} /></div>
                    <ul className="plan-highlights">{offerText.highlights[reportPlan].map(feature => <li key={feature}>{feature}</li>)}</ul>
                  </article>
                ))}
              </div>
              <details className="plan-comparison">
                <summary>{offerText.compare}</summary>
                <table>
                  <thead><tr><th scope="col">{offerText.feature}</th>{[plusText.basicAmount, plusText.plusAmount, deepText.amount].map(amount => <th scope="col" key={amount}>{amount}</th>)}</tr></thead>
                  <tbody>{compactPlanFeatures[locale].map((feature, index) => <tr key={feature}><th scope="row">{feature}</th>{(["basic", "plus", "deep"] as const).map(reportPlan => {
                    const included = reportPlan === "deep" || index < (reportPlan === "plus" ? 8 : plusText.basicFeatures.length);
                    return <td key={reportPlan}><svg className={included ? "feature-included" : "feature-excluded"} viewBox="0 0 20 20" role="img" aria-label={included ? plusText.included : plusText.notIncluded}><path d={included ? "m4 10 4 4 8-8" : "m5 5 10 10M15 5 5 15"} /></svg></td>;
                  })}</tr>)}</tbody>
                </table>
              </details>
              <details className="report-sample" onToggle={event => { if (event.currentTarget.open) trackEvent("report_sample_view", { language: locale, device: deviceClass() }); }}>
                <summary>{offerText.sample}</summary>
                <p>{offerText.sampleNote}</p>
                <h3>{plusText.basic} · {offerText.sampleAxis}</h3>
                <p>{offerText.sampleReading}</p>
                <h3>{plusText.plus}</h3><p>{offerText.sampleComparison}</p>
                <h3>{deepText.name}</h3><p>{offerText.sampleEvidence}</p>
              </details>
              {upgradeContext && <p>{deepText.upgradeNote}</p>}
              <p className="billing-note">{paidText.currency}</p>
              <div className="billing-links"><a href={localePath(locale, "/pricing")}>{paidText.pricing}</a><a href={localePath(locale, "/refund")}>{paidText.refund}</a><a href={localePath(locale, "/privacy")}>{paidText.privacy}</a></div>
            </>}
            {error && <p className="inline-error" role="alert">{error}</p>}
          </section>
        </div>
        <section className="result-intro" id="free-results">
          <span className="eyebrow">{text.resultEyebrow}</span>
          <h2 data-measure-event="free_result_view">{text.resultTitle}</h2>
          <p>{text.resultLead}</p>
          {!!questions.length && <p>{deepText.neutral}: {neutralCount} / {questions.length}</p>}
          {(questions.length > 0 && neutralCount >= questions.length / 2) && <p className="result-caveat">{deepText.insufficient}</p>}
          {auxiliaryUi[locale].fallbackNote && <p className="result-note">{auxiliaryUi[locale].fallbackNote}</p>}
        </section>
        <section className="axis-results" id="axis-readings" aria-label="12 axes">
          {result.axes.map((axis, index) => {
            const localizedAxis = data?.axes.find((item) => item.id === axis.axisId);
            return <article className="axis-result" key={axis.axisId}>
              <header><h2>{localizedAxis?.label ?? axis.label}</h2><span>{axis.intensity} · {axis.dominantPole}</span></header>
              <div className="axis-labels"><b>{localizedAxis?.leftPole ?? axis.leftPole} {Math.round(axis.leftPercent)}%</b><b>{Math.round(axis.rightPercent)}% {localizedAxis?.rightPole ?? axis.rightPole}</b></div>
              <div className="axis-bar"><span style={{ width: `${axis.leftPercent}%` }} /><i style={{ left: `${axis.leftPercent}%` }} /></div>
              {questions.length > 0 && <small>{deepText.neutral}: {questions.filter(q => q.axisId === axis.axisId && data?.answerOptions.find(a => a.id === answers[q.id])?.scoreTowardAgreement === 0.5).length} / {questions.filter(q => q.axisId === axis.axisId).length}</small>}
              {paid && <p className="axis-interpretation">{axisReading(locale, index, axis.leftPercent, localizedAxis?.leftPole ?? axis.leftPole, localizedAxis?.rightPole ?? axis.rightPole)}</p>}
            </article>;
          })}
        </section>
        <section className="result-section" id="ideology-matches">
          <div className="section-heading"><span className="eyebrow">{text.otherMatches}</span><h2>{text.otherMatches}</h2></div>
          <div className="match-grid">{result.matches.slice(1, paid ? 10 : 4).map((match) => <ResultMatch match={match} locale={locale} key={match.ideologyId} />)}</div>
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
        {paid && deep && reportToken && <div id="answer-evidence"><DeepReport data={deep} token={reportToken} locale={locale} /></div>}
        {paid && plus && reportToken && <div id="report-comparisons"><PlusReport data={plus} token={reportToken} locale={locale} original={originalView} /></div>}
        {paid && entitlement !== "deep" && <details className="report-upgrades"><summary>{resultSummaryCopy[locale].optionalUpgrades}</summary>{entitlement === "basic" && <div className="upgrade-offer"><h3>{plusText.plus}</h3><p>{plusText.upgradeNote}</p><ul>{plusText.features.map(feature => <li key={feature}>{feature}</li>)}<li>{deepText.plusExtra}</li></ul><button className="primary-button" disabled={!reportConsent || checkoutBusy} onClick={() => startCheckout("plus")}>{checkoutBusy ? paidText.wait : plusText.upgrade}</button><CurrencyEstimate locale={locale} amount={5} /></div>}
              <div className="upgrade-offer deep-plan-card"><span className="plan-attention-star" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 1.75 2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 16.82l-5.9 3.1 1.13-6.58-4.78-4.66 6.6-.96L12 1.75Z" /></svg></span><h3>{deepText.name}</h3><p>{deepText.upgradeNote}</p><ul>{deepText.features.map(feature => <li key={feature}>{feature}</li>)}</ul>{currentEvidence ? <><label className="consent-label"><input type="checkbox" checked={answerConsent} onChange={event => setAnswerConsent(event.target.checked)} />{deepText.consent}</label><button className="primary-button" disabled={!answerConsent || checkoutBusy} onClick={() => startCheckout("deep")}>{deepText.upgrade} · US${entitlement === "plus" ? "5" : "10"}</button><CurrencyEstimate locale={locale} amount={entitlement === "plus" ? 5 : 10} /></> : <><p>{deepText.needsQuiz}</p><button className="primary-button" onClick={prepareDeepRetake}>{deepText.retake}</button></>}</div></details>}
        <div className="result-actions">
          <button className="secondary-button" onClick={reset}>{text.retake}</button>
        </div>
        {!paid && saveLocal && localSaved && <p className="local-save-note">{deepText.saved} <button className="text-button" onClick={discardLocal}>{deepText.discard}</button></p>}
        <ReportRecovery locale={locale} />
        <Footer locale={locale} onLocale={switchLocale} />
      </main>
    );
  }

  return (
    <main className="home-shell">
      <AppHeader locale={locale} onLocale={switchLocale} onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
      {savedTest && <section className="resume-test"><p>{deepText.saved}</p><button className="primary-button" onClick={resumeTest}>{deepText.resume}</button><button className="text-button" onClick={discardLocal}>{deepText.discard}</button></section>}
      <section className="hero" id="content">
        <div className="hero-copy">
          <span className="eyebrow">{text.eyebrow}</span>
          <h1>{text.titleA}<br /><em>{text.titleB}</em></h1>
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
      <section className="section-block"><h2>{deepText.directory}</h2><p>{deepText.libraryHelp}</p><a href={localePath(locale, "/library")}>{deepText.catalog} →</a></section>
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
      <Footer locale={locale} onLocale={switchLocale} />
      {reportToken && <ReportRecovery locale={locale} />}
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
  return (
    <div className="result-preview">
      <div className="preview-head"><div><span>{text.position}</span><h3>Brazilian Integralism</h3><p>{text.description}</p></div><div className="mini-ring large"><b>88%</b><i>{text.match}</i></div></div>
      {previewAxes[locale].map(([title, left, leftValue, right, rightValue]) => <article className="axis-result" key={title}><header><h3>{title}</h3></header><div className="axis-labels"><b>{left} {leftValue}%</b><b>{rightValue}% {right}</b></div><div className="axis-bar"><span style={{ width: `${leftValue}%` }} /><i style={{ left: `${leftValue}%` }} /></div></article>)}
    </div>
  );
}

function ResultMatch({ match, locale, label, large = false }: { match: Match; locale: Locale; label?: string; large?: boolean }) {
  return (
    <article className={`match-card ${large ? "large" : ""}`}>
      {label && (large ? <h1 className="match-label">{label}</h1> : <span className="eyebrow">{label}</span>)}
      <div className="match-title"><div><small>{match.category}</small><h2>{match.name}</h2></div><div className="mini-ring"><b>{Math.round(match.compatibility)}%</b><i>{auxiliaryUi[locale].match}</i></div></div>
      {large ? <details className="match-description"><summary>{({ en: "About this match", pt: "Sobre este perfil", es: "Sobre este perfil", ru: "Об этом профиле", zh: "查看匹配说明" })[locale]}</summary><p>{match.description}</p></details> : <p>{match.description}</p>}
    </article>
  );
}

function Footer({ locale, onLocale }: { locale: Locale; onLocale: (locale: string) => void }) {
  const [results, ideologies, privacy, license] = auxiliaryUi[locale].footer;
  return (
    <footer>
      <a className="logo" href={localePath(locale)}><b>12</b><span>axes</span></a>
      <p>{copy[locale].footer}</p>
      <nav><a href={localePath(locale, "/vercel-app")}>12axes Vercel app</a><a href={localePath(locale, "/results")}>{results}</a><a href={localePath(locale, "/ideologies")}>{ideologies}</a><a href={localePath(locale, "/12axes-vs-9axes")}>12Axes vs 9Axes</a><a href={localePath(locale, "/12axes-vs-8values")}>12Axes vs 8values</a><a href={localePath(locale, "/privacy")}>{privacy}</a><a href={localePath(locale, "/license")}>{license}</a><a href={publicContactUrl}>{contactLabels[locale]}</a>{commerceSlugs.filter((item) => item !== "privacy").map((item) => <a key={item} href={localePath(locale, "/" + item)}>{commerceLabels[locale][item]}</a>)}{locales.map((item) => <a href={localePath(item)} onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onLocale(item); } }} aria-current={item === locale ? "page" : undefined} key={item}>{localeNames[item]}</a>)}</nav>
    </footer>
  );
}
