import fs from "fs/promises";
import path from "path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SCHOLAR_USER = process.env.SCHOLAR_USER || "1foiT-oAAAAJ";
const TOP_N = Number(process.env.TOP_N || "25");
const ENABLE_GEOCODE = process.env.GEOCODE === "1";

async function fetchCoauthorsList() {
  // Public "View all" co-authors page.
  // Note: Scholar does not expose a guaranteed coauthorship-frequency ranking here.
  const url = `https://scholar.google.ca/citations?view_op=list_colleagues&hl=en&user=${encodeURIComponent(SCHOLAR_USER)}`;
  const html = await fetchText(url);

  // Parse each coauthor block by looking for the name anchor + nearby affiliation.
  // Example:
  // <h3 class="gs_ai_name"><a href="/citations?hl=en&amp;user=...">Name</a></h3>
  // <div class="gs_ai_aff">Affiliation</div>
  const re =
    /<h3 class="gs_ai_name"><a href="\/citations\?hl=en&amp;user=([^&"]+)"[^>]*>([^<]+)<\/a><\/h3>(?:\s*<div class="gs_ai_aff">([^<]*)<\/div>)?/g;
  const items = [];
  let m;
  while ((m = re.exec(html))) {
    const user = m[1];
    const name = (m[2] || "").trim();
    const institution = (m[3] || "").trim() || null;
    if (!name || !user) continue;
    items.push({ name, user, institution });
  }

  // de-dupe by user
  const seen = new Set();
  const uniq = [];
  for (const it of items) {
    if (seen.has(it.user)) continue;
    seen.add(it.user);
    uniq.push(it);
  }

  return uniq.slice(0, TOP_N);
}

function extractAffiliation(html) {
  // Scholar profile renders affiliation in div.gsc_prf_il (first one usually affiliation)
  const m = html.match(/<div[^>]+class="gsc_prf_il"[^>]*>([\s\S]*?)<\/div>/);
  if (!m) return null;
  const raw = m[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return raw || null;
}

async function fetchText(url, timeoutMs = 15000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function geocode(query, timeoutMs = 15000) {
  if (!query) return null;
  // Light normalization: remove obvious non-location tails
  const q = query.replace(/Verified email.*$/i, "").trim();

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        "User-Agent": "atclare-site-collaborators/1.0 (contact: adam)",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const hit = data[0];
    if (!hit.lat || !hit.lon) return null;
    return { lat: Number(hit.lat), lng: Number(hit.lon), display: hit.display_name };
  } finally {
    clearTimeout(t);
  }
}

function parseYamlList(yaml) {
  // Tiny YAML list parser for current collaborators.yml shape.
  // Assumes entries like:
  // - name: X
  //   institution: Y
  //   lat: ...
  //   lng: ...
  //   photo: ...
  const lines = yaml.split(/\r?\n/);
  const items = [];
  let cur = null;
  for (const line of lines) {
    const mStart = line.match(/^\-\s+name:\s*(.*)$/);
    if (mStart) {
      if (cur) items.push(cur);
      cur = { name: mStart[1].trim() };
      continue;
    }
    const mKV = line.match(/^\s+([a-zA-Z_]+):\s*(.*)$/);
    if (mKV && cur) {
      const k = mKV[1];
      let v = mKV[2].trim();
      if (k === "lat" || k === "lng") v = Number(v);
      cur[k] = v;
    }
  }
  if (cur) items.push(cur);
  return items;
}

function toYaml(items) {
  const out = [];
  for (const it of items) {
    out.push(`- name: ${it.name}`);
    if (it.institution) out.push(`  institution: ${it.institution}`);
    if (typeof it.lat === "number" && !Number.isNaN(it.lat)) out.push(`  lat: ${it.lat}`);
    if (typeof it.lng === "number" && !Number.isNaN(it.lng)) out.push(`  lng: ${it.lng}`);
    if (it.photo) out.push(`  photo: ${it.photo}`);
    out.push("");
  }
  return out.join("\n").trimEnd() + "\n";
}

async function main() {
  const repoRoot = process.cwd();
  const ymlPath = path.join(repoRoot, "_data", "collaborators.yml");
  const existingYaml = await fs.readFile(ymlPath, "utf8");
  const existing = parseYamlList(existingYaml);
  const existingByName = new Map(existing.map((x) => [x.name.toLowerCase(), x]));

  const additions = [];

  const coauthors = await fetchCoauthorsList();
  console.log(`Fetched ${coauthors.length} co-authors from Scholar (requested TOP_N=${TOP_N}).`);

  for (let i = 0; i < coauthors.length; i++) {
    const c = coauthors[i];
    const key = c.name.toLowerCase();
    if (existingByName.has(key)) continue;

    console.log(`[${i + 1}/${coauthors.length}] ${c.name}`);

    const affiliation = c.institution || null;

    let geo = null;
    if (ENABLE_GEOCODE && affiliation) {
      try {
        geo = await geocode(affiliation);
      } catch (e) {
        geo = null;
        console.log(`  - geocode failed (${String(e?.name || e)})`);
      }
      // Be polite to Nominatim
      await sleep(1100);
    }

    additions.push({
      name: c.name,
      institution: affiliation || "—",
      lat: geo?.lat,
      lng: geo?.lng,
      // no photo for scraped entries
    });

    await sleep(120);
  }

  const merged = [...existing, ...additions].sort((a, b) => a.name.localeCompare(b.name));
  await fs.writeFile(ymlPath, toYaml(merged), "utf8");

  const report = {
    added: additions.length,
    missingGeo: additions.filter((x) => typeof x.lat !== "number" || typeof x.lng !== "number").map((x) => x.name),
    sample: additions.slice(0, 5),
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
