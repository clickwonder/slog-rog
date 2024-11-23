// lib/optimizationsDB.ts
import { db } from '@/lib/db';

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
  try {
    let query = `
      SELECT * FROM optimizations 
      WHERE brand = ?
    `;
    const params = [brandCode];

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate.toISOString(), endDate.toISOString());
    }

    if (platform) {
      query += ' AND platform = ?';
      params.push(platform);
    }

    query += ' ORDER BY date DESC';

    const results = await db.all(query, params);
    return { data: results, error: null };
  } catch (error) {
    console.error('Error fetching optimizations:', error);
    return { data: null, error: 'Failed to fetch optimization data' };
  }
}