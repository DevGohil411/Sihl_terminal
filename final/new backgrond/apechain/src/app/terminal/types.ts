export type Phase = 'upload' | 'exec' | 'report';
export type ZoomWindow = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';
export type ExportFormat = 'csv-metrics' | 'csv-trades' | 'png' | 'pdf';
export type PlaybackSpeed = 1 | 2 | 5 | 10;
export type Direction = 'LONG' | 'SHORT';

export type SceneId =
  | 'executive-summary'
  | 'performance'
  | 'risk'
  | 'drawdowns'
  | 'monte-carlo'
  | 'trade-diagnostics'
  | 'ai-insights'
  | 'final-verdict';

export interface PerformanceMetrics {
  totalReturn: number;
  cagr: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  alpha: number;
  beta: number;
  vol: number;
  profitFactor: number;
  recoveryFactor: number;
  winRate: number;
  avgTrade: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  exposure: number;
  riskAdjReturn: number;
  maxDD: number;
  totalTrades: number;
  bestMonth: number;
  worstMonth: number;
  rSq: number;
  infoRatio: number;
}

export interface MonthlyReturn {
  year: number;
  data: (number | null)[];
}

export interface RiskMetric {
  label: string;
  value: string;
  status: string;
  color: string;
}

export interface Drawdown {
  start: string;
  end: string;
  depth: number;
  recovery: number;
  duration: number;
  regime: string;
}

export interface DistributionBin {
  range: string;
  count: number;
  color: string;
}

export interface Trade {
  id: string;
  entryDate: string;
  exitDate: string;
  direction: Direction;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  duration: number;
  regime: string;
}

export interface LogLine {
  time: string;
  tag: string;
  message: string;
}

export interface Insight {
  iconType: 'trending' | 'shield' | 'alert' | 'activity';
  color: string;
  title: string;
  body: string;
  confidence: number;
  severity: 'positive' | 'warning' | 'action';
  evidenceScene: number;
}

export interface Bookmark {
  id: string;
  strategyName: string;
  date: string;
  sharpe: number;
  url: string;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  innerWidth: number;
  innerHeight: number;
}

export interface SceneNavItem {
  id: number;
  label: string;
  shortLabel: string;
}

export interface MarketTicker {
  symbol: string;
  value: number;
  jitterRange: number;
  decimals: number;
  change: string;
  isUp: boolean;
}

export interface ExecStep {
  label: string;
  sub: string;
}

export interface StatusItem {
  label: string;
  value: string;
}

export interface SummaryRow {
  metric: string;
  strategy: string;
  benchmark: string;
  edge: string;
}

export interface TradeStat {
  label: string;
  value: string;
}

export interface CorrelationMatrix {
  labels: string[];
  values: number[][];
}
