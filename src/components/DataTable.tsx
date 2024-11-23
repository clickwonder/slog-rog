import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Filter } from 'lucide-react';
import { CampaignMetrics } from '../types';

interface DataTableProps {
  data: CampaignMetrics[];
  groupBy: 'campaign' | 'goods';
  onRowSelect: (metrics: CampaignMetrics | null) => void;
  selectedRow: CampaignMetrics | null;
  onGoodsSelect?: (goodsName: string) => void;
  onCampaignSelect?: (campaignName: string) => void;
  selectedGroup: string;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  groupBy,
  onRowSelect,
  selectedRow,
  onGoodsSelect,
  onCampaignSelect,
  selectedGroup,
}) => {
  const [showConversions, setShowConversions] = useState(false);
  const [hideZeroConv, setHideZeroConv] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CampaignMetrics;
    direction: 'asc' | 'desc';
  } | null>(null);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const getCPAClassName = (actual: number, target: number) => {
    if (actual === 0) return 'text-gray-400';
    return actual > target ? 'text-red-600 font-medium' : 'text-green-600 font-medium';
  };

  const getPacingClassName = (pacing: number) => {
    if (pacing === 0) return 'text-gray-400';
    if (pacing < 90) return 'text-yellow-600 font-medium';
    if (pacing > 110) return 'text-red-600 font-medium';
    return 'text-green-600 font-medium';
  };

  const getVariancePercentage = (actual: number, target: number) => {
    return ((actual - target) / target) * 100;
  };

  const sortData = (data: CampaignMetrics[], sortConfig: { key: keyof CampaignMetrics; direction: 'asc' | 'desc' }) => {
    const isCPAMetric = sortConfig.key.toString().toLowerCase().includes('cpa');

    return [...data].sort((a, b) => {
      if (isCPAMetric) {
        // Calculate variance percentages
        const aVariance = getVariancePercentage(a[sortConfig.key] as number, a.TCPA);
        const bVariance = getVariancePercentage(b[sortConfig.key] as number, b.TCPA);

        // Check if values are above or below TCPA
        const aAboveTCPA = a[sortConfig.key] as number > a.TCPA;
        const bAboveTCPA = b[sortConfig.key] as number > b.TCPA;

        if (sortConfig.direction === 'desc') {
          // For descending sort (highest CPA first)
          if (aAboveTCPA && !bAboveTCPA) return -1;
          if (!aAboveTCPA && bAboveTCPA) return 1;
          return bVariance - aVariance;
        } else {
          // For ascending sort (lowest CPA first)
          if (!aAboveTCPA && bAboveTCPA) return -1;
          if (aAboveTCPA && !bAboveTCPA) return 1;
          return aVariance - bVariance;
        }
      }

      // Standard sorting for non-CPA metrics
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    // Apply group filter
    if (selectedGroup) {
      filtered = filtered.filter(row => row.Group === selectedGroup);
    }

    // Apply zero conversions filter
    if (hideZeroConv) {
      filtered = filtered.filter(row => row.MTD_Conv > 0);
    }

    // Apply sorting
    if (sortConfig) {
      return sortData(filtered, sortConfig);
    }

    return filtered;
  }, [data, hideZeroConv, sortConfig, selectedGroup]);

  const handleRowClick = (row: CampaignMetrics) => {
    if (selectedRow?.CampaignName === row.CampaignName && selectedRow?.GoodsName === row.GoodsName) {
      onRowSelect(null);
      if (groupBy === 'goods' && onGoodsSelect) onGoodsSelect('');
      if (groupBy === 'campaign' && onCampaignSelect) onCampaignSelect('');
    } else {
      onRowSelect(row);
      if (groupBy === 'goods' && onGoodsSelect) onGoodsSelect(row.GoodsName);
      if (groupBy === 'campaign' && onCampaignSelect) onCampaignSelect(row.CampaignName);
    }
  };

  const getRowClassName = (row: CampaignMetrics) => {
    const isSelected = selectedRow?.CampaignName === row.CampaignName && selectedRow?.GoodsName === row.GoodsName;
    return `cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`;
  };

  const handleSort = (key: keyof CampaignMetrics) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIndicator = (key: keyof CampaignMetrics) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideZeroConv(!hideZeroConv)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${
              hideZeroConv ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            {hideZeroConv ? 'Showing Active Only' : 'Show All'}
          </button>
          <span className="text-sm text-gray-500">
            {hideZeroConv ? `Showing ${filteredAndSortedData.length} of ${data.length} rows` : ''}
          </span>
        </div>
        <button
          onClick={() => setShowConversions(!showConversions)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {showConversions ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Conversions
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Conversions
            </>
          )}
        </button>
      </div>
      <div className="flex justify-end space-x-2 mb-2">
        {['ThreeDayCPA', 'SevenDayCPA', 'FourteenDayCPA', 'ThirtyDayCPA', 'MTD_CPA'].map((metric) => (
          <button
            key={metric}
            onClick={() => handleSort(metric as keyof CampaignMetrics)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              sortConfig?.key === metric
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sort by {metric.replace('CPA', ' CPA')} {getSortIndicator(metric as keyof CampaignMetrics)}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Brand Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Group
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {groupBy === 'campaign' ? 'Campaign Name' : 'Goods Name'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                TCPA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                3 Day CPA
              </th>
              {showConversions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  3 Day Conv
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                7 Day CPA
              </th>
              {showConversions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  7 Day Conv
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                14 Day CPA
              </th>
              {showConversions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  14 Day Conv
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                30 Day CPA
              </th>
              {showConversions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  30 Day Conv
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                MTD CPA
              </th>
              {showConversions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  MTD Conv
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Monthly Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                MTD Spend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Daily Pacing
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedData.map((row, index) => (
              <tr
                key={`${row.CampaignName}-${row.GoodsName}-${index}`}
                onClick={() => handleRowClick(row)}
                className={getRowClassName(row)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.BrandName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.Group}
                </td>
                <td className={`px-4 py-4 whitespace-normal text-sm text-gray-900 ${groupBy === 'campaign' ? 'max-w-xs' : ''}`}>
                  {groupBy === 'campaign' ? row.CampaignName : row.GoodsName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(row.TCPA)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getCPAClassName(row.ThreeDayCPA, row.TCPA)}`}>
                  {formatCurrency(row.ThreeDayCPA)}
                </td>
                {showConversions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row.ThreeDayConv)}
                  </td>
                )}
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getCPAClassName(row.SevenDayCPA, row.TCPA)}`}>
                  {formatCurrency(row.SevenDayCPA)}
                </td>
                {showConversions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row.SevenDayConv)}
                  </td>
                )}
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getCPAClassName(row.FourteenDayCPA, row.TCPA)}`}>
                  {formatCurrency(row.FourteenDayCPA)}
                </td>
                {showConversions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row.FourteenDayConv)}
                  </td>
                )}
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getCPAClassName(row.ThirtyDayCPA, row.TCPA)}`}>
                  {formatCurrency(row.ThirtyDayCPA)}
                </td>
                {showConversions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row.ThirtyDayConv)}
                  </td>
                )}
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getCPAClassName(row.MTD_CPA, row.TCPA)}`}>
                  {formatCurrency(row.MTD_CPA)}
                </td>
                {showConversions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row.MTD_Conv)}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(row.MonthlyBudget)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(row.AmountSpent)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getPacingClassName(row.BudgetPacing)}`}>
                  {formatPercentage(row.BudgetPacing)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;