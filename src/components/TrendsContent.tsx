import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Target, DollarSign, MousePointer, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '../utils';
import { CampaignMetrics } from '../types';

// Unified DailyMetrics interface to be used across components
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

interface TrendsContentProps {
  dailyTrends: DailyMetrics[];
  metrics: CampaignMetrics;
}

interface CustomTooltipProps extends TooltipProps<any, any> {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border rounded shadow-lg">
      <p className="font-medium text-gray-900">
        {label ? format(new Date(label), 'MMM d, yyyy') : ''}
      </p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }} className="text-sm">
          <span className="font-medium">{entry.name}: </span>
          {entry.name.toLowerCase().includes('cpa') || entry.name.toLowerCase().includes('spend')
            ? formatCurrency(entry.value)
            : entry.name.toLowerCase().includes('rate') || entry.name.toLowerCase().includes('roas')
            ? formatPercentage(entry.value / 100)
            : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

const TrendsContent: React.FC<TrendsContentProps> = ({ dailyTrends, metrics }) => {
  const [timeframe, setTimeframe] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [chartType, setChartType] = useState<'separate' | 'combined'>('separate');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {(['all', '7d', '30d', '90d'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              onClick={() => setTimeframe(period)}
              size="sm"
              title={`Show data for ${period === 'all' ? 'all time' : `last ${period}`}`}
            >
              {period === 'all' ? 'All Time' :
               period === '7d' ? '7 Days' :
               period === '30d' ? '30 Days' :
               '90 Days'}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['separate', 'combined'] as const).map((type) => (
            <Button
              key={type}
              variant={chartType === type ? 'default' : 'outline'}
              onClick={() => setChartType(type)}
              size="sm"
            >
              {type === 'separate' ? 'Separate Charts' : 'Combined View'}
            </Button>
          ))}
        </div>
      </div>

      {chartType === 'separate' ? (
        <div className="grid grid-cols-2 gap-6">
          {/* Spend & Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                Spend & Revenue Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      name="Daily Spend"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Daily Revenue"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CPA & ROAS Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                CPA & ROAS Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="cpa"
                      name="CPA"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="roas"
                      name="ROAS"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-500" />
                Conversion Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="conversions"
                      name="Conversions"
                      fill="#10B981"
                      opacity={0.8}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="conversionRate"
                      name="Conversion Rate"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="w-5 h-5 text-indigo-500" />
                Engagement Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      fill="#93C5FD"
                      stroke="#3B82F6"
                      fillOpacity={0.3}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="ctr"
                      name="CTR"
                      stroke="#EC4899"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Combined View
        <Card>
          <CardHeader>
            <CardTitle>Comprehensive Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis yAxisId="spend" />
                  <YAxis yAxisId="rate" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="spend"
                    type="monotone"
                    dataKey="spend"
                    name="Spend"
                    fill="#93C5FD"
                    stroke="#3B82F6"
                    fillOpacity={0.3}
                  />
                  <Line
                    yAxisId="spend"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="roas"
                    name="ROAS"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="ctr"
                    name="CTR"
                    stroke="#EC4899"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Bar
                    yAxisId="spend"
                    dataKey="conversions"
                    name="Conversions"
                    fill="#8B5CF6"
                    opacity={0.8}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrendsContent;