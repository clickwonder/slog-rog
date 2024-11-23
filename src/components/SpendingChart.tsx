import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PaidMediaData } from '../types';
import { getWeekNumber, getMonthKey, formatTimeframe } from '../utils/dateUtils';

interface SpendingChartProps {
  data: PaidMediaData[];
  timeframe: 'day' | 'week' | 'month';
}

const SpendingChart: React.FC<SpendingChartProps> = ({ data, timeframe }) => {
  const chartData = data.reduce((acc, row) => {
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

    const existing = acc.find(item => item.date === key);
    
    if (existing) {
      existing.spend += row.AmountSpent || 0;
    } else {
      acc.push({ date: key, spend: row.AmountSpent || 0 });
    }
    
    return acc;
  }, [] as { date: string; spend: number }[])
  .sort((a, b) => a.date.localeCompare(b.date));

  const formattedData = chartData.map(item => ({
    ...item,
    formattedDate: formatTimeframe(item.date, timeframe)
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="formattedDate" />
        <YAxis />
        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
        <Line type="monotone" dataKey="spend" stroke="#3B82F6" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SpendingChart;