import type { PerformanceMetrics } from '../types';

export const PERF: PerformanceMetrics = {
  totalReturn: 156.2,
  cagr: 42.8,
  sharpe: 2.84,
  sortino: 3.92,
  calmar: 3.41,
  alpha: 18.5,
  beta: 0.42,
  vol: 14.2,
  profitFactor: 2.14,
  recoveryFactor: 3.45,
  winRate: 68.2,
  avgTrade: 1.84,
  avgWin: 3.42,
  avgLoss: -1.58,
  expectancy: 1.28,
  exposure: 72.4,
  riskAdjReturn: 3.02,
  maxDD: -12.4,
  totalTrades: 842,
  bestMonth: 9.1,
  worstMonth: -4.8,
  rSq: 0.78,
  infoRatio: 1.86,
};

// Equity curve data points (cumulative)
export const EQ = [
  0, 2, 5, 3, 8, 12, 10, 15, 18, 14, 22, 28, 25, 32, 38, 35, 42, 48, 44, 52,
  58, 55, 62, 68, 72, 78, 85, 80, 88, 95, 92, 98, 105, 112, 108, 118, 125, 120,
  132, 140, 145, 150, 156,
];

// Benchmark data points (cumulative)
export const BM = [
  0, 1, 2, 1, 3, 4, 3, 5, 6, 5, 7, 8, 7, 9, 10, 9, 11, 12, 11, 13, 14, 13,
  15, 16, 17, 18, 19, 17, 20, 21, 20, 22, 23, 24, 23, 25, 26, 25, 27, 28, 28,
  28, 28,
];

// Underwater equity data points
export const UW = [
  0, 0, 0, -2, 0, 0, -2, 0, 0, -4, 0, 0, -3, 0, 0, -3, 0, 0, -4, 0, 0, -3,
  0, 0, 0, 0, 0, -5, 0, 0, -3, 0, 0, 0, -4, 0, 0, -5, 0, 0, 0, 0, 0,
];

export const SUMMARY_ROWS = [
  { metric: 'Cumulative Return', strategy: '+156.2%', benchmark: '+28.4%', edge: '+127.8%' },
  { metric: 'CAGR', strategy: '42.8%', benchmark: '8.2%', edge: '+34.6pp' },
  { metric: 'Sharpe Ratio', strategy: '2.84', benchmark: '0.94', edge: '3.02×' },
  { metric: 'Sortino Ratio', strategy: '3.92', benchmark: '1.12', edge: '3.50×' },
  { metric: 'Max Drawdown', strategy: '-12.4%', benchmark: '-22.1%', edge: '+9.7pp' },
  { metric: 'Win Rate', strategy: '68.2%', benchmark: '52.4%', edge: '+15.8pp' },
  { metric: 'Profit Factor', strategy: '2.14', benchmark: '—', edge: '—' },
  { metric: 'Alpha', strategy: '+18.5%', benchmark: '0.00%', edge: '+18.5%' },
  { metric: 'Beta', strategy: '0.42', benchmark: '1.00', edge: 'Low corr' },
  { metric: 'Volatility (Ann.)', strategy: '14.2%', benchmark: '18.8%', edge: '-4.6pp' },
  { metric: 'Recovery Factor', strategy: '3.45', benchmark: '—', edge: '—' },
  { metric: 'Information Ratio', strategy: '1.86', benchmark: '—', edge: '—' },
];
