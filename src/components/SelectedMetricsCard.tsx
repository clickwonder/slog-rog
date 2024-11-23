import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { CampaignMetrics } from '../types';
import { formatCurrency, formatPercentage, getCPAClassName, getPacingClassName } from '../utils';

interface SelectedMetricsProps {
  metrics: CampaignMetrics;

}



const SelectedMetricsCard: React.FC<SelectedMetricsProps> = ({ metrics }) => {
  const remainingBudget = metrics.MonthlyBudget - metrics.AmountSpent;
  const spendPercentage = (metrics.AmountSpent / metrics.MonthlyBudget) * 100;
  const daysRemaining = getDaysRemainingInMonth(); // Helper function (see below)
  const dailySpendToExhaust = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{metrics.BrandName} - {metrics.GoodsName}</span>
          <span className={getPacingClassName(metrics.BudgetPacing)}>
            {formatPercentage(metrics.BudgetPacing / 100)} Pacing
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Monthly Budget</p>
            <p className="text-lg font-semibold">{formatCurrency(metrics.MonthlyBudget)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Spent</p>
            <p className="text-lg font-semibold">{formatCurrency(metrics.AmountSpent)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-lg font-semibold">{formatCurrency(remainingBudget)}</p>
          </div>
           <div>
            <p className="text-sm text-gray-500">Daily Spend to Exhaust</p>
            <p className="text-lg font-semibold">{formatCurrency(dailySpendToExhaust)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Target CPA</p>
            <p className="text-lg font-semibold">{formatCurrency(metrics.TCPA)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current CPA</p>
            <p className={`text-lg font-semibold ${getCPAClassName(metrics.MTD_CPA, metrics.TCPA)}`}>
              {formatCurrency(metrics.MTD_CPA)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Budget Used</p>
            <p className="text-lg font-semibold">{formatPercentage(spendPercentage / 100)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const getDaysRemainingInMonth = () => {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDayOfMonth.getDate() - today.getDate();
}

export default SelectedMetricsCard;