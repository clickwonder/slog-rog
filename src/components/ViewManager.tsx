import React, { useState } from 'react';
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Save, BookMarked, X } from 'lucide-react';
import { Filters } from '../types';

interface SavedView {
  id: string;
  name: string;
  filters: Filters;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

interface ViewManagerProps {
  currentFilters: Filters;
  dateRange: { startDate: Date; endDate: Date; };
  onLoadView: (view: SavedView) => void;
}

const ViewManager: React.FC<ViewManagerProps> = ({
  currentFilters,
  dateRange,
  onLoadView,
}) => {
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    const saved = localStorage.getItem('savedViews');
    return saved ? JSON.parse(saved) : [];
  });
  const [newViewName, setNewViewName] = useState('');

  const saveView = () => {
    if (!newViewName.trim()) return;

    const newView: SavedView = {
      id: Date.now().toString(),
      name: newViewName,
      filters: currentFilters,
      dateRange: dateRange
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    localStorage.setItem('savedViews', JSON.stringify(updatedViews));
    setNewViewName('');
  };

  const deleteView = (id: string) => {
    const updatedViews = savedViews.filter(view => view.id !== id);
    setSavedViews(updatedViews);
    localStorage.setItem('savedViews', JSON.stringify(updatedViews));
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save View
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="View name"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
              />
              <Button onClick={saveView}>Save</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <BookMarked className="h-4 w-4" />
            Saved Views
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid gap-2">
            {savedViews.map((view) => (
              <div key={view.id} className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start"
                  onClick={() => onLoadView(view)}
                >
                  {view.name}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteView(view.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {savedViews.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                No saved views
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ViewManager;