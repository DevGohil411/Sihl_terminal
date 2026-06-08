import type { CorrelationMatrix } from '../types';

export const CORR_LABELS = ['Strategy', 'NIFTY', 'SPX', 'BTC', 'Gold', 'VIX'];

export const CORR: CorrelationMatrix = {
  labels: CORR_LABELS,
  values: [
    [1.0, 0.42, 0.38, 0.22, 0.08, -0.34],
    [0.42, 1.0, 0.78, 0.31, 0.12, -0.68],
    [0.38, 0.78, 1.0, 0.28, 0.15, -0.72],
    [0.22, 0.31, 0.28, 1.0, -0.04, -0.18],
    [0.08, 0.12, 0.15, -0.04, 1.0, 0.22],
    [-0.34, -0.68, -0.72, -0.18, 0.22, 1.0],
  ],
};
