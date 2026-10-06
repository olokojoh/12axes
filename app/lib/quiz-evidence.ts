import en from "../data/report-quiz/2026-10-07.en.json";
import pt from "../data/report-quiz/2026-10-07.pt.json";
import es from "../data/report-quiz/2026-10-07.es.json";
import ru from "../data/report-quiz/2026-10-07.ru.json";
import zh from "../data/report-quiz/2026-10-07.zh.json";
import type { Locale } from "../i18n";

import { quizVersion } from "./quiz-version";
export { quizVersion } from "./quiz-version";
export const quizBanks = { en, pt, es, ru, zh };
export type QuizEvidence = { version: string; questionIds: string[]; answers: string[] };

export function validEvidence(value: unknown): value is QuizEvidence {
  if (!value || typeof value !== "object") return false;
  const input = value as QuizEvidence;
  if (input.version !== quizVersion || !Array.isArray(input.questionIds) || ![36, 60, 240].includes(input.questionIds.length) || !Array.isArray(input.answers) || input.answers.length !== input.questionIds.length || new Set(input.questionIds).size !== input.questionIds.length) return false;
  const questions = input.questionIds.map(id => en.questions.find(q => q.id === id));
  return questions.every(Boolean) && input.answers.every(id => en.answerOptions.some(a => a.id === id))
    && en.axes.every(axis => questions.filter(q => q?.axisId === axis.id).length === input.questionIds.length / 12);
}

export function evidenceRows(evidence: QuizEvidence, locale: Locale) {
  const bank = quizBanks[locale];
  return evidence.questionIds.map((id, index) => {
    const question = bank.questions.find(q => q.id === id)!;
    const scoringQuestion = en.questions.find(q => q.id === id)!;
    const answer = bank.answerOptions.find(a => a.id === evidence.answers[index])!;
    const score = en.answerOptions.find(a => a.id === evidence.answers[index])!.scoreTowardAgreement;
    return { ...question, answerId: answer.id, answer: answer.label, neutral: score === 0.5, left: 100 * (scoringQuestion.agreePole === "LEFT" ? score : 1 - score) };
  });
}

export function evidenceAxes(evidence: QuizEvidence) {
  const rows = evidenceRows(evidence, "en");
  return en.axes.map(axis => {
    const values = rows.filter(row => row.axisId === axis.id);
    return Math.round(values.reduce((sum, row) => sum + row.left, 0) / values.length);
  });
}

export function deepReport(evidence: QuizEvidence, locale: Locale) {
  const rows = evidenceRows(evidence, locale);
  const axes = evidenceAxes(evidence);
  return {
    evidence,
    axes: quizBanks[locale].axes.map((axis, index) => ({ ...axis, score: axes[index], rows: rows.filter(row => row.axisId === axis.id) })),
    answerOptions: quizBanks[locale].answerOptions,
    neutralCount: rows.filter(row => row.neutral).length,
  };
}
export type DeepReportData = ReturnType<typeof deepReport>;
