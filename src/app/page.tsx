"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import gamesRaw from "@/data/superbowls.json";
import stadiumBackgroundsRaw from "@/data/stadium-backgrounds.json";
import { MatchupCard, type SuperBowlGame } from "@/app/components/MatchupCard";

const games = gamesRaw as SuperBowlGame[];
const stadiumBackgrounds = stadiumBackgroundsRaw as Record<string, string>;

export default function Home() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const jumpMenuRef = useRef<HTMLDetailsElement | null>(null);

  const orderedGames = useMemo(() => {
    const wins = new Map<string, number>();
    const withTitles = games.map((g) => {
      const next = (wins.get(g.winner.name) ?? 0) + 1;
      wins.set(g.winner.name, next);
      return { ...g, winnerTitles: next };
    });
    return withTitles.slice().reverse();
  }, []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bgOpacity, setBgOpacity] = useState(1);

  const goToIndex = (idx: number) => {
    const scroller = scrollerRef.current;
    const section = sectionRefs.current[idx];
    if (!scroller || !section) return;

    scroller.scrollTop = section.offsetTop;
    setActiveIndex(idx);
    if (jumpMenuRef.current) jumpMenuRef.current.open = false;
  };

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

    let wheelLocked = false;
    const onWheel = (e: WheelEvent) => {
      if (window.matchMedia("(max-width: 900px)").matches) return;
      if (Math.abs(e.deltaY) < 4) return;
      if (wheelLocked) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      wheelLocked = true;
      const viewport = scroller.clientHeight;
      scroller.scrollBy({ top: e.deltaY > 0 ? viewport : -viewport, behavior: "smooth" });
      window.setTimeout(() => {
        wheelLocked = false;
      }, 380);
    };

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("wheel", onWheel);
    };
  }, [orderedGames.length]);

  const activeVenue = orderedGames[activeIndex]?.venue?.name;
  const activeBg = stadiumBackgrounds[activeVenue ?? ""] ?? "/stadium-bg.jpg";

  useEffect(() => {
    setBgOpacity(0.6);
    const id = requestAnimationFrame(() => setBgOpacity(1));
    return () => cancelAnimationFrame(id);
  }, [activeBg]);

  return (
    <div
      className={styles.page}
      style={{
        ["--stadium-bg" as "--stadium-bg"]: `url('${activeBg}')`,
        ["--bg-opacity" as "--bg-opacity"]: String(bgOpacity),
      }}
    >
      <header className={styles.header}>
        <div className={styles.kicker}>Broadcast scoreboard mode</div>
        <h1 className={styles.title} key={orderedGames[activeIndex]?.id ?? "title-fallback"}>
          Super Bowl {orderedGames[activeIndex]?.sbRoman ?? "I"}
          <span className={styles.titleNumber}> ({orderedGames[activeIndex]?.sbNumber ?? 1})</span>
        </h1>

        <details className={styles.jumpMenu} ref={jumpMenuRef}>
          <summary aria-label="Open Super Bowl menu">
            <span className={styles.hamburgerIcon}>☰</span>
          </summary>
          <div className={styles.jumpBody}>
            <label htmlFor="jump-sb" className={styles.jumpLabel}>
              Select Super Bowl
            </label>
            <select
              id="jump-sb"
              className={styles.jumpSelect}
              value={activeIndex}
              onChange={(e) => goToIndex(Number(e.target.value))}
            >
              {orderedGames.map((g, idx) => (
                <option key={g.id} value={idx}>
                  Super Bowl {g.sbRoman} ({g.sbNumber})
                </option>
              ))}
            </select>
          </div>
        </details>
      </header>

      <main className={styles.main}>
        <div className={styles.arrows} aria-hidden>
          <span className={styles.arrowUp}>↑</span>
          <span className={styles.arrowDown}>↓</span>
        </div>

        {activeIndex === 0 ? (
          <div className={styles.mobileSwipeHint} aria-hidden>
            <span className={styles.mobileSwipeText}>Swipe up for more</span>
            <svg className={styles.mobileSwipeArrow} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M60 108L8 52h28V12h48v40h28L60 108z"
                fill="currentColor"
                stroke="rgba(96,165,250,0.55)"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <button className={styles.mobileBackToTop} onClick={() => goToIndex(0)}>
            <span className={styles.mobileSwipeText}>Back to top</span>
            <svg className={styles.mobileSwipeArrow} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path
                d="M60 12l52 56H84v40H36V68H8L60 12z"
                fill="currentColor"
                stroke="rgba(96,165,250,0.55)"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <div className={styles.scroller} ref={scrollerRef} tabIndex={0}>
          {orderedGames.map((g, idx) => (
            <section
              key={g.id}
              className={styles.slide}
              ref={(el) => {
                sectionRefs.current[idx] = el;
              }}
            >
              <div className={styles.slideInner}>
                <MatchupCard game={g} />
              </div>
            </section>
          ))}
        </div>
      </main>

      <button className={styles.desktopBackToTop} onClick={() => goToIndex(0)}>
        Back to top ↑
      </button>

      {/* footer removed per request */}
    </div>
  );
}
