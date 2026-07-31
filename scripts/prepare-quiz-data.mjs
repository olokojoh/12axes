import { access, mkdir, writeFile } from "node:fs/promises";

const api = "https://one2axes-backend.onrender.com/api/quiz?variant=extreme&lang=";
const output = new URL("../public/data/", import.meta.url);

await mkdir(output, { recursive: true });

const [english, portuguese] = await Promise.all([
  fetch(`${api}en`).then((response) => response.json()),
  fetch(`${api}pt`).then((response) => response.json()),
]);

await Promise.all([
  writeFile(new URL("quiz.en.json", output), JSON.stringify(english)),
  writeFile(new URL("quiz.pt.json", output), JSON.stringify(portuguese)),
]);

for (const target of ["es", "ru", "zh-CN"]) {
  const code = target === "zh-CN" ? "zh" : target;
  const destination = new URL(`quiz.${code}.json`, output);
  if (await access(destination).then(() => true).catch(() => false)) continue;
  const translated = structuredClone(english);
  const fields = [
    [translated, "title"],
    [translated, "description"],
    ...translated.axes.flatMap((axis) => [
      [axis, "label"],
      [axis, "leftPole"],
      [axis, "rightPole"],
    ]),
    ...translated.questions.map((question) => [question, "text"]),
    ...translated.answerOptions.map((option) => [option, "label"]),
  ];

  const values = fields.map(([object, key]) => object[key]);
  const batches = [];
  for (let index = 0; index < values.length; index += 16) {
    batches.push(values.slice(index, index + 16));
  }

  const results = [];
  for (const batch of batches) {
    const separator = "\n__AXES_SPLIT__\n";
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "en");
    url.searchParams.set("tl", target);
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", batch.join(separator));
    const payload = await fetch(url).then((response) => response.json());
    const text = payload[0].map((part) => part[0]).join("");
    const translatedBatch = text.split(/\s*__AXES_SPLIT__\s*/);
    if (translatedBatch.length === batch.length) {
      results.push(...translatedBatch);
    } else {
      const fallback = await Promise.all(batch.map(async (value) => {
        const single = new URL("https://translate.googleapis.com/translate_a/single");
        single.searchParams.set("client", "gtx");
        single.searchParams.set("sl", "en");
        single.searchParams.set("tl", target);
        single.searchParams.set("dt", "t");
        single.searchParams.set("q", value);
        const data = await fetch(single).then((response) => response.json());
        return data[0].map((part) => part[0]).join("");
      }));
      results.push(...fallback);
    }
  }

  fields.forEach(([object, key], index) => {
    object[key] = results[index];
  });
  await writeFile(destination, JSON.stringify(translated));
}
