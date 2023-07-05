import { nonNameChars, ones, twos, threes } from "./regex";
import { Bounded, clamp } from "fp-ts/Bounded";
import { pipe } from "fp-ts/function";
import { findFirst } from "fp-ts/ReadonlyArray";
import * as N from "fp-ts/number";
import * as O from "fp-ts/Option";
import * as ROA from "fp-ts/ReadonlyArray";

const bookNames = [
  "1 chronicles",
  "1 corinthians",
  "1 john",
  "1 kings",
  "1 peter",
  "1 samuel",
  "1 thessalonians",
  "1 timothy",
  "2 chronicles",
  "2 corinthians",
  "2 john",
  "2 kings",
  "2 peter",
  "2 samuel",
  "2 thessalonians",
  "2 timothy",
  "3 john",
  "acts",
  "amos",
  "colossians",
  "daniel",
  "deuteronomy",
  "ecclesiastes",
  "ephesians",
  "esther",
  "exodus",
  "ezekiel",
  "ezra",
  "galatians",
  "genesis",
  "habakkuk",
  "haggai",
  "hebrews",
  "hosea",
  "isaiah",
  "james",
  "jeremiah",
  "job",
  "joel",
  "john",
  "jonah",
  "joshua",
  "jude",
  "judges",
  "lamentations",
  "leviticus",
  "luke",
  "malachi",
  "mark",
  "matthew",
  "micah",
  "nahum",
  "nehemiah",
  "numbers",
  "obadiah",
  "philemon",
  "philippians",
  "proverbs",
  "psalms",
  "revelation",
  "romans",
  "ruth",
  "song of solomon",
  "titus",
  "zechariah",
  "zephaniah",
] as const;
type BookNames = typeof bookNames;

const orderedBookNames: readonly ValidBookName[] = [
  "genesis",
  "exodus",
  "leviticus",
  "numbers",
  "deuteronomy",
  "joshua",
  "judges",
  "ruth",
  "1 samuel",
  "2 samuel",
  "1 kings",
  "2 kings",
  "1 chronicles",
  "2 chronicles",
  "ezra",
  "nehemiah",
  "esther",
  "job",
  "psalms",
  "proverbs",
  "ecclesiastes",
  "song of solomon",
  "isaiah",
  "jeremiah",
  "lamentations",
  "ezekiel",
  "daniel",
  "hosea",
  "joel",
  "amos",
  "obadiah",
  "jonah",
  "micah",
  "nahum",
  "habakkuk",
  "zephaniah",
  "haggai",
  "zechariah",
  "malachi",
  "matthew",
  "mark",
  "luke",
  "john",
  "acts",
  "romans",
  "1 corinthians",
  "2 corinthians",
  "galatians",
  "ephesians",
  "philippians",
  "colossians",
  "1 thessalonians",
  "2 thessalonians",
  "1 timothy",
  "2 timothy",
  "titus",
  "philemon",
  "hebrews",
  "james",
  "1 peter",
  "2 peter",
  "1 john",
  "2 john",
  "3 john",
  "jude",
  "revelation",
] as const;

/**
 * ValidBookName
 * @description The ValidBookName type is a union of all the valid book names
 */
type ValidBookName = BookNames[number];

/**
 * The getBookName function takes a string, that may or may not be a book name
 * in the form of a "ValidBookName", uses some regex and gets the first match
 * from the bookNames array, which you can use in other parts of your program.
 *
 * This is to make it easy to take in a free form search, but then get a
 * concrete type for the book name.
 *
 * @param search The free-form search string
 * @returns An Option containing a ValidBookName if one is found, or none
 * otherwise
 */
function getBookName(search: string) {
  return pipe(
    // Take the bookNames array
    bookNames,

    // Find a match for the search string
    findFirst((b) => matchKey([b, search]))
  );
}

// A match candidate is a tuple of a book name and a search string. The book
// name is a ValidBookName to match against, and the search string is the
// string input by the user.
type MatchCandidate = [book: ValidBookName, search: string];

// The matchKey function takes a matchCandidate, gets a regex for the book
// portion of the match candidate, then tests the search against it to see if
// it is a match.
function matchKey([book, search]: MatchCandidate): boolean {
  return new RegExp(bookMeta[book].match, "i").test(search);
}

// The BibleMeta type is data about the Bible. It is a Record of ValidBookNames
// to an object containing a regex to match against, and a Record of verse
// counts that are indexed by the chapter number for that book.
type BibleMeta = Record<
  ValidBookName,
  {
    match: string;
    verseCounts: Record<number, number>;
  }
>;

// The chapterCountFrom function takes a ValidBookName and returns the number
// of chapters in that book.
function chapterCountFrom(book: ValidBookName): number {
  return Object.keys(bookMeta[book].verseCounts).length;
}

/**
 * The getChapterRangeFromParts function takes a book name, a min and a max
 * number for the chapter range requested. It returns a tuple of the min and
 * max chapter number, in the corrected order if need be, clamped between 1
 * and the number of chapters in the book.
 *
 * @param book The book to get the range from
 * @param min The minimum requested chapter number
 * @param max The maximum requested chapter number
 * @returns A range of chapter numbers for the book that are clamped between 1
 * and the number of chapters in the book.
 */
function getChapterRangeFromParts(
  book: ValidBookName,
  min: number,
  max: number
): [min: number, max: number] {
  return pipe(
    O.Do,

    // Get the number of chapters in the book
    O.apS("numChapters", pipe(chapterCountFrom(book), O.of)),

    // Get a bounded range from 1 to the number of chapters in the book
    // in the case the user asked for chapters outside of reality
    O.bind("boundedRange", ({ numChapters }) => getBounds(numChapters)),

    // Get the clamped lower bound
    O.bind("start", ({ boundedRange }) => clampStart(min, max, boundedRange)),

    // Get the clamped upper bound
    O.bind("end", ({ boundedRange }) => clampEnd(min, max, boundedRange)),

    // Map the results into a tuple containing the min and max
    O.map(({ start, end }) => <[min: number, max: number]>[start, end]),

    // Get the value from the option. Note: this should never fail because
    // there is nothing in it to fail, but I couldn't figure out how to get
    // absurd to work here, which I'd have preferred.
    O.getOrElse<[min: number, max: number]>(() => [1, 1])
  );
}

// The getBoundsForChapters function takes the number of chapters in a book
// and produces an Option of a Bounded number. This should never return a
// None, it is only in an Option for the Do notation to keep it short. The
// lower bounds will ALWAYS be a 1 and the upper whatever you pass in as max.
function getBounds(max: number) {
  return pipe(
    // Create the bounded range
    {
      bottom: 1,
      top: max,
      compare: N.Ord.compare,
      equals: N.Ord.equals,
    },

    // Wrap it in an Option
    O.of<Bounded<number>>
  );
}

// The clamp start takes a min, a max and a bounded range and returns the the
// lower bound clamped to the bounded range and wrapped in an Option.
function clampStart(min: number, max: number, boundedRange: Bounded<number>) {
  return pipe(
    // Get the lower of the min and max (we can't guarantee the user will)
    min < max ? min : max,

    // Clamp it to the bounded range
    clamp(boundedRange),

    // Wrap it in an Option
    O.of
  );
}

// The clamp start takes a min, a max and a bounded range and returns the the
// upper bound clamped to the bounded range and wrapped in an Option.
function clampEnd(min: number, max: number, boundedRange: Bounded<number>) {
  return pipe(
    // Get the lower of the min and max (we can't guarantee the user will)
    max > min ? max : min,

    // Clamp it to the bounded range
    clamp(boundedRange),

    // Wrap it in an Option
    O.of
  );
}

/**
 * The chapterExissInBook function takes a book and a chapter number, and
 * returns true if the chapter exists in that book and false otherwise.
 *
 * @param book The book to check
 * @param chapter The chapter to check for
 * @returns A boolean value indiciating whether that chapter is present in the
 * book
 */
function chapterExistsInBook(book: ValidBookName, chapter: number): boolean {
  return chapter >= 1 && chapter <= chapterCountFrom(book);
}

/**
 * The verseCountFrom function takes a book and a chapter number and returns
 * an Option with the number of verses in that chapter. If the chapter doesn't
 * exist a None will be returned.
 *
 * @param book The book to check for the chapter in
 * @param chapter The chapter to check for the verseCount
 * @returns The number of verses in the chapter wrapped in an Option, if the
 * chapter doesn't exist a None will be returned.
 */
function verseCountFrom(
  book: ValidBookName,
  chapter: number
): O.Option<number> {
  // Check if the chapter exists in the book
  return chapterExistsInBook(book, chapter)
    ? // if it does return the number of verses wrapped in an Option
      O.some(bookMeta[book].verseCounts[chapter])
    : // If not return a None
      O.none;
}

/**
 * The getVerseRangeFromParts function takes a book name, a chapter, a min and a
 * max number for the verse range requested. It returns a tuple of the min and
 * max verse number for a book/chapter, in the corrected order if need be,
 * clamped between 1 and the number of chapters in the book.
 *
 * @param book The book to get the range from
 * @param chapter The chapter to get the range from
 * @param min The minimum requested verse number
 * @param max The maximum requested verse number
 * @returns A range of verse numbers for the book that are clamped between 1
 * and the number of chapters in the book. Wrapped in an Option as the chapter
 * might not exist in the book. Note: This is different from
 * getChapterRangeFromParts which doesn't need to be in an Option as it should
 * never fail.
 */
function getVerseRangeFromParts(
  book: ValidBookName,
  chapter: number,
  min: number,
  max: number
): O.Option<readonly [number, number]> {
  return pipe(
    O.Do,

    // Get the number of chapters in the book
    O.apS("numVerses", verseCountFrom(book, chapter)),

    // Get a bounded range from 1 to the number of chapters in the book
    // in the case the user asked for chapters outside of reality
    O.bind("boundedRange", ({ numVerses }) => getBounds(numVerses)),

    // Get the clamped lower bound
    O.bind("start", ({ boundedRange }) => clampStart(min, max, boundedRange)),

    // Get the clamped upper bound
    O.bind("end", ({ boundedRange }) => clampEnd(min, max, boundedRange)),

    // Map the results into a tuple containing the min and max
    O.map(({ start, end }) => <[min: number, max: number]>[start, end])
  );
}

/**
 * The verseExistsInChapter takes a book, a chapter and a verse and returns true
 * if it exists and false otherwise.
 *
 * @param book The book to search for the verse
 * @param chapter The chapter to search for the verse
 * @param verse The verse to search for
 * @returns Whether or not the verse exists in that book/chapter combination
 */
function verseExistsInChapter(
  book: ValidBookName,
  chapter: number,
  verse: number
): boolean {
  return pipe(
    // Get the verse count
    verseCountFrom(book, chapter),

    // Return a "some" if the predicate is true and a None otherwise
    O.chain(O.fromPredicate((count) => verse >= 1 && verse <= count)),

    // If the preceding predicate was true, change the mapping from a number
    // to "true"
    O.map(() => true),

    // Get it out if it is true, and return false otherwise
    O.getOrElse(() => false)
  );
}

// The getNextBook function returns the name of the next book in the Bible, in
// order that the books appear in the KJV, or none if there is no next book.
function getNextBook(book: ValidBookName): O.Option<ValidBookName> {
  return pipe(
    // Take the array of ordered book names
    orderedBookNames,

    // Find the index of the current book
    ROA.findIndex((b) => b === book),

    O.chain((i) => {
      // Get the next index (if there are more books)
      const nextIndex = i + 1;

      // Check if the next index has a book
      return ROA.isOutOfBound(nextIndex, orderedBookNames)
        ? // if not return a None
          O.none
        : // if so return the next book
          O.some(orderedBookNames[nextIndex]);
    })
  );
}

// The getPreviousBook function returns the name of the previous book in the
// bible, in order that the books appear in the KJV, or none if there is no
// previous book.
function getPreviousBook(book: ValidBookName): O.Option<ValidBookName> {
  return pipe(
    // Take the array of ordered book names
    orderedBookNames,

    // Find the index of the current book
    ROA.findIndex((b) => b === book),

    O.chain((i) => {
      // Get the previous index (if there is a book at that location)
      const prevIndex = i - 1;

      // Check if the previous index has a book
      return ROA.isOutOfBound(prevIndex, orderedBookNames)
        ? // if not return a None
          O.none
        : // if so return the previous book
          O.some(orderedBookNames[prevIndex]);
    })
  );
}

// The getNextChapter function takes a book and a chapter number and returns
// the next chapter number in the book, or the first chapter of the next book
// if there is no next chapter in the current book, or none if there is no next
// book.
function getNextChapter(
  book: ValidBookName,
  chapter: number
): O.Option<readonly [ValidBookName, number, number]> {
  // increment chapter number
  const newChapterNumber = chapter + 1;

  // Check if the new chapter number exists in the book
  // If so return it and the book name it came from
  if (chapterExistsInBook(book, newChapterNumber)) {
    return O.some([book, newChapterNumber, 1] as const);
  }

  // If not, get the next book name if there is one and the first chapter of
  // that book. Get a none otherwise.
  return pipe(
    O.Do,
    O.apS("nextBook", getNextBook(book)),
    O.chain(({ nextBook }) => O.some([nextBook, 1, 1] as const))
  );
}

// The getPreviousChapter function takes a book and a chapter number and returns
// the previous chapter number in the book, or the last chapter of the previous
// book if there is no next chapter in the current book, or none if there is no
// next book.
function getPreviousChapter(
  book: ValidBookName,
  chapter: number
): O.Option<readonly [ValidBookName, number, number]> {
  // decrement chapter number
  const newChapterNumber = chapter - 1;

  // Check if the new chapter number exists in the book
  // If so return it and the book name it came from
  if (chapterExistsInBook(book, newChapterNumber)) {
    const verseCountOpt = verseCountFrom(
      book,
      newChapterNumber
    );

    if(O.isSome(verseCountOpt)) {
      return O.some([book, newChapterNumber, verseCountOpt.value] as const);
    }

    return O.none;
  }

  // If not, get the next book name if there is one with the last chapter of
  // the previous book. Return a none otherwise.
  return pipe(
    O.Do,
    O.apS("prevBook", getPreviousBook(book)),
    O.chain(({ prevBook }) => {
      const verseCountOpt = verseCountFrom(
        prevBook,
        chapterCountFrom(prevBook)
      );

      if (O.isSome(verseCountOpt)) {
        return O.some([
          prevBook,
          chapterCountFrom(prevBook),
          verseCountOpt.value,
        ] as const);
      }

      return O.none;
    })
  );
}

function getNextVerse(book: ValidBookName, chapter: number, verse: number) {
  // increment verse number
  const newVerseNumber = verse + 1;

  // Check if the new verse number exists in the book
  // If so return it and the book name it came from
  if (verseExistsInChapter(book, chapter, newVerseNumber)) {
    return O.some([book, chapter, newVerseNumber] as const);
  }

  // If not, get the next chapter number if there is one and the first verse of
  // that chapter. Return a none otherwise.
  return pipe(
    O.Do,
    O.apS("nextChapter", getNextChapter(book, chapter)),
    O.chain(({ nextChapter }) => O.some([nextChapter[0], nextChapter[1], nextChapter[2]] as const))
  );
}

function getPreviousVerse(book: ValidBookName, chapter: number, verse: number) {
  // increment verse number
  const newVerseNumber = verse - 1;

  // Check if the new verse number exists in the book
  // If so return it and the book name it came from
  if (verseExistsInChapter(book, chapter, newVerseNumber)) {
    return O.some([book, chapter, newVerseNumber] as const);
  }

  // If not, get the next chapter number if there is one and the first verse of
  // that chapter. Return a none otherwise.
  return pipe(
    O.Do,
    O.apS("previousChapter", getPreviousChapter(book, chapter)),
    O.chain(({ previousChapter }) =>
      O.some([
        previousChapter[0],
        previousChapter[1],
        previousChapter[2],
      ] as const)
    )
  );
}

function wrapBookParam(
  book: string | null | undefined
): O.Option<ValidBookName> {
  return pipe(
    book?.toLowerCase(),
    O.fromNullable,
    O.chain((candidateBook) =>
      pipe(
        orderedBookNames,
        ROA.findFirst((b) => b === candidateBook)
      )
    )
  );
}

function wrapChapterParam(
  book: O.Option<ValidBookName>,
  chapter: string | null | undefined
): O.Option<number> {
  return O.isSome(book)
    ? pipe(
        chapter,
        O.fromNullable,
        O.map(Number),
        O.chain(
          O.fromPredicate((chapter) => chapterExistsInBook(book.value, chapter))
        )
      )
    : O.none;
}

function wrapVerseParam(
  book: O.Option<ValidBookName>,
  chapter: O.Option<number>,
  verse: string | null | undefined
): O.Option<number> {
  return O.isSome(book) && O.isSome(chapter)
    ? pipe(
        verse,
        O.fromNullable,
        O.map(Number),
        O.chain(
          O.fromPredicate((v) =>
            verseExistsInChapter(book.value, chapter.value, v)
          )
        )
      )
    : O.none;
}

function getParamOpts(
  book: string | null | undefined,
  chapter: string | null | undefined,
  verse: string | null | undefined
): {
  bookOpt: O.Option<ValidBookName>;
  chapterOpt: O.Option<number>;
  verseOpt: O.Option<number>;
} {
  const bookOpt = wrapBookParam(book);
  const chapterOpt = wrapChapterParam(bookOpt, chapter);
  const verseOpt = wrapVerseParam(bookOpt, chapterOpt, verse);

  return O.isSome(bookOpt) && O.isSome(chapterOpt)
    ? { bookOpt, chapterOpt, verseOpt }
    : { bookOpt: O.none, chapterOpt: O.none, verseOpt: O.none };
}

function getNext(
  book: string | null | undefined,
  chapter: string | null | undefined,
  verse: string | null | undefined
): O.Option<readonly [ValidBookName, number, number]> {
  const { bookOpt, chapterOpt, verseOpt } = getParamOpts(book, chapter, verse);

  if (O.isNone(bookOpt) || O.isNone(chapterOpt)) {
    return O.none;
  } else if (O.isNone(verseOpt)) {
    return getNextChapter(bookOpt.value, Number(chapterOpt.value));
  } else {
    return getNextVerse(
      bookOpt.value,
      Number(chapterOpt.value),
      Number(verseOpt.value)
    );
  }
}

function getPrevious(
  book: string | null | undefined,
  chapter: string | null | undefined,
  verse: string | null | undefined
): O.Option<readonly [ValidBookName, number, number]> {
  const { bookOpt, chapterOpt, verseOpt } = getParamOpts(book, chapter, verse);

  if (O.isNone(bookOpt) || O.isNone(chapterOpt)) {
    return O.none;
  } else if (O.isNone(verseOpt)) {
    return getPreviousChapter(bookOpt.value, Number(chapterOpt.value));
  } else {
    return getPreviousVerse(
      bookOpt.value,
      Number(chapterOpt.value),
      Number(verseOpt.value)
    );
  }
}

/**
 * The BibleMeta object contains the meta data for the books of the Bible. It
 * includes a "match" expression that can be used to match the book name, and
 * a verseCounts object that contains the number of verses in each chapter.
 */
const bookMeta: BibleMeta = {
  "1 chronicles": {
    match: `^(${ones})\\s*ch(r(o(n(i(c(l(e(s)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 54,
      2: 55,
      3: 24,
      4: 43,
      5: 26,
      6: 81,
      7: 40,
      8: 40,
      9: 44,
      10: 14,
      11: 47,
      12: 40,
      13: 14,
      14: 17,
      15: 29,
      16: 43,
      17: 27,
      18: 17,
      19: 19,
      20: 8,
      21: 30,
      22: 19,
      23: 32,
      24: 31,
      25: 31,
      26: 32,
      27: 34,
      28: 21,
      29: 30,
    },
  },
  "1 corinthians": {
    match: `^(${ones})\\s*co(r(i(n(t(h(i(a(n(s)?)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 31,
      2: 16,
      3: 23,
      4: 21,
      5: 13,
      6: 20,
      7: 40,
      8: 13,
      9: 27,
      10: 33,
      11: 34,
      12: 31,
      13: 13,
      14: 40,
      15: 58,
      16: 24,
    },
  },
  "1 john": {
    match: `^(${ones})\\s*j(o(h(n)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 10,
      2: 29,
      3: 24,
      4: 21,
      5: 21,
    },
  },
  "1 kings": {
    match: `^(${ones})\\s*k(i(n(g(s)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 53,
      2: 46,
      3: 28,
      4: 34,
      5: 18,
      6: 38,
      7: 51,
      8: 66,
      9: 28,
      10: 29,
      11: 43,
      12: 33,
      13: 34,
      14: 31,
      15: 34,
      16: 34,
      17: 24,
      18: 46,
      19: 21,
      20: 43,
      21: 29,
      22: 53,
    },
  },
  "1 peter": {
    match: `^(${ones})\\s*p(e(t(e(r)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 25,
      2: 25,
      3: 22,
      4: 19,
      5: 14,
    },
  },
  "1 samuel": {
    match: `^(${ones})\\s*sam(u(e(l)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 28,
      2: 36,
      3: 21,
      4: 22,
      5: 12,
      6: 21,
      7: 17,
      8: 22,
      9: 27,
      10: 27,
      11: 15,
      12: 25,
      13: 23,
      14: 52,
      15: 35,
      16: 23,
      17: 58,
      18: 30,
      19: 24,
      20: 42,
      21: 15,
      22: 23,
      23: 29,
      24: 22,
      25: 44,
      26: 25,
      27: 12,
      28: 25,
      29: 11,
      30: 31,
      31: 13,
    },
  },
  "1 thessalonians": {
    match: `^(${ones})\\s*th(e(s(s(a(l(o(n(i(a(n(s)?)?)?)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 10,
      2: 20,
      3: 13,
      4: 18,
      5: 28,
    },
  },
  "1 timothy": {
    match: `^(${ones})\\s*ti(m(o(t(h(y)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 20,
      2: 15,
      3: 16,
      4: 16,
      5: 25,
      6: 21,
    },
  },
  "2 chronicles": {
    match: `^(${twos})\\s*ch(r(o(n(i(c(l(e(s)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 17,
      2: 18,
      3: 17,
      4: 22,
      5: 14,
      6: 42,
      7: 22,
      8: 18,
      9: 31,
      10: 19,
      11: 23,
      12: 16,
      13: 22,
      14: 15,
      15: 19,
      16: 14,
      17: 19,
      18: 34,
      19: 11,
      20: 37,
      21: 20,
      22: 12,
      23: 21,
      24: 27,
      25: 28,
      26: 23,
      27: 9,
      28: 27,
      29: 36,
      30: 27,
      31: 21,
      32: 33,
      33: 25,
      34: 33,
      35: 27,
      36: 23,
    },
  },
  "2 corinthians": {
    match: `^(${twos})\\s*co(r(i(n(t(h(i(a(n(s)?)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 24,
      2: 17,
      3: 18,
      4: 18,
      5: 21,
      6: 18,
      7: 16,
      8: 24,
      9: 15,
      10: 18,
      11: 33,
      12: 21,
      13: 14,
    },
  },
  "2 john": {
    match: `^(${twos})\\s*j(o(h(n)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 13,
    },
  },
  "2 kings": {
    match: `^(${twos})\\s*k(i(n(g(s)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 18,
      2: 25,
      3: 27,
      4: 44,
      5: 27,
      6: 33,
      7: 20,
      8: 29,
      9: 37,
      10: 36,
      11: 21,
      12: 21,
      13: 25,
      14: 29,
      15: 38,
      16: 20,
      17: 41,
      18: 37,
      19: 37,
      20: 21,
      21: 26,
      22: 20,
      23: 37,
      24: 20,
      25: 30,
    },
  },
  "2 peter": {
    match: `^(${twos})\\s*p(e(t(e(r)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 21,
      2: 22,
      3: 18,
    },
  },
  "2 samuel": {
    match: `^(${twos})\\s*s(a(m(u(e(l)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 27,
      2: 32,
      3: 39,
      4: 12,
      5: 25,
      6: 23,
      7: 29,
      8: 18,
      9: 13,
      10: 19,
      11: 27,
      12: 31,
      13: 39,
      14: 33,
      15: 37,
      16: 23,
      17: 29,
      18: 33,
      19: 43,
      20: 26,
      21: 22,
      22: 51,
      23: 39,
      24: 25,
    },
  },
  "2 thessalonians": {
    match: `^(${twos})\\s*th(e(s(s(a(l(o(n(i(a(n(s)?)?)?)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 12,
      2: 17,
      3: 18,
    },
  },
  "2 timothy": {
    match: `^(${twos})\\s*ti(m(o(t(h(y)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 18,
      2: 26,
      3: 17,
      4: 22,
    },
  },
  "3 john": {
    match: `^(${threes})\\s*j(o(h(n)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 14,
    },
  },
  acts: {
    match: `^ac(t(s)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 26,
      2: 47,
      3: 26,
      4: 37,
      5: 42,
      6: 15,
      7: 60,
      8: 40,
      9: 43,
      10: 48,
      11: 30,
      12: 25,
      13: 52,
      14: 28,
      15: 41,
      16: 40,
      17: 34,
      18: 28,
      19: 41,
      20: 38,
      21: 40,
      22: 30,
      23: 35,
      24: 27,
      25: 27,
      26: 32,
      27: 44,
      28: 31,
    },
  },
  amos: {
    match: `^am(o(s)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 15,
      2: 16,
      3: 15,
      4: 13,
      5: 27,
      6: 14,
      7: 17,
      8: 14,
      9: 15,
    },
  },
  colossians: {
    match: `^co(l(o(s(s(i(a(n(s)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 29,
      2: 23,
      3: 25,
      4: 18,
    },
  },
  daniel: {
    match: `^da(n(i(e(l)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 21,
      2: 49,
      3: 30,
      4: 37,
      5: 31,
      6: 28,
      7: 28,
      8: 27,
      9: 27,
      10: 21,
      11: 45,
      12: 13,
    },
  },
  deuteronomy: {
    match: `^d[e|u]([e|u](t(e(r(o(n(o(m(y)?)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 46,
      2: 37,
      3: 29,
      4: 49,
      5: 33,
      6: 25,
      7: 26,
      8: 20,
      9: 29,
      10: 22,
      11: 32,
      12: 32,
      13: 18,
      14: 29,
      15: 23,
      16: 22,
      17: 20,
      18: 22,
      19: 21,
      20: 20,
      21: 23,
      22: 30,
      23: 25,
      24: 22,
      25: 19,
      26: 19,
      27: 26,
      28: 68,
      29: 29,
      30: 20,
      31: 30,
      32: 52,
      33: 29,
      34: 12,
    },
  },
  ecclesiastes: {
    match: `^ec(c(l(e(s(i(a(s(t(e(s)?)?)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 18,
      2: 26,
      3: 22,
      4: 16,
      5: 20,
      6: 12,
      7: 29,
      8: 17,
      9: 18,
      10: 20,
      11: 10,
      12: 14,
    },
  },
  ephesians: {
    match: `^ep(h(e(s(i(a(n(s)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 23,
      2: 22,
      3: 21,
      4: 32,
      5: 33,
      6: 24,
    },
  },
  esther: {
    match: `^es(t(h(e(r)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 22,
      2: 23,
      3: 15,
      4: 17,
      5: 14,
      6: 14,
      7: 10,
      8: 17,
      9: 32,
      10: 3,
    },
  },
  exodus: {
    match: `^ex(o(d(u(s)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 22,
      2: 25,
      3: 22,
      4: 31,
      5: 23,
      6: 30,
      7: 25,
      8: 32,
      9: 35,
      10: 29,
      11: 10,
      12: 51,
      13: 22,
      14: 31,
      15: 27,
      16: 36,
      17: 16,
      18: 27,
      19: 25,
      20: 26,
      21: 36,
      22: 31,
      23: 33,
      24: 18,
      25: 40,
      26: 37,
      27: 21,
      28: 43,
      29: 46,
      30: 38,
      31: 18,
      32: 35,
      33: 23,
      34: 35,
      35: 35,
      36: 38,
      37: 29,
      38: 31,
      39: 43,
      40: 38,
    },
  },
  ezekiel: {
    match: `^eze(k(i(e(l)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 28,
      2: 10,
      3: 27,
      4: 17,
      5: 17,
      6: 14,
      7: 27,
      8: 18,
      9: 11,
      10: 22,
      11: 25,
      12: 28,
      13: 23,
      14: 23,
      15: 8,
      16: 63,
      17: 24,
      18: 32,
      19: 14,
      20: 49,
      21: 32,
      22: 31,
      23: 49,
      24: 27,
      25: 17,
      26: 21,
      27: 36,
      28: 26,
      29: 21,
      30: 26,
      31: 18,
      32: 32,
      33: 33,
      34: 31,
      35: 15,
      36: 38,
      37: 28,
      38: 23,
      39: 29,
      40: 49,
      41: 26,
      42: 20,
      43: 27,
      44: 31,
      45: 25,
      46: 24,
      47: 23,
      48: 35,
    },
  },
  ezra: {
    match: `^ezr(a)?${nonNameChars}*$`,
    verseCounts: {
      1: 11,
      2: 70,
      3: 13,
      4: 24,
      5: 17,
      6: 22,
      7: 28,
      8: 36,
      9: 15,
      10: 44,
    },
  },
  galatians: {
    match: `^ga(l(a(t(i(a(n(s)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 24,
      2: 21,
      3: 29,
      4: 31,
      5: 26,
      6: 18,
    },
  },
  genesis: {
    match: `^ge(n(e(s(i(s)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 31,
      2: 25,
      3: 24,
      4: 26,
      5: 32,
      6: 22,
      7: 24,
      8: 22,
      9: 29,
      10: 32,
      11: 32,
      12: 20,
      13: 18,
      14: 24,
      15: 21,
      16: 16,
      17: 27,
      18: 33,
      19: 38,
      20: 18,
      21: 34,
      22: 24,
      23: 20,
      24: 67,
      25: 34,
      26: 35,
      27: 46,
      28: 22,
      29: 35,
      30: 43,
      31: 55,
      32: 32,
      33: 20,
      34: 31,
      35: 29,
      36: 43,
      37: 36,
      38: 30,
      39: 23,
      40: 23,
      41: 57,
      42: 38,
      43: 34,
      44: 34,
      45: 28,
      46: 34,
      47: 31,
      48: 22,
      49: 33,
      50: 26,
    },
  },
  habakkuk: {
    match: `^hab(a(k(k(u(k)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 17,
      2: 20,
      3: 19,
    },
  },
  haggai: {
    match: `^hag(g(a(i)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 15,
      2: 23,
    },
  },
  hebrews: {
    match: `^he(b(r(e(w(s)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 14,
      2: 18,
      3: 19,
      4: 16,
      5: 14,
      6: 20,
      7: 28,
      8: 13,
      9: 28,
      10: 39,
      11: 40,
      12: 29,
      13: 25,
    },
  },
  hosea: {
    match: `^ho(s(e(a)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 11,
      2: 23,
      3: 5,
      4: 19,
      5: 15,
      6: 11,
      7: 16,
      8: 14,
      9: 17,
      10: 15,
      11: 12,
      12: 14,
      13: 16,
      14: 9,
    },
  },
  isaiah: {
    match: `^is(a(i(a(h)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 31,
      2: 22,
      3: 26,
      4: 6,
      5: 30,
      6: 13,
      7: 25,
      8: 22,
      9: 21,
      10: 34,
      11: 16,
      12: 6,
      13: 22,
      14: 32,
      15: 9,
      16: 14,
      17: 14,
      18: 7,
      19: 25,
      20: 6,
      21: 17,
      22: 25,
      23: 18,
      24: 23,
      25: 12,
      26: 21,
      27: 13,
      28: 29,
      29: 24,
      30: 33,
      31: 9,
      32: 20,
      33: 24,
      34: 17,
      35: 10,
      36: 22,
      37: 38,
      38: 22,
      39: 8,
      40: 31,
      41: 29,
      42: 25,
      43: 28,
      44: 28,
      45: 25,
      46: 13,
      47: 15,
      48: 22,
      49: 26,
      50: 11,
      51: 23,
      52: 15,
      53: 12,
      54: 17,
      55: 13,
      56: 12,
      57: 21,
      58: 14,
      59: 21,
      60: 22,
      61: 11,
      62: 12,
      63: 19,
      64: 12,
      65: 25,
      66: 24,
    },
  },
  james: {
    match: `^ja(m(e(s)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 27,
      2: 26,
      3: 18,
      4: 17,
      5: 20,
    },
  },
  jeremiah: {
    match: `^je(r(e(m(i(a(h)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 19,
      2: 37,
      3: 25,
      4: 31,
      5: 31,
      6: 30,
      7: 34,
      8: 22,
      9: 26,
      10: 25,
      11: 23,
      12: 17,
      13: 27,
      14: 22,
      15: 21,
      16: 21,
      17: 27,
      18: 23,
      19: 15,
      20: 18,
      21: 14,
      22: 30,
      23: 40,
      24: 10,
      25: 38,
      26: 24,
      27: 22,
      28: 17,
      29: 32,
      30: 24,
      31: 40,
      32: 44,
      33: 26,
      34: 22,
      35: 19,
      36: 32,
      37: 21,
      38: 28,
      39: 18,
      40: 16,
      41: 18,
      42: 22,
      43: 13,
      44: 30,
      45: 5,
      46: 28,
      47: 7,
      48: 47,
      49: 39,
      50: 46,
      51: 64,
      52: 34,
    },
  },
  job: {
    match: `^job${nonNameChars}*$`,
    verseCounts: {
      1: 22,
      2: 13,
      3: 26,
      4: 21,
      5: 27,
      6: 30,
      7: 21,
      8: 22,
      9: 35,
      10: 22,
      11: 20,
      12: 25,
      13: 28,
      14: 22,
      15: 35,
      16: 22,
      17: 16,
      18: 21,
      19: 29,
      20: 29,
      21: 34,
      22: 30,
      23: 17,
      24: 25,
      25: 6,
      26: 14,
      27: 23,
      28: 28,
      29: 25,
      30: 31,
      31: 40,
      32: 22,
      33: 33,
      34: 37,
      35: 16,
      36: 33,
      37: 24,
      38: 41,
      39: 30,
      40: 24,
      41: 34,
      42: 17,
    },
  },
  joel: {
    match: `^joe(l)?${nonNameChars}*$`,
    verseCounts: {
      1: 20,
      2: 32,
      3: 21,
    },
  },
  john: {
    match: `^joh(n)?${nonNameChars}*$`,
    verseCounts: {
      1: 51,
      2: 25,
      3: 36,
      4: 54,
      5: 47,
      6: 71,
      7: 53,
      8: 59,
      9: 41,
      10: 42,
      11: 57,
      12: 50,
      13: 38,
      14: 31,
      15: 27,
      16: 33,
      17: 26,
      18: 40,
      19: 42,
      20: 31,
      21: 25,
    },
  },
  jonah: {
    match: `^jon(a(h)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 17,
      2: 10,
      3: 10,
      4: 11,
    },
  },
  joshua: {
    match: `^jos(h(u(a)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 18,
      2: 24,
      3: 17,
      4: 24,
      5: 15,
      6: 27,
      7: 26,
      8: 35,
      9: 27,
      10: 43,
      11: 23,
      12: 24,
      13: 33,
      14: 15,
      15: 63,
      16: 10,
      17: 18,
      18: 28,
      19: 51,
      20: 9,
      21: 45,
      22: 34,
      23: 16,
      24: 33,
    },
  },
  jude: {
    match: `^jude${nonNameChars}*$`,
    verseCounts: {
      1: 25,
    },
  },
  judges: {
    match: `^judg(e(s)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 36,
      2: 23,
      3: 31,
      4: 24,
      5: 31,
      6: 40,
      7: 25,
      8: 35,
      9: 57,
      10: 18,
      11: 40,
      12: 15,
      13: 25,
      14: 20,
      15: 20,
      16: 31,
      17: 13,
      18: 31,
      19: 30,
      20: 48,
      21: 25,
    },
  },
  lamentations: {
    match: `^la(m(e(n(t(a(t(i(o(n(s)?)?)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 22,
      2: 22,
      3: 66,
      4: 22,
      5: 22,
    },
  },
  leviticus: {
    match: `^le(v(i(t(i(c(u(s)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 17,
      2: 16,
      3: 17,
      4: 35,
      5: 19,
      6: 30,
      7: 38,
      8: 36,
      9: 24,
      10: 20,
      11: 47,
      12: 8,
      13: 59,
      14: 57,
      15: 33,
      16: 34,
      17: 16,
      18: 30,
      19: 37,
      20: 27,
      21: 24,
      22: 33,
      23: 44,
      24: 23,
      25: 55,
      26: 46,
      27: 34,
    },
  },
  luke: {
    match: `^lu(k(e)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 80,
      2: 52,
      3: 38,
      4: 44,
      5: 39,
      6: 49,
      7: 50,
      8: 56,
      9: 62,
      10: 42,
      11: 54,
      12: 59,
      13: 35,
      14: 35,
      15: 32,
      16: 31,
      17: 37,
      18: 43,
      19: 48,
      20: 47,
      21: 38,
      22: 71,
      23: 56,
      24: 53,
    },
  },
  malachi: {
    match: `^mal(a(c(h(i)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 14,
      2: 17,
      3: 18,
      4: 6,
    },
  },
  mark: {
    match: `^mar(k)?${nonNameChars}*$`,
    verseCounts: {
      1: 45,
      2: 28,
      3: 35,
      4: 41,
      5: 43,
      6: 56,
      7: 37,
      8: 38,
      9: 50,
      10: 52,
      11: 33,
      12: 44,
      13: 37,
      14: 72,
      15: 47,
      16: 20,
    },
  },
  matthew: {
    match: `^mat(t(h(e(w)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 25,
      2: 23,
      3: 17,
      4: 25,
      5: 48,
      6: 34,
      7: 29,
      8: 34,
      9: 38,
      10: 42,
      11: 30,
      12: 50,
      13: 58,
      14: 36,
      15: 39,
      16: 28,
      17: 27,
      18: 35,
      19: 30,
      20: 34,
      21: 46,
      22: 46,
      23: 39,
      24: 51,
      25: 46,
      26: 75,
      27: 66,
      28: 20,
    },
  },
  micah: {
    match: `^mi(c(a(h)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 16,
      2: 13,
      3: 12,
      4: 13,
      5: 15,
      6: 16,
      7: 20,
    },
  },
  nahum: {
    match: `^na(h(u(m)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 15,
      2: 13,
      3: 19,
    },
  },
  nehemiah: {
    match: `^ne(h(e(m(i(a(h)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 11,
      2: 20,
      3: 32,
      4: 23,
      5: 19,
      6: 19,
      7: 73,
      8: 18,
      9: 38,
      10: 39,
      11: 36,
      12: 47,
      13: 31,
    },
  },
  numbers: {
    match: `^nu(m(b(e(r(s)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 54,
      2: 34,
      3: 51,
      4: 49,
      5: 31,
      6: 27,
      7: 89,
      8: 26,
      9: 23,
      10: 36,
      11: 35,
      12: 16,
      13: 33,
      14: 45,
      15: 41,
      16: 50,
      17: 13,
      18: 32,
      19: 22,
      20: 29,
      21: 35,
      22: 41,
      23: 30,
      24: 25,
      25: 18,
      26: 65,
      27: 23,
      28: 31,
      29: 40,
      30: 16,
      31: 54,
      32: 42,
      33: 56,
      34: 29,
      35: 34,
      36: 13,
    },
  },
  obadiah: {
    match: `^o(b(a(d(i(a(h)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 21,
    },
  },
  philemon: {
    match: `^phile(m(o(n)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 25,
    },
  },
  philippians: {
    match: `^phili(p(p(i(a(n(s)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 30,
      2: 30,
      3: 21,
      4: 23,
    },
  },
  proverbs: {
    match: `^pr(o(v(e(r(b(s)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 33,
      2: 22,
      3: 35,
      4: 27,
      5: 23,
      6: 35,
      7: 27,
      8: 36,
      9: 18,
      10: 32,
      11: 31,
      12: 28,
      13: 25,
      14: 35,
      15: 33,
      16: 33,
      17: 28,
      18: 24,
      19: 29,
      20: 30,
      21: 31,
      22: 29,
      23: 35,
      24: 34,
      25: 28,
      26: 28,
      27: 27,
      28: 28,
      29: 27,
      30: 33,
      31: 31,
    },
  },
  psalms: {
    match: `^ps(a(l(m(s)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 6,
      2: 12,
      3: 8,
      4: 8,
      5: 12,
      6: 10,
      7: 17,
      8: 9,
      9: 20,
      10: 18,
      11: 7,
      12: 8,
      13: 6,
      14: 7,
      15: 5,
      16: 11,
      17: 15,
      18: 50,
      19: 14,
      20: 9,
      21: 13,
      22: 31,
      23: 6,
      24: 10,
      25: 22,
      26: 12,
      27: 14,
      28: 9,
      29: 11,
      30: 12,
      31: 24,
      32: 11,
      33: 22,
      34: 22,
      35: 28,
      36: 12,
      37: 40,
      38: 22,
      39: 13,
      40: 17,
      41: 13,
      42: 11,
      43: 5,
      44: 26,
      45: 17,
      46: 11,
      47: 9,
      48: 14,
      49: 20,
      50: 23,
      51: 19,
      52: 9,
      53: 6,
      54: 7,
      55: 23,
      56: 13,
      57: 11,
      58: 11,
      59: 17,
      60: 12,
      61: 8,
      62: 12,
      63: 11,
      64: 10,
      65: 13,
      66: 20,
      67: 7,
      68: 35,
      69: 36,
      70: 5,
      71: 24,
      72: 20,
      73: 28,
      74: 23,
      75: 10,
      76: 12,
      77: 20,
      78: 72,
      79: 13,
      80: 19,
      81: 16,
      82: 8,
      83: 18,
      84: 12,
      85: 13,
      86: 17,
      87: 7,
      88: 18,
      89: 52,
      90: 17,
      91: 16,
      92: 15,
      93: 5,
      94: 23,
      95: 11,
      96: 13,
      97: 12,
      98: 9,
      99: 9,
      100: 5,
      101: 8,
      102: 28,
      103: 22,
      104: 35,
      105: 45,
      106: 48,
      107: 43,
      108: 13,
      109: 31,
      110: 7,
      111: 10,
      112: 10,
      113: 9,
      114: 8,
      115: 18,
      116: 19,
      117: 2,
      118: 29,
      119: 176,
      120: 7,
      121: 8,
      122: 9,
      123: 4,
      124: 8,
      125: 5,
      126: 6,
      127: 5,
      128: 6,
      129: 8,
      130: 8,
      131: 3,
      132: 18,
      133: 3,
      134: 3,
      135: 21,
      136: 26,
      137: 9,
      138: 8,
      139: 24,
      140: 13,
      141: 10,
      142: 7,
      143: 12,
      144: 15,
      145: 21,
      146: 10,
      147: 20,
      148: 14,
      149: 9,
      150: 6,
    },
  },
  revelation: {
    match: `^re(v(e(l(a(t(i(o(n)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 20,
      2: 29,
      3: 22,
      4: 11,
      5: 14,
      6: 17,
      7: 17,
      8: 13,
      9: 21,
      10: 11,
      11: 19,
      12: 17,
      13: 18,
      14: 20,
      15: 8,
      16: 21,
      17: 18,
      18: 24,
      19: 21,
      20: 15,
      21: 27,
      22: 21,
    },
  },
  romans: {
    match: `^ro(m(a(n(s)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 32,
      2: 29,
      3: 31,
      4: 25,
      5: 21,
      6: 23,
      7: 25,
      8: 39,
      9: 33,
      10: 21,
      11: 36,
      12: 21,
      13: 14,
      14: 23,
      15: 33,
      16: 27,
    },
  },
  ruth: {
    match: `^ru(t(h)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 22,
      2: 23,
      3: 18,
      4: 22,
    },
  },
  "song of solomon": {
    match: `^s(o(n(g\\s*(o(f\\s*(s(o(l(o(m(o(n)?)?)?)?)?)?)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 17,
      2: 17,
      3: 11,
      4: 16,
      5: 16,
      6: 13,
      7: 13,
      8: 14,
    },
  },
  titus: {
    match: `^ti(t(u(s)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 16,
      2: 15,
      3: 15,
    },
  },
  zechariah: {
    match: `^zec(h(a(r(i(a(h)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 21,
      2: 13,
      3: 10,
      4: 14,
      5: 11,
      6: 15,
      7: 14,
      8: 23,
      9: 17,
      10: 12,
      11: 17,
      12: 14,
      13: 9,
      14: 21,
    },
  },
  zephaniah: {
    match: `^zep(h(a(n(i(a(h)?)?)?)?)?)?${nonNameChars}*$`,
    verseCounts: {
      1: 18,
      2: 15,
      3: 20,
    },
  },
};

export {
  orderedBookNames,
  bookNames,
  ValidBookName,
  getBookName,
  chapterExistsInBook,
  chapterCountFrom,
  getChapterRangeFromParts,
  verseCountFrom,
  getVerseRangeFromParts,
  verseExistsInChapter,
  getNext,
  getPrevious,
};
