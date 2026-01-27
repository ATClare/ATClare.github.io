import fs from "fs/promises";
import path from "path";

const STOP = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "our",
  "to",
  "the",
  "with",
  "using",
  "use",
  "via",
  "towards",
  "toward",
  "based",
  "study",
  "studies",
  "new",
  "method",
  "methods",
  "approach",
  "analysis",
  "review",
  "part",
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vs",
  "effect",
  "effects",
  "role",
  "within",
  "through",
  "between",
  "under",
  "over",
  "into",
  "out",
  "online",
  "initial",
  "investigation",
  "assessment",
  "characterisation",
  "characterization",
  "processing",
  "process",
  "processes",
  "manufacturing",
  "additive",
  "laser",
  "powder",
  "bed",
  "fusion",
  "machining",
  "electrochemical",
  "jet",
  "directed",
  "energy",
  "deposition",
]);

function normalizeWord(w) {
  return w
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\-]+/g, "")
    .replace(/^-+|-+$/g, "")
    .trim();
}

function tokenize(title) {
  return title
    .replace(/[–—]/g, "-")
    .replace(/\(.*?\)/g, " ")
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean)
    .filter((w) => w.length >= 3)
    .filter((w) => !STOP.has(w));
}

function toTagCloud(words) {
  // words: [{text, count, weight}]
  const max = Math.max(...words.map((w) => w.count));
  const min = Math.min(...words.map((w) => w.count));
  const scale = (c) => {
    if (max === min) return 22;
    // 14..44 px
    return 14 + (30 * (c - min)) / (max - min);
  };

  return words
    .map((w) => {
      const size = scale(w.count).toFixed(1);
      return `<span class="wc-word" style="font-size:${size}px" title="${w.text} (${w.count})">${w.text}</span>`;
    })
    .join("\n");
}

async function main() {
  const repoRoot = process.cwd();
  const titlesPath = path.join(repoRoot, "tools", "scholar_titles.json");
  const titles = JSON.parse(await fs.readFile(titlesPath, "utf8"));

  const counts = new Map();
  for (const t of titles) {
    for (const w of tokenize(t)) {
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }

  const sorted = [...counts.entries()].map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count);

  const top = sorted.slice(0, 90);

  await fs.writeFile(
    path.join(repoRoot, "assets", "wordcloud.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), titles: titles.length, words: top }, null, 2)
  );

  const html = toTagCloud(top);
  await fs.mkdir(path.join(repoRoot, "_includes"), { recursive: true });
  await fs.writeFile(
    path.join(repoRoot, "_includes", "wordcloud.liquid"),
    `<section class="wordcloud-section">
  <h2 class="wordcloud-title">Research footprint (titles word cloud)</h2>
  <p class="wordcloud-subtitle">Generated from ${titles.length} Google Scholar publication titles.</p>
  <div class="wordcloud">\n${html}\n  </div>
</section>
`
  );

  console.log(JSON.stringify({ titles: titles.length, uniqueWords: counts.size, top: top.slice(0, 10) }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
