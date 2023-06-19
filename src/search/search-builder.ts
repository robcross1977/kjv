import { absurd, pipe } from "fp-ts/function";
import { ParamsError, TypedParts } from "./params";
import * as A from "fp-ts/Array";
import * as ROA from "fp-ts/ReadonlyArray";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { Monoid, concatAll } from "fp-ts/Monoid";
import * as N from "fp-ts/number";
import * as R from "fp-ts/Record";
import { fromArray } from "fp-ts/Set";
import {
  ValidBookName,
  chapterCountFrom,
  getChapterRangeFromParts,
  getVerseRangeFromParts,
  verseCountFrom,
} from "./bible-meta";
import { IError, errorFrom } from "./error";
import { Chapters, Search } from "./types";
import { Magma } from "fp-ts/Magma";

type SearchBuilderMsg =
  | "verse not found"
  | "can't concat searches with different names";
type SearchBuilderError = IError<SearchBuilderMsg>;

function makeChapterArray(title: ValidBookName, parts: TypedParts) {
  return buildSearchArray(title, parts);
}

const SetNumberMagma: Magma<Set<number>> = {
  concat: (first, second) => fromArray(N.Ord)([...first, ...second]),
};

const chaptersMonoid: Monoid<Chapters> = {
  concat: (first, second) => R.union(SetNumberMagma)(second)(first),
  empty: {},
};

const concatChapters = concatAll(chaptersMonoid);

function getChapterStart({
  type,
  chapterStart,
}: TypedParts): E.Either<SearchBuilderError | ParamsError, number> {
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
): E.Either<SearchBuilderError | ParamsError, number> {
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
}: TypedParts): E.Either<SearchBuilderError | ParamsError, number> {
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
): E.Either<SearchBuilderError | ParamsError, number> {
  switch (type) {
    case "book":
    case "chapter-range":
      return pipe(
        E.Do,
        E.apS(
          "chEnd",
          type === "book" ? E.right(chapterCountFrom(title)) : chapterEnd
        ),
        E.chainW(({ chEnd }) => {
          return pipe(
            verseCountFrom(title, chEnd),
            E.fromOption(() => errorFrom<SearchBuilderMsg>("verse not found"))
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
            E.fromOption(() => errorFrom<SearchBuilderMsg>("verse not found"))
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
    E.fromOption<SearchBuilderError>(() =>
      errorFrom<SearchBuilderMsg>("verse not found")
    )
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

export { Search, makeChapterArray, concatChapters };
