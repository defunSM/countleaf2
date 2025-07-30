import { NextApiRequest } from 'next'

interface IPAttemptData {
  attempts: number[]  // Array of timestamps
  requiresCaptcha: boolean
  totalRequests: number
}

const ipStore = new Map<string, IPAttemptData>()

export function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) 
    : req.socket.remoteAddress
  return ip || 'unknown'
}

export function trackIPAttempt(req: NextApiRequest): { 
  allowed: boolean, 
  requiresCaptcha: boolean,
  attemptsInLastMinute: number,
  totalRequests: number
} {
  const ip = getClientIP(req)
  const now = Date.now()
  const oneMinuteAgo = now - 60 * 1000 // 1 minute in milliseconds
  const fifteenMinutesAgo = now - 15 * 60 * 1000 // 15 minutes
  
  // Clean up old data
  cleanupOldEntries(fifteenMinutesAgo)
  
  let ipData = ipStore.get(ip)
  
  if (!ipData) {
    ipData = {
      attempts: [],
      requiresCaptcha: false,
      totalRequests: 0
    }
  }
  
  // Filter attempts to only include those from the last minute
  const recentAttempts = ipData.attempts.filter(timestamp => timestamp > oneMinuteAgo)
  
  // Add current attempt
  recentAttempts.push(now)
  ipData.totalRequests++
  
  // Update attempts array to only keep recent ones
  ipData.attempts = recentAttempts
  
  // Check if CAPTCHA should be required (20+ attempts in 1 minute)
  const shouldRequireCaptcha = recentAttempts.length > 20
  if (shouldRequireCaptcha) {
    ipData.requiresCaptcha = true
  }
  
  // Rate limiting: no more than 10 requests per 15 minutes
  const fifteenMinuteAttempts = ipData.attempts.filter(timestamp => timestamp > fifteenMinutesAgo)
  const allowed = fifteenMinuteAttempts.length <= 10
  
  // Store updated data
  ipStore.set(ip, ipData)
  
  return {
    allowed,
    requiresCaptcha: ipData.requiresCaptcha,
    attemptsInLastMinute: recentAttempts.length,
    totalRequests: ipData.totalRequests
  }
}

export function checkIfCaptchaRequired(req: NextApiRequest): boolean {
  const ip = getClientIP(req)
  const ipData = ipStore.get(ip)
  
  if (!ipData) {
    return false
  }
  
  return ipData.requiresCaptcha
}

export function getIPStats(req: NextApiRequest): {
  totalRequests: number,
  attemptsInLastMinute: number,
  requiresCaptcha: boolean
} {
  const ip = getClientIP(req)
  const now = Date.now()
  const oneMinuteAgo = now - 60 * 1000
  
  const ipData = ipStore.get(ip)
  
  if (!ipData) {
    return {
      totalRequests: 0,
      attemptsInLastMinute: 0,
      requiresCaptcha: false
    }
  }
  
  const recentAttempts = ipData.attempts.filter(timestamp => timestamp > oneMinuteAgo)
  
  return {
    totalRequests: ipData.totalRequests,
    attemptsInLastMinute: recentAttempts.length,
    requiresCaptcha: ipData.requiresCaptcha
  }
}

function cleanupOldEntries(cutoffTime: number): void {
  for (const [ip, data] of ipStore.entries()) {
    // Remove attempts older than 15 minutes
    data.attempts = data.attempts.filter(timestamp => timestamp > cutoffTime)
    
    // If no recent attempts and doesn't require captcha, remove the entry
    if (data.attempts.length === 0 && !data.requiresCaptcha) {
      ipStore.delete(ip)
    }
  }
}

// Optional: Get all IP stats for monitoring (admin use)
export function getAllIPStats(): Array<{
  ip: string,
  totalRequests: number,
  attemptsInLastMinute: number,
  requiresCaptcha: boolean
}> {
  const now = Date.now()
  const oneMinuteAgo = now - 60 * 1000
  const stats: Array<{
    ip: string,
    totalRequests: number,
    attemptsInLastMinute: number,
    requiresCaptcha: boolean
  }> = []
  
  for (const [ip, data] of ipStore.entries()) {
    const recentAttempts = data.attempts.filter(timestamp => timestamp > oneMinuteAgo)
    
    stats.push({
      ip,
      totalRequests: data.totalRequests,
      attemptsInLastMinute: recentAttempts.length,
      requiresCaptcha: data.requiresCaptcha
    })
  }
  
  return stats.sort((a, b) => b.totalRequests - a.totalRequests)
}