import * as cheerio from 'cheerio'

export async function countWordsFromUrl(url: string): Promise<{ wordCount: number; url: string }> {
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
    
    return {
      wordCount: words.length,
      url: url
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to process URL')
  }
}