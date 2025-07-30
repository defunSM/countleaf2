import type { NextApiRequest, NextApiResponse } from 'next'
import { generateCaptcha, storeCaptcha } from '@/lib/captcha'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const captcha = generateCaptcha()
    
    // Store the answer server-side
    storeCaptcha(captcha.id, captcha.answer)
    
    // Return only the question and id to the client
    res.status(200).json({
      question: captcha.question,
      id: captcha.id
    })
  } catch (error) {
    console.error('CAPTCHA generation error:', error)
    res.status(500).json({ error: 'Failed to generate CAPTCHA' })
  }
}