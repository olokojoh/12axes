import { readFile } from "node:fs/promises";

const expected = "google.com, pub-6112182006844125, DIRECT, f08c47fec0942fa0\n";
const actual = await readFile(new URL("../public/ads.txt", import.meta.url), "utf8");

if (actual !== expected) {
  throw new Error("public/ads.txt does not match the authorized AdSense seller record");
}

const [englishLayout, segmentLayout, placement, testApp] = await Promise.all([
  readFile(new URL("../app/(en)/layout.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/[segment]/layout.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/AdsterraAds.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/TestApp.tsx", import.meta.url), "utf8"),
]);
const popunder = "eb3f2b4f596dc0ce02129439525e0ca9.js";
const socialBar = "a2fe6205958e31ff19ac56d46d23af7e.js";
const banner = "82007f0af8ba71f54644b287807fe713";
const smartlink = "f515338cffcc25dfc402c9d90fd1bd01";

for (const layout of [englishLayout, segmentLayout]) {
  if (layout.split(popunder).length !== 2 || layout.split(socialBar).length !== 2) {
    throw new Error("each root layout must contain one Popunder and one Social Bar placement");
  }
}

if (placement.split(banner).length !== 3 || placement.split(smartlink).length !== 2) {
  throw new Error("the interaction ad block must contain one Banner loader and one Smartlink");
}

for (const placementName of ["home", "format", "quiz", "extend", "results"]) {
  if (testApp.split(`placement="${placementName}"`).length !== 2) {
    throw new Error(`TestApp must contain one ${placementName} ad placement`);
  }
}
