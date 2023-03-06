import { pipe } from "fp-ts/function";
import { Parts } from "./params";
import * as E from "fp-ts/Either";
import { Predicate } from "fp-ts/Predicate";
import { errorFrom, IError } from "./error";

type ChapterMsg = "invalid search parameters";
type ChapterError = IError<ChapterMsg>;

type SearchType =
  | "book"
  | "chapter"
  | "verse"
  | "verse-range"
  | "chapter-range"
  | "multi-chapter-verse"
  | "full-range";

// Ex: Job
const bookPredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}: Parts) =>
  E.isRight(book) &&
  E.isLeft(chapterStart) &&
  E.isLeft(chapterEnd) &&
  E.isLeft(verseStart) &&
  E.isLeft(verseEnd);

// Ex: Job 1
const chapterPredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}: Parts) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isLeft(chapterEnd) &&
  E.isLeft(verseStart) &&
  E.isLeft(verseEnd);

// Ex: Job 1:2
const versePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isLeft(chapterEnd) &&
  E.isRight(verseStart) &&
  E.isLeft(verseEnd);

// Ex: Job 1:2-3
const verseRangePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isLeft(chapterEnd) &&
  E.isRight(verseStart) &&
  E.isRight(verseEnd);

// Ex: Job 1-2
const chapterRangePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isRight(chapterEnd) &&
  E.isLeft(verseStart) &&
  E.isLeft(verseEnd);

// Ex. Job 1-2:3
const multiChapterVersePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isRight(chapterEnd) &&
  E.isLeft(verseStart) &&
  E.isRight(verseEnd);

const fullRangePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}: Parts) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isRight(chapterEnd) &&
  E.isRight(verseStart) &&
  E.isRight(verseEnd);

function onFalse() {
  return errorFrom<ChapterMsg>("invalid search parameters");
}

type SearchParts = Parts & { type: SearchType };

function wrapSearch(
  parts: Parts,
  pred: Predicate<Parts>,
  searchType: SearchType
) {
  return pipe(
    Object.assign({}, parts, { type: searchType }),
    E.fromPredicate<SearchParts, ChapterError>(pred, onFalse)
  );
}

// Ex: Job
function getBook(parts: Parts) {
  return wrapSearch(parts, bookPredicate, "book");
}

// Ex: Job 1
function getChapter(parts: Parts) {
  return wrapSearch(parts, chapterPredicate, "chapter");
}

// Ex: Job 1:2
function getVerse(parts: Parts) {
  return wrapSearch(parts, versePredicate, "verse");
}

// Ex: Job 1:2-3
function getVerseRange(parts: Parts) {
  return wrapSearch(parts, verseRangePredicate, "verse-range");
}

// Ex: Job 1-2
function getChapterRange(parts: Parts) {
  return wrapSearch(parts, chapterRangePredicate, "chapter-range");
}

// Ex: Job 1-2:2
function getMultiChapterVerse(parts: Parts) {
  return wrapSearch(parts, multiChapterVersePredicate, "multi-chapter-verse");
}

// Ex: Job 1-2:2
function getFullRange(parts: Parts) {
  return wrapSearch(parts, fullRangePredicate, "full-range");
}

function getTypedParts(parts: Parts) {
  return pipe(
    parts,
    getBook,
    E.orElse((_) => getChapter(parts)),
    E.orElse((_) => getVerse(parts)),
    E.orElse((_) => getVerseRange(parts)),
    E.orElse((_) => getChapterRange(parts)),
    E.orElse((_) => getMultiChapterVerse(parts)),
    E.orElse((_) => getFullRange(parts))
  );
}

export {
  type ChapterMsg,
  type ChapterError,
  type SearchType,
  getTypedParts as getSearchParts,
};
