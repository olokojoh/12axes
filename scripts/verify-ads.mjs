import { readFile } from "node:fs/promises";

const expected = "google.com, pub-6112182006844125, DIRECT, f08c47fec0942fa0\n";
const actual = await readFile(new URL("../public/ads.txt", import.meta.url), "utf8");

if (actual !== expected) {
  throw new Error("public/ads.txt does not match the authorized AdSense seller record");
}
