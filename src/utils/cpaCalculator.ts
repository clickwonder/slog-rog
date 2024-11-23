import { PaidMediaData, TCPAData, CampaignMetrics } from '../types';

const calculateCPA = (spentAmount: number, orders: number): number => {
  return orders > 0 ? spentAmount / orders : 0;
};

const getDaysAgo = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - days);
  return result;
};

const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getDaysInCurrentMonth = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

const getCurrentDayOfMonth = (): number => {
  return new Date().getDate();
};

const calculateDailyPacing = (spentAmount: number, monthlyBudget: number): number => {
  const daysInMonth = getDaysInCurrentMonth();
  const currentDay = getCurrentDayOfMonth();
  const expectedSpend = (monthlyBudget / daysInMonth) * currentDay;
  return expectedSpend > 0 ? (spentAmount / expectedSpend) * 100 : 0;
};

const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    const [day, month, year] = dateString.split(/[/-]/);
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return date;
};

interface PeriodMetrics {
  cpa: number;
  conversions: number;
}

const calculateMetricsForGroup = (
  groupData: PaidMediaData[],
  tcpaInfo: TCPAData | undefined,
  brandName: string,
  goodsName: string,
  campaignName: string
): CampaignMetrics => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const threeDaysAgo = getDaysAgo(today, 3);
  const sevenDaysAgo = getDaysAgo(today, 7);
  const fourteenDaysAgo = getDaysAgo(today, 14);
  const thirtyDaysAgo = getDaysAgo(today, 30);
  const monthStart = getMonthStart(today);

  const calculateMetricsForPeriod = (startDate: Date): PeriodMetrics => {
    const periodData = groupData.filter(row => {
      const rowDate = new Date(row.CampaignDate);
      return rowDate >= startDate && rowDate <= today;
    });

    const spent = periodData.reduce((sum, row) => sum + (row.AmountSpent || 0), 0);
    const orders = periodData.reduce((sum, row) => sum + (row.FulfillmentOrders || 0), 0);

    return {
      cpa: calculateCPA(spent, orders),
      conversions: orders
    };
  };

  const mtdData = groupData.filter(row => {
    const rowDate = new Date(row.CampaignDate);
    return rowDate >= monthStart && rowDate <= today;
  });

  const monthlyBudget = tcpaInfo?.MonthlyBudget || 0;
  const totalSpentMTD = mtdData.reduce((sum, row) => sum + (row.AmountSpent || 0), 0);

  const daysInMonth = getDaysInCurrentMonth();
  const dayOfMonth = getCurrentDayOfMonth();
  const expectedSpend = (monthlyBudget / daysInMonth) * dayOfMonth;
  const budgetPacing = expectedSpend > 0 ? (totalSpentMTD / expectedSpend) * 100 : 0;
  const remainingBudget = monthlyBudget - totalSpentMTD;

  const threeDayMetrics = calculateMetricsForPeriod(threeDaysAgo);
  const sevenDayMetrics = calculateMetricsForPeriod(sevenDaysAgo);
  const fourteenDayMetrics = calculateMetricsForPeriod(fourteenDaysAgo);
  const thirtyDayMetrics = calculateMetricsForPeriod(thirtyDaysAgo);
  const mtdMetrics = calculateMetricsForPeriod(monthStart);

  return {
    BrandName: brandName,
    CampaignName: campaignName,
    GoodsName: goodsName,
    Group: tcpaInfo?.Group || '',
    TCPA: tcpaInfo?.TCPA || 0,
    MonthlyBudget: monthlyBudget,
    ThreeDayCPA: threeDayMetrics.cpa,
    ThreeDayConv: threeDayMetrics.conversions,
    SevenDayCPA: sevenDayMetrics.cpa,
    SevenDayConv: sevenDayMetrics.conversions,
    FourteenDayCPA: fourteenDayMetrics.cpa,
    FourteenDayConv: fourteenDayMetrics.conversions,
    ThirtyDayCPA: thirtyDayMetrics.cpa,
    ThirtyDayConv: thirtyDayMetrics.conversions,
    MTD_CPA: mtdMetrics.cpa,
    MTD_Conv: mtdMetrics.conversions,
    AmountSpent: totalSpentMTD,
    BudgetPacing: budgetPacing,
    RemainingBudget: remainingBudget
  };
};

export const calculateCampaignMetrics = (
  data: PaidMediaData[],
  tcpaData: TCPAData[]
): CampaignMetrics[] => {
  const campaignMap = new Map<string, PaidMediaData[]>();

  data.forEach(row => {
    if (!row.Campaign_ID || !row.CampaignName || !row.CampaignDate) return;

    const campaignKey = `${row.Campaign_ID}-${row.CampaignName}`;
    const existing = campaignMap.get(campaignKey) || [];
    campaignMap.set(campaignKey, [...existing, {
      ...row,
      CampaignDate: parseDate(row.CampaignDate).toISOString()
    }]);
  });

  return Array.from(campaignMap.entries()).map(([, campaignData]) => {
    const firstRow = campaignData[0];
    const tcpaInfo = tcpaData.find(t => t.GoodsName === firstRow.GoodsName);

    return calculateMetricsForGroup(
      campaignData,
      tcpaInfo,
      firstRow.GoodsSold || tcpaInfo?.BrandName || 'Unknown Brand',
      firstRow.GoodsName || 'Unknown Goods',
      firstRow.CampaignName
    );
  });
};

export const calculateGoodsMetrics = (
  data: PaidMediaData[],
  tcpaData: TCPAData[]
): CampaignMetrics[] => {
  const goodsMap = new Map<string, PaidMediaData[]>();

  data.forEach(row => {
    if (!row.GoodsName || !row.CampaignDate) return;

    const existing = goodsMap.get(row.GoodsName) || [];
    goodsMap.set(row.GoodsName, [...existing, {
      ...row,
      CampaignDate: parseDate(row.CampaignDate).toISOString()
    }]);
  });

  return Array.from(goodsMap.entries()).map(([goodsName, goodsData]) => {
    const tcpaInfo = tcpaData.find(t => t.GoodsName === goodsName);
    const brandName = tcpaInfo?.BrandName || goodsName;
    const campaignName = goodsData[0]?.CampaignName || goodsName;

    return calculateMetricsForGroup(goodsData, tcpaInfo, brandName, goodsName, campaignName);
  });
};