import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PaidMediaData } from '../types';

interface CampaignComparisonProps {
  data: PaidMediaData[];
  goodsName: string;
}

const CampaignComparison: React.FC<CampaignComparisonProps> = ({ data, goodsName }) => {
  const comparisonData = useMemo(() => {
    // Filter for selected goods
    const goodsCampaigns = data.filter(row => row.GoodsName === goodsName);

    // Group by campaign
    const campaignMap = new Map<string, {
      name: string;
      spend: number;
      conversions: number;
      revenue: number;
      cpa: number;
      roas: number;
    }>();

    goodsCampaigns.forEach(row => {
      if (!row.CampaignName) return;

      const existing = campaignMap.get(row.CampaignName) || {
        name: row.CampaignName,
        spend: 0,
        conversions: 0,
        revenue: 0,
        cpa: 0,
        roas: 0
      };

      existing.spend += row.AmountSpent || 0;
      existing.conversions += row.FulfillmentOrders || 0;
      existing.revenue += row.FulfillmentRevenue || 0;

      campaignMap.set(row.CampaignName, existing);
    });

    // Calculate metrics and sort by spend
    return Array.from(campaignMap.values())
      .map(campaign => ({
        ...campaign,
        cpa: campaign.conversions > 0 ? campaign.spend / campaign.conversions : 0,
        roas: campaign.spend > 0 ? campaign.revenue / campaign.spend : 0
      }))
      .sort((a, b) => b.spend - a.spend);
  }, [data, goodsName]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Campaign Comparison for {goodsName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
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
              <Bar dataKey="spend" fill="#3B82F6" name="Spend" />
              <Bar dataKey="conversions" fill="#10B981" name="Conversions" />
              <Bar dataKey="cpa" fill="#8B5CF6" name="CPA" />
              <Bar dataKey="roas" fill="#F59E0B" name="ROAS" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignComparison;