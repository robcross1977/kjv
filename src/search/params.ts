import { flow, pipe } from "fp-ts/function";
import { replace, trim } from "fp-ts/string";
import { InputGroupKeys, inputRegex } from "./input";
import {
  Either,
  map,
  chain,
  fromPredicate,
  getOrElse,
  of,
  fromOption,
  chainW,
} from "fp-ts/Either";
import { Predicate } from "fp-ts/Predicate";
import { getGroups } from "./matcher";
import { errorFrom, IError } from "./error";
import { findFirst } from "fp-ts/Array";

type ParamsMsg =
  | "no groups found"
  | "value is null or undefined"
  | "string must have at least 1 character";

type ParamsError = IError<ParamsMsg>;

const getParams = flow(
  getGroups<InputGroupKeys>(inputRegex, "gi"),
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

function getParts(parts: Record<InputGroupKeys, string>): PartsWrapped {
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
}: Record<InputGroupKeys, string>): Either<ParamsError, string> {
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

function splitSearches() {
  // split searches on ; into search requests
}

export { type ParamsError, type PartsWrapped, type Parts, getParams };
