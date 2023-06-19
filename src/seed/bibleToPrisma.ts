import { Prisma } from "@prisma/client";
import { pipe } from "fp-ts/function";
import { map } from "fp-ts/Array";
import { Book, Chapter, Verse } from "../search/types";

function bibleToPrisma(book: Book): Prisma.BookCreateArgs {
  return {
    data: {
      name: book.name,
      chapters: {
        create: createChapters(book.chapters),
      },
    },
  };
}

function createChapters(chapters: Chapter[]) {
  return pipe(
    chapters,
    map<Chapter, Prisma.ChapterCreateWithoutBookInput>((c) => {
      return {
        number: c.number,
        verses: {
          create: createVerses(c.verses),
        },
      };
    })
  );
}

function createVerses(verses: Verse[]) {
  return pipe(
    verses,
    map<Verse, Prisma.VerseCreateWithoutChapterInput>((v) => {
      return {
        number: v.number,
        text: String(v.text),
      };
    })
  );
}

export { bibleToPrisma };
