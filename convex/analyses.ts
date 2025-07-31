import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Store a new analysis
export const storeAnalysis = mutation({
  args: {
    url: v.string(),
    wordCount: v.number(),
    characterCount: v.number(),
    sentenceCount: v.number(),
    paragraphCount: v.number(),
    readingTimeMinutes: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const analysisId = await ctx.db.insert("analyses", {
      ...args,
      createdAt: Date.now(),
    });
    return analysisId;
  },
});

// Get all analyses (for admin purposes)
export const getAllAnalyses = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const analyses = await ctx.db
      .query("analyses")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
    return analyses;
  },
});

// Get recent analyses
export const getRecentAnalyses = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const analyses = await ctx.db
      .query("analyses")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
    return analyses;
  },
});

// Get total count of analyses
export const getTotalAnalyses = query({
  handler: async (ctx) => {
    const count = await ctx.db.query("analyses").collect();
    return count.length;
  },
});

// Helper function to calculate median
const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  } else {
    return sorted[mid];
  }
};

// Get analysis statistics
export const getAnalysisStats = query({
  handler: async (ctx) => {
    const analyses = await ctx.db.query("analyses").collect();
    
    if (analyses.length === 0) {
      return {
        totalAnalyses: 0,
        totalWords: 0,
        medianWords: 0,
        totalCharacters: 0,
        medianCharacters: 0,
        totalSentences: 0,
        medianSentences: 0,
        totalParagraphs: 0,
        medianParagraphs: 0,
        totalReadingTime: 0,
        medianReadingTime: 0,
        // Keep averages for backward compatibility
        averageWords: 0,
        averageCharacters: 0,
        averageSentences: 0,
        averageParagraphs: 0,
        averageReadingTime: 0,
      };
    }

    const totalWords = analyses.reduce((sum, analysis) => sum + analysis.wordCount, 0);
    const totalCharacters = analyses.reduce((sum, analysis) => sum + analysis.characterCount, 0);
    const totalSentences = analyses.reduce((sum, analysis) => sum + analysis.sentenceCount, 0);
    const totalParagraphs = analyses.reduce((sum, analysis) => sum + analysis.paragraphCount, 0);
    const totalReadingTime = analyses.reduce((sum, analysis) => sum + analysis.readingTimeMinutes, 0);

    // Extract arrays for median calculation
    const wordCounts = analyses.map(a => a.wordCount);
    const characterCounts = analyses.map(a => a.characterCount);
    const sentenceCounts = analyses.map(a => a.sentenceCount);
    const paragraphCounts = analyses.map(a => a.paragraphCount);
    const readingTimes = analyses.map(a => a.readingTimeMinutes);

    return {
      totalAnalyses: analyses.length,
      totalWords,
      medianWords: calculateMedian(wordCounts),
      totalCharacters,
      medianCharacters: calculateMedian(characterCounts),
      totalSentences,
      medianSentences: calculateMedian(sentenceCounts),
      totalParagraphs,
      medianParagraphs: calculateMedian(paragraphCounts),
      totalReadingTime,
      medianReadingTime: calculateMedian(readingTimes),
      // Keep averages for backward compatibility
      averageWords: Math.round(totalWords / analyses.length),
      averageCharacters: Math.round(totalCharacters / analyses.length),
      averageSentences: Math.round(totalSentences / analyses.length),
      averageParagraphs: Math.round(totalParagraphs / analyses.length),
      averageReadingTime: Math.round(totalReadingTime / analyses.length),
    };
  },
}); 