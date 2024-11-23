import React from 'react';
import { Filters, FilterOption, PaidMediaData } from '../types';
import Select from './Select';

interface FilterControlsProps {
  data: PaidMediaData[];
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ data, filters, onFilterChange }) => {
  const getUniqueOptions = (key: keyof PaidMediaData): FilterOption[] => {
    const uniqueValues = Array.from(new Set(data.map(item => item[key])))
      .filter(Boolean)
      .sort();

    const defaultLabel = (() => {
      switch(key) {
        case 'publishersPlatform': return 'All Platform';
        case 'Publisher': return 'All Publisher';
        case 'GoodsSold': return 'All Goods Sold';
        case 'GoodsName': return 'All Goods Name';
        case 'CampaignName': return 'All Campaign Name';
        default: return `All ${key}`;
      }
    })();

    return [
      { value: '', label: defaultLabel },
      ...uniqueValues.map(value => ({ value: value as string, label: value as string }))
    ];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Select
          label="Platform"
          options={getUniqueOptions('publishersPlatform')}
          value={filters.platform}
          onChange={(value) => onFilterChange('platform', value)}
        />
        <Select
          label="Publisher"
          options={getUniqueOptions('Publisher')}
          value={filters.publisher}
          onChange={(value) => onFilterChange('publisher', value)}
        />
        <Select
          label="Goods Sold"
          options={getUniqueOptions('GoodsSold')}
          value={filters.goodsSold}
          onChange={(value) => onFilterChange('goodsSold', value)}
        />
        <Select
          label="Goods Name"
          options={getUniqueOptions('GoodsName')}
          value={filters.goodsName}
          onChange={(value) => onFilterChange('goodsName', value)}
        />
        <Select
          label="Campaign Name"
          options={getUniqueOptions('CampaignName')}
          value={filters.campaignName}
          onChange={(value) => onFilterChange('campaignName', value)}
        />
        <Select
          label="Time Breakdown"
          options={[
            { value: 'day', label: 'Daily' },
            { value: 'week', label: 'Weekly' },
            { value: 'month', label: 'Monthly' }
          ]}
          value={filters.timeframe}
          onChange={(value) => onFilterChange('timeframe', value as 'day' | 'week' | 'month')}
        />
      </div>
    </div>
  );
};

export default FilterControls;