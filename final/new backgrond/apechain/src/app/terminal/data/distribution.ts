import type { DistributionBin } from '../types';
import { TOKENS } from '../constants';

export const DIST: DistributionBin[] = [
  { range: '-6%–-4%', count: 2, color: TOKENS.negative },
  { range: '-4%–-2%', count: 5, color: TOKENS.negative },
  { range: '-2%–0%', count: 8, color: TOKENS.alpha(TOKENS.negative, 0.4) },
  { range: '0%–2%', count: 6, color: TOKENS.alpha(TOKENS.positive, 0.4) },
  { range: '2%–4%', count: 10, color: TOKENS.positive },
  { range: '4%–6%', count: 7, color: TOKENS.positive },
  { range: '6%–8%', count: 4, color: TOKENS.positive },
  { range: '8%–10%', count: 2, color: TOKENS.positive },
];
