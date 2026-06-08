import type { Drawdown } from '../types';

export const DRAWDOWNS: Drawdown[] = [
  { start: 'Jan 14, 2024', end: 'Feb 02, 2024', depth: -12.4, recovery: 12, duration: 19, regime: 'BEAR' },
  { start: 'Sep 08, 2023', end: 'Sep 22, 2023', depth: -8.2, recovery: 8, duration: 14, regime: 'SHOCK' },
  { start: 'Mar 12, 2022', end: 'Mar 28, 2022', depth: -6.8, recovery: 10, duration: 16, regime: 'VOLATILE' },
  { start: 'Jul 18, 2024', end: 'Jul 29, 2024', depth: -4.8, recovery: 5, duration: 11, regime: 'MEAN-REV' },
  { start: 'Nov 04, 2023', end: 'Nov 12, 2023', depth: -3.2, recovery: 4, duration: 8, regime: 'SIDEWAYS' },
];
