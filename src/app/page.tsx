"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import gamesRaw from "@/data/superbowls.json";
import { MatchupCard, type SuperBowlGame } from "@/app/components/MatchupCard";

const games = gamesRaw as SuperBowlGame[];

export default function Home() {
  const newest = games[games.length - 1];
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const orderedGames = useMemo(() => games.slice().reverse(), []);
  const [activeIndex, setActiveIndex] = useState(0);

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

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      const slideHeight = scroller.clientHeight;
      if (!slideHeight) return;
      const idx = Math.round(scroller.scrollTop / slideHeight);
      const safe = Math.max(0, Math.min(orderedGames.length - 1, idx));
      setActiveIndex(safe);
    };

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [orderedGames.length]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.kicker}>Broadcast scoreboard mode</div>
        <h1 className={styles.title} key={orderedGames[activeIndex]?.id ?? "title-fallback"}>
          Super Bowl {orderedGames[activeIndex]?.sbRoman ?? "I"}
          <span className={styles.titleNumber}> {orderedGames[activeIndex]?.sbNumber ?? 1}</span>
        </h1>
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
          {orderedGames.map((g) => (
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
