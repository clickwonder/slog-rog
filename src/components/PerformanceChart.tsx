import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PaidMediaData } from '../types';

interface PerformanceChartProps {
  data: PaidMediaData[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const chartData = data.reduce((acc, row) => {
    const platform = row.publishersPlatform;
    const existing = acc.find(item => item.platform === platform);
    
    if (existing) {
      existing.clicks += row.Clicks || 0;
      existing.leads += row.Leads || 0;
      existing.orders += row.FulfillmentOrders || 0;
    } else {
      acc.push({
        platform,
        clicks: row.Clicks || 0,
        leads: row.Leads || 0,
        orders: row.FulfillmentOrders || 0
      });
    }
    
    return acc;
  }, [] as { platform: string; clicks: number; leads: number; orders: number }[]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="platform" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="clicks" fill="#3B82F6" name="Clicks" />
        <Bar dataKey="leads" fill="#8B5CF6" name="Leads" />
        <Bar dataKey="orders" fill="#F59E0B" name="Orders" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;