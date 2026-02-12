import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const OUT_DIR = path.resolve("src", "data");
const OUT_FILE = path.join(OUT_DIR, "superbowls.json");

const WIKI = "https://en.wikipedia.org/w/api.php";

async function wikiParse({ page, prop, section }) {
  const url = new URL(WIKI);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", page);
  url.searchParams.set("prop", prop);
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  if (section != null) url.searchParams.set("section", String(section));

  const res = await fetch(url, {
    headers: {
      "user-agent": "superbowl-dataset-bot/0.1 (personal project)",
      accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Wikipedia fetch failed ${res.status} for ${page}`);
  const data = await res.json();
  if (data?.error) throw new Error(`Wikipedia error: ${JSON.stringify(data.error)}`);
  return data.parse;
}

async function getSectionIndex(page, matcher) {
  const parsed = await wikiParse({ page, prop: "sections" });
  const sections = parsed?.sections ?? [];
  const hit = sections.find((s) => matcher(s.line));
  if (!hit) {
    const sample = sections.slice(0, 12).map((s) => `${s.index}: ${s.line}`).join("\n");
    throw new Error(`Could not find section on ${page}. Sample sections:\n${sample}`);
  }
  return Number(hit.index);
}

function textNorm(s) {
  return String(s ?? "")
    .replace(/\[[^\]]+\]/g, "") // footnote brackets
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTrailingRecord(s) {
  // e.g. "Green Bay Packers (1, 1–0)"
  return textNorm(s).replace(/\s*\([^)]*\)\s*$/g, "").trim();
}

function romanToInt(roman) {
  const raw = textNorm(roman);
  if (/^\d+$/.test(raw)) return Number(raw);

  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let s = raw.toUpperCase().replace(/[^IVXLCDM]/g, "");
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]] || 0;
    const next = map[s[i + 1]] || 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

function parseScore(scoreText) {
  const nums = textNorm(scoreText).match(/\d+/g);
  if (!nums || nums.length < 2) return null;
  return { a: Number(nums[0]), b: Number(nums[1]) };
}

function parseChampionshipsTable(html) {
  const $ = cheerio.load(html);

  const table = $("table.wikitable")
    .filter((_i, el) => {
      const t = textNorm($(el).text());
      return t.includes("Winning team") && t.includes("Losing team") && t.includes("Score");
    })
    .first();
  if (!table.length) throw new Error("Could not find championships wikitable in section HTML");

  const out = [];
  table.find("tr").each((_i, tr) => {
    const $tr = $(tr);
    const allCells = $tr.find("th, td").toArray();
    if (!allCells.length) return;

    const firstText = textNorm($(allCells[0]).text());
    if (/^Game$/i.test(firstText)) return;

    // Must be exactly a roman numeral (I..LX etc) or "50".
    if (!/^(?:[IVXLCDM]+|\d+)$/.test(firstText)) return;

    const sbRoman = firstText;

    // Read TD cells. Some rows repeat the SB label as the first TD.
    const tdsAll = $tr.find("td").toArray();
    if (tdsAll.length < 7) return;

    let o = 0;
    const td0 = textNorm($(tdsAll[0]).text());
    if (td0 && textNorm(td0) === sbRoman) o = 1;

    const dateSeason = textNorm($(tdsAll[o + 0]).text());

    // Team name: take the first link text in the cell (avoids footnote letters + record suffix)
    const winnerTeam = stripTrailingRecord(
      textNorm($(tdsAll[o + 1]).find("a").first().text() || $(tdsAll[o + 1]).text())
    );
    const scoreText = textNorm($(tdsAll[o + 2]).text());
    const loserTeam = stripTrailingRecord(
      textNorm($(tdsAll[o + 3]).find("a").first().text() || $(tdsAll[o + 3]).text())
    );

    const venue = textNorm($(tdsAll[o + 4]).find("a").first().text() || $(tdsAll[o + 4]).text());
    const city = textNorm($(tdsAll[o + 5]).text());

    const score = parseScore(scoreText);

    const dateMatch = dateSeason.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
    const gameDate = dateMatch ? new Date(dateMatch[1]).toISOString().slice(0, 10) : null;

    const seasonMatch = dateSeason.match(/\((\d{4})/);
    const seasonYear = seasonMatch ? Number(seasonMatch[1]) : null;

    out.push({
      sbRoman,
      sbNumber: romanToInt(sbRoman),
      gameDate,
      seasonYear,
      winnerTeam,
      loserTeam,
      scoreText,
      score,
      venue,
      city,
      dateSeason,
    });
  });

  out.sort((a, b) => a.sbNumber - b.sbNumber);
  return out;
}

function splitCoMvps(name) {
  const parts = textNorm(name)
    .split(/\s*(?:\/|&)\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [textNorm(name)];
}

function parseQuarterScoringFromGameHtml(html, expectedWinnerScore, expectedLoserScore) {
  const $ = cheerio.load(html);

  const tables = $("table").toArray();
  for (const table of tables) {
    const headerText = textNorm($(table).find("tr").first().text());
    if (!/Total/i.test(headerText)) {
      continue;
    }

    const rows = [];
    $(table)
      .find("tr")
      .each((_i, tr) => {
        const cells = $(tr).find("th, td").toArray();
        if (cells.length < 6) return;

        const nums = cells
          .map((c) => textNorm($(c).text()))
          .filter((v) => /^\d+$/.test(v))
          .map((v) => Number(v));

        if (nums.length < 5) return;

        const total = nums[nums.length - 1];
        const periods = nums.slice(0, -1);
        rows.push({ periods, total });
      });

    if (rows.length < 2) continue;

    const candidates = rows.slice(0, 3);
    const winnerRow = candidates.find((r) => r.total === expectedWinnerScore);
    const loserRow = candidates.find((r) => r.total === expectedLoserScore);

    if (winnerRow && loserRow) {
      const periodCount = Math.max(winnerRow.periods.length, loserRow.periods.length);
      const labels = Array.from({ length: periodCount }, (_, i) => (i < 4 ? `Q${i + 1}` : "OT"));
      return {
        periods: labels,
        winner: winnerRow.periods,
        loser: loserRow.periods,
      };
    }
  }

  return null;
}

function parseFavoriteSpread(raw) {
  const text = textNorm(raw).replace(/[−–—]/g, "-");
  if (!text) return { favorite: null, spread: null };
  if (/pick/i.test(text)) return { favorite: null, spread: 0 };

  let m = text.match(/^(.+?)\s+by\s+([0-9]+(?:\.[0-9]+)?)/i);
  if (m) {
    return { favorite: stripTrailingRecord(m[1]), spread: Number(m[2]) };
  }

  m = text.match(/^(.+?)\s*-\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (m) {
    return { favorite: stripTrailingRecord(m[1]), spread: Number(m[2]) };
  }

  return { favorite: text, spread: null };
}

function parseOverUnder(raw) {
  const text = textNorm(raw).replace(/[−–—]/g, "-");
  const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
  return m ? Number(m[1]) : null;
}

function parseMoneyline(raw) {
  const text = textNorm(raw).replace(/[−–—]/g, "-");
  const nums = [...text.matchAll(/([+-]\d{3,4})/g)].map((m) => Number(m[1]));
  if (nums.length >= 2) {
    return { favorite: nums[0], underdog: nums[1] };
  }
  return { favorite: null, underdog: null };
}

function parseBettingFromGameHtml(html, winnerTeam, loserTeam, winnerScore, loserScore) {
  const $ = cheerio.load(html);
  const infobox = $("table.infobox").first();
  if (!infobox.length) return null;

  const kv = new Map();
  infobox.find("tr").each((_i, tr) => {
    const th = textNorm($(tr).find("th").first().text());
    const td = textNorm($(tr).find("td").first().text());
    if (th && td) kv.set(th.toLowerCase(), td);
  });

  const favoriteRaw = kv.get("favorite");
  const totalRaw = kv.get("over/under");
  const moneylineRaw = kv.get("moneyline") ?? kv.get("money line");

  const parsedFavorite = parseFavoriteSpread(favoriteRaw ?? "");
  const total = parseOverUnder(totalRaw ?? "");
  const moneyline = parseMoneyline(moneylineRaw ?? "");

  const winner = winnerTeam;
  const loser = loserTeam;
  const margin = winnerScore - loserScore;
  const totalPts = winnerScore + loserScore;

  let spreadResult = null;
  if (typeof parsedFavorite.spread === "number" && parsedFavorite.favorite) {
    const fav = parsedFavorite.favorite.toLowerCase();
    const winnerIsFavorite = winner.toLowerCase().includes(fav) || fav.includes(winner.toLowerCase());
    const loserIsFavorite = loser.toLowerCase().includes(fav) || fav.includes(loser.toLowerCase());

    if (winnerIsFavorite) {
      if (margin > parsedFavorite.spread) spreadResult = `${winner} covered`;
      else if (margin === parsedFavorite.spread) spreadResult = "Push";
      else spreadResult = `${loser} covered`;
    } else if (loserIsFavorite) {
      if (margin < parsedFavorite.spread) spreadResult = `${loser} covered`;
      else if (margin === parsedFavorite.spread) spreadResult = "Push";
      else spreadResult = `${winner} covered`;
    }
  }

  let totalResult = null;
  if (typeof total === "number") {
    if (totalPts > total) totalResult = "Over";
    else if (totalPts < total) totalResult = "Under";
    else totalResult = "Push";
  }

  return {
    open: typeof parsedFavorite.spread === "number" ? parsedFavorite.spread : null,
    favorite: parsedFavorite.favorite,
    spread: parsedFavorite.spread,
    total,
    moneyline,
    results: {
      mlWinner: winner,
      spreadResult,
      totalResult,
    },
    source: "Wikipedia infobox",
  };
}

function parseMvpsTable(html) {
  const $ = cheerio.load(html);
  const candidates = $("table.wikitable")
    .toArray()
    .map((el) => {
      const $el = $(el);
      const t = textNorm($el.text());
      const ok =
        t.includes("Year") &&
        t.includes("Super Bowl") &&
        t.includes("Winner") &&
        t.includes("Team") &&
        t.includes("Position") &&
        t.includes("College");
      const rows = $el.find("tr").length;
      return { el, ok, rows };
    })
    .filter((c) => c.ok)
    .sort((a, b) => b.rows - a.rows);

  const table = candidates.length ? $(candidates[0].el) : null;
  if (!table || !table.length) throw new Error("Could not find MVP winners wikitable in section HTML");

  const out = [];
  let lastYear = null;
  let lastSbRoman = null;

  table.find("tr").each((_i, tr) => {
    const $tr = $(tr);

    const cells = $tr.find("th, td").toArray();
    if (cells.length < 4) return;

    // Normal row:
    // 0 year(td), 1 sb(td), 2 winner(th), 3 team(td), 4 pos(td), 5 college(td)
    // Continuation row (rowspans for year/sb):
    // 0 winner(th), 1 team(td), 2 pos(td), 3 college(td)

    const c0 = textNorm($(cells[0]).text());
    const looksLikeYear = /\b\d{4}\b/.test(c0);

    let yearText, sbRoman, winnerCell, teamCell, posCell, collegeCell;

    if (looksLikeYear) {
      yearText = c0;
      sbRoman = textNorm($(cells[1]).text());
      winnerCell = cells[2];
      teamCell = cells[3];
      posCell = cells[4];
      collegeCell = cells[5];

      lastYear = yearText;
      lastSbRoman = sbRoman;
    } else {
      yearText = lastYear;
      sbRoman = lastSbRoman;
      winnerCell = cells[0];
      teamCell = cells[1];
      posCell = cells[2];
      collegeCell = cells[3];
    }

    if (!yearText || !sbRoman) return;
    if (!/^(?:[IVXLCDM]+|\d+)$/.test(sbRoman)) return;

    const sbNumber = romanToInt(sbRoman);

    const winnerText = textNorm($(winnerCell).find("a").first().text() || $(winnerCell).text());
    const team = textNorm($(teamCell).find("a").first().text() || $(teamCell).text());
    const position = posCell ? textNorm($(posCell).text()) : null;
    const college = collegeCell ? textNorm($(collegeCell).text()) : null;

    const yearMatch = String(yearText).match(/(\d{4})/);
    const year = yearMatch ? Number(yearMatch[1]) : null;

    const names = splitCoMvps(winnerText.replace(/\*/g, "").trim());
    for (const n of names) {
      out.push({ sbRoman, sbNumber, year, name: n, team, position, college });
    }
  });

  out.sort((a, b) => a.sbNumber - b.sbNumber);
  return out;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const champsSection = await getSectionIndex(
    "List_of_Super_Bowl_champions",
    (line) => /^Results$/i.test(line)
  );

  const mvpsSection = await getSectionIndex(
    "Super_Bowl_Most_Valuable_Player",
    (line) => /^Winners$/i.test(line) || /Most Valuable Players/i.test(line)
  );

  const champsHtml = (await wikiParse({
    page: "List_of_Super_Bowl_champions",
    prop: "text",
    section: champsSection,
  }))?.text;

  const mvpsHtml = (await wikiParse({
    page: "Super_Bowl_Most_Valuable_Player",
    prop: "text",
    section: mvpsSection,
  }))?.text;

  if (!champsHtml || !mvpsHtml) throw new Error("Missing HTML from Wikipedia parse");

  const champs = parseChampionshipsTable(champsHtml);
  const mvps = parseMvpsTable(mvpsHtml);

  const mvpsBySb = new Map();
  for (const m of mvps) {
    const list = mvpsBySb.get(m.sbNumber) ?? [];
    list.push(m);
    mvpsBySb.set(m.sbNumber, list);
  }

  const silhouette = "/mvp-silhouette.svg";

  const dataset = [];
  for (const g of champs) {
    const mvp = (mvpsBySb.get(g.sbNumber) ?? []).map((m) => ({
      name: m.name,
      team: m.team,
      position: m.position,
      college: m.college,
      headshotUrl: silhouette,
      imageOverrideUrl: null,
    }));

    let quarterScoring = null;
    let betting = null;
    try {
      const gameHtml = (
        await wikiParse({
          page: `Super_Bowl_${g.sbRoman}`,
          prop: "text",
        })
      )?.text;

      if (gameHtml && g.score) {
        quarterScoring = parseQuarterScoringFromGameHtml(gameHtml, g.score.a, g.score.b);
        betting = parseBettingFromGameHtml(
          gameHtml,
          g.winnerTeam,
          g.loserTeam,
          g.score.a,
          g.score.b
        );
      }
    } catch {
      // Keep dataset generation resilient if an individual game page parse fails.
    }

    dataset.push({
      id: `sb-${g.sbNumber}`,
      sbRoman: g.sbRoman,
      sbNumber: g.sbNumber,
      seasonYear: g.seasonYear,
      gameDate: g.gameDate,
      winner: { name: g.winnerTeam, score: g.score?.a ?? null },
      loser: { name: g.loserTeam, score: g.score?.b ?? null },
      scoreText: g.scoreText,
      quarterScoring,
      betting,
      dateSeasonText: g.dateSeason,
      venue: { name: g.venue, city: g.city },
      mvp,
    });
  }

  if (dataset.length !== 60) {
    console.warn(`Warning: expected 60 Super Bowls, got ${dataset.length}`);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(dataset, null, 2) + "\n", "utf8");
  console.log(`Wrote ${dataset.length} games -> ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
