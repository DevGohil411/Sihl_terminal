"use client";

import { useEffect, useState } from "react";

const WORK = [
  { title: "Signal Atlas", type: "Research", year: "2026" },
  { title: "Liquidity Lattice", type: "Execution", year: "2025" },
  { title: "Regime Prism", type: "Risk", year: "2025" },
  { title: "Alpha Cartography", type: "Strategy", year: "2024" },
  { title: "Volatility Echo", type: "Diagnostics", year: "2024" },
];

export default function CinematicPage() {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / 1200) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(tick);
        setTimeout(() => setReady(true), 220);
      }
    }, 30);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      document.documentElement.style.setProperty("--mx", x.toFixed(3));
      document.documentElement.style.setProperty("--my", y.toFixed(3));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <main className="at-root">
      {!ready && (
        <div className="at-loader">
          <div className="at-loader-inner">
            <div className="at-logo">A</div>
            <div className="at-loader-bar">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="at-loader-text">Preparing cinematic system</p>
          </div>
        </div>
      )}

      <div className="at-hero">
        <div className="at-nav">
          <div className="at-brand">APECHAIN</div>
          <div className="at-nav-links">
            <span>Work</span>
            <span>Research</span>
            <span>Contact</span>
          </div>
        </div>
        <div className="at-hero-copy">
          <p className="at-kicker">Quant Research Terminal</p>
          <h1>Backtest Intelligence, reimagined as a cinematic system.</h1>
          <p className="at-sub">
            A premium research environment that blends narrative clarity, atmospheric depth, and
            institutional-grade analytics for decision makers.
          </p>
        </div>
        <div className="at-hero-footer">
          <span>Scroll to enter</span>
          <div className="at-scroll-dot" />
        </div>
      </div>

      <section className="at-section">
        <div className="at-section-head">
          <p className="at-kicker">Studio</p>
          <h2>We build intelligence panels, not dashboards.</h2>
        </div>
        <div className="at-grid">
          <div className="at-card">
            <p className="at-label">Signal Depth</p>
            <h3>Multi-regime narratives</h3>
            <p className="at-body">Frame alpha and risk in a single, coherent story.</p>
          </div>
          <div className="at-card">
            <p className="at-label">Surface Design</p>
            <h3>Floating glass systems</h3>
            <p className="at-body">Soft depth, controlled contrast, and precision typography.</p>
          </div>
          <div className="at-card">
            <p className="at-label">Decision Flow</p>
            <h3>Executive clarity</h3>
            <p className="at-body">Make complex analytics feel immediate and premium.</p>
          </div>
        </div>
      </section>

      <section className="at-section at-work">
        <div className="at-section-head">
          <p className="at-kicker">Selected Work</p>
          <h2>Systems that feel inevitable.</h2>
        </div>
        <div className="at-work-list">
          {WORK.map((item) => (
            <div key={item.title} className="at-work-row">
              <div>
                <h3>{item.title}</h3>
                <p>{item.type}</p>
              </div>
              <span>{item.year}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="at-section">
        <div className="at-section-head">
          <p className="at-kicker">Launch</p>
          <h2>Ready to run a cinematic backtest?</h2>
        </div>
        <div className="at-cta">
          <button className="at-btn">Start new analysis</button>
          <button className="at-btn ghost">View sample report</button>
        </div>
      </section>
    </main>
  );
}
