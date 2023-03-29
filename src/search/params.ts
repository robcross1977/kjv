import { flow, pipe } from "fp-ts/function";
import * as S from "fp-ts/string";
import { InputGroupKeys, inputRegex } from "./input";
import * as E from "fp-ts/Either";
import { Predicate } from "fp-ts/Predicate";
import { getGroups } from "./matcher";
import { errorFrom, IError } from "./error";
import * as A from "fp-ts/Array";

type ParamsMsg =
  | "no groups found"
  | "value is null or undefined"
  | "string must have at least 1 character";

type ParamsError = IError<ParamsMsg>;

const getParams = flow(
  getGroups<InputGroupKeys>(inputRegex, "gi"),
  E.chainW((parts) => getParts(parts))
);

type Parts = {
  book: E.Either<ParamsError, string>;
  chapterStart: E.Either<ParamsError, number>;
  chapterEnd: E.Either<ParamsError, number>;
  verseStart: E.Either<ParamsError, number>;
  verseEnd: E.Either<ParamsError, number>;
};

type PartsWrapped = E.Either<ParamsError, Parts>;

const buildParam = flow(
  A.findFirst((p) => p !== undefined),
  E.fromOption(() => errorFrom<ParamsMsg>("value is null or undefined")),
  E.map(Number)
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

  return E.of({
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
  return `${getBookNumString(E.of(num))}${trimBook(text)}`;
}

function buildBook({
  bookNum: num = "",
  bookName: text = "",
}: Record<InputGroupKeys, string>): E.Either<ParamsError, string> {
  return pipe(
    getFormattedBookName(num, text),
    E.fromPredicate(nonEmptyStringPredicate, () =>
      errorFrom<ParamsMsg>("no groups found")
    )
  );
}

const trimBook = flow(S.replace(/\s\s+/g, " "), S.trim);

const getBookNumString = flow(
  E.chain(
    E.fromPredicate(nonEmptyStringPredicate, (err) =>
      errorFrom<ParamsMsg>("string must have at least 1 character", err)
    )
  ),
  E.map(addSpace),
  E.getOrElse(() => "")
);

function addSpace(s: string) {
  return `${s} `;
}

export { type ParamsError, type PartsWrapped, type Parts, getParams };
