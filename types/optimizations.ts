// types/optimizations.ts
export interface Optimization {
  id: number;
  brand: string;
  platform: string;
  date: string;
  campaign: string;
  optimization: string;
  changes: string;
  optimization_score: string;
  results_next_step: string;
  date_changes: string;
  optimization_by: string;
  created_at: string;
}

export interface OptimizationsResponse {
  data: Optimization[] | null;
  error: string | null;
}

export interface OptimizationsFilter {
  brandCode: string;
  startDate?: Date;
  endDate?: Date;
  platform?: string;
}

export interface OptimizationsByMonthFilter {
  brandCode: string;
  month: string;
  year: string;
  platform?: string;
}