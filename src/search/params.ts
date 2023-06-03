import { flow, pipe } from "fp-ts/function";
import { replace, trim } from "fp-ts/string";
import { GroupKeys, inputRegex } from "./regex";
import {
  Either,
  chainW,
  fromOption,
  map,
  of,
  fromPredicate,
  chain,
  getOrElse,
  isRight,
  isLeft,
  orElse,
} from "fp-ts/Either";
import { Predicate } from "fp-ts/Predicate";
import { getGroups } from "./regex";
import { errorFrom, IError } from "./error";
import { findFirst } from "fp-ts/Array";

type ParamsMsg =
  | "no groups found"
  | "value is null or undefined"
  | "string must have at least 1 character"
  | "invalid search parameters";

type ParamsError = IError<ParamsMsg>;

const getParams = flow(
  getGroups<GroupKeys>(inputRegex, "gi"),
  chainW((parts) => getParts(parts))
);

type Parts = {
  book: Either<ParamsError, string>;
  chapterStart: Either<ParamsError, number>;
  chapterEnd: Either<ParamsError, number>;
  verseStart: Either<ParamsError, number>;
  verseEnd: Either<ParamsError, number>;
};

type PartsWrapped = Either<ParamsError, Parts>;

const buildParam = flow(
  findFirst((p) => p !== undefined),
  fromOption(() => errorFrom<ParamsMsg>("value is null or undefined")),
  map(Number)
);

function getParts(parts: Record<GroupKeys, string>): PartsWrapped {
  const {
    chapterStart,
    chapterVerseChapterStart,
    chapterRangeChapterStart,
    chapterVerseChapterEnd,
    chapterRangeChapterEnd,
    chapterVerseVerseStart,
    chapterVerseVerseEnd,
    chapterRangeVerseEnd,
  } = parts;

  return of({
    book: buildBook(parts),
    chapterStart: buildParam([
      chapterStart,
      chapterVerseChapterStart,
      chapterRangeChapterStart,
    ]),
    chapterEnd: buildParam([chapterVerseChapterEnd, chapterRangeChapterEnd]),
    verseStart: buildParam([chapterVerseVerseStart]),
    verseEnd: buildParam([chapterVerseVerseEnd, chapterRangeVerseEnd]),
  });
}

const nonEmptyStringPredicate: Predicate<string> = (v = "") => v.length > 0;

function getFormattedBookName(num: string = "", text: string = "") {
  return `${getBookNumString(of(num))}${trimBook(text)}`;
}

function buildBook({
  bookNum: num = "",
  bookName: text = "",
}: Record<GroupKeys, string>): Either<ParamsError, string> {
  return pipe(
    getFormattedBookName(num, text),
    fromPredicate(nonEmptyStringPredicate, () =>
      errorFrom<ParamsMsg>("no groups found")
    )
  );
}

const trimBook = flow(replace(/\s\s+/g, " "), trim);

const getBookNumString = flow(
  chain(
    fromPredicate(nonEmptyStringPredicate, (err) =>
      errorFrom<ParamsMsg>("string must have at least 1 character", err)
    )
  ),
  map(addSpace),
  getOrElse(() => "")
);

function addSpace(s: string) {
  return `${s} `;
}

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
  return errorFrom<ParamsMsg>("invalid search parameters");
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
    fromPredicate<SearchParts, ParamsError>(pred, onFalse)
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
  type ParamsError,
  type ParamsMsg,
  type PartsWrapped,
  type Parts,
  getParams,
  type SearchType,
  type TypedParts,
  getTypedParts,
};
