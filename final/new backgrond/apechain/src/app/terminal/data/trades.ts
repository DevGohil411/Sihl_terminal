import type { Trade, TradeStat } from '../types';

export const TRADE_STATS: TradeStat[] = [
  { label: 'Avg Duration', value: '4.2 days' },
  { label: 'Best Day', value: 'Tuesday' },
  { label: 'Best Hour', value: '10:00–11:00' },
  { label: 'Long Win Rate', value: '72.4%' },
  { label: 'Short Win Rate', value: '58.1%' },
  { label: 'Max Win Streak', value: '14 trades' },
  { label: 'Max Loss Streak', value: '5 trades' },
  { label: 'Avg Reward:Risk', value: '2.16' },
  { label: 'Slippage Estimate', value: '0.04%' },
  { label: 'Execution Quality', value: '97.8%' },
];

export const SYNTHETIC_TRADES: Trade[] = [
  { id: 'T001', entryDate: 'Jan 03, 2022', exitDate: 'Jan 07, 2022', direction: 'LONG', entryPrice: 22840, exitPrice: 23120, pnl: 280, pnlPercent: 1.23, duration: 4, regime: 'BULL' },
  { id: 'T002', entryDate: 'Jan 10, 2022', exitDate: 'Jan 14, 2022', direction: 'LONG', entryPrice: 23250, exitPrice: 23580, pnl: 330, pnlPercent: 1.42, duration: 4, regime: 'BULL' },
  { id: 'T003', entryDate: 'Jan 18, 2022', exitDate: 'Jan 21, 2022', direction: 'SHORT', entryPrice: 23450, exitPrice: 23180, pnl: 270, pnlPercent: 1.15, duration: 3, regime: 'BEAR' },
  { id: 'T004', entryDate: 'Jan 24, 2022', exitDate: 'Jan 28, 2022', direction: 'LONG', entryPrice: 23000, exitPrice: 23350, pnl: 350, pnlPercent: 1.52, duration: 4, regime: 'BULL' },
  { id: 'T005', entryDate: 'Feb 01, 2022', exitDate: 'Feb 04, 2022', direction: 'SHORT', entryPrice: 23500, exitPrice: 23250, pnl: 250, pnlPercent: 1.06, duration: 3, regime: 'BEAR' },
  { id: 'T006', entryDate: 'Feb 08, 2022', exitDate: 'Feb 11, 2022', direction: 'LONG', entryPrice: 23100, exitPrice: 23450, pnl: 350, pnlPercent: 1.51, duration: 3, regime: 'BULL' },
  { id: 'T007', entryDate: 'Feb 15, 2022', exitDate: 'Feb 18, 2022', direction: 'LONG', entryPrice: 23300, exitPrice: 23650, pnl: 350, pnlPercent: 1.50, duration: 3, regime: 'BULL' },
  { id: 'T008', entryDate: 'Feb 22, 2022', exitDate: 'Feb 25, 2022', direction: 'SHORT', entryPrice: 23700, exitPrice: 23400, pnl: 300, pnlPercent: 1.27, duration: 3, regime: 'BEAR' },
  { id: 'T009', entryDate: 'Mar 01, 2022', exitDate: 'Mar 04, 2022', direction: 'LONG', entryPrice: 23200, exitPrice: 23550, pnl: 350, pnlPercent: 1.51, duration: 3, regime: 'BULL' },
  { id: 'T010', entryDate: 'Mar 08, 2022', exitDate: 'Mar 11, 2022', direction: 'SHORT', entryPrice: 23600, exitPrice: 23350, pnl: 250, pnlPercent: 1.06, duration: 3, regime: 'BEAR' },
  { id: 'T011', entryDate: 'Mar 15, 2022', exitDate: 'Mar 18, 2022', direction: 'LONG', entryPrice: 23100, exitPrice: 23400, pnl: 300, pnlPercent: 1.30, duration: 3, regime: 'BULL' },
  { id: 'T012', entryDate: 'Mar 22, 2022', exitDate: 'Mar 25, 2022', direction: 'SHORT', entryPrice: 23500, exitPrice: 23200, pnl: 300, pnlPercent: 1.28, duration: 3, regime: 'BEAR' },
  { id: 'T013', entryDate: 'Mar 29, 2022', exitDate: 'Apr 01, 2022', direction: 'LONG', entryPrice: 23000, exitPrice: 23350, pnl: 350, pnlPercent: 1.52, duration: 3, regime: 'BULL' },
  { id: 'T014', entryDate: 'Apr 05, 2022', exitDate: 'Apr 08, 2022', direction: 'LONG', entryPrice: 23200, exitPrice: 23550, pnl: 350, pnlPercent: 1.51, duration: 3, regime: 'BULL' },
  { id: 'T015', entryDate: 'Apr 12, 2022', exitDate: 'Apr 15, 2022', direction: 'SHORT', entryPrice: 23600, exitPrice: 23300, pnl: 300, pnlPercent: 1.27, duration: 3, regime: 'BEAR' },
  { id: 'T016', entryDate: 'Apr 19, 2022', exitDate: 'Apr 22, 2022', direction: 'LONG', entryPrice: 23100, exitPrice: 23450, pnl: 350, pnlPercent: 1.51, duration: 3, regime: 'BULL' },
  { id: 'T017', entryDate: 'Apr 26, 2022', exitDate: 'Apr 29, 2022', direction: 'SHORT', entryPrice: 23500, exitPrice: 23250, pnl: 250, pnlPercent: 1.06, duration: 3, regime: 'BEAR' },
  { id: 'T018', entryDate: 'May 03, 2022', exitDate: 'May 06, 2022', direction: 'LONG', entryPrice: 23000, exitPrice: 23350, pnl: 350, pnlPercent: 1.52, duration: 3, regime: 'BULL' },
  { id: 'T019', entryDate: 'May 10, 2022', exitDate: 'May 13, 2022', direction: 'LONG', entryPrice: 23200, exitPrice: 23550, pnl: 350, pnlPercent: 1.51, duration: 3, regime: 'BULL' },
  { id: 'T020', entryDate: 'May 17, 2022', exitDate: 'May 20, 2022', direction: 'SHORT', entryPrice: 23600, exitPrice: 23300, pnl: 300, pnlPercent: 1.27, duration: 3, regime: 'BEAR' },
];
