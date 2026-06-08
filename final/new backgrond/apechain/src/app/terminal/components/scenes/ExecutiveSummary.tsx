'use client';

import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp, Shield, Target, Zap } from 'lucide-react';
import { SceneContainer } from './SceneContainer';
import { EquityCurve } from '../charts/EquityCurve';
import { TOKENS, TYPOGRAPHY } from '../../constants';
import { PERF } from '../../data';

const KPI_ICONS: Record<string, React.ReactNode> = {
  'Total Return': <TrendingUp size={16} />,
  'CAGR': <Zap size={16} />,
  'Sharpe Ratio': <Shield size={16} />,
  'Win Rate': <Target size={16} />,
};

const KPI_DATA = [
  { label: 'Total Return', value: PERF.totalReturn, suffix: '%', change: '+42.8% vs benchmark', positive: true },
  { label: 'CAGR', value: PERF.cagr, suffix: '%', change: 'Annualized since inception', positive: true },
  { label: 'Sharpe Ratio', value: PERF.sharpe, suffix: '', change: 'Risk-adjusted performance', positive: true },
  { label: 'Win Rate', value: PERF.winRate, suffix: '%', change: `${PERF.totalTrades} total trades`, positive: true },
];

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const duration = 1200;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * ease);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  const decimals = value % 1 === 0 ? 0 : 2;
  return <span>{display.toFixed(decimals)}{suffix}</span>;
}

export const ExecutiveSummary = memo(function ExecutiveSummary() {
  return (
    <SceneContainer
      id="executive-summary"
      title="Executive Summary"
      subtitle="Strategy performance at a glance"
    >
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {KPI_DATA.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="p-7 border transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderColor: 'rgba(255,255,255,0.12)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
              borderRadius: '20px',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'rgba(255,255,255,0.18)';
              el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.35)';
              el.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'rgba(255,255,255,0.12)';
              el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)';
              el.style.transform = 'translateY(0)';
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: TOKENS.gold }}>{KPI_ICONS[kpi.label]}</span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
              >
                {kpi.label}
              </span>
            </div>
            <div
              className="text-[36px] leading-none font-semibold tracking-tight"
              style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.mono }}
            >
              <AnimatedNumber value={kpi.value} suffix={kpi.suffix} />
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px]" style={{ color: kpi.positive ? TOKENS.positive : TOKENS.negative }}>
              <ArrowUpRight size={12} />
              <span style={{ fontFamily: TYPOGRAPHY.body }}>{kpi.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Equity curve */}
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.body }}
            >
              Equity Curve
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: TOKENS.t2 }}>
              Strategy performance vs benchmark over time
            </p>
          </div>
          <span
            className="text-[10px] font-mono px-2.5 py-1 border"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: TOKENS.t2, borderRadius: '12px', fontFamily: TYPOGRAPHY.mono }}
          >
            Interactive
          </span>
        </div>
        <EquityCurve />
      </div>
    </SceneContainer>
  );
});
