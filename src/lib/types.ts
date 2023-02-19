export type Verse = {
  number: number;
  text?: string;
};

export type Chapter = {
  number: number;
  verses: Array<Verse>;
};

export interface Book {
  name: string;
  chapters: Array<Chapter>;
}
