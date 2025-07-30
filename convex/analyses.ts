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

// Get analysis statistics
export const getAnalysisStats = query({
  handler: async (ctx) => {
    const analyses = await ctx.db.query("analyses").collect();
    
    if (analyses.length === 0) {
      return {
        totalAnalyses: 0,
        totalWords: 0,
        averageWords: 0,
        totalCharacters: 0,
        averageCharacters: 0,
        totalReadingTime: 0,
        averageReadingTime: 0,
      };
    }

    const totalWords = analyses.reduce((sum, analysis) => sum + analysis.wordCount, 0);
    const totalCharacters = analyses.reduce((sum, analysis) => sum + analysis.characterCount, 0);
    const totalReadingTime = analyses.reduce((sum, analysis) => sum + analysis.readingTimeMinutes, 0);

    return {
      totalAnalyses: analyses.length,
      totalWords,
      averageWords: Math.round(totalWords / analyses.length),
      totalCharacters,
      averageCharacters: Math.round(totalCharacters / analyses.length),
      totalReadingTime,
      averageReadingTime: Math.round(totalReadingTime / analyses.length),
    };
  },
}); 