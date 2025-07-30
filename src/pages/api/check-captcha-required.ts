import type { NextApiRequest, NextApiResponse } from 'next'
import { getIPStats } from '@/lib/ipTracking'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const stats = getIPStats(req)
    
    res.status(200).json({
      requiresCaptcha: stats.requiresCaptcha,
      attemptsInLastMinute: stats.attemptsInLastMinute,
      totalRequests: stats.totalRequests
    })
  } catch (error) {
    console.error('Check captcha required error:', error)
    res.status(500).json({ error: 'Failed to check captcha requirement' })
  }
}