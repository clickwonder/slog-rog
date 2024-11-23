import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PaidMediaData } from '../types';

interface PublisherBreakdownProps {
  data: PaidMediaData[];
}

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#6366F1'];

const PublisherBreakdown: React.FC<PublisherBreakdownProps> = ({ data }) => {
  const publisherData = data.reduce((acc, row) => {
    const publisher = row.Publisher;
    const existing = acc.find(item => item.name === publisher);
    
    if (existing) {
      existing.value += row.AmountSpent || 0;
    } else {
      acc.push({
        name: publisher,
        value: row.AmountSpent || 0
      });
    }
    
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={publisherData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={150}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {publisherData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PublisherBreakdown;