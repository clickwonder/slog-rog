export const getWeekNumber = (date: Date): string => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error getting week number:', error);
    return 'Invalid Date';
  }
};

export const getMonthKey = (date: Date): string => {
  try {
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error getting month key:', error);
    return 'Invalid Date';
  }
};

export const formatTimeframe = (key: string, timeframe: 'day' | 'week' | 'month'): string => {
  try {
    switch (timeframe) {
      case 'day':
        return key;
      case 'week':
        return `Week ${key.split('-W')[1]}`;
      case 'month': {
        const [year, month] = key.split('-');
        if (!year || !month) throw new Error('Invalid date format');
        return new Date(parseInt(year), parseInt(month) - 1)
          .toLocaleString('default', { month: 'short', year: 'numeric' });
      }
      default:
        return key;
    }
  } catch (error) {
    console.error('Error formatting timeframe:', error);
    return key;
  }
};