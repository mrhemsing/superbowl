import styles from "./page.module.css";
import gamesRaw from "@/data/superbowls.json";
import { MatchupCard, type SuperBowlGame } from "@/app/components/MatchupCard";

const games = gamesRaw as SuperBowlGame[];

export default function Home() {
  const newest = games[games.length - 1];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.kicker}>Broadcast scoreboard mode</div>
        <h1 className={styles.title}>Super Bowls I–LX</h1>
        <div className={styles.sub}>
          {newest ? (
            <>
              Latest: <span className={styles.accent}>Super Bowl {newest.sbRoman}</span>
            </>
          ) : (
            "Dataset not loaded"
          )}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          {games
            .slice()
            .reverse()
            .map((g) => (
              <MatchupCard key={g.id} game={g} />
            ))}
        </div>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerText}>
          Data source: Wikipedia tables (generated via <code>npm run update:data</code>)
        </span>
      </footer>
    </div>
  );
}
