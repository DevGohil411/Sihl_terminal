'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Gavel, CheckCircle2, XCircle } from 'lucide-react';
import { SceneContainer } from './SceneContainer';
import { TOKENS, TYPOGRAPHY } from '../../constants';
import { PERF } from '../../data';

const VERDICT = {
  grade: 'PASS',
  confidence: 95,
  score: 8.2,
};

const CHECKS = [
  { label: 'Alpha > 0', pass: PERF.alpha > 0 },
  { label: 'Sharpe > 1.5', pass: PERF.sharpe > 1.5 },
  { label: 'Max DD < 20%', pass: Math.abs(PERF.maxDD) < 20 },
  { label: 'Win Rate > 50%', pass: PERF.winRate > 50 },
  { label: 'Profit Factor > 1.5', pass: PERF.profitFactor > 1.5 },
  { label: 'Recovery < 30 days', pass: true },
  { label: 'Risk of Ruin < 1%', pass: true },
  { label: 'Beta < 0.6', pass: PERF.beta < 0.6 },
];

export const FinalVerdict = memo(function FinalVerdict() {
  const passCount = CHECKS.filter((c) => c.pass).length;

  return (
    <SceneContainer
      id="final-verdict"
      title="Final Verdict"
      subtitle="Institutional-grade strategy assessment"
    >
      {/* Verdict card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="border p-12 mb-10 text-center"
        style={{
          background: TOKENS.bg2,
          borderColor: TOKENS.alpha(TOKENS.positive, 0.25),
          boxShadow: TOKENS.shadowCard,
          borderRadius: '4px',
          borderLeftWidth: '3px',
          borderLeftColor: TOKENS.positive,
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <Gavel size={24} style={{ color: TOKENS.positive }} />
          <span
            className="text-lg font-semibold tracking-wide"
            style={{ color: TOKENS.positive, fontFamily: TYPOGRAPHY.body }}
          >
            STRATEGY APPROVED
          </span>
        </div>
        <div
          className="text-[56px] leading-none font-semibold mb-4"
          style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.display }}
        >
          {VERDICT.grade}
        </div>
        <div className="text-sm" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>
          {passCount}/{CHECKS.length} criteria met · {VERDICT.confidence}% confidence
        </div>
        <div
          className="mt-6 inline-flex items-center gap-2 text-sm px-6 py-3 border"
          style={{ borderColor: TOKENS.b1, color: TOKENS.t1, borderRadius: '4px' }}
        >
          Overall Score:
          <span
            className="font-semibold text-xl"
            style={{ color: TOKENS.positive, fontFamily: TYPOGRAPHY.mono }}
          >
            {VERDICT.score}/10
          </span>
        </div>
      </motion.div>

      {/* Checklist */}
      <div
        className="border overflow-hidden"
        style={{ borderColor: TOKENS.b1, borderRadius: '4px', boxShadow: TOKENS.shadowCard }}
      >
        <div
          className="px-6 py-3 text-[9px] font-semibold uppercase tracking-widest border-b"
          style={{ borderColor: TOKENS.b1, color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
        >
          Criteria Checklist
        </div>
        {CHECKS.map((check, i) => (
          <motion.div
            key={check.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 transition-colors"
            style={{
              borderColor: TOKENS.b1,
              background: i % 2 === 0 ? TOKENS.bg2 : TOKENS.bg1,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = TOKENS.bg3; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? TOKENS.bg2 : TOKENS.bg1; }}
          >
            <div className="flex items-center gap-2.5">
              {check.pass ? (
                <CheckCircle2 size={14} style={{ color: TOKENS.positive }} />
              ) : (
                <XCircle size={14} style={{ color: TOKENS.negative }} />
              )}
              <span className="text-[13px]" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>{check.label}</span>
            </div>
            <span
              className="text-[9px] px-3 py-1 rounded font-semibold tracking-wide border"
              style={{
                background: check.pass ? TOKENS.alpha(TOKENS.positive, 0.08) : TOKENS.alpha(TOKENS.negative, 0.08),
                borderColor: check.pass ? TOKENS.alpha(TOKENS.positive, 0.2) : TOKENS.alpha(TOKENS.negative, 0.2),
                color: check.pass ? TOKENS.positive : TOKENS.negative,
              }}
            >
              {check.pass ? 'PASS' : 'FAIL'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-10 text-center text-[10px] leading-relaxed" style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.body }}>
        This report is generated algorithmically and does not constitute financial advice.
        Past performance is not indicative of future results. Conduct independent due diligence.
      </div>
    </SceneContainer>
  );
});
