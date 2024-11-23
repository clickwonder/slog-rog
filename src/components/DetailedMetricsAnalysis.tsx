import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import TeamOptimizations from './TeamOptimizations';
import { Alert, AlertDescription } from '../components/ui/alert';
import TrendsContent from './TrendsContent';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { DailyMetrics } from './TrendsContent';  // Import the interface




import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Brain,
  Lightbulb,
  Loader2,
  Download,
  RefreshCw,
  CheckCircle,
  BarChart2,
  DollarSign,
  Target,
  History
} from 'lucide-react';
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  getCPAClassName,
  getPacingClassName,
  getROASClassName

} from '../utils';
import { CampaignMetrics, PaidMediaData } from '../types';

// Interfaces
interface DetailedMetricsProps {
  metrics: CampaignMetrics;
  campaignData: PaidMediaData[];
  onTimeframeChange?: (startDate: Date, endDate: Date) => void;
}

interface MetricsSnapshot {
  timestamp: string;
  metrics: {
    spend: number;
    conversions: number;
    revenue: number;
    cpa: number;
    roas: number;
  };
}

interface DailyMetrics {
  date: string;
  spend: number;
  conversions: number;
  revenue: number;
  impressions: number;
  clicks: number;
  cpa: number;
  roas: number;
  ctr: number;
}

interface CampaignPerformance {
  name: string;
  spend: number;
  conversions: number;
  revenue: number;
  impressions: number;
  clicks: number;
  cpa: number;
  roas: number;
  ctr: number;
  status: 'performing' | 'at-risk' | 'underperforming';
  BudgetPacing: number;
}

interface RollingMetrics {
  spend: number;
  conversions: number;
  revenue: number;
  cpa: number;
  roas: number;
  conversionRate: number;
}

interface Alert {
  severity: 'high' | 'medium' | 'low';
  message: string;
  metric: string;
  change: number;
}

// Constants
const TIMEFRAME_OPTIONS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 14 Days', days: 14 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
];

const LOCAL_STORAGE_KEYS = {
  TIMEFRAME: 'metrics-timeframe',
  ACTIVE_TAB: 'metrics-active-tab',
  SNAPSHOTS: 'metrics-snapshots'
};

// Helper Functions
const getDaysInCurrentMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};



const calculatePercentChange = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};




// Component
const DetailedMetricsAnalysis: React.FC<DetailedMetricsProps> = ({
  metrics,
  campaignData,
  onTimeframeChange
}) => {
  // State
  const [selectedTimeframe, setSelectedTimeframe] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TIMEFRAME);
    return saved ? parseInt(saved, 10) : 30;
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_TAB) || 'overview';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<MetricsSnapshot[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SNAPSHOTS);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TIMEFRAME, selectedTimeframe.toString());
  }, [selectedTimeframe]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
  }, [snapshots]);

  // Data processing
  const filteredData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, selectedTimeframe);

    return campaignData.filter(row => {
      const date = new Date(row.CampaignDate);
      return isWithinInterval(date, {
        start: startOfDay(startDate),
        end: endOfDay(endDate)
      }) && row.GoodsName === metrics.GoodsName;
    });
  }, [campaignData, metrics.GoodsName, selectedTimeframe]);


    // Calculate daily trends first
  const dailyTrends = useMemo(() => {
    const dailyMap = new Map<string, DailyMetrics>();

    filteredData.forEach(row => {
      const date = format(new Date(row.CampaignDate), 'yyyy-MM-dd');
      const existing = dailyMap.get(date) || {
        date,
        spend: 0,
        conversions: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        cpa: 0,
        roas: 0,
        ctr: 0,
        conversionRate: 0
      };

      existing.spend += row.AmountSpent || 0;
      existing.conversions += row.FulfillmentOrders || 0;
      existing.revenue += row.FulfillmentRevenue || 0;
      existing.impressions += row.Impressions || 0;
      existing.clicks += row.Clicks || 0;

      // Calculate derived metrics
      existing.cpa = existing.conversions > 0 ? existing.spend / existing.conversions : 0;
      existing.roas = existing.spend > 0 ? existing.revenue / existing.spend : 0;
      existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0;
      existing.conversionRate = existing.clicks > 0 ? (existing.conversions / existing.clicks) * 100 : 0;

      dailyMap.set(date, existing);
    });

    return Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // Now we can use dailyTrends in period comparisons
  const periodComparisons = useMemo(() => {
    if (!dailyTrends.length) return null;

    const midPoint = Math.floor(dailyTrends.length / 2);
    const currentPeriod = dailyTrends.slice(midPoint);
    const previousPeriod = dailyTrends.slice(0, midPoint);

    const calculatePeriodMetrics = (data: DailyMetrics[]) => {
      const totals = data.reduce((acc, day) => ({
        spend: acc.spend + day.spend,
        conversions: acc.conversions + day.conversions,
        revenue: acc.revenue + day.revenue,
        impressions: acc.impressions + day.impressions,
        clicks: acc.clicks + day.clicks
      }), {
        spend: 0,
        conversions: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0
      });

      return {
        spend: totals.spend,
        conversions: totals.conversions,
        revenue: totals.revenue,
        cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
        roas: totals.spend > 0 ? totals.revenue / totals.spend : 0
      };
    };

    const current = calculatePeriodMetrics(currentPeriod);
    const previous = calculatePeriodMetrics(previousPeriod);

    // Calculate percentage changes
    return {
      spend: previous.spend ? ((current.spend - previous.spend) / previous.spend) * 100 : 0,
      conversions: previous.conversions ? ((current.conversions - previous.conversions) / previous.conversions) * 100 : 0,
      revenue: previous.revenue ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
      cpa: previous.cpa ? ((current.cpa - previous.cpa) / previous.cpa) * 100 : 0,
      roas: previous.roas ? ((current.roas - previous.roas) / previous.roas) * 100 : 0
    };
  }, [dailyTrends]);

  // Calculate summary metrics
  const summary = useMemo(() => {
    return filteredData.reduce((acc, row) => ({
      totalSpend: acc.totalSpend + (row.AmountSpent || 0),
      totalConversions: acc.totalConversions + (row.FulfillmentOrders || 0),
      totalRevenue: acc.totalRevenue + (row.FulfillmentRevenue || 0),
      totalImpressions: acc.totalImpressions + (row.Impressions || 0),
      totalClicks: acc.totalClicks + (row.Clicks || 0),
      totalLeads: acc.totalLeads + (row.Leads || 0)
    }), {
      totalSpend: 0,
      totalConversions: 0,
      totalRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalLeads: 0
    });
  }, [filteredData]);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const { totalSpend, totalConversions, totalRevenue, totalImpressions, totalClicks } = summary;
    return {
      cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      averageDailySpend: totalSpend / selectedTimeframe,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
    };
  }, [summary, selectedTimeframe]);

  // Calculate rolling averages
   const rollingAverages = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const calculateMetricsForDays = (days: number): RollingMetrics => {
      const startDate = subDays(today, days);
      const periodData = campaignData.filter(row => {
        const date = new Date(row.CampaignDate);
        return isWithinInterval(date, {
          start: startOfDay(startDate),
          end: endOfDay(today)
        });
      });

      const totals = periodData.reduce((acc, row) => ({
        spend: acc.spend + (row.AmountSpent || 0),
        conversions: acc.conversions + (row.FulfillmentOrders || 0),
        revenue: acc.revenue + (row.FulfillmentRevenue || 0),
        clicks: acc.clicks + (row.Clicks || 0),
        impressions: acc.impressions + (row.Impressions || 0)
      }), {
        spend: 0,
        conversions: 0,
        revenue: 0,
        clicks: 0,
        impressions: 0
      });

      return {
        spend: totals.spend / days,
        conversions: totals.conversions / days,
        revenue: totals.revenue / days,
        cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
        roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
        conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
      };
    };

    // Calculate MTD metrics
    const mtdData = campaignData.filter(row => {
      const date = new Date(row.CampaignDate);
      return isWithinInterval(date, {
        start: startOfDay(firstDayOfMonth),
        end: endOfDay(today)
      });
    });

    const mtdTotals = mtdData.reduce((acc, row) => ({
      spend: acc.spend + (row.AmountSpent || 0),
      conversions: acc.conversions + (row.FulfillmentOrders || 0),
      revenue: acc.revenue + (row.FulfillmentRevenue || 0),
      clicks: acc.clicks + (row.Clicks || 0),
      impressions: acc.impressions + (row.Impressions || 0)
    }), {
      spend: 0,
      conversions: 0,
      revenue: 0,
      clicks: 0,
      impressions: 0
    });

    const daysInMonth = today.getDate();
    const mtdMetrics = {
      spend: mtdTotals.spend / daysInMonth,
      conversions: mtdTotals.conversions / daysInMonth,
      revenue: mtdTotals.revenue / daysInMonth,
      cpa: mtdTotals.conversions > 0 ? mtdTotals.spend / mtdTotals.conversions : 0,
      roas: mtdTotals.spend > 0 ? mtdTotals.revenue / mtdTotals.spend : 0,
      conversionRate: mtdTotals.clicks > 0 ? (mtdTotals.conversions / mtdTotals.clicks) * 100 : 0
    };

    return {
      threeDay: calculateMetricsForDays(3),
      sevenDay: calculateMetricsForDays(7),
      fourteenDay: calculateMetricsForDays(14),
      thirtyDay: calculateMetricsForDays(30),
      mtd: mtdMetrics
    };
  }, [campaignData]);

  // Calculate performance targets
  const performanceMetrics = useMemo(() => {
    const targetCPA = metrics.TCPA;
    const currentCPA = derivedMetrics.cpa;
    const cpaPerformance = targetCPA > 0 ? (currentCPA / targetCPA) * 100 : 0;

    const targetBudget = metrics.MonthlyBudget;
    const currentSpend = summary.totalSpend;
    const budgetPerformance = targetBudget > 0 ? (currentSpend / targetBudget) * 100 : 0;

    // Assuming target ROAS of 1 (break-even)
    const currentROAS = derivedMetrics.roas;
    const roasPerformance = currentROAS * 100;

    return {
      cpa: {
        current: currentCPA,
        target: targetCPA,
        performance: cpaPerformance,
        status: currentCPA <= targetCPA ? 'good' : 'bad'
      },
      budget: {
        current: currentSpend,
        target: targetBudget,
        performance: budgetPerformance,
        status: budgetPerformance >= 90 && budgetPerformance <= 110 ? 'good' : 'warning'
      },
      roas: {
        current: currentROAS,
        target: 1,
        performance: roasPerformance,
        status: currentROAS >= 1 ? 'good' : 'bad'
      }
    };
  }, [metrics, derivedMetrics, summary]);

  // Calculate anomalies and alerts
  const alerts = useMemo(() => {
    const results: Alert[] = [];

    // CPA Anomalies
    const cpaChange = ((rollingAverages.sevenDay.cpa - rollingAverages.thirtyDay.cpa) / rollingAverages.thirtyDay.cpa) * 100;
    if (Math.abs(cpaChange) > 20) {
      results.push({
        severity: 'high',
        metric: 'CPA',
        change: cpaChange,
        message: `CPA has ${cpaChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(cpaChange).toFixed(1)}% in the last 7 days`
      });
    }

    // Conversion Rate Anomalies
    const convRateChange = ((rollingAverages.sevenDay.conversionRate - rollingAverages.thirtyDay.conversionRate) / rollingAverages.thirtyDay.conversionRate) * 100;
    if (Math.abs(convRateChange) > 15) {
      results.push({
        severity: 'medium',
        metric: 'Conversion Rate',
        change: convRateChange,
        message: `Conversion rate has ${convRateChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(convRateChange).toFixed(1)}% in the last 7 days`
      });
    }

    // Budget Pacing
    const expectedPacing = (new Date().getDate() / getDaysInCurrentMonth()) * 100;
    const actualPacing = (summary.totalSpend / metrics.MonthlyBudget) * 100;
    const pacingDiff = actualPacing - expectedPacing;

    if (Math.abs(pacingDiff) > 15) {
      results.push({
        severity: Math.abs(pacingDiff) > 25 ? 'high' : 'medium',
        metric: 'Budget Pacing',
        change: pacingDiff,
        message: `Campaign is ${pacingDiff > 0 ? 'overspending' : 'underspending'} by ${Math.abs(pacingDiff).toFixed(1)}% relative to monthly target`
      });
    }

    return results;
  }, [rollingAverages, metrics, summary]);

  // Campaign performance calculations
  const campaignPerformance = useMemo(() => {
    const campaigns = new Map<string, CampaignPerformance>();

    filteredData.forEach(row => {
      if (!row.CampaignName) return;

      const existing = campaigns.get(row.CampaignName) || {
        name: row.CampaignName,
        spend: 0,
        conversions: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        cpa: 0,
        roas: 0,
        ctr: 0,
        status: 'performing',
        BudgetPacing: 0
      };

      existing.spend += row.AmountSpent || 0;
      existing.conversions += row.FulfillmentOrders || 0;
      existing.revenue += row.FulfillmentRevenue || 0;
      existing.impressions += row.Impressions || 0;
      existing.clicks += row.Clicks || 0;
      existing.BudgetPacing = (existing.spend / metrics.MonthlyBudget) * 100;

      campaigns.set(row.CampaignName, existing);
    });

    // Calculate derived metrics and determine status for each campaign
    return Array.from(campaigns.values())
      .map(campaign => {
        const cpa = campaign.conversions > 0 ? campaign.spend / campaign.conversions : 0;
        const roas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0;
        const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;

        // Determine campaign status based on TCPA and ROAS targets
        let status: 'performing' | 'at-risk' | 'underperforming';
        if (cpa <= metrics.TCPA && roas >= 1) {
          status = 'performing';
        } else if (cpa <= metrics.TCPA * 1.2 || roas >= 0.8) {
          status = 'at-risk';
        } else {
          status = 'underperforming';
        }

        return {
          ...campaign,
          cpa,
          roas,
          ctr,
          status
        };
      })
      .sort((a, b) => b.spend - a.spend);
  }, [filteredData, metrics.TCPA, metrics.MonthlyBudget]);



  // Handle timeframe changes
  const handleTimeframeChange = async (days: number) => {
    setIsLoading(true);
    setError(null);
    try {
      setSelectedTimeframe(days);
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      // Create snapshot with properly structured data
      const newSnapshot: MetricsSnapshot = {
        timestamp: new Date().toISOString(),
        metrics: {
          spend: summary.totalSpend,
          conversions: summary.totalConversions,
          revenue: summary.totalRevenue,
          cpa: derivedMetrics.cpa,
          roas: derivedMetrics.roas
        }
      };

      setSnapshots(prev => [...prev.slice(-9), newSnapshot]);

      if (onTimeframeChange) {
        await onTimeframeChange(startDate, endDate);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating timeframe');
      console.error('Error changing timeframe:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Export data
  const handleExport = () => {
    try {
      const exportData = {
        overview: {
          summary,
          derivedMetrics,
          timeframe: selectedTimeframe,
          dateRange: {
            start: format(subDays(new Date(), selectedTimeframe), 'yyyy-MM-dd'),
            end: format(new Date(), 'yyyy-MM-dd')
          }
        },
        campaigns: campaignPerformance,
        dailyTrends,
        snapshots
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrics-export-${metrics.GoodsName}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error exporting data');
      console.error('Error exporting data:', err);
    }
  };

  // Get performance indicators
  const getPerformanceIndicators = useMemo(() => {
    const performing = campaignPerformance.filter(c => c.status === 'performing').length;
    const atRisk = campaignPerformance.filter(c => c.status === 'at-risk').length;
    const underperforming = campaignPerformance.filter(c => c.status === 'underperforming').length;

    return {
      performing,
      atRisk,
      underperforming,
      totalCampaigns: campaignPerformance.length
    };
  }, [campaignPerformance]);

  // Render component
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>{metrics.BrandName} - {metrics.GoodsName}</span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {TIMEFRAME_OPTIONS.map(option => (
                <Button
                  key={option.days}
                  variant={selectedTimeframe === option.days ? "default" : "outline"}
                  onClick={() => handleTimeframeChange(option.days)}
                  size="sm"
                  disabled={isLoading}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTimeframeChange(selectedTimeframe)}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isLoading}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="optimizations" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Team Optimizations
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Summary Cards */}
               <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">Total Spend</p>
                    <DollarSign className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-lg font-semibold">{formatCurrency(summary.totalSpend)}</p>
                  <p className="text-sm text-gray-500">
                    Avg. Daily: {formatCurrency(derivedMetrics.averageDailySpend)}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">Conversions</p>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-lg font-semibold">{formatNumber(summary.totalConversions)}</p>
                  <p className="text-sm text-gray-500">
                    Conv. Rate: {formatPercentage(derivedMetrics.conversionRate / 100)}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">CPA</p>
                    <span className={getCPAClassName(derivedMetrics.cpa, metrics.TCPA)}>
                      {derivedMetrics.cpa <= metrics.TCPA ?
                        <ArrowDown className="w-4 h-4" /> :
                        <ArrowUp className="w-4 h-4" />
                      }
                    </span>
                  </div>
                  <p className={`text-lg font-semibold ${getCPAClassName(derivedMetrics.cpa, metrics.TCPA)}`}>
                    {formatCurrency(derivedMetrics.cpa)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Target: {formatCurrency(metrics.TCPA)}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">ROAS</p>
                    <span className={getROASClassName(derivedMetrics.roas)}>
                      {derivedMetrics.roas >= 1 ?
                        <ArrowUp className="w-4 h-4" /> :
                        <ArrowDown className="w-4 h-4" />
                      }
                    </span>
                  </div>
                  <p className={`text-lg font-semibold ${getROASClassName(derivedMetrics.roas)}`}>
                    {formatPercentage(derivedMetrics.roas)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Revenue: {formatCurrency(summary.totalRevenue)}
                  </p>
                </div>
              </div>

               {/* Rolling Performance Summary */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Rolling Performance Summary</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-4 p-4">
                    {/* 3-Day Average */}
                    <div className="p-4 rounded-lg bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-500">3-Day Average</h4>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xl font-semibold">{formatCurrency(rollingAverages.threeDay.cpa)}</p>
                          <p className="text-sm text-gray-500">CPA</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatPercentage(rollingAverages.threeDay.roas)}</p>
                          <p className="text-sm text-gray-500">ROAS</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatCurrency(rollingAverages.threeDay.spend)}</p>
                          <p className="text-sm text-gray-500">Daily Spend</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatNumber(rollingAverages.threeDay.conversions)}</p>
                          <p className="text-sm text-gray-500">Daily Conv.</p>
                        </div>
                      </div>
                    </div>

                    {/* 7-Day Average */}
                    <div className="p-4 rounded-lg bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-500">7-Day Average</h4>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xl font-semibold">{formatCurrency(rollingAverages.sevenDay.cpa)}</p>
                          <p className="text-sm text-gray-500">CPA</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatPercentage(rollingAverages.sevenDay.roas)}</p>
                          <p className="text-sm text-gray-500">ROAS</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatCurrency(rollingAverages.sevenDay.spend)}</p>
                          <p className="text-sm text-gray-500">Daily Spend</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatNumber(rollingAverages.sevenDay.conversions)}</p>
                          <p className="text-sm text-gray-500">Daily Conv.</p>
                        </div>
                      </div>
                    </div>

                    {/* 14-Day Average */}
                    <div className="p-4 rounded-lg bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-500">14-Day Average</h4>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xl font-semibold">{formatCurrency(rollingAverages.fourteenDay.cpa)}</p>
                          <p className="text-sm text-gray-500">CPA</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatPercentage(rollingAverages.fourteenDay.roas)}</p>
                          <p className="text-sm text-gray-500">ROAS</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatCurrency(rollingAverages.fourteenDay.spend)}</p>
                          <p className="text-sm text-gray-500">Daily Spend</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatNumber(rollingAverages.fourteenDay.conversions)}</p>
                          <p className="text-sm text-gray-500">Daily Conv.</p>
                        </div>
                      </div>
                    </div>

                    {/* 30-Day Average */}
                    <div className="p-4 rounded-lg bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-500">30-Day Average</h4>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xl font-semibold">{formatCurrency(rollingAverages.thirtyDay.cpa)}</p>
                          <p className="text-sm text-gray-500">CPA</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatPercentage(rollingAverages.thirtyDay.roas)}</p>
                          <p className="text-sm text-gray-500">ROAS</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatCurrency(rollingAverages.thirtyDay.spend)}</p>
                          <p className="text-sm text-gray-500">Daily Spend</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatNumber(rollingAverages.thirtyDay.conversions)}</p>
                          <p className="text-sm text-gray-500">Daily Conv.</p>
                        </div>
                      </div>
                    </div>

                    {/* MTD Average */}
                    <div className="p-4 rounded-lg bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-500">MTD Average</h4>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xl font-semibold">{formatCurrency(rollingAverages.mtd.cpa)}</p>
                          <p className="text-sm text-gray-500">CPA</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatPercentage(rollingAverages.mtd.roas)}</p>
                          <p className="text-sm text-gray-500">ROAS</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatCurrency(rollingAverages.mtd.spend)}</p>
                          <p className="text-sm text-gray-500">Daily Spend</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatNumber(rollingAverages.mtd.conversions)}</p>
                          <p className="text-sm text-gray-500">Daily Conv.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/* Performance Benchmarks */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Performance vs Targets</h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* CPA Performance */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">CPA Performance</span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(performanceMetrics.cpa.current)} vs {formatCurrency(performanceMetrics.cpa.target)} target
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${performanceMetrics.cpa.status === 'good' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, (performanceMetrics.cpa.target / performanceMetrics.cpa.current) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Budget Pacing */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Budget Pacing</span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(performanceMetrics.budget.current)} vs {formatCurrency(performanceMetrics.budget.target)} target
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          performanceMetrics.budget.status === 'good' ? 'bg-green-500' :
                          performanceMetrics.budget.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, performanceMetrics.budget.performance)}%` }}
                      />
                    </div>
                  </div>
                  {/* ROAS Performance */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">ROAS Performance</span>
                      <span className="text-sm text-gray-500">
                        {formatPercentage(performanceMetrics.roas.current)} vs {formatPercentage(performanceMetrics.roas.target)} target
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${performanceMetrics.roas.status === 'good' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, performanceMetrics.roas.performance)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Anomaly Detection */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Performance Alerts</h3>
                </div>
                <div className="p-4">
                  {alerts.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg flex items-start ${
                            alert.severity === 'high' ? 'bg-red-50 text-red-700' :
                            alert.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-blue-50 text-blue-700'
                          }`}
                        >
                          <div className="flex-shrink-0 mr-2">
                            {alert.severity === 'high' ? (
                              <AlertCircle className="w-5 h-5" />
                            ) : (
                              <AlertTriangle className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{alert.message}</p>
                            <div className="flex items-center mt-1">
                              {alert.change > 0 ? (
                                <TrendingUp className="w-4 h-4 mr-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 mr-1" />
                              )}
                              <span className="text-sm">
                                {Math.abs(alert.change).toFixed(1)}% change
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No significant performance changes detected
                    </div>
                  )}
                </div>
              </div>





              {/* Existing content... */}




              {/* Add this to the grid of metric cards in the Overview tab */}
              <div className="p-4 bg-white rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-gray-500">Budget Pacing</p>
                  <span className={getPacingClassName(metrics.BudgetPacing)}>
                    {metrics.BudgetPacing < 90 ?
                      <ArrowDown className="w-4 h-4" /> :
                      metrics.BudgetPacing > 110 ?
                        <ArrowUp className="w-4 h-4" /> :
                        <CheckCircle className="w-4 h-4" />
                    }
                  </span>
                </div>
                <p className={`text-lg font-semibold ${getPacingClassName(metrics.BudgetPacing)}`}>
                  {formatPercentage(metrics.BudgetPacing / 100)}
                </p>
                <p className="text-sm text-gray-500">
                  Spend: {formatCurrency(metrics.AmountSpent)} / {formatCurrency(metrics.MonthlyBudget)}
                </p>
              </div>

              {/* Campaign Status Overview */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Campaign Performance Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-green-700">Performing</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {getPerformanceIndicators.performing}
                    </p>
                    <p className="text-sm text-green-600">
                      {formatPercentage(getPerformanceIndicators.performing / getPerformanceIndicators.totalCampaigns)} of campaigns
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-yellow-700">At Risk</span>
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">
                      {getPerformanceIndicators.atRisk}
                    </p>
                    <p className="text-sm text-yellow-600">
                      {formatPercentage(getPerformanceIndicators.atRisk / getPerformanceIndicators.totalCampaigns)} of campaigns
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-red-700">Underperforming</span>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      {getPerformanceIndicators.underperforming}
                    </p>
                    <p className="text-sm text-red-600">
                      {formatPercentage(getPerformanceIndicators.underperforming / getPerformanceIndicators.totalCampaigns)} of campaigns
                    </p>
                  </div>
                </div>
              </div>

              {/* Historical Snapshots */}
              {snapshots.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Metric History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Spend
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Conversions
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Revenue
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            CPA
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            ROAS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {snapshots.map((snapshot) => {
                          if (!snapshot || !snapshot.timestamp || !snapshot.metrics) {
                            return null; // Skip invalid snapshots
                          }

                          try {
                            const snapshotDate = new Date(snapshot.timestamp);
                            if (isNaN(snapshotDate.getTime())) {
                              console.error('Invalid timestamp:', snapshot.timestamp);
                              return null;
                            }

                            return (
                              <tr key={snapshot.timestamp}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {format(snapshotDate, 'MMM d, yyyy HH:mm')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {formatCurrency(snapshot.metrics.spend)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {formatNumber(snapshot.metrics.conversions)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {formatCurrency(snapshot.metrics.revenue)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getCPAClassName(snapshot.metrics.cpa, metrics.TCPA)}`}>
                                  {formatCurrency(snapshot.metrics.cpa)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getROASClassName(snapshot.metrics.roas)}`}>
                                  {formatPercentage(snapshot.metrics.roas)}
                                </td>
                              </tr>
                            );
                          } catch (error) {
                            console.error('Error rendering snapshot:', error);
                            return null;
                          }
                        }).filter(Boolean)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

		{/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Campaign Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spend
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conv.
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CPA
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ROAS
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CTR
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pacing
                      </th>
                      <th scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {campaignPerformance.map((campaign) => (
                        <tr key={campaign.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {campaign.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(campaign.spend)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatNumber(campaign.conversions)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={getCPAClassName(campaign.cpa, metrics.TCPA)}>
                              {formatCurrency(campaign.cpa)}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(campaign.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={getROASClassName(campaign.roas)}>
                              {formatPercentage(campaign.roas)}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatPercentage(campaign.ctr / 100)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={getPacingClassName(campaign.BudgetPacing)}>
                              {formatPercentage(campaign.BudgetPacing / 100)}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${campaign.status === 'performing' ? 'bg-green-100 text-green-800' :
                                campaign.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'}`}>
                              {campaign.status === 'performing' ? 'Performing' :
                                  campaign.status === 'at-risk' ? 'At Risk' :
                                      'Underperforming'}
                            </span>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Campaign Performance Chart */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Campaign Performance Distribution</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'spend' ? formatCurrency(value) :
                          name === 'cpa' ? formatCurrency(value) :
                          name === 'roas' ? formatPercentage(value) :
                          formatNumber(value),
                          name.toUpperCase()
                        ]}
                      />
                      <Bar dataKey="spend" fill="#3B82F6" name="Spend" />
                      <Bar dataKey="conversions" fill="#10B981" name="Conversions" />
                      <Bar dataKey="cpa" fill="#8B5CF6" name="CPA" />
                      <Bar dataKey="roas" fill="#F59E0B" name="ROAS" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <TrendsContent dailyTrends={dailyTrends} metrics={metrics} />
          </TabsContent>


          {/* Analysis Tab */}
          <TabsContent value="analysis">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Overall Performance</h4>
                  <p className="text-blue-800">
                    {derivedMetrics.cpa <= metrics.TCPA ?
                        "Currently performing within target CPA." :
                        "Currently exceeding target CPA."}
                    {" "}ROAS
                    is {derivedMetrics.roas >= 1 ? "positive" : "below target"} at {formatPercentage(derivedMetrics.roas)}.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Campaign Distribution</h4>
                  <p className="text-gray-800">
                    {getPerformanceIndicators.performing} campaigns performing well,
                    {" "}{getPerformanceIndicators.atRisk} at risk, and
                    {" "}{getPerformanceIndicators.underperforming} underperforming.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Top Performing Campaigns</h4>
                  <ul className="list-disc list-inside text-green-800 space-y-1">
                    {campaignPerformance
                        .filter(c => c.status === 'performing')
                        .slice(0, 3)
                        .map(c => (
                            <li key={c.name}>
                              {c.name} - CPA: {formatCurrency(c.cpa)}, ROAS: {formatPercentage(c.roas)}
                            </li>
                        ))}
                  </ul>
                </div>


                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Campaigns At Risk</h4>
                  <ul className="list-disc list-inside text-yellow-800 space-y-1">
                    {campaignPerformance
                        .filter(c => c.status === 'at-risk')
                        .slice(0, 3)
                        .map(c => (
                            <li key={c.name}>
                              {c.name} - CPA: {formatCurrency(c.cpa)}, ROAS: {formatPercentage(c.roas)}
                            </li>
                        ))}
                  </ul>
                </div>

                {/* Period Comparison Section */}
                 {periodComparisons && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">
                    Period-over-Period Changes (Current vs Previous {selectedTimeframe / 2} Days)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-purple-700">Spend</p>
                      <div className="flex items-center gap-1">
                        {periodComparisons.spend >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <p className={`text-lg font-semibold ${
                          periodComparisons.spend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(Math.abs(periodComparisons.spend) / 100)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-purple-700">Conversions</p>
                      <div className="flex items-center gap-1">
                        {periodComparisons.conversions >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <p className={`text-lg font-semibold ${
                          periodComparisons.conversions >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(Math.abs(periodComparisons.conversions) / 100)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-purple-700">Revenue</p>
                      <div className="flex items-center gap-1">
                        {periodComparisons.revenue >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <p className={`text-lg font-semibold ${
                          periodComparisons.revenue >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(Math.abs(periodComparisons.revenue) / 100)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-purple-700">CPA</p>
                      <div className="flex items-center gap-1">
                        {periodComparisons.cpa <= 0 ? (
                          <TrendingDown className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        )}
                        <p className={`text-lg font-semibold ${
                          periodComparisons.cpa <= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(Math.abs(periodComparisons.cpa) / 100)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-purple-700">ROAS</p>
                      <div className="flex items-center gap-1">
                        {periodComparisons.roas >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <p className={`text-lg font-semibold ${
                          periodComparisons.roas >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(Math.abs(periodComparisons.roas) / 100)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              </div>
            </div>
          </TabsContent>
           {/* Add new Team Optimizations tab content */}
          <TabsContent value="optimizations">
            <div className="space-y-6">
              <TeamOptimizations
                brandName="GDT"
                selectedPlatform={metrics.platform}
                dateRange={{
                  startDate: new Date(new Date().setDate(new Date().getDate() - selectedTimeframe)),
                  endDate: new Date()
                }}
              />
            </div>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DetailedMetricsAnalysis;
