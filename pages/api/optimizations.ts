// pages/api/optimizations.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getOptimizations } from '@/lib/optimizationsDB';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { brand, startDate, endDate, platform } = req.query;

    if (!brand) {
      return res.status(400).json({ error: 'Brand code is required' });
    }

    const { data, error } = await getOptimizations({
      brandCode: brand as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      platform: platform as string | undefined,
    });

    if (error) {
      return res.status(500).json({ error });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}