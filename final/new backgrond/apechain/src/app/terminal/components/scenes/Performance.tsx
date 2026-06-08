'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SceneContainer } from './SceneContainer';
import { TOKENS, TYPOGRAPHY } from '../../constants';
import { PERF } from '../../data';
import { MONTHLY, MONTHS } from '../../data/monthly';

const ALL_METRICS = [
  { label: 'Total Return', value: `${PERF.totalReturn}%` },
  { label: 'CAGR', value: `${PERF.cagr}%` },
  { label: 'Sharpe', value: PERF.sharpe.toFixed(2) },
  { label: 'Sortino', value: PERF.sortino.toFixed(2) },
  { label: 'Calmar', value: PERF.calmar.toFixed(2) },
  { label: 'Alpha', value: `${PERF.alpha}%` },
  { label: 'Beta', value: PERF.beta.toFixed(2) },
  { label: 'Volatility', value: `${PERF.vol}%` },
  { label: 'Profit Factor', value: PERF.profitFactor.toFixed(2) },
  { label: 'Recovery Factor', value: PERF.recoveryFactor.toFixed(2) },
  { label: 'Win Rate', value: `${PERF.winRate}%` },
  { label: 'Avg Trade', value: `${PERF.avgTrade}%` },
  { label: 'Avg Win', value: `${PERF.avgWin}%` },
  { label: 'Avg Loss', value: `${PERF.avgLoss}%` },
  { label: 'Expectancy', value: `${PERF.expectancy}%` },
  { label: 'Exposure', value: `${PERF.exposure}%` },
];

function getBarColor(val: number | null): string {
  if (val === null) return TOKENS.t3;
  if (val > 5) return TOKENS.positive;
  if (val > 0) return TOKENS.alpha(TOKENS.positive, 0.5);
  if (val > -3) return TOKENS.alpha(TOKENS.negative, 0.5);
  return TOKENS.negative;
}

export const Performance = memo(function Performance() {
  return (
    <SceneContainer
      id="performance"
      title="Performance"
      subtitle="Comprehensive return and risk metrics"
    >
      {/* Metrics grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px border mb-12 overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.10)', borderRadius: '20px' }}
      >
        {ALL_METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.015 }}
            className="p-5 transition-colors"
            style={{
              background: i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(18px)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)'; }}
          >
            <div
              className="text-[9px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
            >
              {m.label}
            </div>
            <div
              className="text-lg font-semibold"
              style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.mono }}
            >
              {m.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Monthly returns heatmap */}
      <div
        className="border p-8"
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderColor: 'rgba(255,255,255,0.12)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          borderRadius: '20px',
        }}
      >
        <h3
          className="text-sm font-semibold mb-6"
          style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.body }}
        >
          Monthly Returns
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ fontFamily: TYPOGRAPHY.mono }}>
            <thead>
              <tr>
                <th
                  className="text-left py-2 pr-4"
                  style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body, fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  Year
                </th>
                {MONTHS.map((m) => (
                  <th
                    key={m}
                    className="text-center py-2 px-1"
                    style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body, fontSize: '10px', fontWeight: 600 }}
                  >
                    {m}
                  </th>
                ))}
                <th
                  className="text-right py-2 pl-4"
                  style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body, fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  YTD
                </th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY.map((row) => {
                const ytd = row.data.reduce<number>((a, b) => a + (b ?? 0), 0);
                return (
                  <tr key={row.year}>
                    <td
                      className="py-2.5 pr-4 font-medium"
                      style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}
                    >
                      {row.year}
                    </td>
                    {row.data.map((val, i) => (
                      <td key={i} className="text-center py-2.5 px-1">
                        <span
                          className="inline-block min-w-[44px] px-1.5 py-0.5 rounded-lg"
                          style={{
                            color: val !== null ? (val >= 0 ? TOKENS.positive : TOKENS.negative) : TOKENS.t3,
                            background: val !== null ? TOKENS.alpha(getBarColor(val), 0.08) : 'transparent',
                            fontFamily: TYPOGRAPHY.mono,
                          }}
                        >
                          {val !== null ? `${val > 0 ? '+' : ''}${val.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                    ))}
                    <td
                      className="text-right py-2.5 pl-4 font-semibold"
                      style={{ color: ytd >= 0 ? TOKENS.positive : TOKENS.negative, fontFamily: TYPOGRAPHY.mono }}
                    >
                      {ytd > 0 ? '+' : ''}{ytd.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SceneContainer>
  );
});
