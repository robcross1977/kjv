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

export { type Book, type Chapter, type Verse };
