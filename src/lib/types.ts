import { ValidBookName } from "../search/bible-meta";

// For results
type VerseRecords = Record<string, string>;
type ChapterRecords = Record<string, VerseRecords>;
type BookRecords = Record<string, ChapterRecords>;

// For searching
type Chapters = Record<string, Set<number>>;
type Search = {
  name: ValidBookName;
  chapters: Chapters;
};

export { BookRecords, ChapterRecords, VerseRecords, Chapters, Search };
