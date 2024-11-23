import { db } from '../../lib/db.js';

export async function getOptimizations({
  brandCode,
  startDate,
  endDate,
  platform
}) {
  try {
    let query = `
      SELECT * FROM optimizations 
      WHERE brand = ?
    `;
    const params = [brandCode];

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
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

export async function getOptimizationsByMonth({
  brandCode,
  month,
  year,
  platform
}) {
  try {
    let query = `
      SELECT * FROM optimizations 
      WHERE brand = ?
      AND strftime('%m', date) = ?
      AND strftime('%Y', date) = ?
    `;
    const params = [brandCode, month.padStart(2, '0'), year.toString()];

    if (platform) {
      query += ' AND platform = ?';
      params.push(platform);
    }

    query += ' ORDER BY date DESC';

    const results = await db.all(query, params);
    return { data: results, error: null };
  } catch (error) {
    console.error('Error fetching optimizations by month:', error);
    return { data: null, error: 'Failed to fetch optimization data' };
  }
}