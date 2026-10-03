import { readFile, writeFile } from "node:fs/promises";

const catalog = JSON.parse(await readFile(new URL("../app/data/matching.json", import.meta.url), "utf8"));
const profiles = [
  ...catalog.ideologies.map((profile) => ({ group: "ideologies", profile, fields: ["name", "category", "description"] })),
  ...catalog.countries.map((profile) => ({ group: "countries", profile, fields: ["name", "category", "description"] })),
  ...catalog.personalities.map((profile) => ({ group: "personalities", profile, fields: ["name", "role", "description"] })),
];
const translations = { ideologies: {}, countries: {}, personalities: {} };

async function translateBatch(source, language) {
  const query = source.map((value, index) => `[[AX${String(index).padStart(3, "0")}]] ${value}`).join("\n");
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.search = new URLSearchParams({ client: "gtx", sl: "en", tl: language === "zh" ? "zh-CN" : language, dt: "t", q: query }).toString();
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url);
    if (response.ok) {
      const translated = (await response.json())[0].map((part) => part[0]).join("");
      const parts = [...translated.matchAll(/\[\[AX(\d{3})\]\]\s*([\s\S]*?)(?=\[\[AX\d{3}\]\]|$)/g)];
      if (parts.length === source.length && parts.every((part, index) => Number(part[1]) === index && part[2].trim())) {
        return parts.map((part) => part[2].trim());
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  if (source.length === 1) throw new Error(`Translation failed for ${language}: ${source[0]}`);
  const middle = Math.floor(source.length / 2);
  return [...await translateBatch(source.slice(0, middle), language), ...await translateBatch(source.slice(middle), language)];
}

for (const language of ["es", "ru", "zh"]) {
  const values = [...new Set(profiles.flatMap(({ profile, fields }) => fields.map((field) => profile[field].en)))];
  const batches = [];
  let batch = [], size = 0;
  for (const value of values) {
    if (batch.length && (batch.length === 20 || size + value.length > 2600)) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(value);
    size += value.length;
  }
  if (batch.length) batches.push(batch);
  const dictionary = new Map();
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < batches.length) {
      const current = batches[next++];
      const translated = await translateBatch(current, language);
      current.forEach((value, index) => dictionary.set(value, translated[index]));
    }
  }));
  for (const { group, profile, fields } of profiles) {
    const record = translations[group][profile.id] ??= {};
    record[language] = Object.fromEntries(fields.map((field) => [field, dictionary.get(profile[field].en)]));
  }
  console.log(language, dictionary.size, "translated strings");
}

await writeFile(new URL("../app/data/matching-translations.json", import.meta.url), JSON.stringify(translations) + "\n");
