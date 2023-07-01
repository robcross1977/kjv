import { ValidBookName } from "../search/bible-meta";
import { SearchType } from "../search/params";

// For results
type VerseRecords = Record<string, string>;
type ChapterRecords = Record<string, VerseRecords>;
type BookRecords = Record<string, ChapterRecords>;
type WrappedRecords = { type: SearchType, records: BookRecords };

// For searching
type Chapters = Record<string, Set<number>>;
type Search = {
  name: ValidBookName;
  type: SearchType,
  chapters: Chapters;
};

export { BookRecords, WrappedRecords, ChapterRecords, VerseRecords, Chapters, Search };
