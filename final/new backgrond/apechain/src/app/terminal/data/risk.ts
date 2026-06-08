import type { RiskMetric } from '../types';
import { TOKENS } from '../constants';

export const RISK_METRICS: RiskMetric[] = [
  { label: 'Value at Risk (95%)', value: '2.84%', status: 'LOW', color: TOKENS.positive },
  { label: 'CVaR / Exp. Shortfall', value: '4.12%', status: 'MODERATE', color: TOKENS.chartPrimary },
  { label: 'Portfolio Volatility', value: '14.2%', status: 'CONTROLLED', color: TOKENS.positive },
  { label: 'Max Drawdown Duration', value: '18 days', status: 'SHORT', color: TOKENS.positive },
  { label: 'Recovery Period', value: '12 days', status: 'FAST', color: TOKENS.chartPrimary },
  { label: 'Net Exposure', value: '72.4%', status: 'MODERATE', color: TOKENS.warning },
  { label: 'Risk of Ruin', value: '0.02%', status: 'NEGLIGIBLE', color: TOKENS.positive },
  { label: 'Tail Risk (99%)', value: '6.18%', status: 'WATCH', color: TOKENS.warning },
  { label: 'Kelly Fraction', value: '0.34', status: 'OPTIMAL', color: TOKENS.chartPrimary },
  { label: 'Max Leverage Used', value: '1.2×', status: 'CONSERVATIVE', color: TOKENS.positive },
];
