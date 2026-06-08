'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SceneContainer } from './SceneContainer';
import { TOKENS, TYPOGRAPHY } from '../../constants';
import { TRADE_STATS, SYNTHETIC_TRADES } from '../../data';

export const TradeDiagnostics = memo(function TradeDiagnostics() {
  return (
    <SceneContainer
      id="trade-diagnostics"
      title="Trade Diagnostics"
      subtitle="Execution quality and pattern analysis"
    >
      {/* Stats grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px border mb-12 overflow-hidden"
        style={{ borderColor: TOKENS.b1, borderRadius: '4px' }}
      >
        {TRADE_STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            className="p-5 transition-colors"
            style={{ background: i % 2 === 0 ? TOKENS.bg2 : TOKENS.bg1 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = TOKENS.bg3; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? TOKENS.bg2 : TOKENS.bg1; }}
          >
            <div
              className="text-[9px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
            >
              {s.label}
            </div>
            <div
              className="text-sm font-semibold"
              style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.mono }}
            >
              {s.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trade table */}
      <div
        className="border overflow-hidden"
        style={{ borderColor: TOKENS.b1, borderRadius: '4px', boxShadow: TOKENS.shadowCard }}
      >
        <div
          className="px-6 py-3 text-[9px] font-semibold uppercase tracking-widest border-b"
          style={{ borderColor: TOKENS.b1, color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
        >
          Recent Trades (20 of {SYNTHETIC_TRADES.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b" style={{ borderColor: TOKENS.b1 }}>
                {['ID', 'Entry', 'Exit', 'Dir', 'Entry Price', 'Exit Price', 'PnL', 'PnL %', 'Dur'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 font-semibold"
                    style={{
                      color: TOKENS.t2,
                      fontFamily: TYPOGRAPHY.body,
                      fontSize: '10px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SYNTHETIC_TRADES.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b last:border-b-0 transition-colors"
                  style={{ borderColor: TOKENS.b1 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = TOKENS.bg3; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td className="px-5 py-3" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.mono }}>{t.id}</td>
                  <td className="px-5 py-3" style={{ color: TOKENS.t1 }}>{t.entryDate}</td>
                  <td className="px-5 py-3" style={{ color: TOKENS.t1 }}>{t.exitDate}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[9px] px-2 py-0.5 rounded font-semibold tracking-wide"
                      style={{
                        background: t.direction === 'LONG' ? TOKENS.alpha(TOKENS.positive, 0.1) : TOKENS.alpha(TOKENS.negative, 0.1),
                        color: t.direction === 'LONG' ? TOKENS.positive : TOKENS.negative,
                      }}
                    >
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.mono }}>{t.entryPrice.toLocaleString()}</td>
                  <td className="px-5 py-3" style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.mono }}>{t.exitPrice.toLocaleString()}</td>
                  <td
                    className="px-5 py-3 font-semibold"
                    style={{ color: t.pnl >= 0 ? TOKENS.positive : TOKENS.negative, fontFamily: TYPOGRAPHY.mono }}
                  >
                    {t.pnl >= 0 ? '+' : ''}{t.pnl}
                  </td>
                  <td
                    className="px-5 py-3"
                    style={{ color: t.pnlPercent >= 0 ? TOKENS.positive : TOKENS.negative, fontFamily: TYPOGRAPHY.mono }}
                  >
                    {t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                  </td>
                  <td className="px-5 py-3" style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.mono }}>{t.duration}d</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SceneContainer>
  );
});
