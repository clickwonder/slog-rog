import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, parse } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface TeamOptimizationsProps {
  brandName: string;
  selectedPlatform?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

interface Optimization {
  date: string;
  platform: string;
  campaign: string;
  optimization: string;
  changes: string;
  results_next_step?: string;
  optimization_by: string;
}

const TeamOptimizations: React.FC<TeamOptimizationsProps> = ({
  brandName,
  selectedPlatform,
  dateRange
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);

  useEffect(() => {
    const fetchOptimizations = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          brand: brandName,
          ...(dateRange?.startDate && { startDate: dateRange.startDate.toISOString() }),
          ...(dateRange?.endDate && { endDate: dateRange.endDate.toISOString() }),
          ...(selectedPlatform && { platform: selectedPlatform })
        });

        const response = await fetch(`/api/optimizations?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch optimizations');
        }

        const data = await response.json();
        setOptimizations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load optimizations');
        console.error('Error loading optimizations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizations();
  }, [brandName, selectedPlatform, dateRange]);

  const groupedByMonth = React.useMemo(() => {
    const groups = new Map<string, Optimization[]>();

    optimizations.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = format(date, 'MMMM yyyy');

      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)?.push(entry);
    });

    // Sort months in descending order
    return new Map([...groups.entries()].sort((a, b) => {
      const dateA = parse(a[0], 'MMMM yyyy', new Date());
      const dateB = parse(b[0], 'MMMM yyyy', new Date());
      return dateB.getTime() - dateA.getTime();
    }));
  }, [optimizations]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(groupedByMonth.entries()).map(([month, entries]) => (
        <Card key={month}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{month}</span>
              <span className="text-sm text-gray-500">
                {entries.length} optimizations
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {entry.platform}
                      </span>
                      {entry.campaign && (
                        <span className="ml-2 text-sm text-gray-600">
                          {entry.campaign}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {entry.optimization && (
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {entry.optimization}
                    </p>
                  )}
                  {entry.changes && (
                    <p className="text-sm text-gray-600 mb-1">
                      {entry.changes}
                    </p>
                  )}
                  {entry.results_next_step && (
                    <p className="text-sm text-gray-600 italic">
                      Next steps: {entry.results_next_step}
                    </p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    Optimized by {entry.optimization_by}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TeamOptimizations;