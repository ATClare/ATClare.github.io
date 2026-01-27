import fs from "fs/promises";
import path from "path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Top-25 from Adam Clare's Scholar "Co-authors" dialog (2026-01-26), in order.
const COAUTHORS = [
  { name: "James W Murray", user: "tCXWRUUAAAAJ" },
  { name: "Alistair Speidel", user: "Ce1yK98AAAAJ" },
  { name: "Jonathon Mitchell-Smith", user: "4sUat1QAAAAJ" },
  { name: "Christopher Tuck", user: "9B8LbxIAAAAJ" },
  { name: "Richard Leach", user: "ZAfAKAkAAAAJ" },
  { name: "D Graham McCartney", user: "irR0UtIAAAAJ" },
  { name: "Taiwo Ebenezer Abioye", user: "RO_0Qp8AAAAJ" },
  { name: "Christopher J. Hyde", user: "FBh_xTIAAAAJ" },
  { name: "PK Farayibi", user: "ZKL3zLQAAAAJ" },
  { name: "Rikesh Patel", user: "eDzvB5UAAAAJ" },
  { name: "Nesma T. Aboulkhair", user: "jHvg-9UAAAAJ" },
  { name: "Marco Simonelli", user: "1jSCRLYAAAAJ" },
  { name: "Paul Dryburgh", user: "zNKT7iQAAAAJ" },
  { name: "Don Pieris", user: "3ojfUIYAAAAJ" },
  { name: "Richard Hague", user: "E78iDZoAAAAJ" },
  { name: "Zhengkai XU", user: "SQ6lB5EAAAAJ" },
  { name: "Stefano Laureti", user: "SMCZKBIAAAAJ" },
  { name: "Steven Freear", user: "CLiBBDEAAAAJ" },
  { name: "Rachid Msaoubi", user: "uKXx4LsAAAAJ" },
  { name: "John Christopher Walker", user: "3LmzzxEAAAAJ" },
  { name: "Paul Chalker", user: "ulJVvz4AAAAJ" },
  { name: "Wessel W. Wits", user: "SiqaoPMAAAAJ" },
  { name: "samer algodi", user: "rRMaKIkAAAAJ" },
  { name: "Salomé Sanchez", user: "bF1QTuIAAAAJ" },
  { name: "Peter Kinnell", user: "RyqgO2kAAAAJ" },
];

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

  for (let i = 0; i < COAUTHORS.length; i++) {
    const c = COAUTHORS[i];
    const key = c.name.toLowerCase();
    if (existingByName.has(key)) continue;

    console.log(`[${i + 1}/${COAUTHORS.length}] ${c.name}`);

    const profileUrl = `https://scholar.google.ca/citations?hl=en&user=${c.user}`;
    let affiliation = null;
    try {
      const html = await fetchText(profileUrl);
      affiliation = extractAffiliation(html);
    } catch (e) {
      affiliation = null;
      console.log(`  - profile fetch failed (${String(e?.name || e)})`);
    }

    let geo = null;
    if (affiliation) {
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

    // Short delay to be polite to Scholar
    await sleep(300);
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
