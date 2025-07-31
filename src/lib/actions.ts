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
    url: url
  }
}

export async function countWordsFromUrl(url: string): Promise<AnalysisResult> {
  try {
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
    
    const html = await response.json()
    const analysisResult = await analyzeHtmlContent(html, url)
    
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
        mostFrequentWordCount: analysisResult.mostFrequentWordCount
      })
    } else if (!cachedAnalysis) {
      // Store new analysis
      await convex.mutation(api.analyses.storeAnalysis, {
        url: analysisResult.url,
        wordCount: analysisResult.wordCount,
        tokenCount: analysisResult.tokenCount,
        sentenceCount: analysisResult.sentenceCount,
        averageWordsPerSentence: analysisResult.averageWordsPerSentence,
        mostFrequentWord: analysisResult.mostFrequentWord,
        mostFrequentWordCount: analysisResult.mostFrequentWordCount
      })
    }
    
    return analysisResult
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to process URL')
  }
}