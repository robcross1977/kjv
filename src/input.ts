import { pipe } from "fp-ts/function";
import { fromPredicate, map, getOrElse } from "fp-ts/Option";

/**
 * The Matcher module exists because it is easier for me to work
 * on and debug the very difficult-to-read regex required by this
 * app, so I'm breaking it down into small components, giving them
 * names and pasting them together. Yes, I could just copy the
 * string that gets output in the end, and that is great until I
 * want to add a feature or fix a bug, then I wish it was broke up.
 */

// Title
const bookNum = `(?<bookNum>[1|2|3])`;
const bookText = `(?<bookName>\\D+)`;
const name = `${bookNum}?\\s*${bookText}`;

// Chapter
const chapterStart = `(?<chapterStart>\\d{1,3})`;
const chapter = wrapNonCap(`${chapterStart}\\s*[:-]?\\s*$`);

// Chapter Verse
const chapterVerseChapterStart = `(?<chapterVerseChapterStart>\\d{1,3})`;
const chapterVerseVerseStart = `(?<chapterVerseVerseStart>\\d{1,3})`;
const mandatory = `${chapterVerseChapterStart}\\s*:\\s*${chapterVerseVerseStart}`;
const chapterVerseChapterEnd = wrapNonCap(
  `(?=\\d{1,3}\\s*:)(?<chapterVerseChapterEnd>\\d{1,3})\\s*:`
);
const chapterVerseVerseEnd = `(?<chapterVerseVerseEnd>\\d{1,3})`;
const optional = `-?\\s*${chapterVerseChapterEnd}?\\s*${chapterVerseVerseEnd}?`;
const chapterVerse = wrapNonCap(`${mandatory}\\s*${optional}?\\s*$`);

// Chapter Range
const chapterRangeChapterStart = `(?<chapterRangeChapterStart>\\d{1,3})`;
const chapterRangeChapterEnd = `(?<chapterRangeChapterEnd>\\d{1,3})`;
const chapterRangeVerseEnd = `(?<chapterRangeVerseEnd>\\d{1,3})`;
const chapterRange = wrapNonCap(
  `${chapterRangeChapterStart}\\s*-\\s*${chapterRangeChapterEnd}\\s*:?\\s*${chapterRangeVerseEnd}?\\s*$`
);

// Combined (Captain Planet)
const params = wrapNonCap(`${chapter}?|${chapterVerse}?|${chapterRange}?`);
const final = `^\\s*${name}\\s*${params}?\\s*`;

const matcher = {
  // We want to give a new RegExp every time so that
  // it isn't cluttered with pre-existing junk.
  build: () => new RegExp(final, "g"),
};

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
    fromPredicate((i) => i.length > 0),
    map((i) => `(?:${i})`),
    getOrElse(() => "")
  );
}

export { wrapNonCap, matcher, final as inputRegex };
