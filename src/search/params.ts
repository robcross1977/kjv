import { errorFrom, IError } from "./error";
import { GroupKeys, inputRegex, getGroups } from "./regex";
import { flow, pipe } from "fp-ts/function";
import { Predicate } from "fp-ts/Predicate";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as S from "fp-ts/string";

type ParamsMsg =
  | "no groups found"
  | "value is null or undefined"
  | "string must have at least 1 character"
  | "invalid search parameters";

type ParamsError = IError<ParamsMsg>;

/**
 * The getParmas function takes a string and returns an Either of RegexError, 
 * ParamsError or a record containing the validated matched groups, along with
 * a type for each set of params so you will know what sort of search it is.
 */
const getParams = flow(
  // Get the groups from the input string
  getGroups<GroupKeys>(inputRegex, "gi"),

  // Get the validated "parts" for them in a typed object
  E.chainW(getParts),

  // Get the "type" of a search (e.g. book, chapter, verse, etc.)
  E.chainW(getTypedParts)
);

/**
 * The Parts type is a typed collection of the matched groups from the input.
 * Each part is housed in an Either, so you can easily check for errors.
 * Please note, most searches expect some E.left values, so you will need to
 * be sure you don't fail on those. 
 */
type Parts = {
  book: E.Either<ParamsError, string>;
  chapterStart: E.Either<ParamsError, number>;
  chapterEnd: E.Either<ParamsError, number>;
  verseStart: E.Either<ParamsError, number>;
  verseEnd: E.Either<ParamsError, number>;
};

/**
 * The PartsWrapped type takes the Parts type and wraps it in an Either
 */
type PartsWrapped = E.Either<ParamsError, Parts>;

// The buildParam function takes an array of potential "parts" pieces, and
// returns the first one that is not undefined as a number. If all are undefined
// it will set an Option error.
const buildParam = flow(
  // Find the first non-undefined value
  A.findFirst((p) => p !== undefined),

  // If it is still undefined, set an error
  E.fromOption(() => errorFrom<ParamsMsg>("value is null or undefined")),

  // Map it to a number
  E.map(Number)
);

// The getParts function takes a record of matched groups and returns a typed
// PartsWrapped object. Note that it builds the non-book pieces by having an
// array of them, and returning the number associated with the first non-null
// one. 
function getParts(parts: Record<GroupKeys, string>): PartsWrapped {
  // Grab the individual, potential groups for the parts
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

  // Wrap the whole thing in an Either
  return E.of({
    // Get the book wrapped in an either
    book: buildBook(parts),

    // Get the chapter start, whether it is a chapterStart,
    // chapterVerseChapterStart or chapterRangeChapterStart. All of them can
    // be considered the "chapterStart" for their search type. 
    chapterStart: buildParam([
      chapterStart,
      chapterVerseChapterStart,
      chapterRangeChapterStart,
    ]),

    // Get the chapter end, whether it is a chapterVerseChapterEnd or a
    // chapterRangeChapterEnd. All of them can be considered the "chapterEnd"
    // for their respective search type. Take the first one that comes back not
    // undefined.
    chapterEnd: buildParam([chapterVerseChapterEnd, chapterRangeChapterEnd]),

    // Get the verseStart. This is the verseStart for a chapterVerseVerseStart
    // and only it needs to be checked. If it doesn't exist set it as a None. 
    verseStart: buildParam([chapterVerseVerseStart]),

    // Get the verseEnd. This is the verseEnd for a chapterVerseVerseEnd and
    // chapterRangeVerseEnd. Take the first one that comes back not undefined.
    verseEnd: buildParam([chapterVerseVerseEnd, chapterRangeVerseEnd]),
  });
}

// The nonEmptyStringPredicate returns true if a string is not empty, false
// otherwise
const nonEmptyStringPredicate: Predicate<string> = (v = "") => v.length > 0;

// The getFormattedBookName takes the bookNum and bookName and returns a string
// containing the proper spaces and trimming. If there is a book num a space
// will be added, if there are extra spaces they will be removed. 
function getFormattedBookName(num: string = "", text: string = "") {
  return `${getBookNumString(E.of(num))}${trimBook(text)}`;
}

// The buildBook function takes a bookNum and a bookName and gets the properly
// formatted book name. If there is no book name, it will return a Left. 
function buildBook({
  bookNum: num = "",
  bookName: text = "",
}: Record<GroupKeys, string>): E.Either<ParamsError, string> {
  return pipe(
    // Get the formatted book name using the num and text provided
    getFormattedBookName(num, text),

    // Wrap it in an Either if it is not empty, otherwise set an error
    E.fromPredicate(nonEmptyStringPredicate, () =>
      errorFrom<ParamsMsg>("no groups found")
    )
  );
}

// The trimBook function takes a string and if there are more than 1 space in a
// row make it only 1 space globally. Then trim the ends. 
const trimBook = flow(S.replace(/\s\s+/g, " "), S.trim);

// The getBookNumString takes a search string and returns the book number if it
// exists, with a space to buffer between it and the book name, or an empty
// string otherwise. 
const getBookNumString = flow(
  E.chain(
    // If the string is non-empty wrap it in an Either, otherwise set an error
    E.fromPredicate(nonEmptyStringPredicate, (err) =>
      errorFrom<ParamsMsg>("string must have at least 1 character", err)
    )
  ),
  // Add a space if it is in a Right
  E.map(addSpace),

  // If it is in a left, return an empty string with no spaces
  E.getOrElse(() => "")
);

// The addSpace function takes a string and adds a space to the end of it.
function addSpace(s: string) {
  return `${s} `;
}

/**
 * The SearchType type is a union of all the possible search types.
 */
type SearchType =
  | "none"
  | "book"
  | "chapter"
  | "verse"
  | "verse-range"
  | "chapter-range"
  | "multi-chapter-verse"
  | "full-range";

// The bookPredicate returns true if the Parts object is a book search, false
// otherwise. In a book search only the book will be present. Ex: Job
const bookPredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}: Parts) =>
  E.isRight(book) &&
  E.isLeft(chapterStart) &&
  E.isLeft(chapterEnd) &&
  E.isLeft(verseStart) &&
  E.isLeft(verseEnd);

// The chapterPredicate returns true if the Parts object is a chapter search,
// false otherwise. In a chapter search the book and the chapter will be present
// but nothing else. Ex: Job 1
const chapterPredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}: Parts) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isLeft(chapterEnd) &&
  E.isLeft(verseStart) &&
  E.isLeft(verseEnd);

// The versePredicate returns true if the Parts object is a verse search,
// false otherwise. In a verse search the book, the chapterStart and a
// verseStart will be present but nothing else. Ex: Job 1:2
const versePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isLeft(chapterEnd) &&
  E.isRight(verseStart) &&
  E.isLeft(verseEnd);

// The verseRangePredicate returns true if the Parts object is a verse-range
// search, false otherwise. In a verse-range search the book, the chapterStart,
// a verseStart and a verseEnd will be present but nothing else. Ex: Job 1:2-3
const verseRangePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isLeft(chapterEnd) &&
  E.isRight(verseStart) &&
  E.isRight(verseEnd);

// The chapterRangePredicate returns true if the Parts object is a chapter-range
// search, false otherwise. In a chapter-range search the book, the chapterStart,
// and the chapterEnd will be present but nothing else. Ex: Job 1-2
const chapterRangePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isRight(chapterEnd) &&
  E.isLeft(verseStart) &&
  E.isLeft(verseEnd);

// The multiChapterVersePredicate returns true if the Parts object is a
// multi-chapter-verse search, false otherwise. In a multi-chapter-verse search
// the book, the chapterStart, the chapterEnd and the verseEnd will be present
// but the verseStart will not. Ex. Job 1-2:3
const multiChapterVersePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isRight(chapterEnd) &&
  E.isLeft(verseStart) &&
  E.isRight(verseEnd);

// The fullRangePredicate returns true if the Parts object is a full-range
// search, false otherwise. In a full-range search all parts will be present
// Ex. Job 1-2:3
const fullRangePredicate: Predicate<Parts> = ({
  book,
  chapterStart,
  chapterEnd,
  verseStart,
  verseEnd,
}: Parts) =>
  E.isRight(book) &&
  E.isRight(chapterStart) &&
  E.isRight(chapterEnd) &&
  E.isRight(verseStart) &&
  E.isRight(verseEnd);

// The onFalse is a simple thunk that returns an error message.
function onFalse() {
  return errorFrom<ParamsMsg>("invalid search parameters");
}

// The wrapSearch takes a Parts type, and adds the SearchType
// to it based on the predicate that works, so we know how
// to handle it in later sections of the code.
function wrapSearch(
  parts: Parts,
  pred: Predicate<Parts>,
  searchType: SearchType
) {
  return pipe(
    // Tkae the parts and the search type and combine them into a new object
    Object.assign({}, parts, { type: searchType }),

    // Wrap it in an either or return an error depending on the predicate passed
    E.fromPredicate<TypedParts, ParamsError>(pred, onFalse)
  );
}

// The getBook function takes parts and returns a SearchParts object complete
// with the book type if the predicate for that type is true. Ex: Job
function getBook(parts: Parts) {
  return wrapSearch(parts, bookPredicate, "book");
}

// The getChapter function takes parts and returns a SearchParts object complete
// with the chapter type if the predicate for that type is true. Ex: Job 1
function getChapter(parts: Parts) {
  return wrapSearch(parts, chapterPredicate, "chapter");
}

// The getVerse function takes parts and returns a SearchParts object complete
// with the verse type if the predicate for that type is true. Ex: Job 1:2
function getVerse(parts: Parts) {
  return wrapSearch(parts, versePredicate, "verse");
}

// The getVerseRange function takes parts and returns a SearchParts object
// complete the verse-range type if the predicate for that type is true. 
// Ex: Job 1:2-3
function getVerseRange(parts: Parts) {
  return wrapSearch(parts, verseRangePredicate, "verse-range");
}

// The getChapterRange function takes parts and returns a SearchParts object
// complete the chapter-range type if the predicate for that type is true. 
// Ex: Job 1-2
function getChapterRange(parts: Parts) {
  return wrapSearch(parts, chapterRangePredicate, "chapter-range");
}

// The getMultiChapterVerseRange function takes parts and returns a SearchParts
// object complete the multi-chapter-verse type if the predicate for that type
// is true. Ex: Job 1-2:2
function getMultiChapterVerse(parts: Parts) {
  return wrapSearch(parts, multiChapterVersePredicate, "multi-chapter-verse");
}

// The getFullRange function takes parts and returns a SearchPartsobject
// complete the full-range type if the predicate for that type is true. 
// Ex: Job 1-2:2
function getFullRange(parts: Parts) {
  return wrapSearch(parts, fullRangePredicate, "full-range");
}

/**
 * The TypedParts type is a union of all the possible search types combined with
 * the Parts type validated from a parts predicate. This is the type that is
 * returned from the getParams function
 */
type TypedParts = Parts & { type: SearchType };

// The getTypedParts function takes the parts and goes through all of the
// possible predicates until it gets a Right avalue, and then it returns that.
function getTypedParts(parts: Parts) {
  return pipe(
    // Take the parts
    parts,

    // Check if they are a book
    getBook,

    // If not check if they are a chapter
    E.orElse((_) => getChapter(parts)),

    // If not check if they are a verse
    E.orElse((_) => getVerse(parts)),

    // If not check if they are a verse-range
    E.orElse((_) => getVerseRange(parts)),

    // If not check if they are a chapter-range
    E.orElse((_) => getChapterRange(parts)),

    // If not check if they are a multi-chapter-verse
    E.orElse((_) => getMultiChapterVerse(parts)),

    // If not check if they are a full-range
    E.orElse((_) => getFullRange(parts))

    // Otherwise it just returns the last error
  );
}

export { ParamsError, ParamsMsg, getParams, TypedParts, SearchType };
