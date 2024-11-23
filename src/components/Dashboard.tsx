import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Activity, DollarSign, Target, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { PaidMediaData, MetricSummary, Filters, TCPAData, CampaignMetrics } from '../types';
import { calculateCampaignMetrics, calculateGoodsMetrics } from '../utils/cpaCalculator';
import MetricCard from './MetricCard';
import SpendingChart from './SpendingChart';
import PerformanceChart from './PerformanceChart';
import PublisherBreakdown from './PublisherBreakdown';
import FilterControls from './FilterControls';
import DataTable from './DataTable';
import FilteredMetricsTable from './FilteredMetricsTable';
import CampaignComparison from "./CampaignComparison";
import CampaignTrends from "./CampaignTrends";
// import SelectedMetricsCard from "./SelectedMetricsCard";
import DateRangeSelector from './DateRangeSelector';
import ViewManager from './ViewManager';
import DetailedMetricsAnalysis from './DetailedMetricsAnalysis';
import GroupFilters from './GroupFilters';
// import TeamOptimizations from './TeamOptimizations';
import TeamOptimizations from '../components/TeamOptimizations';


const Dashboard: React.FC = () => {
  const [data, setData] = useState<PaidMediaData[]>([]);
  const [tcpaData, setTcpaData] = useState<TCPAData[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics[]>([]);
  const [groupBy, setGroupBy] = useState<'campaign' | 'goods'>('goods');
  const [selectedGoodsName, setSelectedGoodsName] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedMetrics, setSelectedMetrics] = useState<CampaignMetrics | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showOptimizations, setShowOptimizations] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    platform: '',
    publisher: '',
    goodsSold: '',
    goodsName: '',
    campaignName: '',
    timeframe: 'day'
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date("2024-10-19"),
    endDate: new Date("2024-11-18")
  });
  const [metrics, setMetrics] = useState<MetricSummary>({
    totalSpent: 0,
    totalRevenue: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalLeads: 0,
    totalOrders: 0,
    roas: 0,
    ctr: 0,
    cpl: 0,
    cpo: 0
  });

 const handleGroupSelect = (group: string) => {
  setSelectedGroup(group);

  // Reset other selections when changing groups
  setSelectedMetrics(null);
  setSelectedGoodsName('');
  setSelectedCampaign('');
  };


  interface SavedView {
    id: string;
    name: string;
    filters: Filters;
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
  }

  const handleGoodsSelect = (goodsName: string) => {
    setSelectedGoodsName(prev => prev === goodsName ? '' : goodsName);
    setSelectedCampaign('');
  };

  const handleCampaignSelect = (campaignName: string) => {
    setSelectedCampaign(prev => prev === campaignName ? '' : campaignName);
    setSelectedGoodsName('');
  };

  const handleGroupByChange = (newGroupBy: 'campaign' | 'goods') => {
    setGroupBy(newGroupBy);
    setSelectedMetrics(null);
    setSelectedGoodsName('');
    setSelectedCampaign('');
  };

  const handleLoadView = (view: SavedView) => {
    setFilters(view.filters);
    setDateRange(view.dateRange);
  };

  // Data fetching and processing effects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.csv');
        const csvText = await response.text();
        const tcpaResponse = await fetch('/tcpa.csv');
        const tcpaCsvText = await tcpaResponse.text();

        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => setData(results.data as PaidMediaData[]),
          error: (error) => console.error('Error parsing main data:', error)
        });

        Papa.parse(tcpaCsvText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const cleanedData = results.data.map((row: any) => ({
              ...row,
              TCPA: typeof row.TCPA === 'string' ? Number(row.TCPA.replace('$', '').replace(',', '')) : row.TCPA,
              MonthlyBudget: typeof row.MonthlyBudget === 'string' ? Number(row.MonthlyBudget.replace('$', '').replace(',', '')) : row.MonthlyBudget
            }));
            setTcpaData(cleanedData as TCPAData[]);
          },
          error: (error) => console.error('Error parsing TCPA data:', error)
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0 && tcpaData.length > 0) {
      let metrics = groupBy === 'campaign'
        ? calculateCampaignMetrics(data, tcpaData)
        : calculateGoodsMetrics(data, tcpaData);

      // Filter by group if one is selected
      if (selectedGroup) {
        metrics = metrics.filter(metric => metric.Group === selectedGroup);
      }

      setCampaignMetrics(metrics);
    }
  }, [data, tcpaData, groupBy, selectedGroup]);


  useEffect(() => {
    let filtered = [...data];

    if (filters.platform) {
      filtered = filtered.filter(item => item.Platform?.toLowerCase() === filters.platform.toLowerCase());
    }
    if (filters.publisher) {
      filtered = filtered.filter(item => item.Publisher === filters.publisher);
    }
    if (filters.goodsSold) {
      filtered = filtered.filter(item => item.GoodsSold === filters.goodsSold);
    }
    if (filters.goodsName) {
      filtered = filtered.filter(item => item.GoodsName === filters.goodsName);
    }
    if (filters.campaignName) {
      filtered = filtered.filter(item => item.CampaignName === filters.campaignName);
    }

    filtered = filtered.filter(item => {
      const itemDate = new Date(item.CampaignDate);
      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });

    calculateMetrics(filtered);
  }, [filters, data, dateRange]);

  const calculateMetrics = (filteredData: PaidMediaData[]) => {
  const summary = filteredData.reduce((acc, row) => ({
    totalSpent: acc.totalSpent + (row.AmountSpent || 0),
    totalRevenue: acc.totalRevenue + (row.FulfillmentRevenue || 0),
    totalImpressions: acc.totalImpressions + (row.Impressions || 0),
    totalClicks: acc.totalClicks + (row.Clicks || 0),
    totalLeads: acc.totalLeads + (row.Leads || 0),
    totalOrders: acc.totalOrders + (row.FulfillmentOrders || 0),
    roas: 0,
    ctr: 0,
    cpl: 0,
    cpo: 0
  }), {
    totalSpent: 0,
    totalRevenue: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalLeads: 0,
    totalOrders: 0,
    roas: 0,
    ctr: 0,
    cpl: 0,
    cpo: 0
  });

  // Calculate derived metrics
  summary.roas = summary.totalRevenue / summary.totalSpent || 0;
  summary.ctr = summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0;
  summary.cpl = summary.totalLeads > 0 ? summary.totalSpent / summary.totalLeads : 0;
  summary.cpo = summary.totalOrders > 0 ? summary.totalSpent / summary.totalOrders : 0;

  setMetrics(summary);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Paid Media Analytics</h1>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard
              title="Total Spend"
              value={`$${metrics.totalSpent.toLocaleString()}`}
              icon={<DollarSign className="w-6 h-6 text-blue-500"/>}
          />
          <MetricCard
              title="ROAS"
              value={`${metrics.roas.toFixed(2)}x`}
              icon={<Activity className="w-6 h-6 text-green-500"/>}
          />
          <MetricCard
              title="CPA (Cost per Acquisition)"
              value={`$${metrics.cpo.toFixed(2)}`}
              icon={<Target className="w-6 h-6 text-purple-500"/>}
          />
          <MetricCard
              title="Total Orders"
              value={metrics.totalOrders.toLocaleString()}
              icon={<ShoppingCart className="w-6 h-6 text-orange-500"/>}
          />
        </div>

        <div className="mb-6">
          <FilterControls
              data={data}
              filters={filters}
              onFilterChange={handleFilterChange}
          />
        </div>

        <div className="mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                {showAnalysis ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
              </button>

              <div className="flex items-center gap-4">
                <DateRangeSelector
                    onRangeSelect={setDateRange}
                    selectedRange={dateRange}
                />
                <ViewManager
                    currentFilters={filters}
                    dateRange={dateRange}
                    onLoadView={handleLoadView}
                />
              </div>
            </div>

            {showAnalysis && (
                <FilteredMetricsTable
                    data={data}
                    filters={filters}
                    timeframe={filters.timeframe}
                    dateRange={dateRange}
                />
            )}
          </div>
        </div>


        {/* Add Team Optimizations section */}
        <div className="mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowOptimizations(!showOptimizations)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                {showOptimizations ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                {showOptimizations ? 'Hide Team Optimizations' : 'Show Team Optimizations'}
              </button>

              <div className="flex items-center gap-4">
                {showOptimizations && (
                  <select
                    className="px-3 py-2 border rounded"
                    value={filters.platform}
                    onChange={(e) => handleFilterChange('platform', e.target.value)}
                  >
                    <option value="">All Platforms</option>
                    <option value="SEM">Search</option>
                    <option value="Social">Social</option>
                    <option value="Bing">Bing</option>
                  </select>
                )}
              </div>
            </div>

            {showOptimizations && (
              <TeamOptimizations
                brandName="GDT"
                selectedPlatform={filters.platform}
                dateRange={dateRange}
              />
            )}
          </div>
        </div>




        {selectedMetrics && (
            <div className="mb-6">
              <DetailedMetricsAnalysis
                  metrics={selectedMetrics}
                  campaignData={data.filter(row =>
                      // If we're grouping by goods, show all campaigns for that goods
                      (groupBy === 'goods' && row.GoodsName === selectedMetrics.GoodsName) ||
                      // If we're grouping by campaign, show only the selected campaign
                      (groupBy === 'campaign' && row.CampaignName === selectedMetrics.CampaignName)
                  )}
                  onTimeframeChange={(startDate, endDate) => {
                    setDateRange({startDate, endDate});
                    // Recalculate metrics when date range changes
                    calculateMetrics(data.filter(row => {
                      const rowDate = new Date(row.CampaignDate);
                      return rowDate >= startDate && rowDate <= endDate;
                    }));
                  }}
              />
            </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Performance Data</h2>
            <div className="flex gap-2">
              <button
                  onClick={() => handleGroupByChange('campaign')}
                  className={`px-4 py-2 rounded ${
                      groupBy === 'campaign'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                By Campaign
              </button>
              <button
                  onClick={() => handleGroupByChange('goods')}
                  className={`px-4 py-2 rounded ${
                      groupBy === 'goods'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                By Goods
              </button>
            </div>
          </div>

          <GroupFilters
              data={campaignMetrics}
              selectedGroup={selectedGroup}
              onGroupSelect={handleGroupSelect}
          />

          <DataTable
              data={campaignMetrics}
              groupBy={groupBy}
              onRowSelect={setSelectedMetrics}
              selectedRow={selectedMetrics}
              onGoodsSelect={handleGoodsSelect}
              onCampaignSelect={handleCampaignSelect}
              selectedGroup={selectedGroup}
          />
        </div>


        {selectedGoodsName && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <CampaignComparison
                  data={selectedGroup
                      ? data.filter(row => {
                        const tcpaInfo = tcpaData.find(t => t.GoodsName === row.GoodsName);
                        return tcpaInfo?.Group === selectedGroup;
                      })
                      : data}
                  goodsName={selectedGoodsName}
              />
            </div>
        )}


        {selectedCampaign && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <CampaignTrends
                  data={selectedGroup
                      ? data.filter(row => {
                        const tcpaInfo = tcpaData.find(t => t.GoodsName === row.GoodsName);
                        return tcpaInfo?.Group === selectedGroup;
                      })
                      : data}
                  campaignName={selectedCampaign}
                  timeframe={filters.timeframe}
              />
            </div>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Spending Trend</h2>
            <SpendingChart
                data={selectedGroup
                    ? data.filter(row => {
                      const tcpaInfo = tcpaData.find(t => t.GoodsName === row.GoodsName);
                      return tcpaInfo?.Group === selectedGroup;
                    })
                    : data}
                timeframe={filters.timeframe}
            />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <PerformanceChart
                data={selectedGroup
                    ? data.filter(row => {
                      const tcpaInfo = tcpaData.find(t => t.GoodsName === row.GoodsName);
                      return tcpaInfo?.Group === selectedGroup;
                    })
                    : data}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Publisher Breakdown</h2>
          <PublisherBreakdown
              data={selectedGroup
                  ? data.filter(row => {
                    const tcpaInfo = tcpaData.find(t => t.GoodsName === row.GoodsName);
                    return tcpaInfo?.Group === selectedGroup;
                  })
                  : data}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;