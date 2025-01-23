import { z } from "zod";

// For results
const verseRecordsSchema = z
  .record(z.string().describe("Verse text").optional())
  .describe("Verse records");
type VerseRecords = z.infer<typeof verseRecordsSchema>;

const chapterRecordsSchema = z
  .record(verseRecordsSchema.describe("Verses"))
  .describe("Chapter records");
type ChapterRecords = z.infer<typeof chapterRecordsSchema>;

const bookRecordsSchema = z
  .record(chapterRecordsSchema.describe("Chapters"))
  .describe("book records");
type BookRecords = z.infer<typeof bookRecordsSchema>;

const wrappedRecordsSchema = z.object({
  type: z.string().describe("type of search performed"),
  records: bookRecordsSchema.describe("records"),
});
type WrappedRecords = z.infer<typeof wrappedRecordsSchema>;

// For searching
const chaptersSchema = z.record(z.set(z.number()));
type Chapters = z.infer<typeof chaptersSchema>;

const searchSchema = z.object({
  name: z.string(),
  type: z.string(),
  chapters: chaptersSchema,
});
type Search = z.infer<typeof searchSchema>;

export {
  bookRecordsSchema,
  BookRecords,
  wrappedRecordsSchema,
  WrappedRecords,
  chapterRecordsSchema,
  ChapterRecords,
  verseRecordsSchema,
  VerseRecords,
  chaptersSchema,
  Chapters,
  searchSchema,
  Search,
};
