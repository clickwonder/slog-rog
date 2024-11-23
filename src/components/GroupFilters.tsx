import React from 'react';
import { Button } from '../components/ui/button';
import { CampaignMetrics } from '../types';

interface GroupFiltersProps {
  data: CampaignMetrics[];
  selectedGroup: string;
  onGroupSelect: (group: string) => void;
}

const GroupFilters: React.FC<GroupFiltersProps> = ({ data, selectedGroup, onGroupSelect }) => {
  // Get unique groups and sort them
  const groups = Array.from(new Set(data.map(item => item.Group)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant={selectedGroup === '' ? 'default' : 'outline'}
        onClick={() => onGroupSelect('')}
        className="text-sm"
      >
        All Groups
      </Button>
      {groups.map((group) => (
        <Button
          key={group}
          variant={selectedGroup === group ? 'default' : 'outline'}
          onClick={() => onGroupSelect(group)}
          className="text-sm"
        >
          {group}
        </Button>
      ))}
    </div>
  );
};

export default GroupFilters;