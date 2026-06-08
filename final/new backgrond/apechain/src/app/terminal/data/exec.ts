import type { ExecStep, MarketTicker, StatusItem } from '../types';

export const EXEC_STEPS: ExecStep[] = [
  { label: 'Parsing strategy file', sub: 'Extracting trade rules & signal definitions' },
  { label: 'Validating trade history', sub: 'Cross-referencing timestamps & fill prices' },
  { label: 'Extracting entry/exit signals', sub: 'Identifying conditions, filters & overlaps' },
  { label: 'Running volatility simulation', sub: 'Monte Carlo σ estimation across market regimes' },
  { label: 'Generating risk model', sub: 'VaR, CVaR, expected shortfall computation' },
  { label: 'Benchmarking vs market index', sub: 'Comparing strategy vs NIFTY50 & SPX' },
  { label: 'Stress-testing drawdowns', sub: 'Simulating 2008, 2020 & 2022 shock scenarios' },
  { label: 'Computing alpha & beta', sub: "Jensen's α, information ratio, R-squared" },
  { label: 'Monte Carlo simulation', sub: '10,000 paths · 95% confidence interval' },
  { label: 'Report generated', sub: 'Institutional-grade PDF report ready' },
];

export const MARKET_TICKERS: MarketTicker[] = [
  { symbol: 'NIFTY', value: 22840, jitterRange: 40, decimals: 0, change: '+0.42%', isUp: true },
  { symbol: 'BNIFTY', value: 48320, jitterRange: 80, decimals: 0, change: '+0.31%', isUp: true },
  { symbol: 'SPX', value: 5480, jitterRange: 15, decimals: 0, change: '+0.18%', isUp: true },
  { symbol: 'VIX', value: 14.2, jitterRange: 0.3, decimals: 1, change: '-1.2%', isUp: false },
  { symbol: 'BTC', value: 67400, jitterRange: 200, decimals: 0, change: '+2.14%', isUp: true },
];

export const STATUS_ITEMS: StatusItem[] = [
  { label: 'Model', value: 'Q-3.2' },
  { label: 'Latency', value: '32ms' },
  { label: 'Coverage', value: '95%' },
  { label: 'Universe', value: 'NIFTY 50 + SPX' },
  { label: 'Regimes', value: '5 detected' },
  { label: 'Last Run', value: '02:18 UTC' },
];
