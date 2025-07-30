interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number = 15, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  private getClientId(req: any): string {
    // Prioritize direct connection IP over potentially spoofed headers
    const directIp = req.connection?.remoteAddress || req.socket?.remoteAddress
    
    // Only trust X-Forwarded-For in specific environments (like behind a trusted proxy)
    // For now, use direct IP to prevent spoofing
    if (directIp) {
      return directIp
    }
    
    // Fallback to X-Forwarded-For only if no direct IP available
    const forwarded = req.headers['x-forwarded-for']
    const forwardedIp = forwarded ? forwarded.split(',')[0].trim() : null
    
    return forwardedIp || 'unknown'
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now()
    this.requests.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.requests.delete(key)
      }
    })
  }

  public checkLimit(req: any): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanupExpiredEntries()
    
    const clientId = this.getClientId(req)
    const now = Date.now()
    const entry = this.requests.get(clientId)

    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs
      }
      this.requests.set(clientId, newEntry)
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: newEntry.resetTime
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    entry.count++
    this.requests.set(clientId, entry)

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }
}

const rateLimiter = new RateLimiter(15, 60000)

export default rateLimiter