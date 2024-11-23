import React from 'react';
import { Button } from '../components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Calendar } from 'lucide-react';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangeSelectorProps {
  onRangeSelect: (range: DateRange) => void;
  selectedRange: DateRange | null;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  onRangeSelect,
  selectedRange
}) => {
  const getDateRange = (days: number): DateRange => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    return { startDate, endDate };
  };

  const getMonthRange = (monthsBack: number): DateRange => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - monthsBack);
    startDate.setDate(1);
    return { startDate, endDate };
  };

  const presetRanges = [
    { label: 'Last 3 Days', range: () => getDateRange(3) },
    { label: 'Last 7 Days', range: () => getDateRange(7) },
    { label: 'Last 14 Days', range: () => getDateRange(14) },
    { label: 'Last 30 Days', range: () => getDateRange(30) },
    { label: 'This Month', range: () => ({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date()
    })},
    { label: 'Last Month', range: () => ({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    })},
    { label: 'Last 3 Months', range: () => getMonthRange(3) }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          {selectedRange ? (
            <span>
              {selectedRange.startDate.toLocaleDateString()} - {selectedRange.endDate.toLocaleDateString()}
            </span>
          ) : (
            'Select Date Range'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-2">
          {presetRanges.map((preset, index) => (
            <Button
              key={index}
              variant="ghost"
              className="justify-start"
              onClick={() => onRangeSelect(preset.range())}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeSelector;