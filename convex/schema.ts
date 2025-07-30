import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analyses: defineTable({
    url: v.string(),
    wordCount: v.number(),
    characterCount: v.number(),
    sentenceCount: v.number(),
    paragraphCount: v.number(),
    readingTimeMinutes: v.number(),
    createdAt: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_url", ["url"]),
}); 