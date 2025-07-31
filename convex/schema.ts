import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analyses: defineTable({
    url: v.string(),
    wordCount: v.number(),
    tokenCount: v.optional(v.number()),
    sentenceCount: v.number(),
    averageWordsPerSentence: v.optional(v.number()),
    mostFrequentWord: v.optional(v.string()),
    mostFrequentWordCount: v.optional(v.number()),
    characterCount: v.optional(v.number()),
    paragraphCount: v.optional(v.number()),
    readingTimeMinutes: v.optional(v.number()),
    createdAt: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_url", ["url"]),
}); 