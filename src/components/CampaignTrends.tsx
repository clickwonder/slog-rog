import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PaidMediaData } from '../types';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface CampaignTrendsProps {
  data: PaidMediaData[];
  campaignName: string;
  timeframe: 'day' | 'week' | 'month';
}

const CampaignTrends: React.FC<CampaignTrendsProps> = ({ data, campaignName, timeframe }) => {
  const trendData = useMemo(() => {
    // Filter for selected campaign
    const campaignData = data.filter(row => row.CampaignName === campaignName);

    // Group by timeframe
    const timeMap = new Map<string, {
      date: string;
      spend: number;
      conversions: number;
      cpa: number;
      roas: number;
    }>();

    campaignData.forEach(row => {
      if (!row.CampaignDate) return;

      const date = new Date(row.CampaignDate);
      let key: string;

      switch (timeframe) {
        case 'week':
          const weekStart = startOfWeek(date);
          key = format(weekStart, 'yyyy-MM-dd');
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }

      const existing = timeMap.get(key) || {
        date: key,
        spend: 0,
        conversions: 0,
        cpa: 0,
        roas: 0
      };

      existing.spend += row.AmountSpent || 0;
      existing.conversions += row.FulfillmentOrders || 0;

      timeMap.set(key, existing);
    });

    // Calculate metrics and sort by date
    return Array.from(timeMap.values())
      .map(period => ({
        ...period,
        cpa: period.conversions > 0 ? period.spend / period.conversions : 0,
        roas: period.spend > 0 ? (period.conversions * 100) / period.spend : 0 // Assuming $100 per conversion
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, campaignName, timeframe]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Performance Trends for {campaignName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  switch (timeframe) {
                    case 'week':
                      return `Week ${format(new Date(value), 'w')}`;
                    case 'month':
                      return format(new Date(value), 'MMM yyyy');
                    default:
                      return format(new Date(value), 'MM/dd');
                  }
                }}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'spend' ? `$${value.toFixed(2)}` :
                  name === 'roas' ? `${value.toFixed(2)}x` :
                  name === 'cpa' ? `$${value.toFixed(2)}` :
                  value.toFixed(0),
                  name.toUpperCase()
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spend"
                stroke="#3B82F6"
                name="Spend"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="conversions"
                stroke="#10B981"
                name="Conversions"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cpa"
                stroke="#8B5CF6"
                name="CPA"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="roas"
                stroke="#F59E0B"
                name="ROAS"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignTrends;