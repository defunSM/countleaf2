import type { NextApiRequest, NextApiResponse } from 'next'
import { getClientIP } from '@/lib/ipTracking'

interface AnalysisData {
  url: string
  wordCount: number
  tokenCount: number
  sentenceCount: number
  averageWordsPerSentence: number
  mostFrequentWord: string
  mostFrequentWordCount: number
  userAgent: string
  timestamp: number
  ip: string
}

// Simple in-memory storage for analysis data
const analysisStore: AnalysisData[] = []

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      url,
      wordCount,
      tokenCount,
      sentenceCount,
      averageWordsPerSentence,
      mostFrequentWord,
      mostFrequentWordCount,
      userAgent
    } = req.body

    // Validate required fields
    if (!url || wordCount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const analysisData: AnalysisData = {
      url,
      wordCount,
      tokenCount,
      sentenceCount,
      averageWordsPerSentence,
      mostFrequentWord,
      mostFrequentWordCount,
      userAgent,
      timestamp: Date.now(),
      ip: getClientIP(req)
    }

    // Store the analysis
    analysisStore.push(analysisData)

    // Keep only the last 1000 analyses to prevent memory issues
    if (analysisStore.length > 1000) {
      analysisStore.shift()
    }

    console.log(`Analysis stored for IP: ${analysisData.ip}, URL: ${url}, Words: ${wordCount}`)

    res.status(200).json({ success: true, id: analysisStore.length })
  } catch (error) {
    console.error('Store analysis error:', error)
    res.status(500).json({ error: 'Failed to store analysis' })
  }
}

// Export function to get analysis stats (for admin monitoring)
export function getAnalysisStats() {
  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000
  const oneDayAgo = now - 24 * 60 * 60 * 1000

  const recentAnalyses = analysisStore.filter(a => a.timestamp > oneHourAgo)
  const dailyAnalyses = analysisStore.filter(a => a.timestamp > oneDayAgo)
  
  const uniqueIPs = new Set(analysisStore.map(a => a.ip))
  const recentUniqueIPs = new Set(recentAnalyses.map(a => a.ip))

  return {
    totalAnalyses: analysisStore.length,
    recentAnalyses: recentAnalyses.length,
    dailyAnalyses: dailyAnalyses.length,
    uniqueIPs: uniqueIPs.size,
    recentUniqueIPs: recentUniqueIPs.size,
    averageWordsPerAnalysis: analysisStore.reduce((sum, a) => sum + a.wordCount, 0) / analysisStore.length || 0
  }
}