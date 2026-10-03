import { isLocale, type Locale } from "../i18n";

export type ResultInput = { axes: number[]; locale: Locale; quizLength: number; variant: "a" | "b" | "baseline" };

export function validResult(value: unknown): value is ResultInput {
  if (!value || typeof value !== "object") return false;
  const body = value as ResultInput;
  return Array.isArray(body.axes) && body.axes.length === 12
    && body.axes.every((item) => Number.isInteger(item) && item >= 0 && item <= 100)
    && isLocale(body.locale) && [0, 36, 60, 240].includes(body.quizLength)
    && ["a", "b", "baseline"].includes(body.variant);
}

export const privateHeaders = { "cache-control": "no-store", "referrer-policy": "no-referrer" };
