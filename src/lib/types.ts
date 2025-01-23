import { z } from "zod";

// For results
const verseRecordsSchema = z.record(z.string());
type VerseRecords = z.infer<typeof verseRecordsSchema>;

const chapterRecordsSchema = z.record(verseRecordsSchema);
type ChapterRecords = z.infer<typeof chapterRecordsSchema>;

const bookRecordsSchema = z.record(chapterRecordsSchema);
type BookRecords = z.infer<typeof bookRecordsSchema>;

const wrappedRecordsSchema = z.object({
  type: z.string(),
  records: bookRecordsSchema,
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
