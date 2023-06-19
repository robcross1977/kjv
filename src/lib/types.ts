import { ValidBookName } from "../search/bible-meta";

type Verse = {
  number: number;
  text?: string;
};

type Chapter = {
  number: number;
  verses: Verse[];
};

interface Book {
  name: string;
  chapters: Chapter[];
}

type Chapters = Record<string, Set<number>>;
type Search = {
  name?: ValidBookName;
  chapters: Chapters;
};

export { Book, Chapter, Verse, Chapters, Search };
