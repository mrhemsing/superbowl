import fs from "node:fs";
import path from "node:path";

const DATA_FILE = path.resolve("src/data/superbowls.json");
const OUT_DIR = path.resolve("public/stadiums");
const MAP_FILE = path.resolve("src/data/stadium-backgrounds.json");

const API = "https://en.wikipedia.org/w/api.php";

const TITLE_OVERRIDES = {
  "Levi's Stadium": "Levi's Stadium",
  "U.S. Bank Stadium": "U.S. Bank Stadium",
  "SoFi Stadium": "SoFi Stadium",
  "Caesars Superdome": "Caesars Superdome",
  "Mercedes-Benz Superdome": "Caesars Superdome",
  "Louisiana Superdome": "Caesars Superdome",
  "Sun Life Stadium": "Hard Rock Stadium",
  "Pro Player Stadium": "Hard Rock Stadium",
  "Joe Robbie Stadium": "Hard Rock Stadium",
  "Dolphin Stadium": "Hard Rock Stadium",
  "Alltel Stadium": "TIAA Bank Field",
  "San Diego�Jack Murphy Stadium": "San Diego Stadium",
  "Metrodome": "Hubert H. Humphrey Metrodome",
  "Rice Stadium": "Rice Stadium",
  "Tulane Stadium": "Tulane Stadium",
  "University of Phoenix Stadium": "State Farm Stadium",
  "Pontiac Silverdome": "Pontiac Silverdome",
};

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

async function wikiQuery(params) {
  const url = new URL(API);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, {
    headers: {
      "user-agent": "superbowl-stadium-bg-fetcher/0.1 (personal project)",
      accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`);
  return res.json();
}

async function getThumbForTitle(title) {
  const direct = await wikiQuery({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "1920",
    titles: title,
  });
  const page = direct?.query?.pages?.[0];
  if (page?.thumbnail?.source) return page.thumbnail.source;

  const search = await wikiQuery({
    action: "query",
    format: "json",
    formatversion: "2",
    list: "search",
    srsearch: `${title} stadium`,
    srlimit: 1,
  });
  const first = search?.query?.search?.[0]?.title;
  if (!first) return null;

  const second = await wikiQuery({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "1920",
    titles: first,
  });
  const p2 = second?.query?.pages?.[0];
  return p2?.thumbnail?.source ?? null;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadTo(url, outBase) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { "user-agent": "superbowl-stadium-bg-fetcher/0.1" } });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "image/jpeg";
      const ext = ct.includes("png") ? ".png" : ct.includes("webp") ? ".webp" : ".jpg";
      const outPath = `${outBase}${ext}`;
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      return outPath;
    }
    lastErr = new Error(`Image HTTP ${res.status}`);
    if (res.status === 429) await sleep(1200 * attempt);
  }
  throw lastErr ?? new Error("Image download failed");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const games = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const venues = [...new Set(games.map((g) => g.venue?.name).filter(Boolean))].sort();

  const map = fs.existsSync(MAP_FILE)
    ? JSON.parse(fs.readFileSync(MAP_FILE, "utf8"))
    : {};
  let ok = 0;
  let fail = 0;

  for (const venue of venues) {
    if (map[venue]) {
      console.log(`↺ ${venue} already mapped`);
      continue;
    }

    const title = TITLE_OVERRIDES[venue] ?? venue;
    try {
      const thumb = await getThumbForTitle(title);
      if (!thumb) throw new Error("No thumbnail source");

      const outBase = path.join(OUT_DIR, slugify(venue));
      const saved = await downloadTo(thumb, outBase);
      map[venue] = `/stadiums/${path.basename(saved)}`;
      ok += 1;
      console.log(`✓ ${venue} -> ${map[venue]}`);
    } catch (e) {
      fail += 1;
      console.warn(`✗ ${venue}: ${e.message}`);
    }
    await sleep(500);
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + "\n", "utf8");
  console.log(`Done. mapped=${ok}, failed=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
