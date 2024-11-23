export interface PaidMediaData {
  Platform: string;
  Publisher: string;
  GoodsSold: string;
  GoodsName: string;
  Campaign_ID: string;
  CampaignName: string;
  PlatAccountNbr: string;
  CampaignDate: string;
  AmountSpent: number;
  PlatBResult: number;
  PlatValue: number;
  Impressions: number;
  Clicks: number;
  LPViews: number;
  LPViewCost: number;
  Leads: number;
  LeadCost: number;
  LinkClicks: number;
  FulfillmentOrders: number;
  FulfillmentRevenue: number;
}

export interface TCPAData {
  BrandName: string;
  GoodsName: string;
  TCPA: number;
  MonthlyBudget: number;
  Group: string;
}

export interface CampaignMetrics {
  BrandName: string;
  CampaignName: string;
  GoodsName: string;
  Group: string;
  TCPA: number;
  MonthlyBudget: number;
  ThreeDayCPA: number;
  ThreeDayConv: number;
  SevenDayCPA: number;
  SevenDayConv: number;
  FourteenDayCPA: number;
  FourteenDayConv: number;
  ThirtyDayCPA: number;
  ThirtyDayConv: number;
  MTD_CPA: number;
  MTD_Conv: number;
  AmountSpent: number;
  BudgetPacing: number;
  RemainingBudget: number;
}

export interface MetricSummary {
  totalSpent: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  totalOrders: number;
  roas: number;
  ctr: number;
  cpl: number;
  cpo: number;
}

export interface DetailedMetricsProps {
  metrics: CampaignMetrics;
  campaignData: PaidMediaData[];
  onTimeframeChange: (startDate: Date, endDate: Date) => void;
}

export interface CampaignBreakdown {
  name: string;
  spend: number;
  conversions: number;
  revenue: number;
  impressions: number;
  clicks: number;
  cpa: number;
  roas: number;
  ctr: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}


export interface Filters {
  platform: string;
  publisher: string;
  goodsSold: string;
  goodsName: string;
  campaignName: string;
  timeframe: 'day' | 'week' | 'month';
}

export type FilterOption = {
  value: string;
  label: string;
}

// types.ts
export interface DailyMetrics {
  date: string;
  spend: number;
  conversions: number;
  revenue: number;
  impressions: number;
  clicks: number;
  cpa: number;
  roas: number;
  ctr: number;
  conversionRate: number;
}