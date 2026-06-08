'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SceneContainer } from './SceneContainer';
import { RiskGauge } from '../charts/RiskGauge';
import { RiskRadar } from '../charts/RiskRadar';
import { TOKENS, TYPOGRAPHY } from '../../constants';
import { RISK_METRICS } from '../../data';
import { CORR, CORR_LABELS } from '../../data/correlation';

const GLASS_CARD = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
  borderRadius: '20px',
};

export const Risk = memo(function Risk() {
  return (
    <SceneContainer
      id="risk"
      title="Risk Analysis"
      subtitle="Exposure, tail risk, and downside metrics"
    >
      {/* Top section: Gauge + Radar + Kelly Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
        {/* Risk Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 flex flex-col items-center justify-center"
          style={GLASS_CARD}
        >
          <div
            className="text-[9px] font-semibold uppercase tracking-widest mb-4"
            style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
          >
            Overall Risk Score
          </div>
          <RiskGauge value={28} label="Low Risk" sublabel="VaR 2.84%" />
        </motion.div>

        {/* Risk Radar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="p-6 flex flex-col items-center justify-center"
          style={GLASS_CARD}
        >
          <div
            className="text-[9px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
          >
            Risk Profile
          </div>
          <RiskRadar
            data={[
              { label: 'Volatility', value: 35 },
              { label: 'Tail Risk', value: 55 },
              { label: 'Drawdown', value: 42 },
              { label: 'Leverage', value: 20 },
              { label: 'Correlation', value: 30 },
              { label: 'Liquidity', value: 75 },
            ]}
          />
        </motion.div>

        {/* Kelly Sizing + Tail Risk */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="p-8 flex flex-col justify-center gap-8"
          style={GLASS_CARD}
        >
          {/* Kelly Bar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-medium" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>
                Kelly Fraction
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: TOKENS.gold, fontFamily: TYPOGRAPHY.mono }}
              >
                0.34
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '34%' }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: TOKENS.gold }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px]" style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.mono }}>0</span>
              <span className="text-[9px]" style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.mono }}>0.5</span>
              <span className="text-[9px]" style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.mono }}>1.0</span>
            </div>
          </div>

          {/* Tail Risk Bar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-medium" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>
                Tail Risk (99%)
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: TOKENS.warning, fontFamily: TYPOGRAPHY.mono }}
              >
                6.18%
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '62%' }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: TOKENS.warning }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px]" style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.mono }}>0%</span>
              <span className="text-[9px]" style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.mono }}>5%</span>
              <span className="text-[9px]" style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.mono }}>10%</span>
            </div>
          </div>

          {/* Risk of Ruin */}
          <div
            className="flex items-center justify-between py-3 px-4"
            style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }}
          >
            <span className="text-[12px]" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>
              Risk of Ruin
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: TOKENS.positive, fontFamily: TYPOGRAPHY.mono }}
            >
              0.02%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Risk metrics list */}
      <div
        className="overflow-hidden mb-12"
        style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}
      >
        {RISK_METRICS.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 transition-colors"
            style={{
              borderColor: 'rgba(255,255,255,0.10)',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(18px)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)'; }}
          >
            <span className="text-[13px]" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>{r.label}</span>
            <div className="flex items-center gap-3">
              <span
                className="text-sm font-semibold"
                style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.mono }}
              >
                {r.value}
              </span>
              <span
                className="text-[9px] px-2.5 py-1 rounded-full font-semibold border tracking-wide"
                style={{
                  borderColor: TOKENS.alpha(r.color, 0.3),
                  color: r.color,
                  fontFamily: TYPOGRAPHY.body,
                }}
              >
                {r.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Correlation matrix */}
      <div
        className="p-8"
        style={GLASS_CARD}
      >
        <h3
          className="text-sm font-semibold mb-6"
          style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.body }}
        >
          Correlation Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th></th>
                {CORR_LABELS.map((l) => (
                  <th
                    key={l}
                    className="text-[10px] font-semibold text-center pb-4"
                    style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body, letterSpacing: '0.06em' }}
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CORR.values.map((row, i) => (
                <tr key={i}>
                  <td
                    className="text-[10px] font-semibold pr-5 py-3"
                    style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body, letterSpacing: '0.06em' }}
                  >
                    {CORR_LABELS[i]}
                  </td>
                  {row.map((val, j) => (
                    <td key={j} className="text-center py-3">
                      <span
                        className="inline-block min-w-[52px] px-2 py-1 rounded-lg text-[11px] font-semibold"
                        style={{
                          color: val > 0 ? TOKENS.positive : val < 0 ? TOKENS.negative : TOKENS.t1,
                          background: val > 0.5 ? TOKENS.alpha(TOKENS.positive, 0.06) : val < -0.3 ? TOKENS.alpha(TOKENS.negative, 0.06) : 'transparent',
                          fontFamily: TYPOGRAPHY.mono,
                        }}
                      >
                        {val.toFixed(2)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SceneContainer>
  );
});
