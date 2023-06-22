import prisma from "../lib/prisma";
import { BookRecords, ChapterRecords, VerseRecords } from "../lib/types";
import { Prisma } from "@prisma/client";
import { pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";
import * as R from "fp-ts/Record";

function bibleToPrisma(kjv: BookRecords) {
  return pipe(
    kjv,
    createBooks,
    // NOTE: we are doing it this way because createMany is not supported with
    // sqlite. If we were sure we wouldn't use sqlite we could use createMany
    A.map((book) => prisma.book.create(book))
  );
}

function createBooks(book: BookRecords) {
  return pipe(
    book,
    R.mapWithIndex<string, ChapterRecords, Prisma.BookCreateArgs>(
      (key, value) => createBook(key, value)
    ),
    R.toArray,
    A.map((r) => r[1])
  );
}

function createBook(name: string, value: ChapterRecords) {
  return {
    data: {
      name,
      chapters: {
        create: createChapters(value),
      },
    },
  };
}

function createChapters(chapters: ChapterRecords) {
  return pipe(
    chapters,
    R.mapWithIndex<string, VerseRecords, Prisma.ChapterCreateWithoutBookInput>(
      (key, value) => createChapter(key, value)
    ),
    R.toArray,
    A.map((r) => r[1])
  );
}

function createChapter(key: string, value: VerseRecords) {
  return {
    number: Number(key),
    verses: {
      create: createVerses(value),
    },
  };
}

function createVerses(verses: VerseRecords) {
  return pipe(
    verses,
    R.mapWithIndex<string, string, Prisma.VerseCreateWithoutChapterInput>(
      (key, value) => createVerse(key, value)
    ),
    R.toArray,
    A.map((r) => r[1])
  );
}

function createVerse(key: string, value: string) {
  return {
    number: Number(key),
    text: value,
  };
}
export { bibleToPrisma };
