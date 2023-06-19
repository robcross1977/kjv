import prisma from "../lib/prisma";
import { Book } from "../search/types";
import { bibleToPrisma } from "./bibleToPrisma";
import {
  OneChronicles,
  OneCorinthians,
  OneJohn,
  OneKings,
  OnePeter,
  OneSamuel,
  OneThessalonians,
  OneTimothy,
  TwoChronicles,
  TwoCorinthians,
  TwoJohn,
  TwoKings,
  TwoPeter,
  TwoSamuel,
  TwoThessalonians,
  TwoTimothy,
  ThreeJohn,
  Acts,
  Amos,
  Colossians,
  Daniel,
  Deuteronomy,
  Ecclesiastes,
  Ephesians,
  Esther,
  Exodus,
  Ezekiel,
  Ezra,
  Galatians,
  Genesis,
  Habakkuk,
  Haggai,
  Hebrews,
  Hosea,
  Isaiah,
  James,
  Jeremiah,
  Job,
  Joel,
  John,
  Jonah,
  Joshua,
  Jude,
  Judges,
  Lamentations,
  Leviticus,
  Luke,
  Malachi,
  Mark,
  Matthew,
  Micah,
  Nahum,
  Nehemiah,
  Numbers,
  Obadiah,
  Philemon,
  Philippians,
  Proverbs,
  Psalms,
  Revelation,
  Romans,
  Ruth,
  SongOfSolomon,
  Titus,
  Zechariah,
  Zephaniah,
} from "../search/books";

const books: Book[] = [
  OneChronicles,
  OneCorinthians,
  OneJohn,
  OneKings,
  OnePeter,
  OneSamuel,
  OneThessalonians,
  OneTimothy,
  TwoChronicles,
  TwoCorinthians,
  TwoJohn,
  TwoKings,
  TwoPeter,
  TwoSamuel,
  TwoThessalonians,
  TwoTimothy,
  ThreeJohn,
  Acts,
  Amos,
  Colossians,
  Daniel,
  Deuteronomy,
  Ecclesiastes,
  Ephesians,
  Esther,
  Exodus,
  Ezekiel,
  Ezra,
  Galatians,
  Genesis,
  Habakkuk,
  Haggai,
  Hebrews,
  Hosea,
  Isaiah,
  James,
  Jeremiah,
  Job,
  Joel,
  John,
  Jonah,
  Joshua,
  Jude,
  Judges,
  Lamentations,
  Leviticus,
  Luke,
  Malachi,
  Mark,
  Matthew,
  Micah,
  Nahum,
  Nehemiah,
  Numbers,
  Obadiah,
  Philemon,
  Philippians,
  Proverbs,
  Psalms,
  Revelation,
  Romans,
  Ruth,
  SongOfSolomon,
  Titus,
  Zechariah,
  Zephaniah,
];

// K.I.S.S. - The bible should never change. If you are seeding the db
// easier to delete data and create rather than upsert
const clearDb = () => prisma.book.deleteMany({});

(async () => {
  console.log("Starting DB Seed");
  await prisma.$connect();

  console.log("Writing KJV");
  await prisma.$transaction([
    clearDb(),
    ...books.map((b) => prisma.book.create(bibleToPrisma(b))),
  ]);

  await prisma.$disconnect();
  console.log("DB seed complete");
})();
