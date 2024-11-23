export async function fetchOptimizations({
  brand,
  startDate,
  endDate,
  platform
}: {
  brand: string;
  startDate?: Date;
  endDate?: Date;
  platform?: string;
}) {
  const params = new URLSearchParams({
    brand,
    ...(startDate && { startDate: startDate.toISOString() }),
    ...(endDate && { endDate: endDate.toISOString() }),
    ...(platform && { platform }),
  });

  try {
    const response = await fetch(`/api/optimizations?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch optimizations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching optimizations:', error);
    throw error;
  }
}