import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("public", "logos", "espn");

// ESPN logo CDN (PNG). Example:
// https://a.espncdn.com/i/teamlogos/nfl/500/gb.png
function espnUrl(abbr) {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;
}

const ABBRS = [
  "ARI","ATL","BAL","BUF","CAR","CHI","CIN","CLE","DAL","DEN","DET","GB",
  "HOU","IND","JAX","KC","LV","LAC","LAR","MIA","MIN","NE","NO","NYG","NYJ",
  "PHI","PIT","SEA","SF","TB","TEN","WAS",
];

async function download(abbr) {
  const url = espnUrl(abbr);
  const res = await fetch(url, {
    headers: {
      "user-agent": "superbowl-logo-fetch/0.1 (personal project)",
      accept: "image/*",
    },
  });
  if (!res.ok) throw new Error(`${abbr}: ${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const outPath = path.join(OUT_DIR, `${abbr}.png`);
  fs.writeFileSync(outPath, buf);
  return outPath;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  for (const abbr of ABBRS) {
    process.stdout.write(`Fetching ${abbr}... `);
    try {
      const p = await download(abbr);
      const stat = fs.statSync(p);
      console.log(`ok (${Math.round(stat.size / 1024)} KB)`);
      results.push({ abbr, ok: true });
    } catch (e) {
      console.log("FAIL");
      console.error(e);
      results.push({ abbr, ok: false });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`Done. ok=${ok} fail=${fail} -> ${OUT_DIR}`);
  if (fail) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
