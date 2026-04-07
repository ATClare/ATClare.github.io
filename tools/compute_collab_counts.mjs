import fs from "fs/promises";
import path from "path";

// Very lightweight BibTeX author frequency counter.
// Counts co-authors across entries in _bibliography/papers.bib.
// Excludes anything containing "Clare" as self.

function normalizeName(s) {
  return s
    .replace(/\s+/g, " ")
    .replace(/\s+,\s+/g, ", ")
    .trim();
}

function parseAuthors(authorField) {
  // BibTeX uses "and" between authors.
  return authorField
    .split(/\s+and\s+/i)
    .map((a) => normalizeName(a.replace(/[{}]/g, "")))
    .filter(Boolean);
}

function extractField(entry, field) {
  // naive: field = {...} or field = "..."
  const re = new RegExp(`${field}\\s*=\\s*(?:\\{([\\s\\S]*?)\\}|\"([\\s\\S]*?)\")\\s*,`, "i");
  const m = entry.match(re);
  if (!m) return null;
  return (m[1] ?? m[2] ?? "").trim();
}

function splitEntries(bib) {
  // split on @...{key,
  const parts = bib.split(/\n@/g);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const p = i === 0 ? parts[i] : "@" + parts[i];
    if (!p.trim().startsWith("@")) continue;
    out.push(p);
  }
  return out;
}

async function main() {
  const repoRoot = process.cwd();
  const bibPath = path.join(repoRoot, "_bibliography", "papers.bib");
  const ymlOut = path.join(repoRoot, "_data", "collaborator_counts.yml");

  const bib = await fs.readFile(bibPath, "utf8");
  const entries = splitEntries(bib);

  const counts = new Map();

  for (const e of entries) {
    const author = extractField(e, "author");
    if (!author) continue;
    const authors = parseAuthors(author);
    for (const a of authors) {
      if (/\bclare\b/i.test(a)) continue;
      counts.set(a, (counts.get(a) || 0) + 1);
    }
  }

  const sorted = [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const topN = Number(process.env.TOP_N || "75");
  const top = sorted.slice(0, topN);

  const lines = [];
  for (const t of top) {
    lines.push(`- name: ${t.name}`);
    lines.push(`  count: ${t.count}`);
    lines.push("");
  }

  await fs.writeFile(ymlOut, lines.join("\n").trimEnd() + "\n", "utf8");

  console.log(JSON.stringify({ entries: entries.length, unique: counts.size, top: top.slice(0, 10) }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
