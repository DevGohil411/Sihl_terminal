'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SceneContainer } from './SceneContainer';
import { MonteCarloFan } from '../charts/MonteCarloFan';
import { TOKENS, TYPOGRAPHY } from '../../constants';

const PERCENTILES = [
  { p: '95th', val: '+284%', color: TOKENS.positive },
  { p: '75th', val: '+198%', color: TOKENS.alpha(TOKENS.positive, 0.7) },
  { p: '50th', val: '+156%', color: TOKENS.chartPrimary },
  { p: '25th', val: '+112%', color: TOKENS.alpha(TOKENS.chartPrimary, 0.6) },
  { p: '5th', val: '+68%', color: TOKENS.chartSecondary },
];

const HISTOGRAM = [
  { range: '0–50%', count: 2 },
  { range: '50–100%', count: 8 },
  { range: '100–150%', count: 35 },
  { range: '150–200%', count: 32 },
  { range: '200–250%', count: 18 },
  { range: '250–300%', count: 5 },
];

const maxHist = Math.max(...HISTOGRAM.map((h) => h.count));

export const MonteCarlo = memo(function MonteCarlo() {
  return (
    <SceneContainer
      id="monte-carlo"
      title="Monte Carlo"
      subtitle="10,000 simulated paths — 95% confidence"
    >
      {/* Percentile legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {PERCENTILES.map((p) => (
          <div
            key={p.p}
            className="flex items-center gap-2 text-[11px] px-3 py-1.5 border"
            style={{ borderColor: TOKENS.b1, color: TOKENS.t1, borderRadius: '3px' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.p}: <span style={{ fontFamily: TYPOGRAPHY.mono }}>{p.val}</span>
          </div>
        ))}
      </div>

      {/* Fan chart */}
      <div
        className="border p-8 mb-8"
        style={{
          background: TOKENS.bg2,
          borderColor: TOKENS.b1,
          boxShadow: TOKENS.shadowCard,
          borderRadius: '4px',
        }}
      >
        <MonteCarloFan />
      </div>

      {/* Histogram + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Histogram */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-2 border p-8"
          style={{
            background: TOKENS.bg2,
            borderColor: TOKENS.b1,
            boxShadow: TOKENS.shadowCard,
            borderRadius: '4px',
          }}
        >
          <h4
            className="text-[10px] font-semibold uppercase tracking-widest mb-6"
            style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
          >
            Terminal Value Distribution
          </h4>
          <div className="flex items-end gap-4 h-36">
            {HISTOGRAM.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(h.count / maxHist) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                  className="w-full rounded-t min-h-[4px]"
                  style={{ background: TOKENS.chartPrimary }}
                />
                <span className="text-[9px]" style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.mono }}>
                  {h.range}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="space-y-3">
          {[
            { label: 'Simulations', value: '10,000' },
            { label: 'Confidence', value: '95%' },
            { label: 'Path Volatility', value: '14.2%' },
            { label: 'Median Return', value: '+156%' },
            { label: 'Worst Case (5%)', value: '+68%' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border p-5 text-center"
              style={{
                background: TOKENS.bg2,
                borderColor: TOKENS.b1,
                boxShadow: TOKENS.shadowCard,
                borderRadius: '4px',
              }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-2"
                style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
              >
                {s.label}
              </div>
              <div
                className="text-xl font-semibold"
                style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.mono }}
              >
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SceneContainer>
  );
});
