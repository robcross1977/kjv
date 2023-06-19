import { ValidBookName } from "./bible-meta";

// For results
type VerseRecords = Record<number, string>;
type ChapterRecords = Record<number, VerseRecords>;
type Book = Record<string, ChapterRecords>;

// For searching
type Chapters = Record<string, Set<number>>;
type Search = {
  name: ValidBookName;
  chapters: Chapters;
};

export { Book, ChapterRecords, VerseRecords, Chapters, Search };
