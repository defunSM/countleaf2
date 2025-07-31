import * as cheerio from 'cheerio'
import { convex } from './convex'
import { api } from '../../convex/_generated/api'

export interface AnalysisResult {
  wordCount: number
  tokenCount: number
  sentenceCount: number
  averageWordsPerSentence: number
  mostFrequentWord: string
  mostFrequentWordCount: number
  characterCount: number
  paragraphCount: number
  readingTimeMinutes: number
  url: string
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

async function analyzeHtmlContent(html: string, url: string): Promise<AnalysisResult> {
  const $ = cheerio.load(html)
  
  // Remove script, style, and other non-content elements
  $('script, style, nav, header, footer, aside, .advertisement, .ads').remove()
  
  // Extract text content
  const textContent = $('body').text()
  
  // Count words - split by whitespace and filter out empty strings
  const words = textContent
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
  
  // Count tokens (characters excluding spaces)
  const tokenCount = textContent.replace(/\s/g, '').length
  
  // Count total characters (including spaces)
  const characterCount = textContent.length
  
  // Count paragraphs - split by double line breaks or paragraph tags
  const paragraphs = $('p').length > 0 ? $('p').length : Math.max(1, textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length)
  
  // Calculate reading time (average 200 words per minute)
  const readingTimeMinutes = Math.max(1, Math.ceil(words.length / 200))
  
  // Count sentences - split by sentence-ending punctuation
  const sentences = textContent
    .trim()
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 0)
  
  const sentenceCount = sentences.length
  const averageWordsPerSentence = sentenceCount > 0 ? Math.round((words.length / sentenceCount) * 100) / 100 : 0
  
  // Find most frequent word
  const wordFrequency: { [key: string]: number } = {}
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
    if (cleanWord.length > 0) {
      wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1
    }
  })
  
  let mostFrequentWord = ''
  let mostFrequentWordCount = 0
  Object.entries(wordFrequency).forEach(([word, count]) => {
    if (count > mostFrequentWordCount) {
      mostFrequentWord = word
      mostFrequentWordCount = count
    }
  })
  
  return {
    wordCount: words.length,
    tokenCount,
    sentenceCount,
    averageWordsPerSentence,
    mostFrequentWord,
    mostFrequentWordCount,
    characterCount,
    paragraphCount: paragraphs,
    readingTimeMinutes,
    url: url
  }
}

export async function countWordsFromUrl(url: string): Promise<AnalysisResult> {
  try {
    // Capture user agent and IP information
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side request'
    
    // Check if we have a cached analysis
    const cachedAnalysis = await convex.query(api.analyses.getAnalysisByUrl, { url })
    
    const now = Date.now()
    const isExpired = !cachedAnalysis || (now - cachedAnalysis.createdAt) > SEVEN_DAYS_MS
    
    // If we have a fresh cached result, return it
    if (cachedAnalysis && !isExpired) {
      return {
        wordCount: cachedAnalysis.wordCount,
        tokenCount: cachedAnalysis.tokenCount ?? 0,
        sentenceCount: cachedAnalysis.sentenceCount,
        averageWordsPerSentence: cachedAnalysis.averageWordsPerSentence ?? 0,
        mostFrequentWord: cachedAnalysis.mostFrequentWord ?? '',
        mostFrequentWordCount: cachedAnalysis.mostFrequentWordCount ?? 0,
        characterCount: cachedAnalysis.characterCount ?? cachedAnalysis.wordCount * 5,
        paragraphCount: cachedAnalysis.paragraphCount ?? Math.ceil(cachedAnalysis.wordCount / 100),
        readingTimeMinutes: cachedAnalysis.readingTimeMinutes ?? Math.ceil(cachedAnalysis.wordCount / 200),
        url: cachedAnalysis.url
      }
    }
    
    // Fetch fresh data from webcrawler
    const response = await fetch(`/api/webcrawler?link=${encodeURIComponent(url)}`)
    
    if (!response.ok) {
      if (response.status === 429) {
        const errorData = await response.json()
        throw new Error(`Rate limit exceeded: ${errorData.message}`)
      }
      throw new Error(`Failed to fetch webpage: ${response.statusText}`)
    }
    
    const responseData = await response.json()
    
    // Handle both old and new response formats for backward compatibility
    let html: string
    let serverUserAgent: string | undefined
    let serverIP: string | undefined
    
    if (typeof responseData === 'string') {
      // Old format - just HTML string
      html = responseData
    } else if (responseData.html) {
      // New format - object with html and metadata
      html = responseData.html
      serverUserAgent = responseData.metadata?.userAgent
      serverIP = responseData.metadata?.clientIP
    } else {
      // Fallback - treat as HTML string
      html = responseData
    }
    
    const analysisResult = await analyzeHtmlContent(html, url)
    
    // Use server-provided user agent if available, otherwise use client-side
    const finalUserAgent = serverUserAgent || userAgent
    
    // Store or update the analysis in the database
    if (cachedAnalysis && isExpired) {
      // Update existing expired analysis
      await convex.mutation(api.analyses.updateAnalysis, {
        id: cachedAnalysis._id,
        wordCount: analysisResult.wordCount,
        tokenCount: analysisResult.tokenCount,
        sentenceCount: analysisResult.sentenceCount,
        averageWordsPerSentence: analysisResult.averageWordsPerSentence,
        mostFrequentWord: analysisResult.mostFrequentWord,
        mostFrequentWordCount: analysisResult.mostFrequentWordCount,
        characterCount: analysisResult.characterCount,
        paragraphCount: analysisResult.paragraphCount,
        readingTimeMinutes: analysisResult.readingTimeMinutes
      })
    } else if (!cachedAnalysis) {
      // Store new analysis with user agent and IP information
      await convex.mutation(api.analyses.storeAnalysis, {
        url: analysisResult.url,
        wordCount: analysisResult.wordCount,
        tokenCount: analysisResult.tokenCount,
        sentenceCount: analysisResult.sentenceCount,
        averageWordsPerSentence: analysisResult.averageWordsPerSentence,
        mostFrequentWord: analysisResult.mostFrequentWord,
        mostFrequentWordCount: analysisResult.mostFrequentWordCount,
        characterCount: analysisResult.characterCount,
        paragraphCount: analysisResult.paragraphCount,
        readingTimeMinutes: analysisResult.readingTimeMinutes,
        userAgent: finalUserAgent,
        ipAddress: serverIP
      })
    }
    
    return analysisResult
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to process URL')
  }
}