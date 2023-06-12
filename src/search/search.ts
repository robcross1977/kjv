import { absurd, pipe } from "fp-ts/function";
import { ParamsError, getParams, TypedParts } from "./params";
import * as A from "fp-ts/Array";
import * as ROA from "fp-ts/ReadonlyArray";
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as N from "fp-ts/number";
import * as S from "fp-ts/string";
import * as R from "fp-ts/Record";
import { fromArray } from "fp-ts/Set";

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

type SearchMsg =
  | "book not found"
  | "no main found"
  | "no subs found"
  | "book not found"
  | "chapter not found"
  | "verse not found";

type SearchError = IError<SearchMsg>;

type Chapters = Record<string, Set<number>>;
type Search = {
  name: ValidBookName;
  chapters: Chapters;
};

/**
 * The search function takes the query string and returns a bible search result.
 *
 * @param query The query string (e.g. "John 3:16")
 * @returns A bible search result in JSON format
 */
function search(query: string) {
  return pipe(
    E.Do,

    // Split the query into parts on the comma, the first part being the main part, the rest being subs
    E.bind("splits", () => getSplits(query)),

    // Get the main part from the splits
    E.bind("main", ({ splits }) => getMain(splits)),

    // Get the sub parts from the splits. The sub-parts are comma-seperated values after the main part.
    // Example: John 3:16,18-20,22-24
    E.bind("subs", ({ splits }) => getSubs(splits)),

    E.bindW("parts", ({ main }) => getParams(main)),
    E.bind("title", ({ parts }) => getTitle(parts)),
    E.bind("mainChapterVerses", ({ title, parts }) =>
      makeChapterArray(title, parts)
    ),
    E.bind("search", ({ title, mainChapterVerses }) => {
      return E.right(<Search>{
        name: title,
        chapters: mainChapterVerses,
      });
    }),
    E.map(({ search }) => search)
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

function makeChapterArray(title: ValidBookName, parts: TypedParts) {
  return buildSearchArray(title, parts);
}

function getChapterStart({
  type,
  chapterStart,
}: TypedParts): E.Either<SearchError | ParamsError, number> {
  switch (type) {
    case "book":
      return E.right(1);
    case "chapter":
    case "verse":
    case "verse-range":
    case "chapter-range":
    case "multi-chapter-verse":
    case "full-range":
      return chapterStart;
    default:
      return absurd(type);
  }
}

function getChapterEnd(
  title: ValidBookName,
  { type, chapterStart, chapterEnd }: TypedParts
): E.Either<SearchError | ParamsError, number> {
  switch (type) {
    case "book":
      return pipe(chapterCountFrom(title), E.right);
    case "chapter":
    case "verse":
    case "verse-range":
      return chapterStart;
    case "chapter-range":
    case "multi-chapter-verse":
    case "full-range":
      return chapterEnd;
    default:
      return absurd(type);
  }
}

function getVerseStart({
  type,
  verseStart,
}: TypedParts): E.Either<SearchError | ParamsError, number> {
  switch (type) {
    case "book":
    case "chapter":
    case "chapter-range":
    case "multi-chapter-verse":
      return E.right(1);
    case "verse":
    case "verse-range":
    case "full-range":
      return verseStart;
    default:
      return absurd(type);
  }
}

function getVerseEnd(
  title: ValidBookName,
  { type, chapterStart, chapterEnd, verseStart, verseEnd }: TypedParts
): E.Either<SearchError | ParamsError, number> {
  switch (type) {
    case "book":
    case "chapter-range":
      return pipe(
        E.Do,
        E.apS("chEnd", E.right(chapterCountFrom(title))),
        E.chainW(({ chEnd }) => {
          return pipe(
            verseCountFrom(title, chEnd),
            E.fromOption(() => errorFrom<SearchMsg>("verse not found"))
          );
        })
      );
    case "chapter":
      return pipe(
        E.Do,
        E.apS("chStart", chapterStart),
        E.chainW(({ chStart }) => {
          return pipe(
            verseCountFrom(title, chStart),
            E.fromOption(() => errorFrom<SearchMsg>("verse not found"))
          );
        })
      );
    case "verse":
      return verseStart;
    case "verse-range":
    case "multi-chapter-verse":
    case "full-range":
      return verseEnd;
    default:
      return absurd(type);
  }
}

function buildSearchArray(title: ValidBookName, parts: TypedParts) {
  return pipe(
    E.Do,
    E.apS("chapterStart", getChapterStart(parts)),
    E.apSW("chapterEnd", getChapterEnd(title, parts)),
    E.apSW("verseStart", getVerseStart(parts)),
    E.apS("verseEnd", getVerseEnd(title, parts)),
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
  const result = pipe(
    E.Do,
    E.apS(
      "chapterRange",
      E.right(getChapterRangeFromParts(title, chapterStart, chapterEnd))
    ),
    E.bind("chapterCount", ({ chapterRange }) =>
      E.right(chapterRange[1] - chapterRange[0] + 1)
    ),
    E.chain(({ chapterCount, chapterRange }) => {
      const arr = A.makeBy(chapterCount, (i) =>
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
            E.right(buildChapterVersesTuple(currentChapter, verseRange))
          )
        )
      );

      return pipe(
        arr,
        E.sequenceArray,
        E.map(ROA.toArray),
        E.map(R.fromEntries)
      );
    })
  );

  return result;
}

function buildChapterVersesTuple(
  currentChapter: number,
  verseRange: readonly [number, number]
): [string, Set<number>] {
  return [
    String(currentChapter),
    pipe(
      A.makeBy(verseRange[1] - verseRange[0] + 1, (j) => j + verseRange[0]),
      fromArray(N.Eq)
    ),
  ];
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
  const result = pipe(
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
    O.alt(() => {
      const endingRange = getVerseRangeForEndingChapter(
        title,
        currentChapter,
        chapterRange,
        verseEnd
      );

      return endingRange;
    }),
    O.alt(() =>
      getVerseRangeForContainedChapter(title, currentChapter, chapterRange)
    )
  );

  return result;
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
    O.fromPredicate((cc) => cc > chapterRange[0] && cc < chapterRange[1]),
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

export { Search, search };
