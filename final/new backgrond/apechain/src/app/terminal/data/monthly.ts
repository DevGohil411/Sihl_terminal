import type { MonthlyReturn } from '../types';

export const MONTHLY: MonthlyReturn[] = [
  { year: 2022, data: [-2.1, 3.4, 5.8, -1.2, 4.2, -3.8, 7.1, 2.4, -0.9, 6.3, -2.8, 4.5] },
  { year: 2023, data: [3.2, -1.8, 6.4, 4.1, -2.4, 8.2, 3.6, -1.1, 5.8, 2.9, 7.4, -0.6] },
  { year: 2024, data: [5.1, 2.8, -3.2, 7.8, 1.4, -0.8, 9.1, -4.8, 3.2, 6.7, 4.2, 8.4] },
  { year: 2025, data: [4.8, -1.4, 8.2, 3.6, 6.1, null, null, null, null, null, null, null] },
];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
