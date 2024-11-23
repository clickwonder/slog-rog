import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PaidMediaData } from '../types';
import { getWeekNumber, getMonthKey, formatTimeframe } from '../utils/dateUtils';

interface SpendingChartProps {
  data: PaidMediaData[];
  timeframe: 'day' | 'week' | 'month';
}

const SpendingChart: React.FC<SpendingChartProps> = ({ data, timeframe }) => {
  const chartData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; spend: number }>();

    // Filter out entries with invalid dates first
    const validData = data.filter(row => {
      if (!row.CampaignDate) return false;
      const date = new Date(row.CampaignDate);
      return !isNaN(date.getTime());
    });

    validData.forEach(row => {
      if (!row.CampaignDate) return; // Skip if no date

      const date = new Date(row.CampaignDate);
      let key: string;

      switch (timeframe) {
        case 'week':
          key = getWeekNumber(date);
          break;
        case 'month':
          key = getMonthKey(date);
          break;
        default:
          key = row.CampaignDate;
      }

      const existing = dailyMap.get(key) || { date: key, spend: 0 };
      existing.spend += row.AmountSpent || 0;
      dailyMap.set(key, existing);
    });

    // Convert to array and sort
    return Array.from(dailyMap.values())
      .sort((a, b) => {
        // Ensure both values exist before comparing
        if (!a.date || !b.date) return 0;
        return a.date.localeCompare(b.date);
      });
  }, [data, timeframe]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => {
            if (!value) return '';
            try {
              return formatTimeframe(value, timeframe);
            } catch (error) {
              console.error('Error formatting date:', error);
              return value;
            }
          }}
        />
        <YAxis />
        <Tooltip
          formatter={(value: number) => `$${value.toFixed(2)}`}
          labelFormatter={(label: string) => {
            if (!label) return '';
            try {
              return formatTimeframe(label, timeframe);
            } catch (error) {
              console.error('Error formatting tooltip label:', error);
              return label;
            }
          }}
        />
        <Line
          type="monotone"
          dataKey="spend"
          stroke="#3B82F6"
          name="Spend"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SpendingChart;