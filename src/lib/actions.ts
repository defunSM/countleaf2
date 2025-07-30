import * as cheerio from 'cheerio'

export interface AnalysisResult {
  wordCount: number
  tokenCount: number
  sentenceCount: number
  averageWordsPerSentence: number
  mostFrequentWord: string
  mostFrequentWordCount: number
  url: string
}

export async function countWordsFromUrl(url: string): Promise<AnalysisResult> {
  try {
    const response = await fetch(`/api/webcrawler?link=${encodeURIComponent(url)}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.statusText}`)
    }
    
    const html = await response.json()
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
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to process URL')
  }
}