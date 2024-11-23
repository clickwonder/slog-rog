import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { format, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Card, CardContent } from '../components/ui/card';
import { PaidMediaData, Filters } from '../types';

interface FilteredMetricsTableProps {
  data: PaidMediaData[];
  filters: Filters;
  timeframe: 'day' | 'week' | 'month';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

const FilteredMetricsTable: React.FC<FilteredMetricsTableProps> = ({
  data = [],
  filters,
  timeframe,
  dateRange
}) => {
  const [showTable, setShowTable] = useState(false);
  const [startDate, setStartDate] = useState(dateRange.startDate);
  const [endDate, setEndDate] = useState(dateRange.endDate);
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    platform: true,
    publisher: true,
    goodsSold: true,
    brand: true,
    campaignName: true,
    cost: true,
    impressions: true,
    clicks: true,
    ctr: true,
    cpa: true,
    conv: true,
    rev: true,
    convCDS: true,
    revCDS: true,
    variance: true
  });

  // Keep local dates in sync with prop dates
  useEffect(() => {
    setStartDate(dateRange.startDate);
    setEndDate(dateRange.endDate);
  }, [dateRange]);

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const formatCurrency = (value: number) => `$${(value || 0).toFixed(2)}`;
  const formatNumber = (value: number) => (value || 0).toLocaleString();
  const formatPercentage = (value: number) => `${(value || 0).toFixed(2)}%`;

  const filteredAndAggregatedData = useMemo(() => {
  if (!Array.isArray(data) || data.length === 0) return [];

  // First, filter the data based on date range and other filters
  const filtered = data.filter(row => {
    if (!row.CampaignDate) return false;

    const rowDate = new Date(row.CampaignDate);
    const isInDateRange = isWithinInterval(rowDate, {
      start: startDate,
      end: endDate
    });

    if (!isInDateRange) return false;

    // Apply other filters
    if (filters.platform && row.Platform?.toLowerCase() !== filters.platform.toLowerCase()) return false;
    if (filters.publisher && row.Publisher !== filters.publisher) return false;
    if (filters.goodsSold && row.GoodsSold !== filters.goodsSold) return false;
    if (filters.goodsName && row.GoodsName !== filters.goodsName) return false;
    if (filters.campaignName && row.CampaignName !== filters.campaignName) return false;

    return true;
  });

    // Then aggregate the filtered data based on timeframe
      const aggregated = filtered.reduce((acc, row) => {
    if (!row.CampaignDate) return acc;

    const rowDate = new Date(row.CampaignDate);
    let dateKey: string;

    switch (timeframe) {
      case 'week':
        dateKey = format(startOfWeek(rowDate), 'yyyy-MM-dd');
        break;
      case 'month':
        dateKey = format(startOfMonth(rowDate), 'yyyy-MM');
        break;
      default:
        dateKey = format(rowDate, 'yyyy-MM-dd');
    }

      const key = `${dateKey}-${row.CampaignName}`;

    if (!acc[key]) {
      acc[key] = {
        date: dateKey,
        Platform: row.Platform,
        Publisher: row.Publisher,
        GoodsSold: row.GoodsSold,
        GoodsName: row.GoodsName,
        CampaignName: row.CampaignName,
        AmountSpent: 0,
        Impressions: 0,
        Clicks: 0,
        PlatBResult: 0,
        PlatValue: 0,
        FulfillmentOrders: 0,
        FulfillmentRevenue: 0
      };
    }

    // Aggregate metrics
    acc[key].AmountSpent += row.AmountSpent || 0;
    acc[key].Impressions += row.Impressions || 0;
    acc[key].Clicks += row.Clicks || 0;
    acc[key].PlatBResult += row.PlatBResult || 0;
    acc[key].PlatValue += row.PlatValue || 0;
    acc[key].FulfillmentOrders += row.FulfillmentOrders || 0;
    acc[key].FulfillmentRevenue += row.FulfillmentRevenue || 0;

    return acc;
  }, {} as Record<string, any>);

  // Convert to array and sort by date and campaign name
  return Object.values(aggregated).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.CampaignName.localeCompare(b.CampaignName);
  });
}, [data, filters, timeframe, startDate, endDate]);

  const calculateMetrics = (row: any) => ({
    ctr: row.Impressions ? (row.Clicks / row.Impressions) * 100 : 0,
    cpa: row.PlatBResult ? row.AmountSpent / row.PlatBResult : 0,
    variance: (row.PlatBResult || 0) - (row.FulfillmentOrders || 0)
  });

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (!Array.isArray(data)) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showTable ? 'Hide Analysis' : 'Show Analysis'}
            </button>
            <div className="flex items-center gap-2">
              <DatePicker
                selected={startDate}
                onChange={(date: Date) => handleDateRangeChange(date, endDate)}
                className="px-3 py-2 border rounded"
                dateFormat="MM/dd/yyyy"
              />
              <span>to</span>
              <DatePicker
                selected={endDate}
                onChange={(date: Date) => handleDateRangeChange(startDate, date)}
                className="px-3 py-2 border rounded"
                dateFormat="MM/dd/yyyy"
              />

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 3);
                    handleDateRangeChange(start, end);
                  }}
                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                >
                  Last 3 Days
                </button>
                <button
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 7);
                    handleDateRangeChange(start, end);
                  }}
                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 14);
                    handleDateRangeChange(start, end);
                  }}
                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                >
                  Last 14 Days
                </button>
                <button
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 30);
                    handleDateRangeChange(start, end);
                  }}
                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => {
                    const end = new Date();
                    const start = new Date(end.getFullYear(), end.getMonth(), 1);
                    handleDateRangeChange(start, end);
                  }}
                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                >
                  This Month
                </button>
                <button
                  onClick={() => {
                    const end = new Date();
                    end.setDate(0); // Last day of previous month
                    const start = new Date(end.getFullYear(), end.getMonth(), 1);
                    handleDateRangeChange(start, end);
                  }}
                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                >
                  Last Month
                </button>
                <button
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setMonth(end.getMonth() - 3);
                    handleDateRangeChange(start, end);
                  }}
                  className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                >
                  Last 3 Months
                </button>
              </div>
            </div>
          </div>
        </div>

        {showTable && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(visibleColumns).map(([column, isVisible]) => (
                <button
                  key={column}
                  onClick={() => toggleColumn(column)}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                    isVisible ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {isVisible ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>}
                  {column.replace(/([A-Z])/g, ' $1').trim()}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.date && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {timeframe === 'month' ? 'Month' : timeframe === 'week' ? 'Week' : 'Date'}
                      </th>
                    )}
                    {visibleColumns.platform && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                    )}
                    {visibleColumns.publisher && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publisher</th>
                    )}
                    {visibleColumns.goodsSold && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GoodsSold</th>
                    )}
                    {visibleColumns.brand && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    )}
                    {visibleColumns.campaignName && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    )}
                    {visibleColumns.cost && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    )}
                    {visibleColumns.impressions && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                    )}
                    {visibleColumns.clicks && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                    )}
                    {visibleColumns.ctr && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                    )}
                    {visibleColumns.cpa && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CPA</th>
                    )}
                    {visibleColumns.conv && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Conv</th>
                    )}
                    {visibleColumns.rev && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rev</th>
                    )}
                    {visibleColumns.convCDS && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Conv (CDS)</th>
                    )}
                    {visibleColumns.revCDS && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rev (CDS)</th>
                    )}
                    {visibleColumns.variance && (
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndAggregatedData.map((row, index) => {
                    const metrics = calculateMetrics(row);
                    const formattedDate = timeframe === 'month'
                      ? format(new Date(row.date), 'MMMM yyyy')
                      : timeframe === 'week'
                      ? `Week of ${format(new Date(row.date), 'MM/dd/yyyy')}`
                      : format(new Date(row.date), 'MM/dd/yyyy');

                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {visibleColumns.date && (
                          <td className="px-4 py-2 text-sm text-gray-900">{formattedDate}</td>
                        )}
                        {visibleColumns.platform && (
                          <td className="px-4 py-2 text-sm text-gray-900">{row.Platform}</td>
                        )}
                        {visibleColumns.publisher && (
                          <td className="px-4 py-2 text-sm text-gray-900">{row.Publisher}</td>
                        )}
                        {visibleColumns.goodsSold && (
                          <td className="px-4 py-2 text-sm text-gray-900">{row.GoodsSold}</td>
                        )}
                        {visibleColumns.brand && (
                          <td className="px-4 py-2 text-sm text-gray-900">{row.GoodsName}</td>
                        )}
                        {visibleColumns.campaignName && (
                          <td className="px-4 py-2 text-sm text-gray-900">{row.CampaignName}</td>
                        )}
                        {visibleColumns.cost && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(row.AmountSpent)}</td>
                        )}
                        {visibleColumns.impressions && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatNumber(row.Impressions)}</td>
                        )}
                        {visibleColumns.clicks && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatNumber(row.Clicks)}</td>
                        )}
                        {visibleColumns.ctr && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatPercentage(metrics.ctr)}</td>
                        )}
                        {visibleColumns.cpa && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(metrics.cpa)}</td>
                        )}
                        {visibleColumns.conv && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatNumber(row.PlatBResult)}</td>
                        )}
                        {visibleColumns.rev && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(row.PlatValue)}</td>
                        )}
                        {visibleColumns.convCDS && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatNumber(row.FulfillmentOrders)}</td>
                        )}
                        {visibleColumns.revCDS && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(row.FulfillmentRevenue)}</td>
                        )}
                        {visibleColumns.variance && (
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatNumber(metrics.variance)}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FilteredMetricsTable;