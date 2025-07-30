// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import rateLimiter from '../../lib/rateLimit'

// Secure URL validation and fetching
async function getHTML(link: string) {
  // Validate URL format
  let url: URL
  try {
    url = new URL(link)
  } catch (error) {
    throw new Error('Invalid URL format')
  }

  // Only allow HTTP and HTTPS protocols
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS protocols are allowed')
  }

  // Block private IP ranges and localhost (except in development)
  const hostname = url.hostname.toLowerCase()
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Always block AWS metadata service and other dangerous endpoints
  const alwaysBlockedHosts = [
    '169.254.169.254', // AWS metadata service
    '0.0.0.0',
  ]
  
  // Block localhost and private networks only in production
  const developmentOnlyHosts = [
    '127.0.0.1', 'localhost', '::1', // IPv6 localhost
  ]
  
  const privateNetworks = [
    '192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.',
    '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
    '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.'
  ]

  // Always block dangerous hosts
  if (alwaysBlockedHosts.includes(hostname)) {
    throw new Error('Access to this endpoint is not allowed')
  }

  // Block localhost and private networks only in production
  if (isProduction) {
    if (developmentOnlyHosts.includes(hostname) || 
        privateNetworks.some(network => hostname.startsWith(network))) {
      throw new Error('Access to private networks is not allowed')
    }
  }

  // Fetch with security headers and timeout
  const response = await fetch(link, {
    method: 'GET',
    headers: {
      'User-Agent': 'CountLeaf/1.0 (+https://countleaf.com)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    // Add timeout to prevent hanging requests
    signal: AbortSignal.timeout(15000) // 15 second timeout
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  // Check content type
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('text/html')) {
    throw new Error('URL must return HTML content')
  }

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

    // Additional URL length validation
    if (link.length > 2048) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'URL is too long'
      })
    }
    
    const html = await getHTML(link)
    res.status(200).json(html)
  } catch (error) {
    // Log error internally but don't expose details to prevent information leakage
    console.error('Webcrawler error:', error)
    
    // Return generic error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid URL') || 
          error.message.includes('protocol') ||
          error.message.includes('private networks')) {
        return res.status(400).json({
          error: 'Invalid URL',
          message: 'The provided URL is not valid or accessible'
        })
      }
      
      if (error.message.includes('timeout')) {
        return res.status(408).json({
          error: 'Request timeout',
          message: 'The webpage took too long to respond'
        })
      }
      
      if (error.message.includes('HTTP')) {
        return res.status(400).json({
          error: 'Webpage error',
          message: 'The webpage could not be accessed'
        })
      }
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to process the webpage at this time'
    })
  }
}
