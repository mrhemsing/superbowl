import Image from "next/image";
import styles from "./MatchupCard.module.css";
import { teamGradient, teamInitials } from "@/lib/teamStyle";
import { getTeamMeta } from "@/lib/teams";

export type Mvp = {
  name: string;
  team: string;
  position: string | null;
  college: string | null;
  headshotUrl: string;
  imageOverrideUrl: string | null;
};

export type SuperBowlGame = {
  id: string;
  sbRoman: string;
  sbNumber: number;
  seasonYear: number | null;
  gameDate: string | null; // YYYY-MM-DD
  winner: { name: string; score: number | null };
  loser: { name: string; score: number | null };
  scoreText: string;
  quarterScoring: {
    periods: string[];
    winner: number[];
    loser: number[];
  } | null;
  betting: {
    open: number | null;
    favorite: string | null;
    spread: number | null;
    total: number | null;
    moneyline: { favorite: number | null; underdog: number | null };
    results: { mlWinner: string; spreadResult: string | null; totalResult: string | null };
    source: string;
  } | null;
  dateSeasonText: string;
  venue: { name: string; city: string };
  mvp: Mvp[];
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(`${iso}T12:00:00Z`);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return iso;
  }
}

function teamCityName(teamName: string) {
  const parts = teamName.trim().split(/\s+/);
  if (parts.length <= 1) return teamName;
  return parts.slice(0, -1).join(" ");
}

function abbreviatePosition(position: string | null) {
  if (!position) return "";
  return position
    .replace(/^Quarterback\b/i, "QB")
    .replace(/^Running back\b/i, "RB")
    .replace(/^Wide receiver\b/i, "WR")
    .replace(/^Tight end\b/i, "TE")
    .replace(/^Linebacker\b/i, "LB")
    .replace(/^Cornerback\b/i, "CB")
    .replace(/^Safety\b/i, "S")
    .replace(/^Defensive end\b/i, "DE")
    .replace(/^Defensive tackle\b/i, "DT")
    .replace(/^Return specialist\b/i, "RS");
}

function abbreviateStateInCity(city: string) {
  const map: Record<string, string> = {
    Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
    Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
    Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
    Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA",
    Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
    Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
    Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
    "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
    Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
    Wyoming: "WY",
  };
  return city.replace(/,\s*([A-Za-z ]+)$/, (_m, state) => `, ${map[state] ?? state}`);
}

export function MatchupCard({ game }: { game: SuperBowlGame }) {
  const left = game.winner;
  const right = game.loser;

  const leftMeta = getTeamMeta(left.name);
  const rightMeta = getTeamMeta(right.name);

  const leftG = leftMeta ? { a: leftMeta.primary, b: leftMeta.secondary } : teamGradient(left.name);
  const rightG = rightMeta ? { a: rightMeta.primary, b: rightMeta.secondary } : teamGradient(right.name);

  const scoreLeft = left.score ?? "?";
  const scoreRight = right.score ?? "?";

  const spreadResult = game.betting?.results?.spreadResult ?? null;
  const favorite = game.betting?.favorite ?? null;
  const favoriteCovered =
    !!spreadResult &&
    !!favorite &&
    spreadResult.toLowerCase().includes(favorite.toLowerCase()) &&
    spreadResult.toLowerCase().includes("covered");
  const spreadPush = spreadResult === "Push";

  const totalLine = game.betting?.total ?? null;
  const leftNum = typeof left.score === "number" ? left.score : null;
  const rightNum = typeof right.score === "number" ? right.score : null;
  const combined = leftNum != null && rightNum != null ? leftNum + rightNum : null;

  const totalResult =
    game.betting?.results?.totalResult ??
    (totalLine != null && combined != null
      ? combined > totalLine
        ? "OVER"
        : combined < totalLine
        ? "UNDER"
        : "Push"
      : null);
  const totalOver = totalResult === "OVER" || totalResult === "Over";
  const totalUnder = totalResult === "UNDER" || totalResult === "Under";
  const totalPush = totalResult === "PUSH" || totalResult === "Push";

  return (
    <details className={styles.card} open>
      <summary className={styles.summary}>
        <div className={styles.watermark}>{String(game.sbRoman)}</div>

        <div className={styles.top}>
          <div className={styles.team}>
            <div
              className={styles.logo}
              style={{
                background: `linear-gradient(135deg, ${leftG.a}, ${leftG.b})`,
                boxShadow: `0 0 0 2px rgba(76,201,240,0.25), 0 0 22px rgba(76,201,240,0.18)`,
              }}
              aria-label={left.name}
              title={left.name}
            >
              {leftMeta ? (
                <Image
                  src={leftMeta.logoPath}
                  alt={`${leftMeta.abbr} logo`}
                  width={192}
                  height={192}
                  className={styles.logoImg}
                />
              ) : (
                <span className={styles.initials}>{teamInitials(left.name)}</span>
              )}
            </div>
            <div className={styles.teamMeta}>
              <div className={styles.teamName}>{left.name}</div>
              <div className={styles.teamTag}>WINNER</div>
            </div>
          </div>

          <div className={styles.center}>
            {/* Removed repetitive SUPER BOWL line per mobile UX feedback */}
            <div className={styles.score}>
              <span className={styles.scoreNum}>{scoreLeft}</span>
              <span className={styles.dash}>–</span>
              <span className={styles.scoreNum}>{scoreRight}</span>
            </div>
            <div className={styles.subline}>
              <span>{fmtDate(game.gameDate) ?? game.dateSeasonText}</span>
              <span className={styles.dot}>•</span>
              <span>{game.venue.name}</span>
              {game.venue.city ? (
                <>
                  <span className={`${styles.dot} ${styles.dotDesktopHide}`}>•</span>
                  <span className={styles.cityDesktop}>{game.venue.city}</span>
                  <span className={styles.cityMobile}>{abbreviateStateInCity(game.venue.city)}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className={styles.team}>
            <div
              className={`${styles.logo} ${styles.logoLoser}`}
              style={{
                background: `linear-gradient(135deg, ${rightG.a}, ${rightG.b})`,
                opacity: 0.78,
              }}
              aria-label={right.name}
              title={right.name}
            >
              {rightMeta ? (
                <Image
                  src={rightMeta.logoPath}
                  alt={`${rightMeta.abbr} logo`}
                  width={192}
                  height={192}
                  className={styles.logoImg}
                />
              ) : (
                <span className={styles.initials}>{teamInitials(right.name)}</span>
              )}
            </div>
            <div className={styles.teamMeta}>
              <div className={styles.teamName}>{right.name}</div>
              {/* runner-up label removed */}
            </div>
          </div>
        </div>

        {/* collapse hint removed per UX request */}
      </summary>

      <div className={styles.details}>
        <div className={styles.detailGrid}>
          <div className={styles.panel}>
            <div className={`${styles.panelTitle} ${styles.bettingTitle}`}>Betting</div>
            {game.betting ? (
              <div className={styles.oddsGrid}>
                <div
                  className={`${styles.oddsCell} ${
                    spreadResult
                      ? spreadPush
                        ? styles.oddsCellNeutral
                        : favoriteCovered
                        ? styles.oddsCellGood
                        : styles.oddsCellBad
                      : ""
                  }`}
                >
                  <div className={styles.oddsLabel}>Spread</div>
                  <div className={styles.oddsValue}>
                    {game.betting.favorite && game.betting.spread != null
                      ? `${game.betting.favorite} -${game.betting.spread}`
                      : "—"}
                  </div>
                </div>
                <div
                  className={`${styles.oddsCell} ${
                    totalResult
                      ? totalPush
                        ? styles.oddsCellNeutral
                        : totalOver
                        ? styles.oddsCellGood
                        : totalUnder
                        ? styles.oddsCellBad
                        : ""
                      : ""
                  }`}
                >
                  <div className={styles.oddsLabel}>Total</div>
                  <div className={styles.oddsValue}>{game.betting.total != null ? game.betting.total : "—"}</div>
                </div>
              </div>
            ) : (
              <div className={styles.muted}>Odds not available for this game.</div>
            )}

            <div className={styles.panelTitle} style={{ marginTop: 12 }}>
              MVP
            </div>
            {game.mvp.length ? (
              <ul className={styles.mvpList}>
                {game.mvp.map((m) => (
                  <li key={m.name} className={styles.mvpRow}>
                    <div className={styles.mvpAvatar}>
                      <Image
                        src={m.imageOverrideUrl ?? m.headshotUrl}
                        alt={m.name}
                        width={34}
                        height={34}
                        className={styles.mvpAvatarImg}
                      />
                    </div>
                    <div>
                      <div className={styles.mvpName}>{m.name}</div>
                      <div className={styles.mvpMeta}>
                        <span className={styles.mvpPrimaryMeta}>
                          {m.team}
                          {m.position ? ` • ${abbreviatePosition(m.position)}` : ""}
                          {m.college ? <span className={styles.mvpCollege}>{m.college}</span> : null}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.muted}>MVP not found in scrape.</div>
            )}
          </div>

          <div className={`${styles.panel} ${styles.extraPanel}`}>
            {game.quarterScoring ? (
              <div
                className={styles.qTable}
                style={{ ["--period-cols" as "--period-cols"]: String(game.quarterScoring.periods.length + 1) }}
              >
                <div className={styles.qHead}>
                  <span>Team</span>
                  {game.quarterScoring.periods.map((p) => (
                    <span key={p}>{p}</span>
                  ))}
                  <span>T</span>
                </div>
                <div className={styles.qRow}>
                  <span>{teamCityName(left.name)}</span>
                  {game.quarterScoring.winner.map((n, i) => (
                    <span key={`w-${i}`}>{n}</span>
                  ))}
                  <span>{left.score ?? "?"}</span>
                </div>
                <div className={styles.qRow}>
                  <span>{teamCityName(right.name)}</span>
                  {game.quarterScoring.loser.map((n, i) => (
                    <span key={`l-${i}`}>{n}</span>
                  ))}
                  <span>{right.score ?? "?"}</span>
                </div>
              </div>
            ) : (
              <div className={styles.muted}>Quarter-by-quarter data unavailable for this game.</div>
            )}

            <div className={styles.panelTitle} style={{ marginTop: 14 }}>
              Links
            </div>
            <div className={styles.links}>
              <a
                href={`https://en.wikipedia.org/wiki/List_of_Super_Bowl_champions#Results`}
                target="_blank"
                rel="noreferrer"
              >
                Champions table
              </a>
              <a
                href={`https://en.wikipedia.org/wiki/Super_Bowl_Most_Valuable_Player#Winners`}
                target="_blank"
                rel="noreferrer"
              >
                MVP table
              </a>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

