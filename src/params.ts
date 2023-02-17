import { pipe } from "fp-ts/function";
import { replace, trim } from "fp-ts/string";
import { inputRegex } from "./input";
import {
  Either,
  fromNullable,
  map,
  chain,
  fromPredicate,
  getOrElse,
  of,
} from "fp-ts/Either";
import { Predicate } from "fp-ts/Predicate";
import { getGroups } from "./matcher";
import { errorFrom, IError } from "./error";

type ParamsMsg =
  | "no groups found"
  | "value is null or undefined"
  | "parts empty"
  | "parsed string is NaN"
  | "bookNum not found"
  | "string must have at least 1 character";

type ParamsError = IError<ParamsMsg>;

function getParams(search: string) {
  return pipe(search, getGroups(inputRegex, "g"), map(getParts));
}

type PartsInner = {
  book: Either<ParamsError, string>;
  chapterStart: Either<ParamsError, number>;
  chapterEnd: Either<ParamsError, number>;
  verseStart: Either<ParamsError, number>;
  verseEnd: Either<ParamsError, number>;
};

type PartsWrapped = Either<ParamsError, PartsInner>;

function getParts(parts: Record<string, string>): PartsWrapped {
  return of({
    book: buildBook(parts),
    chapterStart: buildChapterStart(parts),
    chapterEnd: buildChapterEnd(parts),
    verseStart: buildVerseStart(parts),
    verseEnd: buildVerseEnd(parts),
  });
}

const nonEmptyStringPredicate: Predicate<string> = (v = "") =>
  typeof v === "string" && v.length > 0;

function getFormattedBookName(num?: string, text?: string) {
  return `${getBookNumString(num)}${trimBook(text ?? "")}`;
}

function buildBook({
  bookNum: num,
  bookName: text,
}: Record<string, string>): Either<ParamsError, string> {
  return pipe(
    getFormattedBookName(num, text),
    fromPredicate(nonEmptyStringPredicate, () =>
      errorFrom<ParamsMsg>("no groups found")
    )
  );
}

function buildChapterStart({
  chapterStart,
  chapterVerseChapterStart,
  chapterRangeChapterStart,
}: Record<string, string | undefined>) {
  return toNumber(
    chapterStart ?? chapterVerseChapterStart ?? chapterRangeChapterStart
  );
}

function buildChapterEnd({
  chapterVerseChapterEnd,
  chapterRangeChapterEnd,
}: Record<string, string>) {
  return toNumber(chapterVerseChapterEnd ?? chapterRangeChapterEnd);
}

function buildVerseStart({
  chapterVerseVerseStart,
}: Record<string, string | undefined>) {
  return toNumber(chapterVerseVerseStart);
}

function buildVerseEnd({
  chapterVerseVerseEnd,
  chapterRangeVerseEnd,
}: Record<string, string>) {
  return toNumber(chapterVerseVerseEnd ?? chapterRangeVerseEnd);
}

const toStringNumberNotNaNPredicate: Predicate<string> = (v) =>
  !Number.isNaN(Number(v));

function toNumber(val?: string): Either<ParamsError, number> {
  return pipe(
    val,
    fromNullable(errorFrom<ParamsMsg>("value is null or undefined")),
    chain(
      fromPredicate(toStringNumberNotNaNPredicate, (err) =>
        errorFrom<ParamsMsg>("parsed string is NaN", err)
      )
    ),
    map(Number)
  );
}

function trimBook(name: string) {
  return pipe(name, replace(/\s\s+/g, " "), trim);
}

function getBookNumString(bookNum?: string) {
  return pipe(
    bookNum,
    fromNullable<ParamsError>(errorFrom<ParamsMsg>("bookNum not found")),
    chain(
      fromPredicate(nonEmptyStringPredicate, (err) =>
        errorFrom<ParamsMsg>("string must have at least 1 character", err)
      )
    ),
    map((n) => `${n} `),
    getOrElse(() => "")
  );
}

export { type ParamsError, type PartsWrapped, type PartsInner, getParams };
