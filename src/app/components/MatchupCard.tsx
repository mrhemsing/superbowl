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

export function MatchupCard({ game }: { game: SuperBowlGame }) {
  const left = game.winner;
  const right = game.loser;

  const leftMeta = getTeamMeta(left.name);
  const rightMeta = getTeamMeta(right.name);

  const leftG = leftMeta ? { a: leftMeta.primary, b: leftMeta.secondary } : teamGradient(left.name);
  const rightG = rightMeta ? { a: rightMeta.primary, b: rightMeta.secondary } : teamGradient(right.name);

  const scoreLeft = left.score ?? "?";
  const scoreRight = right.score ?? "?";

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
                  <span className={styles.dot}>•</span>
                  <span>{game.venue.city}</span>
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
              <div className={styles.teamTagMuted}>Runner-up</div>
            </div>
          </div>
        </div>

        {/* collapse hint removed per UX request */}
      </summary>

      <div className={styles.details}>
        <div className={styles.detailGrid}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>MVP</div>
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
                        {m.team}
                        {m.position ? ` • ${m.position}` : ""}
                        {m.college ? ` • ${m.college}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.muted}>MVP not found in scrape.</div>
            )}

            <div className={styles.panelTitle} style={{ marginTop: 12 }}>
              Odds
            </div>
            {game.betting ? (
              <div className={styles.oddsGrid}>
                <div className={styles.oddsCell}>
                  <div className={styles.oddsLabel}>Spread</div>
                  <div className={styles.oddsValue}>
                    {game.betting.favorite && game.betting.spread != null
                      ? `${game.betting.favorite} -${game.betting.spread}`
                      : "—"}
                  </div>
                  {game.betting.results.spreadResult ? (
                    <div className={styles.oddsWin}>{game.betting.results.spreadResult}</div>
                  ) : null}
                </div>
                <div className={styles.oddsCell}>
                  <div className={styles.oddsLabel}>Total</div>
                  <div className={styles.oddsValue}>{game.betting.total != null ? game.betting.total : "—"}</div>
                  {game.betting.results.totalResult ? (
                    <div className={styles.oddsWin}>{game.betting.results.totalResult}</div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className={styles.muted}>Odds not available for this game.</div>
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

