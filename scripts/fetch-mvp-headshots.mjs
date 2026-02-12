import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.resolve("src", "data", "superbowls.json");
const OUT_DIR = path.resolve("public", "mvp");

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "superbowl-mvp-headshots/0.1 (personal project)",
      accept: "application/json",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  return res.json();
}

async function getSummary(name) {
  const title = encodeURIComponent(name.replace(/\*/g, "").trim());
  const primary = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
  if (primary?.thumbnail?.source) return primary;

  const search = await fetchJson(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&formatversion=2`
  );
  const hit = search?.query?.search?.[0]?.title;
  if (!hit) return null;
  const fallback = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit)}`);
  return fallback?.thumbnail?.source ? fallback : null;
}

async function downloadTo(url, outPath) {
  const res = await fetch(url, {
    headers: { "user-agent": "superbowl-mvp-headshots/0.1 (personal project)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  return true;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const games = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

  const cache = new Map();
  let found = 0;
  let checked = 0;

  for (const game of games) {
    for (const m of game.mvp ?? []) {
      const name = String(m.name || "").trim();
      if (!name) continue;

      if (cache.has(name)) {
        const cached = cache.get(name);
        if (cached) {
          m.headshotUrl = cached;
          m.imageOverrideUrl = cached;
        }
        continue;
      }

      checked++;
      if (checked % 10 === 0) console.log(`Checked ${checked} MVP names...`);
      const summary = await getSummary(name);
      const src = summary?.thumbnail?.source;

      if (!src) {
        cache.set(name, null);
        continue;
      }

      const ext = path.extname(new URL(src).pathname) || ".jpg";
      const file = `${slugify(name)}${ext}`;
      const outPath = path.join(OUT_DIR, file);
      const ok = await downloadTo(src, outPath);
      if (!ok) {
        cache.set(name, null);
        continue;
      }

      const local = `/mvp/${file}`;
      m.headshotUrl = local;
      m.imageOverrideUrl = local;
      cache.set(name, local);
      found++;

      await new Promise((r) => setTimeout(r, 120));
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(games, null, 2) + "\n", "utf8");
  console.log(`Fetched MVP headshots for ${found} entries (${cache.size} unique names checked).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
