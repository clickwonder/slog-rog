// utils/api.ts
export async function getOptimizations({
  brandCode,
  startDate,
  endDate,
  platform
}: {
  brandCode: string;
  startDate?: Date;
  endDate?: Date;
  platform?: string;
}) {
  const params = new URLSearchParams({
    brand: brandCode,
    ...(startDate && { startDate: startDate.toISOString() }),
    ...(endDate && { endDate: endDate.toISOString() }),
    ...(platform && { platform }),
  });

  try {
    const response = await fetch(`/api/optimizations?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch optimizations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching optimizations:', error);
    throw error;
  }
}