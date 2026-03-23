import { SchoolStats } from '../types';

export const calculateQuartiles = (data: number[]) => {
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q2 = sorted[Math.floor(sorted.length * 0.5)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  return { q1, q2, q3 };
};

export const getCOAColor = (value: number | undefined, quartiles: { q1: number; q2: number; q3: number }) => {
  if (value === undefined) return 'text-slate-400';
  if (value <= quartiles.q1) return 'text-emerald-600'; // Green (Lowest 25%)
  if (value <= quartiles.q2) return 'text-yellow-600';  // Yellow (25-50%)
  if (value <= quartiles.q3) return 'text-orange-600';  // Orange (50-75%)
  return 'text-rose-600';                             // Red (Highest 25%)
};
