import { pipe } from "fp-ts/function";
import { Parts } from "./params";
import { isRight, isLeft, fromPredicate, orElse } from "fp-ts/Either";
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
  isRight(book) &&
  isLeft(chapterStart) &&
  isLeft(chapterEnd) &&
  isLeft(verseStart) &&
  isLeft(verseEnd);

// Ex: Job 1
const chapterPredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}: Parts) =>
  isRight(book) &&
  isRight(chapterStart) &&
  isLeft(chapterEnd) &&
  isLeft(verseStart) &&
  isLeft(verseEnd);

// Ex: Job 1:2
const versePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  isRight(book) &&
  isRight(chapterStart) &&
  isLeft(chapterEnd) &&
  isRight(verseStart) &&
  isLeft(verseEnd);

// Ex: Job 1:2-3
const verseRangePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  isRight(book) &&
  isRight(chapterStart) &&
  isLeft(chapterEnd) &&
  isRight(verseStart) &&
  isRight(verseEnd);

// Ex: Job 1-2
const chapterRangePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  isRight(book) &&
  isRight(chapterStart) &&
  isRight(chapterEnd) &&
  isLeft(verseStart) &&
  isLeft(verseEnd);

// Ex. Job 1-2:3
const multiChapterVersePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  isRight(book) &&
  isRight(chapterStart) &&
  isRight(chapterEnd) &&
  isLeft(verseStart) &&
  isRight(verseEnd);

const fullRangePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}: Parts) =>
  isRight(book) &&
  isRight(chapterStart) &&
  isRight(chapterEnd) &&
  isRight(verseStart) &&
  isRight(verseEnd);

function onFalse() {
  return errorFrom<ChapterMsg>("invalid search parameters");
}

type SearchParts = Parts & { type: SearchType };

// The wrapSearch takes a Parts type, and adds the SearchType
// to it based on the predicate that works, so we know how
// to handle it in later sections of the code.
function wrapSearch(
  parts: Parts,
  pred: Predicate<Parts>,
  searchType: SearchType
) {
  return pipe(
    Object.assign({}, parts, { type: searchType }),
    fromPredicate<SearchParts, ChapterError>(pred, onFalse)
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

type TypedParts = Parts & { type: SearchType };

function getTypedParts(parts: Parts) {
  return pipe(
    parts,
    getBook,
    orElse((_) => getChapter(parts)),
    orElse((_) => getVerse(parts)),
    orElse((_) => getVerseRange(parts)),
    orElse((_) => getChapterRange(parts)),
    orElse((_) => getMultiChapterVerse(parts)),
    orElse((_) => getFullRange(parts))
  );
}

export {
  type ChapterMsg,
  type ChapterError,
  type SearchType,
  type TypedParts,
  getTypedParts,
};
