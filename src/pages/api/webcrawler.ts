import type { NextApiRequest, NextApiResponse } from 'next'
import rateLimiter from '../../lib/rateLimit'


async function getHTML(link: string) {
  const response = await fetch(link)
  const html = await response.text()
  return html
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check rate limit
  const { allowed, remaining, resetTime } = rateLimiter.checkLimit(req)
  
  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please wait before trying again.',
      retryAfter,
      resetTime
    })
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', '15')
  res.setHeader('X-RateLimit-Remaining', remaining.toString())
  res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString())

  try {
    const { link } = req.query
    
    if (!link || typeof link !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'URL parameter is required'
      })
    }
    
    const html = await getHTML(link)
    res.status(200).json(html)
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch webpage content'
    })
  }
}
