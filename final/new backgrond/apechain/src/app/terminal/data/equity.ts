import { MONTHLY } from './monthly';

export interface EquityPoint {
  date: string;
  index: number;
  strategy: number;
  benchmark: number;
  underwater: number;
  return: number | null;
}

// Compound monthly returns into equity curve
// Starting value = 100
export const EQUITY_DATA: EquityPoint[] = (() => {
  let strategy = 100;
  let benchmark = 100;
  let peak = 100;
  const points: EquityPoint[] = [];
  let globalIdx = 0;

  const bmReturns = [0.3, 0.5, 0.2, -0.1, 0.4, 0.3, 0.5, 0.2, -0.2, 0.4, 0.3, 0.5, 0.2, -0.1, 0.3, 0.4, 0.2, -0.3, 0.5, 0.4, 0.3, 0.2, 0.4, 0.3, 0.5, 0.2, -0.4, 0.3, 0.4, 0.2, 0.3, 0.5, 0.2, -0.1, 0.4, 0.3, 0.5, 0.2, -0.2, 0.4, 0.3, 0.2];

  MONTHLY.forEach((yearData) => {
    yearData.data.forEach((ret, monthIdx) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const date = `${monthNames[monthIdx]} ${yearData.year}`;

      if (ret !== null) {
        strategy *= (1 + ret / 100);
      }
      benchmark *= (1 + (bmReturns[globalIdx] ?? 0.3) / 100);
      peak = Math.max(peak, strategy);
      const underwater = ((strategy - peak) / peak) * 100;

      points.push({
        date,
        index: globalIdx,
        strategy: Number(strategy.toFixed(2)),
        benchmark: Number(benchmark.toFixed(2)),
        underwater: Number(underwater.toFixed(2)),
        return: ret,
      });
      globalIdx++;
    });
  });

  return points;
})();

// Drawdown periods extracted from equity data
export interface DrawdownPeriod {
  startIdx: number;
  endIdx: number;
  startDate: string;
  endDate: string;
  depth: number;
}

export const EQUITY_DRAWDOWNS: DrawdownPeriod[] = [
  { startIdx: 2, endIdx: 5, startDate: 'Mar 2022', endDate: 'Jun 2022', depth: -8.5 },
  { startIdx: 14, endIdx: 17, startDate: 'Mar 2023', endDate: 'Jun 2023', depth: -5.2 },
  { startIdx: 26, endIdx: 29, startDate: 'Mar 2024', endDate: 'Jun 2024', depth: -12.4 },
  { startIdx: 38, endIdx: 40, startDate: 'Mar 2025', endDate: 'May 2025', depth: -3.8 },
];

// Trade markers on the equity curve
export interface TradeMarker {
  index: number;
  date: string;
  direction: 'LONG' | 'SHORT';
  pnl: number;
}

export const EQUITY_TRADES: TradeMarker[] = [
  { index: 0, date: 'Jan 2022', direction: 'LONG', pnl: 280 },
  { index: 4, date: 'May 2022', direction: 'SHORT', pnl: 320 },
  { index: 8, date: 'Sep 2022', direction: 'LONG', pnl: 450 },
  { index: 12, date: 'Jan 2023', direction: 'LONG', pnl: 380 },
  { index: 16, date: 'May 2023', direction: 'SHORT', pnl: 210 },
  { index: 20, date: 'Sep 2023', direction: 'LONG', pnl: 520 },
  { index: 24, date: 'Jan 2024', direction: 'LONG', pnl: 610 },
  { index: 28, date: 'May 2024', direction: 'SHORT', pnl: 340 },
  { index: 32, date: 'Sep 2024', direction: 'LONG', pnl: 480 },
  { index: 36, date: 'Jan 2025', direction: 'LONG', pnl: 390 },
];
