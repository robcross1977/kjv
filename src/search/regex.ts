import { errorFrom, IError } from "./error";
import { pipe, unsafeCoerce } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

type RegexMsg = "no groups found";
export type RegexError = IError<RegexMsg>;

/**
 * The ones, twos and threes regex strings are to search for the number (or one
 * of its variations) at the front of the book name. Examples: 1 Thessalonians,
 * Three John, ii Timothy, etc.
 */
const ones = `1(st)?|i\\s+|one|fst|fir(s(t)?)?` as const;
const twos = `2(nd)?|ii\\s+|two|sec(o(n(d)?)?)?` as const;
const threes = `3(rd)?|iii\\s+|th((r(e(e)?)?)?|(i(r(d)?)?)?)?` as const;

/**
 * The nonnamechars regex string is to search for any characters that are not
 * part of the book name.
 */
const nonNameChars = `[\\d|:|-|_|\\s]`;

/**
 * Type: InputGroupKeys
 * This is a list of groups you can expect from the input regex matcher
 */
type GroupKeys =
  | "bookNum"
  | "bookName"
  | "chapterStart"
  | "chapterVerseChapterStart"
  | "chapterVerseVerseStart"
  | "chapterVerseChapterEnd"
  | "chapterVerseVerseEnd"
  | "chapterRangeChapterStart"
  | "chapterRangeChapterEnd"
  | "chapterRangeVerseEnd";

// Title
const bookNum = wrapCap("bookNum", `${ones}|${twos}|${threes}`);
const bookText = wrapCap("bookName", "\\D+");
const name = `${bookNum}?\\s*${bookText}`;

// Chapter
const chapterStart = wrapCap("chapterStart", "\\d{1,3}");
const chapter = wrapNonCap(`${chapterStart}\\s*[:-]?\\s*$`);

// Chapter Verse
const chapterVerseChapterStart = wrapCap(
  "chapterVerseChapterStart",
  "\\d{1,3}"
);
const chapterVerseVerseStart = wrapCap("chapterVerseVerseStart", "\\d{1,3}");
const mando = `${chapterVerseChapterStart}\\s*:\\s*${chapterVerseVerseStart}`;
const chapterVerseChapterEnd = wrapNonCap(
  `(?=\\d{1,3}\\s*:)${wrapCap("chapterVerseChapterEnd", "\\d{1,3}")}\\s*:`
);
const chapterVerseVerseEnd = wrapCap("chapterVerseVerseEnd", "\\d{1,3}");
const optional = `-?\\s*${chapterVerseChapterEnd}?\\s*${chapterVerseVerseEnd}?`;
const chapterVerse = wrapNonCap(`${mando}\\s*${optional}?\\s*$`);

// Chapter Range
const chapterRangeChapterStart = wrapCap(
  "chapterRangeChapterStart",
  "\\d{1,3}"
);
const chapterRangeChapterEnd = wrapCap("chapterRangeChapterEnd", "\\d{1,3}");
const chapterRangeVerseEnd = wrapCap("chapterRangeVerseEnd", "\\d{1,3}");
const chapterRange = wrapNonCap(
  `${chapterRangeChapterStart}\\s*-\\s*${chapterRangeChapterEnd}\\s*:?\\s*${chapterRangeVerseEnd}?\\s*$`
);

// Combined (Captain Planet)
const params = wrapNonCap(`${chapter}?|${chapterVerse}?|${chapterRange}?`);
const inputRegex = `^\\s*${name}\\s*${params}?\\s*`;

/**
 * The wrapCap function wraps a regex statement with a typed capturing group.
 * @param group A typed capturing group
 * @param regex A regex statement
 * @returns The regex statement wrapped in a typed capturing group
 */
function wrapCap(group: GroupKeys, regex: string) {
  return `(?<${group}>${regex})`;
}

/**
 * The wrapNonCap function simply wraps a regex statement inside of a
 * non-capturing group. I turned it into a function to allow me to
 * focus on the internal regex without worrying about how it is laid
 * out together.
 *
 * @param internal The internal regex to wrap
 * @returns The internal regex wrapped in a non-capturing group, or an
 * empty string if an empty string was passed.
 */
function wrapNonCap(internal: string = "") {
  return pipe(
    internal,
    O.fromPredicate((i) => i.length > 0),
    O.map((i) => `(?:${i})`),
    O.getOrElse(() => "")
  );
}

// The build function takes a regex and some flags and returns a new regex
function build(regex: string | RegExp, flags?: string) {
  return new RegExp(regex, flags);
}

/**
 * The getGroups function takes a regex and some flags and returns a function
 * that can be used to search for groups that were in the match. The groups will
 * be wrapped in an Either, but if they don't exist it will be an error (Left)
 * @param regex The regex to search for
 * @param flags The flags for the regex
 * @returns An either holding a Record<TType, string> or a RegexError, wrapped
 * in an Either
 */
function getGroups<TType extends string>(
  regex: string | RegExp,
  flags?: string
) {
  return function (
    search: string
  ): E.Either<RegexError, Record<TType, string>> {
    return pipe(
      // Build the regex, execute it and attempt to grab the groups or undefined
      build(regex, flags).exec(search)?.groups,

      // If the groups are undefined, return an error
      E.fromNullable<RegexError>(errorFrom<RegexMsg>("no groups found")),

      // If the groups are not undefined then we need to coerce them to the
      // correct type (Record<TType, string>) and return them
      E.map((i) =>
        unsafeCoerce<Record<string, string>, Record<TType, string>>(i)
      )
    );
  };
}

export { GroupKeys, inputRegex, ones, twos, threes, nonNameChars, getGroups };
