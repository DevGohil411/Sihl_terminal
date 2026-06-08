import type { LogLine } from '../types';

export const LOG_LINES: LogLine[] = [
  { time: '02:18:04', tag: 'INGEST', message: 'Strategy file parsed · 842 trades · 3.1y window' },
  { time: '02:18:09', tag: 'RISK', message: 'VaR(95) 2.84% · CVaR 4.12% · tail events 3' },
  { time: '02:18:13', tag: 'ALPHA', message: 'Excess return +18.5% · info ratio 1.86' },
  { time: '02:18:18', tag: 'REGIME', message: '5 regimes classified · low-vol sensitivity flagged' },
  { time: '02:18:22', tag: 'REPORT', message: 'Tear sheet compiled · confidence 95%' },
];
