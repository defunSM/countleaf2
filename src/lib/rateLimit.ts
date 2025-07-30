import { NextApiRequest, NextApiResponse } from 'next'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitData {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitData>()

export function rateLimit(config: RateLimitConfig) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const key = getClientKey(req)
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Clean up old entries
    for (const [k, data] of rateLimitStore.entries()) {
      if (data.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
    
    const current = rateLimitStore.get(key)
    
    if (!current || current.resetTime < now) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      next()
      return
    }
    
    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      })
      return
    }
    
    // Increment count
    current.count++
    rateLimitStore.set(key, current)
    next()
  }
}

function getClientKey(req: NextApiRequest): string {
  // Use IP address as the key
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress
  return ip || 'unknown'
}

export async function checkRateLimit(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  return new Promise((resolve) => {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10 // 10 requests per 15 minutes
    })
    
    limiter(req, res, () => {
      resolve(true)
    })
  })
}