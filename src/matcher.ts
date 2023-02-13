import { pipe } from "fp-ts/function";
import { fromPredicate, map, getOrElse } from "fp-ts/Option";

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
const chapterVerseChapterEnd = wrapNonCap(`(?=\\d{1,3}\\s*:)(?<chapterVerseChapterEnd>\\d{1,3})\\s*:`);
const chapterVerseVerseEnd = `(?<chapterVerseVerseEnd>\\d{1,3})`;
const optional = `-?\\s*${chapterVerseChapterEnd}?\\s*${chapterVerseVerseEnd}?`;
const chapterVerse = wrapNonCap(`${mandatory}\\s*${optional}?\\s*$`);

// Chapter Range
const chapterRangeChapterStart = `(?<chapterRangeChapterStart>\\d{1,3})`;
const chapterRangeChapterEnd = `(?<chapterRangeChapterEnd>\\d{1,3})`;
const chapterRangeVerseEnd = `(?<chapterRangeVerseEnd>\\d{1,3})`;
const chapterRange = wrapNonCap(`${chapterRangeChapterStart}\\s*-\\s*${chapterRangeChapterEnd}\\s*:?\\s*${chapterRangeVerseEnd}?\\s*$`);

// Combined (Captain Planet)
const params = wrapNonCap(`${chapter}?|${chapterVerse}?|${chapterRange}?`);
const final = `^\\s*${name}\\s*${params}?\\s*`;

const matcher = {
  from: () => new RegExp(final, "g")
}

function wrapNonCap(internal: string = '') {
  return pipe(
    internal,
    fromPredicate(i => i.length > 0),
    map(i => `(?:${i})`),
    getOrElse(() => ''),
  )
}

export { wrapNonCap, matcher };