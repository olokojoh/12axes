import { mkdir, readFile, writeFile } from "node:fs/promises";

const revision = "40ec789a2843232b30ae5e5fbeea66208ef3e88e";
const source = `https://raw.githubusercontent.com/RomanCypherpunk/12axes/${revision}/backend/src/main/resources/data/`;
const axes = {};
for (const locale of ["en", "pt", "es", "ru", "zh"]) {
  axes[locale] = JSON.parse(await readFile(new URL(`../public/data/quiz.${locale}.json`, import.meta.url), "utf8")).axes;
}
const axisIds = axes.en.map((axis) => axis.id);
const catalog = { revision, axes };
for (const [name, profileFile, idKey, fields] of [
  ["ideologies", "ideology-profiles", "ideologyId", ["name", "category", "description"]],
  ["countries", "countries-profiles", "countryId", ["name", "category", "description"]],
  ["personalities", "personality-profiles", "personalityId", ["name", "role", "description"]],
]) {
  const downloaded = await Promise.all([`${name}.json`, `${profileFile}.json`, `i18n/en/${name}.json`].map(async (file) => {
    const response = await fetch(source + file);
    if (!response.ok) throw new Error(`Download failed: ${file} (${response.status})`);
    return response.json();
  }));
  const [entities, profiles, english] = downloaded;
  const vectors = new Map(profiles.map((item) => [item[idKey], item.vector]));
  const translations = new Map(english.map((item) => [item.id, item]));
  catalog[name] = entities.map((item) => {
    const vector = axisIds.map((id) => vectors.get(item.id)?.[id]);
    const translation = translations.get(item.id);
    if (!translation || vector.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) throw new Error(`Invalid profile: ${name}/${item.id}`);
    const translated = Object.fromEntries(fields.map((field) => [field, { pt: item[field], en: translation[field] }]));
    if (fields.some((field) => typeof translated[field].pt !== "string" || typeof translated[field].en !== "string")) throw new Error(`Incomplete translation: ${name}/${item.id}`);
    return { id: item.id, vector, ...translated, ...(name === "countries" ? { period: item.period } : {}), ...(name === "personalities" ? { lifespan: item.lifespan } : {}) };
  });
}
await mkdir(new URL("../app/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../app/data/matching.json", import.meta.url), JSON.stringify(catalog) + "\n");
console.log({ revision, ideologies: catalog.ideologies.length, countries: catalog.countries.length, personalities: catalog.personalities.length });
