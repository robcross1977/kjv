import {
  ValidBookName,
  chapterCountFrom,
  getChapterRangeFromParts,
  getVerseRangeFromParts,
  verseCountFrom,
} from "./bible-meta";
import { IError, errorFrom } from "./error";
import { Chapters, Search } from "../lib/types";
import { ParamsError, TypedParts } from "./params";
import { absurd, pipe } from "fp-ts/function";
import { Magma } from "fp-ts/Magma";
import { Monoid, concatAll } from "fp-ts/Monoid";
import { fromArray } from "fp-ts/Set";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as N from "fp-ts/number";
import * as O from "fp-ts/Option";
import * as R from "fp-ts/Record";
import * as ROA from "fp-ts/ReadonlyArray";

type SearchBuilderMsg =
  | "verse not found"
  | "can't concat searches with different names";
type SearchBuilderError = IError<SearchBuilderMsg>;

/**
 * The makeChapterArray function takes the book name and the parts and returns
 * an object holding the actual data (book/chapter/verses) we want to search
 * for wrapped in a Record<string, Set<number>>, the key being the chapter
 * number and the Set<number> being the verses we want to find in that chapter.
 * 
 * @param title The ValidBookName we are going to build a search object for.
 * @param parts The TypedParts we'll use as the parameters
 * @returns a Record<string, Set<number>> holding the actual data we want to
 * search for, wrapped in an Either. The key is the chapter number and the
 * Set<number> is the verses we want to find in that chapter.
 */
function makeChapterArray(title: ValidBookName, parts: TypedParts) {
  return buildSearchArray(title, parts);
}

// The SetNumberMagma is used to describe how to concat the Set<number> values
// in our search object tha tdefine the verses we want to search for within a
// chapter. We might have many sub-searches, each with their own Set<number>
// and this joins them together.
const SetNumberMagma: Magma<Set<number>> = {
  concat: (first, second) => fromArray(N.Ord)([...first, ...second]),
};

// The chapterMonoid object describes how to join two chapters together, the
// main purpose being so that we can use the monoid that describes how to join
// two objects to pass to the concatAll function which creates a function that
// can be used to join as many chapters together as we want based on the monoid.
const chaptersMonoid: Monoid<Chapters> = {
  // With a monoid you must designate a concat function describing how to join
  // two Chapters together. In this case we use the R.union function to join
  // them together as each chapter is a Record. 
  concat: (first, second) => R.union(SetNumberMagma)(second)(first),

  // A monoid must also include a definition for "empty"
  empty: {},
};

// The concatAll takes a Monoid desribing how to concat two Chapters together 
// and builds a function that can be used to concat as many chapters as we want
// together from it. 
const concatChapters = concatAll(chaptersMonoid);

// The getChapterStart function takes a searchType and the chapterStart, and
// based on the searchType returns the chapterStart or 1.
function getChapterStart({
  type,
  chapterStart,
}: TypedParts): E.Either<SearchBuilderError | ParamsError, number> {
  switch (type) {
    // If we have a book search no chapterStart is provided so we return 1 since
    // 1 is the default chapterStart for a book search.
    case "book":
      return E.right(1);
    // In the cases of chapter, verse, verse-range, chapter-range,
    // multi-chapter-verse or full range a chapterStart must be provided so we
    // will use it
    case "chapter":
    case "verse":
    case "verse-range":
    case "chapter-range":
    case "multi-chapter-verse":
    case "full-range":
      return chapterStart;
    // In the case of an invalid searchType we return an error
    default:
      return absurd(type);
  }
}

// The getChapterEnd function takes a title, a searchType, the chapterStart and
// chapterEnd and calculates the chapterEnd based on the context. For a book
// no chapterEnd will be provided so we want the number of chapters. For a
// chapter, verse or verse-range search the chapterEnd will be the same as the
// chapterStart so we'll just use the chapterStart. For a chapter-range,
// multi-chapter-verse or full-range search the chapterEnd will be provided so
// we'll use it.
function getChapterEnd(
  title: ValidBookName,
  { type, chapterStart, chapterEnd }: TypedParts
): E.Either<SearchBuilderError | ParamsError, number> {
  switch (type) {
    // For a book search the chapterEnd is the number of chapters in the book
    // as the chapterEnd is not provided. 
    case "book":
      return pipe(chapterCountFrom(title), E.right);
    // For a chapter, verse or verse-range search the chapterEnd is the same as
    // the chapterStart so we'll use the chapterStart. 
    case "chapter":
    case "verse":
    case "verse-range":
      return chapterStart;
    // For a chapter-range, multi-chapter-verse or full-range search the
    // chapterEnd is provided so we'll use it.
    case "chapter-range":
    case "multi-chapter-verse":
    case "full-range":
      return chapterEnd;
    // For an invalid searchType we return an error
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
