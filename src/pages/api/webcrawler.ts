import type { NextApiRequest, NextApiResponse } from 'next'
import { trackIPAttempt, getClientIP } from '@/lib/ipTracking'
import { verifyCaptcha } from '@/lib/captcha'

async function getHTML(link: string) {
  const response = await fetch(link)
  const html = await response.text()
  return html
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Track IP attempt and check rate limits
    const ipCheck = trackIPAttempt(req)
    
    if (!ipCheck.allowed) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait before trying again.',
        retryAfter: 900 // 15 minutes in seconds
      })
    }

    const { link, captchaId, captchaAnswer } = req.body

    // Verify required fields
    if (!link) {
      return res.status(400).json({ 
        error: 'Missing required field: link' 
      })
    }

    // Check if CAPTCHA is required for this IP
    if (ipCheck.requiresCaptcha) {
      if (!captchaId || captchaAnswer === undefined) {
        return res.status(400).json({ 
          error: 'CAPTCHA verification required. Please complete the security check.',
          requiresCaptcha: true
        })
      }

      // Verify CAPTCHA
      const captchaValid = verifyCaptcha(captchaId, parseInt(captchaAnswer))
      if (!captchaValid) {
        return res.status(400).json({ 
          error: 'Invalid CAPTCHA. Please try again.',
          requiresCaptcha: true
        })
      }
    }

    // Validate URL
    try {
      new URL(link)
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // Fetch HTML
    const html = await getHTML(link)
    
    // Log successful request with IP for monitoring
    console.log(`Successful request from IP: ${getClientIP(req)}, Total requests: ${ipCheck.totalRequests}`)
    
    res.status(200).json(html)
    
  } catch (error) {
    console.error('Webcrawler error:', error)
    res.status(500).json({ error: 'Failed to fetch webpage content' })
  }
}
