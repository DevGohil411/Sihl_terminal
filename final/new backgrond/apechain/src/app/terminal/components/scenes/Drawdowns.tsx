'use client';

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, Calendar, Clock, ArrowUpDown, Filter } from 'lucide-react';
import { SceneContainer } from './SceneContainer';
import { TOKENS, TYPOGRAPHY } from '../../constants';
import { DRAWDOWNS } from '../../data';

type SortKey = 'depth' | 'duration' | 'recovery';
type SortDir = 'asc' | 'desc';

export const Drawdowns = memo(function Drawdowns() {
  const [sortKey, setSortKey] = useState<SortKey>('depth');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [regimeFilter, setRegimeFilter] = useState<string | null>(null);

  const regimes = useMemo(() => Array.from(new Set(DRAWDOWNS.map((d) => d.regime))), []);

  const sorted = useMemo(() => {
    const data = regimeFilter ? DRAWDOWNS.filter((d) => d.regime === regimeFilter) : [...DRAWDOWNS];
    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * dir;
    });
    return data;
  }, [sortKey, sortDir, regimeFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const maxDepth = Math.min(...DRAWDOWNS.map((d) => d.depth));
  const worst = DRAWDOWNS.reduce((a, b) => (a.depth < b.depth ? a : b));

  return (
    <SceneContainer
      id="drawdowns"
      title="Drawdowns"
      subtitle="Historical peak-to-trough analysis"
    >
      {/* Worst drawdown highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="border p-8 mb-10 flex items-center gap-6"
        style={{
          background: TOKENS.bg2,
          borderColor: TOKENS.alpha(TOKENS.negative, 0.25),
          boxShadow: TOKENS.shadowCard,
          borderRadius: '4px',
          borderLeftWidth: '3px',
        }}
      >
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full shrink-0"
          style={{ background: TOKENS.alpha(TOKENS.negative, 0.08) }}
        >
          <TrendingDown size={20} style={{ color: TOKENS.negative }} />
        </div>
        <div className="flex-1">
          <div
            className="text-[9px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
          >
            Worst Drawdown
          </div>
          <div className="flex items-baseline gap-3">
            <span
              className="text-[36px] leading-none font-semibold"
              style={{ color: TOKENS.negative, fontFamily: TYPOGRAPHY.mono }}
            >
              {worst.depth}%
            </span>
            <span className="text-sm" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>
              {worst.start} — {worst.end}
            </span>
          </div>
        </div>
        <div className="text-right text-[11px]" style={{ color: TOKENS.t2 }}>
          <div className="flex items-center gap-1 justify-end">
            <Clock size={10} />
            {worst.duration} days
          </div>
          <div className="flex items-center gap-1 justify-end mt-1">
            <Calendar size={10} />
            recovery {worst.recovery} days
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Filter size={12} style={{ color: TOKENS.t2 }} />
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
        >
          Regime
        </span>
        <button
          onClick={() => setRegimeFilter(null)}
          className="text-[10px] px-3 py-1 border transition-colors"
          style={{
            borderColor: !regimeFilter ? TOKENS.chartPrimary : TOKENS.b1,
            color: !regimeFilter ? TOKENS.chartPrimary : TOKENS.t2,
            borderRadius: '3px',
            background: !regimeFilter ? TOKENS.alpha(TOKENS.chartPrimary, 0.06) : 'transparent',
          }}
        >
          All
        </button>
        {regimes.map((r) => (
          <button
            key={r}
            onClick={() => setRegimeFilter(r)}
            className="text-[10px] px-3 py-1 border transition-colors"
            style={{
              borderColor: regimeFilter === r ? TOKENS.chartPrimary : TOKENS.b1,
              color: regimeFilter === r ? TOKENS.chartPrimary : TOKENS.t2,
              borderRadius: '3px',
              background: regimeFilter === r ? TOKENS.alpha(TOKENS.chartPrimary, 0.06) : 'transparent',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
        >
          Sort by
        </span>
        {([
          { key: 'depth' as SortKey, label: 'Depth' },
          { key: 'duration' as SortKey, label: 'Duration' },
          { key: 'recovery' as SortKey, label: 'Recovery' },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => handleSort(s.key)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors"
            style={{ color: sortKey === s.key ? TOKENS.chartPrimary : TOKENS.t2 }}
          >
            {s.label}
            <ArrowUpDown size={10} />
          </button>
        ))}
      </div>

      {/* Drawdown cards */}
      <div className="space-y-3 mb-12">
        <AnimatePresence mode="popLayout">
          {sorted.map((dd, i) => {
            const width = Math.abs(dd.depth / maxDepth) * 100;
            const isWorst = dd === worst;
            return (
              <motion.div
                key={dd.start}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.04 }}
                className="border p-6 transition-all duration-200"
                style={{
                  background: TOKENS.bg2,
                  borderColor: isWorst ? TOKENS.alpha(TOKENS.negative, 0.25) : TOKENS.b1,
                  boxShadow: TOKENS.shadowCard,
                  borderRadius: '4px',
                  borderLeftWidth: isWorst ? '3px' : '1px',
                  borderLeftColor: isWorst ? TOKENS.negative : TOKENS.b1,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = TOKENS.b2;
                  el.style.boxShadow = TOKENS.shadowElevated;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = isWorst ? TOKENS.alpha(TOKENS.negative, 0.25) : TOKENS.b1;
                  el.style.boxShadow = TOKENS.shadowCard;
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TrendingDown size={14} style={{ color: TOKENS.negative }} />
                    <span
                      className="text-xl font-semibold"
                      style={{ color: TOKENS.negative, fontFamily: TYPOGRAPHY.mono }}
                    >
                      {dd.depth}%
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 border font-semibold tracking-wide"
                      style={{ borderColor: TOKENS.b1, color: TOKENS.t2, borderRadius: '3px' }}
                    >
                      {dd.regime}
                    </span>
                    {isWorst && (
                      <span
                        className="text-[9px] px-2 py-0.5 font-semibold tracking-wide"
                        style={{
                          background: TOKENS.alpha(TOKENS.negative, 0.08),
                          color: TOKENS.negative,
                          borderRadius: '3px',
                        }}
                      >
                        WORST
                      </span>
                    )}
                  </div>
                  <div className="text-right text-[11px]" style={{ color: TOKENS.t2 }}>
                    <div className="flex items-center gap-1 justify-end">
                      <Calendar size={10} />
                      {dd.start} — {dd.end}
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Clock size={10} />
                      {dd.duration}d · recovery {dd.recovery}d
                    </div>
                  </div>
                </div>
                {/* Depth bar */}
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: TOKENS.bg3 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${width}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: TOKENS.negative }}
                  />
                </div>
                {/* Recovery arc */}
                <div className="mt-4 flex items-center gap-3">
                  <svg width={60} height={20} viewBox="0 0 60 20">
                    <path
                      d={`M 0 18 Q 30 ${18 - (dd.recovery / 20) * 16} 60 18`}
                      fill="none"
                      stroke={TOKENS.positive}
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                  </svg>
                  <span className="text-[10px]" style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}>
                    Recovery trajectory: {dd.recovery} days to new high
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Underwater curve */}
      <div
        className="border p-8"
        style={{
          background: TOKENS.bg2,
          borderColor: TOKENS.b1,
          boxShadow: TOKENS.shadowCard,
          borderRadius: '4px',
        }}
      >
        <h3
          className="text-sm font-semibold mb-6"
          style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.body }}
        >
          Underwater Curve
        </h3>
        <svg viewBox="0 0 800 120" className="w-full h-24">
          <defs>
            <linearGradient id="uwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TOKENS.negative} stopOpacity="0.12" />
              <stop offset="100%" stopColor={TOKENS.negative} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 30, 60, 90, 120].map((y) => (
            <line key={y} x1="0" y1={y} x2="800" y2={y} stroke={TOKENS.b1} strokeWidth="0.5" />
          ))}
          <path
            d="M0,0 L0,30 C80,45 160,25 240,60 C320,95 400,80 480,90 C560,105 640,40 720,70 L800,50 L800,0 Z"
            fill="url(#uwGrad)"
          />
          <path
            d="M0,30 C80,45 160,25 240,60 C320,95 400,80 480,90 C560,105 640,40 720,70 L800,50"
            fill="none"
            stroke={TOKENS.negative}
            strokeWidth="2"
          />
        </svg>
      </div>
    </SceneContainer>
  );
});
