import { pipe } from "fp-ts/function";
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

function getParams(search: string) {
  return pipe(
    search,
    getGroups<InputGroupKeys>(inputRegex, "g"),
    map(getParts)
  );
}

type Parts = {
  book: Either<ParamsError, string>;
  chapterStart: Either<ParamsError, number>;
  chapterEnd: Either<ParamsError, number>;
  verseStart: Either<ParamsError, number>;
  verseEnd: Either<ParamsError, number>;
};

type PartsWrapped = Either<ParamsError, Parts>;

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
  return `${getBookNumString(num)}${trimBook(text)}`;
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

function buildParam(
  candidateParts: (string | undefined)[]
): Either<ParamsError, number> {
  return pipe(
    candidateParts,
    findFirst((p) => p !== undefined),
    fromOption(() => errorFrom<ParamsMsg>("value is null or undefined")),
    map(Number)
  );
}

function trimBook(name: string) {
  return pipe(name, replace(/\s\s+/g, " "), trim);
}

function getBookNumString(bookNum: string) {
  return pipe(
    bookNum,
    of,
    chain(
      fromPredicate(nonEmptyStringPredicate, (err) =>
        errorFrom<ParamsMsg>("string must have at least 1 character", err)
      )
    ),
    map(addSpace),
    getOrElse(() => "")
  );
}

function addSpace(s: string) {
  return `${s} `;
}

export { type ParamsError, type PartsWrapped, type Parts, getParams };
