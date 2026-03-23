import { SchoolStats, UserStats, MatchCategory } from '../types';

export const getMatchCategory = (school: SchoolStats, user: UserStats): MatchCategory => {
  if (user.aa === 0 || user.totalGpa === 0) return 'N/A';

  const aaDiff = user.aa - school.meanAA;
  const gpaDiff = user.totalGpa - school.meanTotalGPA;

  // Safety: User is well above average
  if (aaDiff >= 1.5 && gpaDiff >= 0.15) return 'Safety';
  
  // Median/Target: User is around average
  if (aaDiff >= -0.5 && gpaDiff >= -0.05) return 'Median';
  
  // Reach: User is below average but within competitive range (5th percentile)
  if (user.aa >= school.percentile5AA && user.totalGpa >= school.percentile5TotalGPA) return 'Reach';
  
  // Long Shot: User is below the 5th percentile of admitted students
  return 'Long Shot';
};

export const calculateMatchPercent = (school: SchoolStats, user: UserStats): number => {
  if (!user.aa || !user.totalGpa) return 0;

  const calculateScore = (val: number, mean: number, p5: number) => {
    if (val >= mean) {
      const score = 75 + ((val - mean) / (mean - p5)) * 25;
      return Math.min(100, Math.round(score));
    } else if (val >= p5) {
      const score = 25 + ((val - p5) / (mean - p5)) * 50;
      return Math.round(score);
    } else {
      const score = (val / p5) * 25;
      return Math.max(0, Math.round(score));
    }
  };

  const aaScore = calculateScore(user.aa, school.meanAA, school.percentile5AA);
  const gpaScore = calculateScore(user.totalGpa, school.meanTotalGPA, school.percentile5TotalGPA);

  return Math.round((aaScore * 0.6) + (gpaScore * 0.4));
};
