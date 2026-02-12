"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";
import gamesRaw from "@/data/superbowls.json";
import { MatchupCard, type SuperBowlGame } from "@/app/components/MatchupCard";

const games = gamesRaw as SuperBowlGame[];

export default function Home() {
  const newest = games[games.length - 1];
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const viewport = scroller.clientHeight;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scroller.scrollBy({ top: viewport, behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scroller.scrollBy({ top: -viewport, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
        <div className={styles.arrows} aria-hidden>
          <span className={styles.arrowUp}>↑</span>
          <span className={styles.arrowDown}>↓</span>
        </div>

        <div className={styles.scroller} ref={scrollerRef} tabIndex={0}>
          {games
            .slice()
            .reverse()
            .map((g) => (
              <section key={g.id} className={styles.slide}>
                <div className={styles.slideInner}>
                  <MatchupCard game={g} />
                </div>
              </section>
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
