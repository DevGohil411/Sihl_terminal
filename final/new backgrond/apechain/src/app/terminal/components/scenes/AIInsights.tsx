'use client';

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lightbulb, CheckCircle2, ChevronDown, BookOpen, Gauge } from 'lucide-react';
import { SceneContainer } from './SceneContainer';
import { TOKENS, TYPOGRAPHY } from '../../constants';

interface Insight {
  type: 'strength' | 'watch' | 'opportunity';
  icon: React.ReactNode;
  title: string;
  body: string;
  metric: string;
  confidence: number;
  evidence: string[];
  source: string;
}

const INSIGHTS: Insight[] = [
  {
    type: 'strength',
    icon: <CheckCircle2 size={16} />,
    title: 'Consistent Alpha Generation',
    body: 'Strategy demonstrates sustained alpha of +18.5% over 3.1 years across multiple market regimes. Sharpe ratio of 2.84 indicates superior risk-adjusted returns.',
    metric: 'α = +18.5%',
    confidence: 94,
    evidence: [
      'Rolling 12-month alpha positive in 31 of 36 months',
      'Information ratio 1.86 vs NIFTY 50 benchmark',
      'Jensen\'s alpha significant at p < 0.01',
    ],
    source: 'Performance Analysis · Scene 2',
  },
  {
    type: 'strength',
    icon: <CheckCircle2 size={16} />,
    title: 'Low Market Correlation',
    body: 'Beta of 0.42 against NIFTY 50 suggests independent return generation. SPX correlation at 0.38 further confirms decorrelation from broad equity indices.',
    metric: 'β = 0.42',
    confidence: 91,
    evidence: [
      'Correlation to NIFTY 50: 0.42 (R² = 0.18)',
      'Correlation to SPX: 0.38 (R² = 0.14)',
      'Correlation to VIX: -0.34 (hedge characteristic)',
    ],
    source: 'Risk Analysis · Scene 3',
  },
  {
    type: 'watch',
    icon: <AlertTriangle size={16} />,
    title: 'Regime Sensitivity — Low Volatility',
    body: 'Performance in low-volatility regimes shows marginal alpha decay. Consider dynamic position sizing or regime-switching overlay for sustained edge.',
    metric: 'Flagged',
    confidence: 72,
    evidence: [
      'Alpha in low-vol regime: +8.2% (vs +22.1% in high-vol)',
      'Win rate drops to 58% in sideways markets',
      'Signal frequency reduced by 34% in compressed ranges',
    ],
    source: 'Regime Detection · Scene 6',
  },
  {
    type: 'opportunity',
    icon: <Lightbulb size={16} />,
    title: 'Expand to Additional Asset Classes',
    body: 'Correlation matrix reveals significant alpha potential in uncorrelated markets. BTC (ρ=0.22) and Gold (ρ=0.08) present diversification opportunities.',
    metric: 'ρ < 0.25',
    confidence: 78,
    evidence: [
      'BTC correlation: 0.22 (low, non-significant)',
      'Gold correlation: 0.08 (negligible)',
      'Estimated Sharpe in multi-asset portfolio: 3.12',
    ],
    source: 'Correlation Matrix · Scene 3',
  },
  {
    type: 'strength',
    icon: <CheckCircle2 size={16} />,
    title: 'Rapid Recovery Mechanism',
    body: 'Average drawdown recovery of 7.8 days is exceptional. Max drawdown duration of only 18 days demonstrates strong mean-reversion capture.',
    metric: 'Recovery: 7.8d avg',
    confidence: 96,
    evidence: [
      'Mean recovery time: 7.8 days (median: 6 days)',
      'Longest recovery: 18 days (Jan–Feb 2024)',
      'Recovery rate correlates with signal strength (ρ=0.71)',
    ],
    source: 'Drawdown Analysis · Scene 4',
  },
];

const TYPE_COLORS: Record<string, { border: string; bg: string; icon: string; leftBorder: string }> = {
  strength: {
    border: TOKENS.alpha(TOKENS.positive, 0.2),
    bg: TOKENS.alpha(TOKENS.positive, 0.03),
    icon: TOKENS.positive,
    leftBorder: TOKENS.positive,
  },
  watch: {
    border: TOKENS.alpha(TOKENS.warning, 0.2),
    bg: TOKENS.alpha(TOKENS.warning, 0.03),
    icon: TOKENS.warning,
    leftBorder: TOKENS.warning,
  },
  opportunity: {
    border: TOKENS.alpha(TOKENS.chartPrimary, 0.2),
    bg: TOKENS.alpha(TOKENS.chartPrimary, 0.03),
    icon: TOKENS.chartPrimary,
    leftBorder: TOKENS.chartPrimary,
  },
};

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [started, text]);

  return <span>{displayed}</span>;
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: TOKENS.bg3 }}>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: value >= 90 ? TOKENS.positive : value >= 75 ? TOKENS.chartPrimary : TOKENS.warning,
          }}
        />
      </div>
      <span className="text-[10px] font-semibold w-7 text-right" style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.mono }}>
        {value}%
      </span>
    </div>
  );
}

export const AIInsights = memo(function AIInsights() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <SceneContainer
      id="ai-insights"
      title="AI Insights"
      subtitle="Machine-generated strategy analysis with confidence scoring"
    >
      <div className="space-y-3">
        {INSIGHTS.map((insight, i) => {
          const style = TYPE_COLORS[insight.type];
          const isOpen = expanded === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border overflow-hidden transition-all duration-200"
              style={{
                background: TOKENS.bg2,
                borderColor: style.border,
                borderLeftWidth: '3px',
                borderLeftColor: style.leftBorder,
                borderRadius: '4px',
                boxShadow: TOKENS.shadowCard,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = TOKENS.shadowElevated;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = TOKENS.shadowCard;
              }}
            >
              {/* Header */}
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-start gap-3 p-6 text-left"
              >
                <span style={{ color: style.icon, marginTop: 2 }}>{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h4
                      className="text-sm font-semibold"
                      style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.body }}
                    >
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{
                          background: TOKENS.bg1,
                          color: style.icon,
                          fontFamily: TYPOGRAPHY.mono,
                        }}
                      >
                        {insight.metric}
                      </span>
                      <ChevronDown
                        size={14}
                        style={{
                          color: TOKENS.t2,
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>
                    {insight.body}
                  </p>
                  {/* Confidence bar */}
                  <div className="mt-4 flex items-center gap-2 max-w-[200px]">
                    <Gauge size={11} style={{ color: TOKENS.t2 }} />
                    <span className="text-[10px]" style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}>Confidence</span>
                    <div className="flex-1">
                      <ConfidenceBar value={insight.confidence} />
                    </div>
                  </div>
                </div>
              </button>

              {/* Expandable evidence */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0">
                      <div className="h-px mb-5" style={{ background: style.border }} />
                      <div className="space-y-2.5 mb-5">
                        <div
                          className="text-[9px] font-semibold uppercase tracking-widest mb-3"
                          style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
                        >
                          Supporting Evidence
                        </div>
                        {insight.evidence.map((ev, j) => (
                          <div key={j} className="flex items-start gap-2.5 text-[12px]" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>
                            <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: style.icon }} />
                            <TypewriterText text={ev} delay={j * 200} />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.body }}>
                        <BookOpen size={11} />
                        Source: {insight.source}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </SceneContainer>
  );
});
