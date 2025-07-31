import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Store a new analysis
export const storeAnalysis = mutation({
  args: {
    url: v.string(),
    wordCount: v.number(),
    tokenCount: v.optional(v.number()),
    sentenceCount: v.number(),
    averageWordsPerSentence: v.optional(v.number()),
    mostFrequentWord: v.optional(v.string()),
    mostFrequentWordCount: v.optional(v.number()),
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

// Get analysis by URL (for caching)
export const getAnalysisByUrl = query({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const analysis = await ctx.db
      .query("analyses")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .order("desc")
      .first();
    
    // Return with defaults for missing fields
    if (analysis) {
      return {
        ...analysis,
        tokenCount: analysis.tokenCount ?? 0,
        averageWordsPerSentence: analysis.averageWordsPerSentence ?? 0,
        mostFrequentWord: analysis.mostFrequentWord ?? '',
        mostFrequentWordCount: analysis.mostFrequentWordCount ?? 0,
      };
    }
    return analysis;
  },
});

// Update existing analysis
export const updateAnalysis = mutation({
  args: {
    id: v.id("analyses"),
    wordCount: v.number(),
    tokenCount: v.optional(v.number()),
    sentenceCount: v.number(),
    averageWordsPerSentence: v.optional(v.number()),
    mostFrequentWord: v.optional(v.string()),
    mostFrequentWordCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    await ctx.db.patch(id, {
      ...updateData,
      createdAt: Date.now(),
    });
    return id;
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
        totalTokens: 0,
        medianTokens: 0,
        totalSentences: 0,
        medianSentences: 0,
        medianAverageWordsPerSentence: 0,
        // Keep averages for backward compatibility
        averageWords: 0,
        averageTokens: 0,
        averageSentences: 0,
        averageAverageWordsPerSentence: 0,
      };
    }

    const totalWords = analyses.reduce((sum, analysis) => sum + analysis.wordCount, 0);
    const totalTokens = analyses.reduce((sum, analysis) => sum + analysis.tokenCount, 0);
    const totalSentences = analyses.reduce((sum, analysis) => sum + analysis.sentenceCount, 0);

    // Extract arrays for median calculation
    const wordCounts = analyses.map(a => a.wordCount);
    const tokenCounts = analyses.map(a => a.tokenCount);
    const sentenceCounts = analyses.map(a => a.sentenceCount);
    const averageWordsPerSentence = analyses.map(a => a.averageWordsPerSentence);

    return {
      totalAnalyses: analyses.length,
      totalWords,
      medianWords: calculateMedian(wordCounts),
      totalTokens,
      medianTokens: calculateMedian(tokenCounts),
      totalSentences,
      medianSentences: calculateMedian(sentenceCounts),
      medianAverageWordsPerSentence: calculateMedian(averageWordsPerSentence),
      // Keep averages for backward compatibility
      averageWords: Math.round(totalWords / analyses.length),
      averageTokens: Math.round(totalTokens / analyses.length),
      averageSentences: Math.round(totalSentences / analyses.length),
      averageAverageWordsPerSentence: Math.round(averageWordsPerSentence.reduce((sum, val) => sum + val, 0) / analyses.length * 100) / 100,
    };
  },
}); 