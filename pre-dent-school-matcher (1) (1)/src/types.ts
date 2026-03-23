export interface SchoolStats {
  name: string;
  state: string;
  type?: 'Public' | 'Private';
  meanAA: number;
  meanPAT: number;
  meanSci: number;
  percentile5AA: number;
  percentile25AA?: number;
  percentile75AA?: number;
  percentile95AA: number;
  percentile5PAT?: number;
  percentile25PAT?: number;
  percentile75PAT?: number;
  percentile95PAT?: number;
  percentile5Sci?: number;
  percentile25Sci?: number;
  percentile75Sci?: number;
  percentile95Sci?: number;
  meanSciGPA: number;
  percentile5SciGPA?: number;
  percentile25SciGPA?: number;
  percentile75SciGPA?: number;
  percentile95SciGPA?: number;
  meanTotalGPA: number;
  percentile5TotalGPA: number;
  percentile25TotalGPA?: number;
  percentile75TotalGPA?: number;
  percentile95TotalGPA: number;
  inStatePercent: number;
  maDegreePercent: number;
  website?: string;
  description?: string;
  missionStatement?: string;
  coa?: number;
  coaInState?: number;
  coaOutState?: number;
  classSize?: number;
  acceptanceRate?: string;
  deadline?: string;
  gradingScale?: string;
  latitude?: number;
  longitude?: number;
}

export type MatchCategory = 'Safety' | 'Median' | 'Reach' | 'Long Shot' | 'N/A';

export interface UserStats {
  aa: number;
  pat: number;
  sci: number;
  totalGpa: number;
  sciGpa: number;
}
