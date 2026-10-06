import catalog from "../data/matching.json";
import translations from "../data/matching-translations.json";
import type { Locale } from "../i18n";

export function compatibility(user: number[], target: number[]) {
  let axisSimilarity = 0, dot = 0, userNorm = 0, targetNorm = 0;
  let userMagnitude = 0, targetMagnitude = 0, maxDiff = 0;
  for (let i = 0; i < user.length; i++) {
    const u = user[i] - 50, t = target[i] - 50;
    const diff = Math.abs(u - t);
    let similarity = Math.max(0, 1 - (diff / 50) ** 2);
    if (u * t < 0) similarity *= 1 - 0.45 * Math.tanh(Math.abs(u) / 25) * Math.tanh(Math.abs(t) / 25);
    axisSimilarity += similarity;
    dot += u * t;
    userNorm += u * u;
    targetNorm += t * t;
    userMagnitude += Math.abs(u);
    targetMagnitude += Math.abs(t);
    maxDiff = Math.max(maxDiff, diff);
  }
  // Preserve the source scorer's augmented cosine near the neutral center.
  const augment = user.length * 8 * 8;
  const direction = 50 + 50 * (dot + augment) / Math.sqrt((userNorm + augment) * (targetNorm + augment));
  const magnitude = 100 - 2 * Math.abs(userMagnitude - targetMagnitude) / user.length;
  const outlier = 100 * Math.max(0, 1 - (maxDiff / 100) ** 2.5);
  const score = 0.42 * 100 * axisSimilarity / user.length + 0.33 * direction + 0.18 * magnitude + 0.07 * outlier;
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

function rank<T extends { vector: number[]; name: { pt: string; en: string } }>(profiles: T[], axes: number[]) {
  return profiles.map((profile) => ({ profile, compatibility: compatibility(axes, profile.vector) }))
    .sort((a, b) => b.compatibility - a.compatibility || (a.profile.name.en < b.profile.name.en ? -1 : a.profile.name.en > b.profile.name.en ? 1 : 0));
}

const intensities = {
  en: ["Balanced", "Leaning", "Strong", "Very strong"],
  pt: ["Equilibrado", "Inclinado", "Forte", "Muito forte"],
  es: ["Equilibrado", "Inclinado", "Fuerte", "Muy fuerte"],
  ru: ["Баланс", "Склонность", "Выражено", "Сильно выражено"],
  zh: ["均衡", "倾向", "明显", "强烈"],
};

export function matchResult(axes: number[], locale: Locale) {
  const matches = rank(catalog.ideologies, axes).slice(0, 10).map(({ profile, compatibility }) => {
    const copy = locale === "en" || locale === "pt"
      ? { name: profile.name[locale], category: profile.category[locale], description: profile.description[locale] }
      : translations.ideologies[profile.id as keyof typeof translations.ideologies][locale];
    return { ideologyId: profile.id, ...copy, compatibility };
  });
  const country = rank(catalog.countries, axes)[0];
  const personality = rank(catalog.personalities, axes)[0];
  const countryCopy = locale === "en" || locale === "pt"
    ? { name: country.profile.name[locale], category: country.profile.category[locale], description: country.profile.description[locale] }
    : translations.countries[country.profile.id as keyof typeof translations.countries][locale];
  const personalityCopy = locale === "en" || locale === "pt"
    ? { name: personality.profile.name[locale], role: personality.profile.role[locale], description: personality.profile.description[locale] }
    : translations.personalities[personality.profile.id as keyof typeof translations.personalities][locale];
  return {
    axes: catalog.axes[locale].map((axis, i) => {
      const leftPercent = axes[i], rightPercent = 100 - leftPercent, distance = Math.abs(leftPercent - 50);
      return {
        axisId: axis.id, label: axis.label, leftPole: axis.leftPole, rightPole: axis.rightPole, leftPercent, rightPercent,
        dominantPole: leftPercent >= rightPercent ? axis.leftPole : axis.rightPole,
        intensity: intensities[locale][distance < 7.5 ? 0 : distance < 22.5 ? 1 : distance < 37.5 ? 2 : 3],
      };
    }),
    topMatch: matches[0], matches,
    topCountryMatch: {
      ...countryCopy,
      period: country.profile.period, compatibility: country.compatibility,
    },
    topPersonalityMatch: {
      ...personalityCopy,
      lifespan: personality.profile.lifespan, compatibility: personality.compatibility,
    },
  };
}

export function axisComparison(user: number[], target: number[], locale: Locale) {
  return catalog.axes[locale].map((axis, i) => ({ label: axis.label, leftPole: axis.leftPole, rightPole: axis.rightPole, user: user[i], target: target[i], difference: Math.round(Math.abs(user[i] - target[i]) * 10) / 10 }));
}

export function plusReport(axes: number[], locale: Locale) {
  const ideologies = rank(catalog.ideologies, axes).slice(0, 10).map(({ profile, compatibility }) => {
    const copy = locale === "en" || locale === "pt"
      ? { name: profile.name[locale], description: profile.description[locale] }
      : translations.ideologies[profile.id as keyof typeof translations.ideologies][locale];
    return { id: profile.id, name: copy.name, description: copy.description, compatibility, axes: axisComparison(axes, profile.vector, locale) };
  });
  const countries = rank(catalog.countries, axes).slice(0, 10).map(({ profile, compatibility }) => {
    const copy = locale === "en" || locale === "pt"
      ? { name: profile.name[locale], description: profile.description[locale] }
      : translations.countries[profile.id as keyof typeof translations.countries][locale];
    return { id: profile.id, name: copy.name, description: copy.description, context: profile.period, compatibility, axes: axisComparison(axes, profile.vector, locale) };
  });
  const personalities = rank(catalog.personalities, axes).slice(0, 10).map(({ profile, compatibility }) => {
    const copy = locale === "en" || locale === "pt"
      ? { name: profile.name[locale], description: profile.description[locale], role: profile.role[locale] }
      : translations.personalities[profile.id as keyof typeof translations.personalities][locale];
    return { id: profile.id, name: copy.name, description: copy.description, context: copy.role + " · " + profile.lifespan, compatibility, axes: axisComparison(axes, profile.vector, locale) };
  });
  return { ideologies, countries, personalities };
}
export type PlusReportData = ReturnType<typeof plusReport>;
export type AxisComparison = ReturnType<typeof axisComparison>;

export type ProfileGroup = "ideologies" | "countries" | "personalities";
export type ProfileDomain = "all" | "political" | "social" | "economic";
export const domainAxes = { all: [0,1,2,3,4,5,6,7,8,9,10,11], political: [0,1,2,4,5], social: [3,9,10,11], economic: [6,7,8] };
export function catalogProfiles(group: ProfileGroup, locale: Locale) {
  return catalog[group].map(profile => {
    const translated = locale === "en" || locale === "pt" ? null : (translations[group] as Record<string, Record<string, { name: string; description: string; role?: string; category?: string }>>)[profile.id][locale];
    const language = locale === "pt" ? "pt" : "en";
    const role = "role" in profile ? profile.role.en.toLowerCase() : "";
    const field = /philosoph|theolog/.test(role) ? "philosophy" : /econom/.test(role) ? "economics" : /scientist|engineer|mathematic|physic|biolog/.test(role) ? "science" : /artist|writer|poet|novelist|musician|painter|sculptor|architect/.test(role) ? "arts" : /politic|leader|president|revolution|states|king|queen|emperor|dictator|minister|general|activist/.test(role) ? "politics" : "other";
    return { id: profile.id, name: translated?.name ?? profile.name[language], description: translated?.description ?? profile.description[language], category: "category" in profile ? translated?.category ?? profile.category[language] : translated?.role ?? ("role" in profile ? profile.role[language] : ""), context: "period" in profile ? profile.period : "lifespan" in profile ? profile.lifespan : "", era: "period" in profile && profile.period ? "historical" : "current", field, vector: profile.vector };
  });
}

export function exploreProfiles(axes: number[], locale: Locale, group: ProfileGroup, domain: ProfileDomain, query = "", filter = "all", furthest = false) {
  const indices = domainAxes[domain];
  return catalogProfiles(group, locale)
    .filter(p => (filter === "all" || (group === "countries" ? p.era : p.field) === filter) && (p.name + " " + p.category).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .map(p => ({ ...p, compatibility: compatibility(indices.map(i => axes[i]), indices.map(i => p.vector[i])) }))
    .sort((a, b) => (furthest ? a.compatibility - b.compatibility : b.compatibility - a.compatibility) || a.id.localeCompare(b.id))
    .slice(0, 20).map(({ vector, ...profile }) => ({ ...profile, axes: axisComparison(axes, vector, locale) }));
}
