"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  BarChart3, Layers, ArrowRight,
  Activity, TrendingUp, Shield, Zap, PieChart,
  Cpu, Rocket, Radio,
  Plug, Webhook, Workflow, ShieldCheck,
  Mail, Check, X,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   COLOR TOKENS — UI Blueprint palette
   ═══════════════════════════════════════════════════════════ */
const BG = "#070A0F";
const SURFACE = "#0B1120";
const SURFACE_L = "#101825";
const TEAL = "#2DD4BF";
const CYAN = "#14E0C4";
const BLUE = "#3B82F6";
const VIOLET = "#8B5CF6";
const AMBER = "#F59E0B";
const GREEN = "#22C55E";
const SLATE = "#6B7685";
const TEXT_SECONDARY = "#94A3B8";
const TEXT_MUTED = "#64748B";

/* ═══════════════════════════════════════════════════════════
   DATA CONSTANTS
   ═══════════════════════════════════════════════════════════ */
const PANELS = [
  {
    id: "deployed",
    title: "Algofy Strategies",
    subtitle: "Proprietary quant models built by Algofy research.",
    features: ["Live performance tracking", "Research-backed models", "Risk-managed deployment", "Analytics & reporting"],
    cta: "Explore Strategies",
    href: "/strategies/deployed",
    icon: BarChart3,
    accent: TEAL,
    bullet: TEAL,
    visual: "quant" as const,
  },
  {
    id: "options",
    title: "Pre-Built Option Strategies",
    subtitle: "Expert-designed option setups for any market condition.",
    features: ["Bull Call Spread", "Iron Condor", "Straddle", "Butterfly", "Protective Put"],
    cta: "Explore Option Strategies",
    href: "/strategies/options",
    icon: Layers,
    accent: BLUE,
    bullet: BLUE,
    visual: "payoff" as const,
  },
];

const LIFECYCLE = [
  { num: "01", icon: Cpu, label: "Signal Generation", desc: "High-probability trading signals identified by our quant models.", color: TEAL, titleColor: "#F1F5F9" },
  { num: "02", icon: BarChart3, label: "Backtesting", desc: "Rigorous historical testing across multiple market conditions.", color: CYAN, titleColor: "#F1F5F9" },
  { num: "03", icon: Shield, label: "Risk Validation", desc: "Risk exposure, drawdown & position sizing validation.", color: VIOLET, titleColor: VIOLET },
  { num: "04", icon: Rocket, label: "Deployment", desc: "Strategies deployed with real-time risk controls & monitoring.", color: AMBER, titleColor: AMBER },
  { num: "05", icon: Radio, label: "Monitoring", desc: "Continuous performance tracking & anomaly detection.", color: BLUE, titleColor: BLUE },
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function sinePath(w: number, amp: number, freq: number, yOff: number): string {
  const s: string[] = [];
  for (let x = 0; x <= w; x += 6) {
    const y = yOff + amp * Math.sin(x * freq);
    s.push(x === 0 ? `M${x},${y.toFixed(1)}` : `L${x},${y.toFixed(1)}`);
  }
  return s.join(" ");
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ═══════════════════════════════════════════════════════════
   HERO BACKGROUND MARKET CHART
   ═══════════════════════════════════════════════════════════ */
function HeroChartBackground() {
  const VW = 800, VH = 340;

  // Dense jagged market line (left-to-right upward trend)
  const trendPath = "M0 292 L28 286 L52 290 L78 278 L104 282 L132 268 L160 272 L186 258 L214 264 L242 248 L270 254 L298 236 L326 242 L354 222 L382 230 L410 208 L438 216 L466 194 L494 202 L522 180 L550 188 L578 168 L606 176 L634 154 L662 162 L690 142 L718 150 L746 128 L774 136 L800 118";

  const hMajor = [68, 136, 204, 272];
  const vMajor = [80, 200, 320, 440, 560, 680];

  const priceLabels = [
    { x: 120, y: 262, text: "+0.65%", c: TEAL },
    { x: 270, y: 232, text: "+0.69%", c: TEAL },
    { x: 410, y: 194, text: "+1.23%", c: TEAL },
    { x: 578, y: 156, text: "+1.25%", c: CYAN },
    { x: 746, y: 118, text: "+1.23%", c: CYAN },
  ];

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="heroLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.25" />
          <stop offset="50%" stopColor={TEAL} stopOpacity="0.65" />
          <stop offset="100%" stopColor={CYAN} stopOpacity="1" />
        </linearGradient>
        <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.12" />
          <stop offset="60%" stopColor={TEAL} stopOpacity="0.03" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
        </linearGradient>
        <filter id="heroLineGlow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="heroPointGlow">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="heroDotGrid" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="24" cy="24" r="1" fill="white" opacity="0.04" />
        </pattern>
      </defs>

      {/* Dot grid background */}
      <rect x="0" y="0" width={VW} height={VH} fill="url(#heroDotGrid)" />

      {/* Major horizontal grid lines */}
      {hMajor.map((y, i) => (
        <motion.line key={`hM${i}`} x1="0" y1={y} x2={VW} y2={y}
          stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" strokeDasharray="3 6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 + i * 0.06 }} />
      ))}

      {/* Major vertical grid lines */}
      {vMajor.map((x, i) => (
        <motion.line key={`vM${i}`} x1={x} y1="0" x2={x} y2={VH}
          stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" strokeDasharray="3 6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 + i * 0.06 }} />
      ))}

      {/* Area fill under main trend */}
      <motion.path d={`${trendPath} L${VW} ${VH} L0 ${VH} Z`}
        fill="url(#heroAreaGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1.8 }} />

      {/* Secondary faint trend lines for depth */}
      <motion.path d="M0 305 Q160 280 320 245 T640 175 T800 135"
        fill="none" stroke={BLUE} strokeWidth="1" strokeOpacity="0.12"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2.5, delay: 0.4 }} />
      <motion.path d="M0 315 Q200 290 400 260 T800 165"
        fill="none" stroke={TEAL} strokeWidth="0.8" strokeOpacity="0.08"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2.5, delay: 0.6 }} />

      {/* Main jagged trend line */}
      <motion.path d={trendPath} fill="none"
        stroke="url(#heroLineGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        filter="url(#heroLineGlow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.2, ease: "easeInOut" }} />

      {/* Traveling particles along main trend */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={`ptc${i}`} r={1.4 + i * 0.3} fill={i % 2 === 0 ? TEAL : CYAN} opacity={0.5 - i * 0.08} filter="url(#heroPointGlow)">
          <animateMotion dur={`${5 + i * 1.5}s`} repeatCount="indefinite" begin={`${i * 1.2}s`} path={trendPath} />
        </circle>
      ))}

      {/* Floating percentage labels */}
      {priceLabels.map((l, i) => (
        <motion.g key={`lbl${i}`} initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 + i * 0.18, duration: 0.5 }}>
          <rect x={l.x - 28} y={l.y - 13} width="56" height="20" rx="5"
            fill={`${l.c}12`} stroke={l.c} strokeWidth="0.5" opacity="0.7" />
          <text x={l.x} y={l.y + 3} textAnchor="middle"
            fill={l.c} fontSize="9" fontFamily="var(--font-jetbrains), monospace" fontWeight="500">{l.text}</text>
        </motion.g>
      ))}

      {/* Ambient particles */}
      {Array.from({ length: 28 }).map((_, i) => {
        const ax = 40 + (i % 7) * 110;
        const ay = 40 + Math.floor(i / 7) * 78;
        const ac = [TEAL, CYAN, BLUE][i % 3];
        return (
          <circle key={`adust${i}`} cx={ax} cy={ay}
            r={0.5 + (i % 3) * 0.25} fill={ac} opacity="0.04">
            <animate attributeName="opacity" values="0.02;0.10;0.02"
              dur={`${4 + (i % 5) * 1.2}s`} repeatCount="indefinite" begin={`${i * 0.35}s`} />
          </circle>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   ISOMETRIC STACKED LAYERS — center card graphic
   ═══════════════════════════════════════════════════════════ */
function IsometricStack() {
  const layers = [
    { y: 12, op: 0.85, size: 1.08 },
    { y: 40, op: 0.55, size: 1.0 },
    { y: 68, op: 0.40, size: 0.92 },
    { y: 96, op: 0.28, size: 0.84 },
  ];

  return (
    <div className="absolute -right-4 bottom-2 w-72 h-72 pointer-events-none">
      <svg viewBox="0 0 240 230" className="w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="isoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.55" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="isoGradTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.8" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="isoVol" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.18" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
          </radialGradient>
          <filter id="isoGlow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Volumetric glow */}
        <ellipse cx="120" cy="125" rx="85" ry="55" fill="url(#isoVol)" />

        {layers.map((l, i) => {
          const w = 120 * l.size;
          const h = 44 * l.size;
          const left = 120 - w / 2;
          const top = l.y;
          const path = `M${left + w / 2} ${top} L${left + w} ${top + h / 2} L${left + w / 2} ${top + h} L${left} ${top + h / 2} Z`;
          return (
            <motion.g key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: [0, -3, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 0.3 + i * 0.1 },
                y: { duration: 4 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
              }}>
              <path d={path}
                fill={i === 0 ? "url(#isoGradTop)" : "url(#isoGrad)"}
                stroke={TEAL} strokeWidth={i === 0 ? 1.4 : 0.8} opacity={l.op} filter={i === 0 ? "url(#isoGlow)" : undefined} />
              {/* Inner grid lines */}
              <line x1={left + w * 0.25} y1={top + h * 0.25} x2={left + w * 0.75} y2={top + h * 0.25}
                stroke={TEAL} strokeWidth="0.35" opacity={l.op * 0.35} strokeDasharray="2 4" />
              <line x1={left + w * 0.25} y1={top + h * 0.75} x2={left + w * 0.75} y2={top + h * 0.75}
                stroke={TEAL} strokeWidth="0.35" opacity={l.op * 0.35} strokeDasharray="2 4" />
            </motion.g>
          );
        })}

        {/* Rising particles */}
        {Array.from({ length: 18 }).map((_, i) => {
          const cx = 55 + (i % 6) * 22;
          const startY = 175 - (i % 5) * 8;
          return (
            <circle key={`rp${i}`} r={0.9 + (i % 3) * 0.35}
              fill={i % 2 === 0 ? TEAL : CYAN} opacity="0.6" filter="url(#isoGlow)">
              <animate attributeName="cy" values={`${startY};${startY - 95};${startY}`}
                dur={`${2.5 + (i % 4) * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.22}s`} />
              <animate attributeName="cx" values={`${cx};${cx + (i % 2 === 0 ? 5 : -5)};${cx}`}
                dur={`${2.5 + (i % 4) * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.22}s`} />
              <animate attributeName="opacity" values="0;0.7;0"
                dur={`${2.5 + (i % 4) * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.22}s`} />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAYOFF CURVES — right card graphic
   ═══════════════════════════════════════════════════════════ */
function PayoffCurves() {
  return (
    <div className="absolute -right-2 bottom-4 w-72 h-64 pointer-events-none">
      <svg viewBox="0 0 260 200" className="w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="payoffArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity="0.25" />
            <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="peakGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="30%" stopColor={BLUE} stopOpacity="0.65" />
            <stop offset="70%" stopColor={BLUE} stopOpacity="0.15" />
            <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
          </radialGradient>
          <filter id="payoffGlow">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="peakBloom">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Faint grid */}
        {[45, 80, 115, 150].map((y, i) => (
          <line key={`ay${i}`} x1="20" y1={y} x2="240" y2={y}
            stroke="rgba(255,255,255,0.035)" strokeWidth="0.5" strokeDasharray="2 5" />
        ))}
        {[55, 105, 155, 205].map((x, i) => (
          <line key={`ax${i}`} x1={x} y1="30" x2={x} y2="175"
            stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" strokeDasharray="2 5" />
        ))}
        {/* Axes */}
        <line x1="20" y1="175" x2="240" y2="175" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
        <line x1="20" y1="30" x2="20" y2="175" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

        {/* Main blue bell curve */}
        <motion.path d="M20 165 C55 162 75 130 95 95 C115 60 140 35 170 35 C200 35 225 60 245 95"
          fill="none" stroke={BLUE} strokeWidth="2" filter="url(#payoffGlow)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }} />
        <path d="M20 165 C55 162 75 130 95 95 C115 60 140 35 170 35 C200 35 225 60 245 95 L245 175 L20 175 Z"
          fill="url(#payoffArea)" opacity="0.45" />

        {/* Secondary purple curve */}
        <motion.path d="M20 158 C60 150 90 120 125 108 C160 96 195 110 240 82"
          fill="none" stroke={VIOLET} strokeWidth="1.3" opacity="0.45"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, delay: 0.25, ease: "easeOut" }} />

        {/* Tertiary teal curve */}
        <motion.path d="M20 170 C70 165 110 145 155 138 C200 131 225 145 245 135"
          fill="none" stroke={TEAL} strokeWidth="1" opacity="0.28"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, delay: 0.4, ease: "easeOut" }} />

        {/* Starburst peak glow at main curve peak */}
        <motion.g
          animate={{ opacity: [0.75, 1, 0.75], scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <circle cx="170" cy="35" r="22" fill="url(#peakGlow)" filter="url(#peakBloom)" />
          <circle cx="170" cy="35" r="4" fill="white" filter="url(#payoffGlow)" />
          {/* Starburst rays */}
          {[0, 45, 90, 135].map((angle) => (
            <line key={angle} x1="170" y1="35"
              x2={170 + Math.cos((angle * Math.PI) / 180) * 14}
              y2={35 + Math.sin((angle * Math.PI) / 180) * 14}
              stroke={BLUE} strokeWidth="0.6" opacity="0.4" />
          ))}
        </motion.g>

        {/* Subtle data points */}
        {[
          { x: 95, y: 95, c: BLUE }, { x: 170, y: 35, c: "white" },
          { x: 125, y: 108, c: VIOLET }, { x: 155, y: 138, c: TEAL },
        ].map((p, i) => (
          <g key={`bp${i}`}>
            <circle cx={p.x} cy={p.y} r="2.5" fill={p.c} filter="url(#payoffGlow)">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin={`${i * 0.4}s`} />
            </circle>
            <circle cx={p.x} cy={p.y} r="5" fill="none" stroke={p.c} strokeWidth="0.5" opacity="0.2">
              <animate attributeName="r" values="5;9;5" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.4}s`} />
              <animate attributeName="opacity" values="0.2;0;0.2" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.4}s`} />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BOTTOM WAVE / PARTICLE VISUALIZATION
   ═══════════════════════════════════════════════════════════ */
function WaveVisualization() {
  const waves = [
    { amp: 5, freq: 0.022, yOff: 10, color: TEAL, count: 18, dur: 7 },
    { amp: 8, freq: 0.016, yOff: 18, color: CYAN, count: 16, dur: 9 },
    { amp: 4, freq: 0.028, yOff: 14, color: VIOLET, count: 14, dur: 6.5 },
    { amp: 7, freq: 0.019, yOff: 26, color: AMBER, count: 15, dur: 8.5 },
    { amp: 9, freq: 0.014, yOff: 34, color: BLUE, count: 17, dur: 10 },
  ];

  return (
    <svg viewBox="0 0 1100 60" className="w-full h-16 mt-2" style={{ overflow: "visible" }}>
      <defs>
        <filter id="waveGlow">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {waves.map((w, wi) => {
        const path = sinePath(1100, w.amp, w.freq, w.yOff);
        return (
          <g key={wi}>
            <path d={path} fill="none" stroke={w.color} strokeWidth="0.45" opacity="0.08" />
            {Array.from({ length: w.count }).map((_, pi) => (
              <circle key={pi}
                r={0.7 + (pi % 4) * 0.35}
                fill={w.color}
                opacity={0.12 + (pi % 5) * 0.07}
                filter="url(#waveGlow)">
                <animateMotion
                  dur={`${w.dur + (pi % 4) * 0.8}s`}
                  repeatCount="indefinite"
                  begin={`${(pi / w.count) * w.dur}s`}
                  path={path} />
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   LIVE STRATEGY LIFECYCLE
   ═══════════════════════════════════════════════════════════ */
function LifecyclePanel() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative">
      {LIFECYCLE.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="relative">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.14 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-4">
                <motion.div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-2 transition-all duration-300 hover:scale-110"
                  style={{
                    borderColor: `${item.color}50`,
                    background: `radial-gradient(circle, ${hexToRgba(item.color, 0.08)} 0%, transparent 70%)`,
                    color: item.color,
                    boxShadow: `0 0 24px ${hexToRgba(item.color, 0.15)}`,
                  }}
                  animate={inView ? {
                    boxShadow: [
                      `0 0 18px ${hexToRgba(item.color, 0.12)}`,
                      `0 0 36px ${hexToRgba(item.color, 0.28)}`,
                      `0 0 18px ${hexToRgba(item.color, 0.12)}`,
                    ],
                  } : {}}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
                >
                  <Icon size={24} strokeWidth={1.7} />
                </motion.div>
                <span className="absolute -top-1.5 -right-1.5 text-[10px] font-mono text-[#5C6B7A]">
                  {item.num}
                </span>
              </div>
              <h4 className="text-[15px] font-semibold mb-1.5" style={{ color: item.titleColor }}>{item.label}</h4>
              <p className="text-xs text-[#6B7685] leading-relaxed max-w-[180px]">{item.desc}</p>
            </motion.div>

            {/* Dotted connector + traveling particles */}
            {i < LIFECYCLE.length - 1 && (
              <div className="hidden lg:block absolute top-9 left-[60%] w-[82%]">
                <svg className="w-full h-8" style={{ overflow: "visible" }}>
                  <line x1="0" y1="16" x2="100%" y2="16"
                    stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 5" />
                  <line x1="0" y1="12" x2="100%" y2="12"
                    stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                  <line x1="0" y1="20" x2="100%" y2="20"
                    stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                  <circle r="2.2" fill={CYAN} filter="drop-shadow(0 0 4px #14E0C4)">
                    <animateMotion dur="2.2s" repeatCount="indefinite"
                      begin={`${i * 0.3}s`} path="M0 16 L200 16" />
                  </circle>
                  <circle r="1.5" fill={TEAL} opacity="0.5">
                    <animateMotion dur="2.8s" repeatCount="indefinite"
                      begin={`${i * 0.3 + 0.8}s`} path="M0 16 L200 16" />
                  </circle>
                  <circle r="1" fill={BLUE} opacity="0.35">
                    <animateMotion dur="3.4s" repeatCount="indefinite"
                      begin={`${i * 0.3 + 1.5}s`} path="M0 16 L200 16" />
                  </circle>
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INVESTOR / BUILDER BANNER — Circuit data-flow visual
   ═══════════════════════════════════════════════════════════ */
function InvestorBuilderBanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const lines = [
    "M10 35 L90 35 L110 18 L200 18 L220 50 L300 50",
    "M10 58 L75 58 L95 78 L185 78 L205 58 L320 58",
    "M10 82 L120 82 L140 102 L250 102 L270 82 L380 82",
    "M10 108 L60 108 L80 128 L170 128 L190 108 L350 108",
    "M10 132 L130 132 L150 152 L240 152 L260 132 L400 132",
  ];

  const hexNodes = [
    { x: 90, y: 35 }, { x: 200, y: 18 }, { x: 300, y: 50 },
    { x: 75, y: 58 }, { x: 185, y: 78 }, { x: 320, y: 58 },
    { x: 120, y: 82 }, { x: 250, y: 102 }, { x: 380, y: 82 },
    { x: 60, y: 108 }, { x: 170, y: 128 }, { x: 350, y: 108 },
    { x: 130, y: 132 }, { x: 240, y: 152 }, { x: 400, y: 132 },
  ];

  return (
    <section ref={ref} className="px-6 pb-6">
      <div className="max-w-[1536px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          {/* Top headline */}
          <div className="text-center mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight"
            >
              Build Algos With Trading APIs
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[15px] text-[#94A3B8] max-w-xl mx-auto"
            >
              Easy algo platform for all. Built for Traders, Investors, Beginners, Experts.
            </motion.p>
          </div>

          {/* Banner card */}
          <div
            className="rounded-2xl border border-white/[0.06] p-0 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(13,20,30,0.95), rgba(8,12,18,0.98))",
              backdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.45)",
            }}
          >
            {/* top accent line */}
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.4), rgba(59,130,246,0.3), transparent)" }} />

            {/* background glow */}
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-[#2DD4BF]/5 blur-[100px] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left text */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="p-8 md:p-10 flex flex-col justify-center"
              >
                <span className="w-fit inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.12em] uppercase text-[#2DD4BF] bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
                  Free Trading APIs
                </span>
                <h3 className="text-2xl md:text-[32px] font-semibold text-white mb-3 tracking-tight leading-tight">
                  Start automating without any additional charges
                </h3>
                <p className="text-[15px] text-[#94A3B8] leading-relaxed max-w-md mb-7">
                  Zero API charges and a flat ₹20 per order brokerage. Connect your algos directly to live market data and execution venues without hidden costs.
                </p>

                {/* brokerage comparison */}
                <div className="flex items-center gap-4 mb-7">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#64748B] uppercase tracking-wider">API Charges</span>
                    <span className="text-2xl font-bold text-[#2DD4BF]">₹0</span>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#64748B] uppercase tracking-wider">Brokerage</span>
                    <span className="text-2xl font-bold text-white">₹20 <span className="text-sm font-medium text-[#64748B]">/ order</span></span>
                  </div>
                </div>

                <Link
                  href="/api"
                  className="group w-fit inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-medium border transition-all duration-300 hover:gap-3.5"
                  style={{ color: TEAL, borderColor: `${TEAL}35`, background: `${TEAL}08` }}
                >
                  Explore APIs
                  <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>

              {/* Right circuit graphic */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="relative h-72 md:h-80 lg:h-full min-h-[300px] border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-gradient-to-br from-white/[0.01] to-transparent"
              >
                <svg viewBox="0 0 420 180" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
                  <defs>
                    <linearGradient id="apiLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={TEAL} stopOpacity="0.15" />
                      <stop offset="50%" stopColor={BLUE} stopOpacity="0.5" />
                      <stop offset="100%" stopColor={TEAL} stopOpacity="0.9" />
                    </linearGradient>
                    <filter id="apiGlow">
                      <feGaussianBlur stdDeviation="2.5" result="b" />
                      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="apiBadgeGlow">
                      <feGaussianBlur stdDeviation="6" result="b" />
                      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>

                  {/* Circuit lines */}
                  {lines.map((d, i) => (
                    <path key={i} d={d} fill="none" stroke="url(#apiLineGrad)" strokeWidth="1.2" opacity="0.35" />
                  ))}

                  {/* Hex nodes */}
                  {hexNodes.map((n, i) => (
                    <g key={i}>
                      <polygon
                        points={`${n.x},${n.y - 5} ${n.x + 5},${n.y - 2.5} ${n.x + 5},${n.y + 2.5} ${n.x},${n.y + 5} ${n.x - 5},${n.y + 2.5} ${n.x - 5},${n.y - 2.5}`}
                        fill={SURFACE_L} stroke={i % 3 === 0 ? TEAL : i % 3 === 1 ? BLUE : CYAN} strokeWidth="1" opacity="0.9" />
                      <circle cx={n.x} cy={n.y} r="1.8" fill={i % 3 === 0 ? TEAL : i % 3 === 1 ? BLUE : CYAN} filter="url(#apiGlow)" />
                    </g>
                  ))}

                  {/* Traveling data packets */}
                  {lines.map((d, i) => (
                    <g key={`pkt-${i}`}>
                      {[0, 1].map((j) => (
                        <circle key={j} r="2.2" fill={i % 2 === 0 ? TEAL : CYAN} opacity="0.85" filter="url(#apiGlow)">
                          <animateMotion dur={`${2.8 + i * 0.3}s`} repeatCount="indefinite" begin={`${j * 1.4}s`} path={d} />
                        </circle>
                      ))}
                    </g>
                  ))}

                  {/* Large ₹0 badge */}
                  <motion.g
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.7, delay: 0.4 }}
                  >
                    <defs>
                      <linearGradient id="badgeRing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={TEAL} />
                        <stop offset="100%" stopColor={BLUE} />
                      </linearGradient>
                    </defs>
                    <circle cx="330" cy="90" r="52" fill={SURFACE_L} stroke="url(#badgeRing)" strokeWidth="2" opacity="0.95" filter="url(#apiBadgeGlow)" />
                    <circle cx="330" cy="90" r="58" fill="none" stroke={TEAL} strokeWidth="0.8" opacity="0.2">
                      <animate attributeName="r" values="58;70;58" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0;0.2" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <text x="330" y="108" textAnchor="middle" fill="url(#badgeRing)" fontSize="46" fontWeight="800" fontFamily="var(--font-jetbrains), monospace">₹0</text>
                  </motion.g>

                  {/* FREE tag */}
                  <motion.g
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <rect x="288" y="150" width="84" height="24" rx="5" fill={`${TEAL}14`} stroke={TEAL} strokeWidth="0.7" opacity="0.95" />
                    <text x="330" y="166" textAnchor="middle" fill={TEAL} fontSize="10" fontWeight="700" letterSpacing="0.08em">BROKERAGE</text>
                  </motion.g>

                  {/* Ambient particles */}
                  {Array.from({ length: 16 }).map((_, i) => (
                    <circle key={`amb${i}`} cx={25 + (i % 8) * 50} cy={15 + Math.floor(i / 8) * 150} r="1.2" fill={TEAL} opacity="0.06">
                      <animate attributeName="opacity" values="0.02;0.12;0.02" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" begin={`${i * 0.15}s`} />
                    </circle>
                  ))}
                </svg>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   STRATEGY ENGINEERING / CONSULTATION
   ═══════════════════════════════════════════════════════════ */
function StrategyEngineeringSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const particles = Array.from({ length: 24 }, (_, i) => ({
    x: 5 + (i % 8) * 12,
    y: 10 + Math.floor(i / 8) * 35,
    r: 0.6 + (i % 3) * 0.3,
    dur: 4 + (i % 4),
    delay: i * 0.25,
  }));

  return (
    <section ref={ref} className="px-6 pb-6">
      <div className="max-w-[1536px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative rounded-2xl border border-white/[0.06] p-8 md:p-10 lg:p-12 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(13,20,30,0.95), rgba(8,12,18,0.98))",
            backdropFilter: "blur(20px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.45)",
          }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.4), rgba(59,130,246,0.3), transparent)" }} />

          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-[#2DD4BF]/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-[#3B82F6]/5 blur-[100px] pointer-events-none" />

          {/* Animated neural / flowing background */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="engLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={TEAL} stopOpacity="0" />
                  <stop offset="50%" stopColor={TEAL} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20, 40, 60, 80].map((y, i) => (
                <path
                  key={i}
                  d={`M-5 ${y} Q25 ${y - 12} 50 ${y} T105 ${y - 8}`}
                  fill="none"
                  stroke="url(#engLineGrad)"
                  strokeWidth="0.35"
                >
                  <animate attributeName="d" values={`M-5 ${y} Q25 ${y - 12} 50 ${y} T105 ${y - 8};M-5 ${y} Q25 ${y + 12} 50 ${y} T105 ${y + 8};M-5 ${y} Q25 ${y - 12} 50 ${y} T105 ${y - 8}`} dur={`${6 + i}s`} repeatCount="indefinite" />
                </path>
              ))}
              {particles.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={i % 3 === 0 ? TEAL : i % 3 === 1 ? BLUE : CYAN} opacity="0.25">
                  <animate attributeName="cy" values={`${p.y};${p.y - 8};${p.y}`} dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
                  <animate attributeName="opacity" values="0.1;0.4;0.1" dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.delay}s`} />
                </circle>
              ))}
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left content */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-[42px] font-semibold text-white mb-4 tracking-tight leading-tight"
              >
                Bring The Strategy. We&apos;ll Engineer The Edge.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[15px] md:text-base text-[#94A3B8] leading-relaxed max-w-lg mb-8"
              >
                Whether it&apos;s a simple setup or a complex trading model, we help turn your ideas into real strategies that can be backtested, monitored, and deployed.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-3"
              >
                {["Backtested Models", "Real-Time Monitoring", "Deployable Logic"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide text-[#2DD4BF] bg-[#2DD4BF]/10 border border-[#2DD4BF]/20"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Support card */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="group rounded-xl border border-white/[0.06] p-6 md:p-8 bg-white/[0.02] hover:-translate-y-1 hover:border-[#2DD4BF]/20 transition-all duration-500"
              style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.35)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)` }} />
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-2 tracking-tight">
                Need Help Building Your Strategy?
              </h3>
              <p className="text-[14px] text-[#94A3B8] leading-relaxed mb-6">
                Our team can help translate your trading logic into a deployable strategy with professional implementation guidance.
              </p>

              <div className="flex items-center gap-3 mb-6 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                <div className="w-10 h-10 rounded-lg bg-[#2DD4BF]/10 flex items-center justify-center">
                  <Mail size={18} className="text-[#2DD4BF]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Email</div>
                  <div className="text-sm text-white font-medium">support.algo@sihl.in</div>
                </div>
              </div>

              <a
                href="mailto:support.algo@sihl.in"
                className="group w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-medium border transition-all duration-300 hover:gap-3.5"
                style={{ color: TEAL, borderColor: `${TEAL}35`, background: `${TEAL}08` }}
              >
                Contact Support
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   WHY CONNECT YOUR API?
   ═══════════════════════════════════════════════════════════ */
const API_CARDS = [
  {
    num: "01",
    icon: Plug,
    title: "One API, Every Exchange",
    desc: "Stop wrestling with multiple broker APIs. One Algofy integration gives you unified market data, order placement, and portfolio updates across venues.",
    color: TEAL,
  },
  {
    num: "02",
    icon: Workflow,
    title: "Automate Without the Plumbing",
    desc: "We handle authentication, session management, rate limits, and error retrying so you can focus on strategy logic instead of API maintenance.",
    color: BLUE,
  },
  {
    num: "03",
    icon: Webhook,
    title: "Real-Time Data & Execution",
    desc: "Get low-latency ticks, order acknowledgements, and position updates over a single reliable connection built for active traders.",
    color: AMBER,
  },
  {
    num: "04",
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    desc: "API credentials are encrypted at rest, never exposed in the UI, and access is gated by role-based controls so your capital stays protected.",
    color: VIOLET,
  },
];

function BrokerMiniVisual({ color, index }: { color: string; index: number }) {
  const c = color;
  if (index === 0) {
    return (
      <svg viewBox="0 0 120 60" className="w-full h-full opacity-60" style={{ overflow: "visible" }}>
        <circle cx="15" cy="30" r="6" fill="none" stroke={c} strokeWidth="1.2" />
        <path d="M21 30h25l8-12h40" fill="none" stroke={c} strokeWidth="0.8" opacity="0.5" />
        <circle cx="100" cy="18" r="5" fill={c} opacity="0.2" />
        <circle cx="100" cy="18" r="2" fill={c}>
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="55" cy="30" r="4" fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" />
        <path d="M21 30h25l8 14h40" fill="none" stroke={c} strokeWidth="0.8" opacity="0.3" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 120 60" className="w-full h-full opacity-60" style={{ overflow: "visible" }}>
        <circle cx="25" cy="30" r="8" fill="none" stroke={c} strokeWidth="1" />
        <path d="M35 30h20" stroke={c} strokeWidth="0.8" opacity="0.4" />
        <rect x="60" y="20" width="30" height="20" rx="4" fill={c} opacity="0.1" stroke={c} strokeWidth="0.8" />
        <path d="M70 30l5 5l10-10" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg viewBox="0 0 120 60" className="w-full h-full opacity-60" style={{ overflow: "visible" }}>
        <circle cx="18" cy="30" r="5" fill={c} opacity="0.15" />
        <path d="M25 30h25" stroke={c} strokeWidth="1" opacity="0.5" />
        <polygon points="60,22 70,30 60,38 50,30" fill="none" stroke={c} strokeWidth="1" />
        <path d="M70 30h25" stroke={c} strokeWidth="1" opacity="0.5" />
        <circle cx="105" cy="30" r="5" fill={c} opacity="0.15" />
        <circle cx="105" cy="30" r="2" fill={c}>
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 60" className="w-full h-full opacity-60" style={{ overflow: "visible" }}>
      <rect x="15" y="18" width="24" height="24" rx="4" fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" />
      <rect x="50" y="14" width="30" height="32" rx="4" fill={c} opacity="0.08" stroke={c} strokeWidth="0.8" />
      <path d="M39 30h11" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <path d="M80 30h20" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <circle cx="105" cy="30" r="4" fill="none" stroke={c} strokeWidth="0.8" />
      <path d="M58 24h14M58 30h10M58 36h14" stroke={c} strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

function WhyConnectBroker() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="px-6 pb-6">
      <div className="max-w-[1536px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/[0.06] p-8 md:p-10 relative overflow-hidden"
          style={{ background: "rgba(16, 22, 32, 0.55)", backdropFilter: "blur(20px)" }}
        >
          {/* background grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative z-10">
            <div className="text-center mb-12">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.14em] uppercase text-[#94A3B8] bg-white/[0.03] border border-white/[0.08] mb-4"
              >
                API Integration
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight"
              >
                Why Connect Your API?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[15px] text-[#94A3B8] max-w-2xl mx-auto"
              >
                Algofy is your broker. The real question is why plug in your API access — here is what it solves for active traders and algo builders.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {API_CARDS.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 28 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                  className="group relative rounded-xl border border-white/[0.06] p-6 transition-all duration-500 hover:-translate-y-2 hover:border-white/[0.12] overflow-hidden"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  }}
                >
                  {/* top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />

                  {/* glow orb */}
                  <div
                    className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
                    style={{ background: hexToRgba(card.color, 0.15) }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-5">
                      <motion.div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{ background: hexToRgba(card.color, 0.1), boxShadow: `0 0 24px ${hexToRgba(card.color, 0.12)}`, color: card.color }}
                      >
                        <card.icon size={22} />
                      </motion.div>
                      <span className="text-[11px] font-mono text-[#475569] font-medium">{card.num}</span>
                    </div>

                    <div className="h-14 mb-5">
                      <BrokerMiniVisual color={card.color} index={i} />
                    </div>

                    <h3 className="text-[16px] font-semibold text-white mb-2 leading-snug group-hover:text-[#F1F5F9] transition-colors">{card.title}</h3>
                    <p className="text-[13px] text-[#94A3B8] leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   STRATEGY PLANS — 3-tier access cards
   ═══════════════════════════════════════════════════════════ */
const PLANS = [
  {
    name: "Starter",
    duration: "1 Month Plan",
    days: "30 Days",
    price: "300",
    gst: "+18% GST",
    accent: TEAL,
    popular: false,
  },
  {
    name: "Advanced",
    duration: "6 Months Plan",
    days: "180 Days",
    price: "1,500",
    gst: "+18% GST",
    accent: BLUE,
    popular: true,
  },
  {
    name: "Pro",
    duration: "1 Year Plan",
    days: "360 Days",
    price: "3,000",
    gst: "+18% GST",
    accent: VIOLET,
    popular: false,
  },
];

const PLAN_INCLUDES = [
  "Get Access to Simulator, Builder, Replay Bar, Backtest Strategy Analysis",
  "Simulator Data available since 1st Jan'19",
  "Nifty, Banknifty, Finnifty, Midcpnifty",
  "F&O Stocks only available in No Code Strategy",
];

const PLAN_EXCLUDES = [
  "F&O Stocks only available in No Code Strategy, not in Simulator",
  "Not applicable for Auto Backtesting on Home & Basket Page",
];

function StrategyPlans() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="px-6 pb-6">
      <div className="max-w-[1536px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight"
            >
              Our Plans
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[15px] text-[#94A3B8] max-w-xl mx-auto"
            >
              Simple analytics access for simulator, builder, charts, and backtests.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left info panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-4 rounded-2xl border border-white/[0.06] p-7 md:p-8 flex flex-col justify-center"
              style={{ background: "rgba(16, 22, 32, 0.55)", backdropFilter: "blur(20px)" }}
            >
              <h3 className="text-2xl md:text-3xl font-semibold text-white mb-1 tracking-tight">Analytics Plans</h3>
              <p className="text-sm text-[#94A3B8] mb-6">For Simulator, Builder & Charts, you need an Analytics Plan.</p>

              <ul className="space-y-4 mb-4">
                {PLAN_INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#E2E8F0]">
                    <span className="w-5 h-5 rounded-full bg-[#00C853]/10 text-[#00C853] flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <ul className="space-y-4">
                {PLAN_EXCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                    <span className="w-5 h-5 rounded-full bg-[#FF5252]/10 text-[#FF5252] flex items-center justify-center shrink-0 mt-0.5">
                      <X size={12} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right pricing cards */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                  className="group relative rounded-2xl border border-white/[0.06] p-6 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col"
                  style={{
                    background: "rgba(16, 22, 32, 0.55)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* animated gradient border */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      padding: "1px",
                      background: `linear-gradient(135deg, ${hexToRgba(plan.accent, 0.4)}, transparent 50%, ${hexToRgba(plan.accent, 0.15)})`,
                      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                  />

                  {/* glow orb */}
                  <div
                    className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
                    style={{ background: hexToRgba(plan.accent, 0.15) }}
                  />

                  {plan.popular && (
                    <span
                      className="absolute top-4 right-4 px-2.5 py-1 rounded text-[9px] font-bold tracking-[0.12em] uppercase"
                      style={{ color: plan.accent, background: hexToRgba(plan.accent, 0.12), border: `1px solid ${hexToRgba(plan.accent, 0.25)}` }}
                    >
                      Most Popular
                    </span>
                  )}

                  <div className="relative z-10 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: hexToRgba(plan.accent, 0.1), color: plan.accent, boxShadow: `0 0 18px ${hexToRgba(plan.accent, 0.15)}` }}
                      >
                        {i === 0 ? <Activity size={20} /> : i === 1 ? <TrendingUp size={20} /> : <PieChart size={20} />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                        <p className="text-[10px] text-[#64748B] uppercase tracking-wider">{plan.duration}</p>
                      </div>
                    </div>

                    <h4 className="text-[15px] font-semibold text-white mb-3">Simulator + Builder + Charts</h4>

                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                      <span className="text-xs text-[#64748B]">{plan.gst}</span>
                    </div>

                    <p className="text-[12px] text-[#64748B] mb-6">
                      {plan.duration} ({plan.days})<br />
                      Access unlimited times within Validity
                    </p>

                    <button
                      className="mt-auto w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-300 hover:shadow-lg"
                      style={{
                        background: plan.popular ? `linear-gradient(135deg, ${plan.accent}, ${BLUE})` : hexToRgba(plan.accent, 0.1),
                        color: plan.popular ? "#0B0C10" : plan.accent,
                        border: `1px solid ${hexToRgba(plan.accent, plan.popular ? 0 : 0.25)}`,
                      }}
                    >
                      Get Access
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════ */
function StatusBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] text-[#22C55E] uppercase">
      <motion.span
        className="w-2 h-2 rounded-full bg-[#22C55E]"
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {text}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function StrategiesHubPage() {
  const heroRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen text-white font-sans" style={{ background: BG }}>

      {/* ═══ Global atmosphere overlay ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage:
          `radial-gradient(ellipse at 22% 10%, rgba(45,212,191,0.035) 0%, transparent 50%),
           radial-gradient(ellipse at 78% 8%, rgba(59,130,246,0.028) 0%, transparent 45%),
           radial-gradient(ellipse at 50% 55%, rgba(139,92,246,0.015) 0%, transparent 55%),
           radial-gradient(circle at 1px 1px, rgba(255,255,255,0.012) 1px, transparent 0)`,
        backgroundSize: "100% 100%, 100% 100%, 100% 100%, 22px 22px",
      }} />

      {/* ═══ Floating ambient stars / dust ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <svg viewBox="0 0 1400 900" className="w-full h-full" preserveAspectRatio="none">
          {Array.from({ length: 40 }).map((_, i) => {
            const sx = 35 + (i % 8) * 175;
            const sy = 25 + Math.floor(i / 8) * 178;
            const sc = [TEAL, CYAN, BLUE, VIOLET, AMBER][i % 5];
            return (
              <circle key={`star${i}`} cx={sx} cy={sy}
                r={0.5 + (i % 3) * 0.25} fill={sc}>
                <animate attributeName="opacity" values="0.02;0.09;0.02"
                  dur={`${5 + (i % 5) * 2}s`} repeatCount="indefinite" begin={`${i * 0.55}s`} />
              </circle>
            );
          })}
        </svg>
      </div>

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative px-6 pt-28 pb-8 min-h-[540px] overflow-hidden">
        <HeroChartBackground />

        <div className="max-w-[1536px] mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr_1fr] gap-6 items-stretch">

            {/* ── Left: Hero text ── */}
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="flex flex-col justify-center pt-4 pb-8"
            >
              <h1 className="text-5xl md:text-6xl lg:text-[64px] font-extrabold text-white tracking-tight leading-[1.05]">
                Strategy Hub
              </h1>
              <p className="text-base text-[#94A3B8] leading-relaxed max-w-sm mt-5">
                Deploy institutional-grade strategies and option structures.
              </p>
            </motion.div>

            {/* ── Center & Right: Strategy Cards ── */}
            {PANELS.map((panel, i) => {
              const PIcon = panel.icon;
              return (
                <motion.div key={panel.id}
                  initial={{ opacity: 0, y: 36 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
                  className="h-full">
                  <Link href={panel.href}
                    className="group block h-full min-h-[370px] rounded-2xl border border-white/[0.07] p-8 transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-1 relative overflow-hidden"
                    style={{
                      background: "rgba(16, 22, 32, 0.72)",
                      backdropFilter: "blur(20px)",
                    }}>
                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 75% 10%, ${hexToRgba(panel.accent, 0.08)} 0%, transparent 55%)` }} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                      style={{ boxShadow: `0 24px 60px -16px ${hexToRgba(panel.accent, 0.14)}` }} />

                    <div className="relative z-10 h-full flex flex-col">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                        style={{ background: `linear-gradient(135deg, ${panel.accent}20, ${panel.accent}08)`, color: panel.accent, boxShadow: `0 0 20px ${hexToRgba(panel.accent, 0.18)}` }}>
                        <PIcon size={22} />
                      </div>
                      <h2 className="text-2xl md:text-[26px] font-semibold text-white mb-2 leading-tight">{panel.title}</h2>
                      <p className="text-[15px] text-[#94A3B8] mb-6 leading-relaxed max-w-[58%]">{panel.subtitle}</p>
                      <ul className="space-y-2.5 mb-8">
                        {panel.features.map((f) => (
                          <li key={f} className="flex items-center gap-2.5 text-[14px] text-[#94A3B8]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: panel.bullet }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-medium border transition-all duration-300 group-hover:gap-3.5"
                        style={{ color: panel.accent, borderColor: `${panel.accent}30`, background: `${panel.accent}08` }}>
                        {panel.cta}
                        <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                    {panel.visual === "quant" && <IsometricStack />}
                    {panel.visual === "payoff" && <PayoffCurves />}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          INVESTOR / BUILDER BANNER
          ═══════════════════════════════════════════ */}
      <InvestorBuilderBanner />

      {/* ═══════════════════════════════════════════
          WHY CONNECT YOUR API?
          ═══════════════════════════════════════════ */}
      <WhyConnectBroker />

      {/* ═══════════════════════════════════════════
          LIVE STRATEGY LIFECYCLE
          ═══════════════════════════════════════════ */}
      <section className="px-6 pb-6">
        <div className="max-w-[1536px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-white/[0.06] p-8 relative overflow-hidden"
            style={{ background: "rgba(16, 22, 32, 0.55)", backdropFilter: "blur(20px)" }}>
            <div className="absolute inset-0 pointer-events-none opacity-[0.018]" style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-10">
                <div>
                  <h2 className="text-[22px] font-semibold text-white mb-1">Live Strategy Lifecycle</h2>
                  <p className="text-[14px] text-[#94A3B8]">From research to real-time monitoring — every step powered by Algofy.</p>
                </div>
                <StatusBadge text="All Systems Operational" />
              </div>
              <LifecyclePanel />
              <WaveVisualization />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STRATEGY ENGINEERING / CONSULTATION
          ═══════════════════════════════════════════ */}
      <StrategyEngineeringSection />

      {/* ═══════════════════════════════════════════
          STRATEGY PLANS
          ═══════════════════════════════════════════ */}
      <StrategyPlans />

    </div>
  );
}
