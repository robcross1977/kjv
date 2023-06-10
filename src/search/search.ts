import { pipe } from "fp-ts/function";
import { ParamsError, getParams, TypedParts } from "./params";
import * as A from "fp-ts/Array";
import * as ROA from "fp-ts/ReadonlyArray";
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as S from "fp-ts/string";
import {
  ValidBookName,
  chapterCountFrom,
  getBookName,
  getChapterRangeFromParts,
  getVerseRangeFromParts,
  verseCountFrom,
} from "./bible-meta";
import { IError, errorFrom } from "./error";
import { ReadonlyNonEmptyArray } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { Chapter, Verse } from "../lib/types";
import { validationT } from "fp-ts";

type SearchMsg =
  | "book not found"
  | "no main found"
  | "no subs found"
  | "chapter not found"
  | "verse not found";
type SearchError = IError<SearchMsg>;

function search(query: string) {
  return pipe(
    E.Do,
    E.bind("splits", () => getSplits(query)),
    E.bind("main", ({ splits }) => getMain(splits)),
    E.bind("subs", ({ splits }) => getSubs(splits)),
    E.bindW("parts", ({ main }) => getParams(main)),
    E.bind("title", ({ parts }) => getTitle(parts)),
    E.bind("mainChapterVerses", ({ title, parts }) =>
      makeChapterArray(title, parts)
    )
    // add subs to chapter verses (might use that function that is like reduce but keeps the state)
    // get final bible search result
    // query the sql database and return the result
  );
}

function getSplits(query: string) {
  return pipe(
    query,
    S.split(","),
    E.of<SearchError, ReadonlyNonEmptyArray<string>>
  );
}

function getMain(splits: ReadonlyNonEmptyArray<string>) {
  return pipe(
    splits,
    RONEA.head,
    E.fromPredicate(
      (h) => h.length > 0,
      () => errorFrom<SearchMsg>("no main found")
    )
  );
}

function getSubs(splits: ReadonlyNonEmptyArray<string>) {
  return pipe(
    splits,
    RONEA.tail,
    ROA.map(S.trim),
    ROA.filter((i) => i.length > 0),
    E.of<SearchError, readonly string[]>
  );
}

function getTitle(parts: TypedParts) {
  return pipe(
    parts.book,
    E.match(E.left, (book) =>
      pipe(
        book,
        getBookName,
        E.fromOption<SearchError | ParamsError>(() =>
          errorFrom<SearchMsg>("book not found")
        )
      )
    )
  );
}

function makeChapterArray(
  title: ValidBookName,
  parts: TypedParts
): E.Either<SearchError | ParamsError, readonly Chapter[]> {
  switch (parts.type) {
    case "book":
      return buildBook(title);
    case "chapter":
      return buildChapter(title, parts);
    case "verse":
      return buildVerse(title, parts);
    case "verse-range":
      return buildVerseRange(title, parts);
    case "chapter-range":
      return buildChapterRange(title, parts);
    case "multi-chapter-verse":
      return buildMultiChapterVerse(title, parts);
    case "full-range":
      return buildFullRange(title, parts);
    default: {
      const exhaustiveCheck: never = parts.type;
      throw new Error(exhaustiveCheck);
    }
  }
}

function buildBook(title: ValidBookName) {
  return pipe(
    E.Do,
    E.apS("chapterStart", E.right(1)),
    E.apS("chapterEnd", E.right(chapterCountFrom(title))),
    E.apS("verseStart", E.right(1)),
    E.bind("verseEnd", ({ chapterEnd }) =>
      pipe(
        verseCountFrom(title, chapterEnd),
        E.fromOption(() => errorFrom<SearchMsg>("verse not found"))
      )
    ),
    E.chain(({ chapterStart, chapterEnd, verseStart, verseEnd }) =>
      buildChapters(title, chapterStart, chapterEnd, verseStart, verseEnd)
    )
  );
}

function buildChapter(
  title: ValidBookName,
  parts: TypedParts
): E.Either<SearchError | ParamsError, readonly Chapter[]> {
  return pipe(
    E.Do,
    E.apS("chapterStart", parts.chapterStart),
    E.apS("chapterEnd", parts.chapterStart),
    E.apS("verseStart", E.right(1)),
    E.bindW("verseEnd", ({ chapterEnd }) =>
      pipe(
        verseCountFrom(title, chapterEnd),
        E.fromOption(() => errorFrom<SearchMsg>("verse not found"))
      )
    ),
    E.chainW(({ chapterStart, chapterEnd, verseStart, verseEnd }) =>
      buildChapters(title, chapterStart, chapterEnd, verseStart, verseEnd)
    )
  );
}

function buildVerse(
  title: ValidBookName,
  parts: TypedParts
): E.Either<SearchError | ParamsError, readonly Chapter[]> {
  return pipe(
    E.Do,
    E.apS("chapterStart", parts.chapterStart),
    E.apS("chapterEnd", parts.chapterStart),
    E.apS("verseStart", parts.verseStart),
    E.apS("verseEnd", parts.verseStart),
    E.chainW(({ chapterStart, chapterEnd, verseStart, verseEnd }) =>
      buildChapters(title, chapterStart, chapterEnd, verseStart, verseEnd)
    )
  );
}

function buildVerseRange(
  title: ValidBookName,
  parts: TypedParts
): E.Either<SearchError | ParamsError, readonly Chapter[]> {
  return pipe(
    E.Do,
    E.apS("chapterStart", parts.chapterStart),
    E.apS("chapterEnd", parts.chapterStart),
    E.apS("verseStart", parts.verseStart),
    E.apS("verseEnd", parts.verseEnd),
    E.chainW(({ chapterStart, chapterEnd, verseStart, verseEnd }) =>
      buildChapters(title, chapterStart, chapterEnd, verseStart, verseEnd)
    )
  );
}

function buildChapterRange(
  title: ValidBookName,
  parts: TypedParts
): E.Either<SearchError | ParamsError, readonly Chapter[]> {
  return pipe(
    E.Do,
    E.apS("chapterStart", parts.chapterStart),
    E.apS("chapterEnd", parts.chapterEnd),
    E.apS("verseStart", E.right(1)),
    E.bindW("verseEnd", ({ chapterEnd }) =>
      pipe(
        verseCountFrom(title, chapterEnd),
        E.fromOption(() => errorFrom<SearchMsg>("verse not found"))
      )
    ),
    E.chainW(({ chapterStart, chapterEnd, verseStart, verseEnd }) =>
      buildChapters(title, chapterStart, chapterEnd, verseStart, verseEnd)
    )
  );
}

function buildMultiChapterVerse(
  title: ValidBookName,
  parts: TypedParts
): E.Either<SearchError | ParamsError, readonly Chapter[]> {
  return pipe(
    E.Do,
    E.apS("chapterStart", parts.chapterStart),
    E.apS("chapterEnd", parts.chapterStart),
    E.apS("verseStart", parts.verseStart),
    E.apS("verseEnd", parts.verseEnd),
    E.chainW(({ chapterStart, chapterEnd, verseStart, verseEnd }) =>
      buildChapters(title, chapterStart, chapterEnd, verseStart, verseEnd)
    )
  );
}

function buildFullRange(
  title: ValidBookName,
  parts: TypedParts
): E.Either<SearchError | ParamsError, readonly Chapter[]> {
  return pipe(
    E.Do,
    E.apS("chapterStart", parts.chapterStart),
    E.apS("chapterEnd", parts.chapterEnd),
    E.apS("verseStart", parts.verseStart),
    E.apS("verseEnd", parts.verseEnd),
    E.chainW(({ chapterStart, chapterEnd, verseStart, verseEnd }) =>
      buildChapters(title, chapterStart, chapterEnd, verseStart, verseEnd)
    )
  );
}

function buildChapters(
  title: ValidBookName,
  chapterStart: number,
  chapterEnd: number,
  verseStart: number,
  verseEnd: number
) {
  return pipe(
    E.Do,
    E.apS(
      "chapterRange",
      E.right(getChapterRangeFromParts(title, chapterStart, chapterEnd))
    ),
    E.bind("chapterCount", ({ chapterRange }) =>
      E.right(chapterRange[0] - chapterRange[0] + 1)
    ),
    E.chain(({ chapterCount, chapterRange }) =>
      pipe(
        A.makeBy(chapterCount, (i) =>
          pipe(
            E.Do,
            E.apS("currentChapter", E.right(i + chapterRange[0])),
            E.bind("verseRange", ({ currentChapter }) =>
              getVerseRange(
                title,
                currentChapter,
                chapterRange,
                verseStart,
                verseEnd
              )
            ),
            E.chain(({ currentChapter, verseRange }) =>
              E.right(buildChapterArray(currentChapter, verseRange))
            )
          )
        ),
        E.sequenceArray<SearchError, Chapter>
      )
    )
  );
}

function buildChapterArray(
  currentChapter: number,
  verseRange: readonly [number, number]
) {
  return {
    number: currentChapter,
    verses: A.makeBy<Verse>(verseRange[1] - verseRange[0] + 1, (j) => {
      return {
        number: j + verseRange[0],
      };
    }),
  };
}

function getVerseRange(
  title: ValidBookName,
  currentChapter: number,
  chapterRange: readonly [number, number],
  verseStart: number,
  verseEnd: number
) {
  return pipe(
    getFinalVerseRange(
      title,
      currentChapter,
      chapterRange,
      verseStart,
      verseEnd
    ),
    E.fromOption<SearchError>(() => errorFrom<SearchMsg>("verse not found"))
  );
}

// This function assumes you've already validated the chapter range
function getFinalVerseRange(
  title: ValidBookName,
  currentChapter: number,
  chapterRange: readonly [number, number],
  verseStart: number,
  verseEnd: number
) {
  return pipe(
    getVerseRangeForSingleChapter(
      title,
      currentChapter,
      chapterRange,
      verseStart,
      verseEnd
    ),
    O.alt(() =>
      getVerseRangeForStartingChapter(
        title,
        currentChapter,
        chapterRange,
        verseStart
      )
    ),
    O.alt(() =>
      getVerseRangeForEndingChapter(
        title,
        currentChapter,
        chapterRange,
        verseEnd
      )
    ),
    O.alt(() =>
      getVerseRangeForContainedChapter(title, currentChapter, chapterRange)
    )
  );
}

function getVerseRangeForSingleChapter(
  title: ValidBookName,
  currentChapter: number,
  chapterRange: readonly [number, number],
  verseStart: number,
  verseEnd: number
) {
  return pipe(
    currentChapter,
    O.fromPredicate((cc) => cc === chapterRange[0] && cc === chapterRange[1]),
    O.chain(() =>
      getVerseRangeFromParts(title, currentChapter, verseStart, verseEnd)
    )
  );
}

function getVerseRangeForStartingChapter(
  title: ValidBookName,
  currentChapter: number,
  chapterRange: readonly [number, number],
  verseStart: number
) {
  return pipe(
    currentChapter,
    O.fromPredicate((cc) => cc === chapterRange[0] && cc < chapterRange[1]),
    O.chain(() =>
      pipe(
        verseCountFrom(title, currentChapter),
        O.chain((verseCount) =>
          getVerseRangeFromParts(title, currentChapter, verseStart, verseCount)
        )
      )
    )
  );
}

function getVerseRangeForEndingChapter(
  title: ValidBookName,
  currentChapter: number,
  chapterRange: readonly [number, number],
  verseEnd: number
) {
  return pipe(
    currentChapter,
    O.fromPredicate((cc) => cc > chapterRange[0] && cc === chapterRange[1]),
    O.chain(() => getVerseRangeFromParts(title, currentChapter, 1, verseEnd))
  );
}

function getVerseRangeForContainedChapter(
  title: ValidBookName,
  currentChapter: number,
  chapterRange: readonly [number, number]
) {
  return pipe(
    currentChapter,
    O.fromPredicate((cc) => cc > chapterRange[0] && cc === chapterRange[1]),
    O.chain(() =>
      pipe(
        verseCountFrom(title, currentChapter),
        O.chain((verseCount) =>
          getVerseRangeFromParts(title, currentChapter, 1, verseCount)
        )
      )
    )
  );
}

export { search };
