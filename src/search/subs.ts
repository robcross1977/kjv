import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as P from "fp-ts/Predicate";
import { ValidBookName } from "./bible-meta";
import { SearchType, TypedParts, getParams } from "./params";
import { flow, pipe } from "fp-ts/function";
import { makeChapterArray } from "./search-builder";
import { IError, errorFrom } from "./error";

// POSSIBLE SUBS
// -----------------------------------------------------------------------------
// CHAPTER
// -----------------------------------------------------------------------------
// Sub Regex: \d{1,3}
//
// This regex will be recognized as a chapter match if the previous part is a
// book, chapter or chapter-range.
//
// New query: `${title} ${sub}`
//
// -----------------------------------------------------------------------------
// CHAPTER RANGE
// -----------------------------------------------------------------------------
// Sub Regex: \d{1,3}-\d{1,3}
//
// This regex will be recognized as a chapter-range match if the previous part
// is a book, chapter or chapter-range.
//
// New query: `${title} ${sub}`
//
// -----------------------------------------------------------------------------
// CHAPTER  VERSE
// -----------------------------------------------------------------------------
// Sub Regex: \d{1,3}:\d{1,3}
//
// This regex will be recognized as a whole new chapter-verse match regardless
// of the previous part.
//
// New query: `${title} ${sub}`
//
// -----------------------------------------------------------------------------
// VERSE
// -----------------------------------------------------------------------------
// Sub Regex: \d{1,3}
//
// This regex will be recognized as a verse match if the previous part is a
// verse, verse-range, multi-chapter-verse or full-range.
//
// New query: `${title} ${previous.chapter}:${sub}`
//
// -----------------------------------------------------------------------------
// VERSE RANGE
// -----------------------------------------------------------------------------
// Sub Regex: \d{1,3}-\d{1,3}
//
// This regex will be recognized as a verse-range match if the previous part is
// a verse, verse-range, multi-chapter-verse or full-range.
//
// New query: `${title} ${previous.chapter}:${sub}`
//
// -----------------------------------------------------------------------------
// FULL VERSE RANGE
// -----------------------------------------------------------------------------
// Sub Regex: \d{1,3}:\d{1,3}-\d{1,3}
//
// This regex will be recognized as a full-verse-range match no matter the
// previous part.
//
// New query: `${title} ${previous.chapter}:${sub}`
//
// -----------------------------------------------------------------------------
// MULTI-CHAPTER VERSE
// -----------------------------------------------------------------------------
// Sub Regex: \d{1,3}-\d{1,3}:\d{1,3}
//
// This regex will be recognized as a multi-chapter-verse match no matter the
// previous part.
//
// New query: `${title} ${sub}`
//
// -----------------------------------------------------------------------------
// FULL RANGE
// -----------------------------------------------------------------------------
// Sub Regex: \d{1,3}:\d{1,3}-\d{1,3}:\d{1,3}
//
// This regex will be recognized as a full-range match no matter the previous
// part.
//
// New query: `${title} ${sub}`
// -----------------------------------------------------------------------------

type SubsMsg = "no subs found";
type SubsError = IError<SubsMsg>;

function getSubsChapterArrays(
  title: ValidBookName,
  parts: TypedParts,
  subs: string[]
) {
  return pipe(
    subs,
    A.scanLeft<string, TypedParts>(parts, (acc, sub) =>
      pipe(
        getNewQuery(title, acc, sub),
        O.chain(subQueryToTypedParts),
        O.getOrElseW(() => acc)
      )
    ),
    A.tail,
    E.fromOption<SubsError>(() => errorFrom<SubsMsg>("no subs found")),
    E.chainW(
      flow(
        A.map((p) => makeChapterArray(title, p)),
        E.sequenceArray
      )
    )
  );
}

function subQueryToTypedParts(query: string) {
  return pipe(getParams(query), O.fromEither);
}

function getNewQuery(title: ValidBookName, parts: TypedParts, sub: string) {
  return pipe(
    buildChapter(title, parts, sub),
    O.alt(() => buildChapterRange(title, parts, sub)),
    O.alt(() => buildVerse(title, parts, sub)),
    O.alt(() => buildVerseRange(title, parts, sub)),
    O.alt(() => buildFullVerseRange(title, parts, sub)),
    O.alt(() => buildChapterVerse(title, parts, sub)),
    O.alt(() => buildMultiChapterVerse(title, parts, sub)),
    O.alt(() => buildFullRange(title, parts, sub))
  );
}

type MatchData = [RegExp, P.Predicate<SearchType>];

function isChapter(previousType: SearchType) {
  return function (sub: string) {
    const chapterMatchData: MatchData = [
      /^\s*\d{1,3}\s*$/,
      (t) => t === "book" || t === "chapter" || t === "chapter-range",
    ];

    return getIsMatch(previousType, sub, chapterMatchData);
  };
}

function buildChapter(title: ValidBookName, parts: TypedParts, sub: string) {
  return pipe(
    sub,
    isChapter(parts.type),
    O.fromPredicate((is) => is),
    O.map(() => `${title} ${sub}`)
  );
}

function isChapterRange(previousType: SearchType) {
  return function (sub: string) {
    const chapterRangeMatchData: MatchData = [
      /^\s*\d{1,3}\s*-\s*\d{1,3}\s*$/,
      (t) => t === "book" || t === "chapter" || t === "chapter-range",
    ];

    return getIsMatch(previousType, sub, chapterRangeMatchData);
  };
}

function buildChapterRange(
  title: ValidBookName,
  parts: TypedParts,
  sub: string
) {
  return pipe(
    sub,
    isChapterRange(parts.type),
    O.fromPredicate((is) => is),
    O.map(() => `${title} ${sub}`)
  );
}

function isChapterVerse(previousType: SearchType) {
  return function (sub: string) {
    const chapterVerseMatchData: MatchData = [
      /^\s*\d{1,3}\s*:\s*\d{1,3}\s*$/,
      (_) => true,
    ];

    return getIsMatch(previousType, sub, chapterVerseMatchData);
  };
}

function buildChapterVerse(
  title: ValidBookName,
  parts: TypedParts,
  sub: string
) {
  return pipe(
    sub,
    isChapterVerse(parts.type),
    O.fromPredicate((is) => is),
    O.map(() => `${title} ${sub}`)
  );
}

function isVerse(previousParts: TypedParts) {
  return function (sub: string) {
    const verseMatchData: MatchData = [
      /^\s*\d{1,3}\s*$/,
      (t) =>
        E.isRight(previousParts.chapterStart) &&
        (t === "verse" ||
          t === "verse-range" ||
          t === "multi-chapter-verse" ||
          t === "full-range"),
    ];

    return getIsMatch(previousParts.type, sub, verseMatchData);
  };
}

function buildVerse(title: ValidBookName, parts: TypedParts, sub: string) {
  return pipe(
    sub,
    isVerse(parts),
    O.fromPredicate((is) => is),
    O.chain(() =>
      pipe(
        parts.chapterStart,
        O.fromEither,
        O.map((chapter) => `${title} ${chapter}:${sub}`)
      )
    )
  );
}

function isVerseRange(previousParts: TypedParts) {
  return function (sub: string) {
    const verseRangeMatchData: MatchData = [
      /^\s*\d{1,3}\s*-\s*\d{1,3}\s*$/,
      (t) =>
        E.isRight(previousParts.chapterStart) &&
        (t === "verse" ||
          t === "verse-range" ||
          t === "multi-chapter-verse" ||
          t === "full-range"),
    ];

    return getIsMatch(previousParts.type, sub, verseRangeMatchData);
  };
}

function buildVerseRange(title: ValidBookName, parts: TypedParts, sub: string) {
  return pipe(
    sub,
    isVerseRange(parts),
    O.fromPredicate((is) => is),
    O.chain(() =>
      pipe(
        parts.chapterStart,
        O.fromEither,
        O.map((chapter) => `${title} ${chapter}:${sub}`)
      )
    )
  );
}

function isFullVerseRange(previousParts: TypedParts) {
  return function (sub: string) {
    const verseRangeMatchData: MatchData = [
      /^\s*\d{1,3}\s*:\s*\d{1,3}\s*-\s*\d{1,3}\s*$/,
      () => true,
    ];

    return getIsMatch(previousParts.type, sub, verseRangeMatchData);
  };
}

function buildFullVerseRange(
  title: ValidBookName,
  parts: TypedParts,
  sub: string
) {
  return pipe(
    sub,
    isFullVerseRange(parts),
    O.fromPredicate((is) => is),
    O.chain(() => pipe(O.some(`${title} ${sub}`)))
  );
}

function isMultiChapterVerse(previousType: SearchType) {
  return function (sub: string) {
    const multiChapterVerseMatchData: MatchData = [
      /^\s*\d{1,3}\s*-\s*\d{1,3}\s*:\s*\d{1,3}\s*$/,
      (_) => true,
    ];
    return getIsMatch(previousType, sub, multiChapterVerseMatchData);
  };
}

function buildMultiChapterVerse(
  title: ValidBookName,
  parts: TypedParts,
  sub: string
) {
  return pipe(
    sub,
    isMultiChapterVerse(parts.type),
    O.fromPredicate((is) => is),
    O.map(() => `${title} ${sub}`)
  );
}

function isFullRange(previousType: SearchType) {
  return function (sub: string) {
    const fullRangeMatchData: MatchData = [
      /^\s*\d{1,3}\s*:\s*\d{1,3}\s*-\s*\d{1,3}\s*:\s*\d{1,3}\s*$/,
      (_) => true,
    ];

    return getIsMatch(previousType, sub, fullRangeMatchData);
  };
}

function buildFullRange(title: ValidBookName, parts: TypedParts, sub: string) {
  return pipe(
    sub,
    isFullRange(parts.type),
    O.fromPredicate((is) => is),
    O.map(() => `${title} ${sub}`)
  );
}

function getIsMatch(type: SearchType, sub: string, matchData: MatchData) {
  return pipe(
    type,
    O.fromPredicate(matchData[1]),
    O.map(() => new RegExp(matchData[0]).test(sub)),
    O.getOrElse(() => false)
  );
}

export { getSubsChapterArrays };
