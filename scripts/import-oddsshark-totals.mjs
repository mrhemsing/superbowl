import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.resolve("src/data/superbowls.json");

const byYear = new Map([
  [2026, { total: 45.5, totalResult: "UNDER" }],
  [2025, { total: 48.5, totalResult: "OVER" }],
  [2024, { total: 47.5, totalResult: "UNDER" }],
  [2023, { total: 50, totalResult: "OVER" }],
  [2022, { total: 49.5, totalResult: "UNDER" }],
  [2021, { total: 56, totalResult: "UNDER" }],
  [2020, { total: 53, totalResult: "UNDER" }],
  [2019, { total: 55.5, totalResult: "UNDER" }],
  [2018, { total: 49, totalResult: "OVER" }],
  [2017, { total: 57.5, totalResult: "OVER" }],
  [2016, { total: 43, totalResult: "UNDER" }],
  [2015, { total: 47.5, totalResult: "OVER" }],
  [2014, { total: 47.5, totalResult: "OVER" }],
  [2013, { total: 48, totalResult: "OVER" }],
  [2012, { total: 53, totalResult: "UNDER" }],
  [2011, { total: 45, totalResult: "OVER" }],
  [2010, { total: 57, totalResult: "UNDER" }],
  [2009, { total: 46, totalResult: "OVER" }],
  [2008, { total: 55, totalResult: "UNDER" }],
  [2007, { total: 47, totalResult: "UNDER" }],
  [2006, { total: 47, totalResult: "UNDER" }],
  [2005, { total: 46.5, totalResult: "UNDER" }],
  [2004, { total: 37.5, totalResult: "OVER" }],
  [2003, { total: 44, totalResult: "OVER" }],
  [2002, { total: 53, totalResult: "UNDER" }],
  [2001, { total: 33, totalResult: "OVER" }],
  [2000, { total: 45, totalResult: "UNDER" }],
  [1999, { total: 52.5, totalResult: "OVER" }],
  [1998, { total: 49, totalResult: "OVER" }],
  [1997, { total: 49, totalResult: "OVER" }],
  [1996, { total: 51, totalResult: "UNDER" }],
  [1995, { total: 53.5, totalResult: "OVER" }],
  [1994, { total: 50.5, totalResult: "UNDER" }],
  [1993, { total: 44.5, totalResult: "OVER" }],
  [1992, { total: 49, totalResult: "OVER" }],
  [1991, { total: 40.5, totalResult: "UNDER" }],
  [1990, { total: 48, totalResult: "OVER" }],
  [1989, { total: 48, totalResult: "UNDER" }],
  [1988, { total: 47, totalResult: "OVER" }],
  [1987, { total: 40, totalResult: "OVER" }],
  [1986, { total: 37.5, totalResult: "OVER" }],
  [1985, { total: 53.5, totalResult: "OVER" }],
  [1984, { total: 48, totalResult: "UNDER" }],
  [1983, { total: 36.5, totalResult: "OVER" }],
  [1982, { total: 48, totalResult: "UNDER" }],
  [1981, { total: 37.5, totalResult: "UNDER" }],
  [1980, { total: 36, totalResult: "OVER" }],
  [1979, { total: 37, totalResult: "OVER" }],
  [1978, { total: 39, totalResult: "UNDER" }],
  [1977, { total: 38, totalResult: "OVER" }],
  [1976, { total: 36, totalResult: "OVER" }],
  [1975, { total: 33, totalResult: "UNDER" }],
  [1974, { total: 33, totalResult: "UNDER" }],
  [1973, { total: 33, totalResult: "UNDER" }],
  [1972, { total: 34, totalResult: "UNDER" }],
  [1971, { total: 36, totalResult: "UNDER" }],
  [1970, { total: 39, totalResult: "UNDER" }],
  [1969, { total: 40, totalResult: "UNDER" }],
  [1968, { total: 43, totalResult: "OVER" }],
]);

const games = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
let updated = 0;
for (const g of games) {
  const year = g.gameDate ? Number(String(g.gameDate).slice(0, 4)) : null;
  if (!year) continue;
  const found = byYear.get(year);
  if (!found || !g.betting) continue;
  g.betting.total = found.total;
  g.betting.results.totalResult = found.totalResult;
  updated += 1;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(games, null, 2) + "\n", "utf8");
console.log(`Updated totals for ${updated} games from OddsShark table.`);
