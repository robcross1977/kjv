import { getBookName, ValidBookName } from "./bible-meta";
import { IError, errorFrom } from "./error";
import { ParamsError, TypedParts, getParams } from "./params";
import { concatChapters, makeChapterArray, Search } from "./search-builder";
import { getSubsChapterArrays } from "./subs";
import { Book } from "../lib/types";
import {
  OneChronicles,
  OneCorinthians,
  OneJohn,
  OneKings,
  OnePeter,
  OneSamuel,
  OneThessalonians,
  OneTimothy,
  TwoChronicles,
  TwoCorinthians,
  TwoJohn,
  TwoKings,
  TwoPeter,
  TwoSamuel,
  TwoThessalonians,
  TwoTimothy,
  ThreeJohn,
  Acts,
  Amos,
  Colossians,
  Daniel,
  Deuteronomy,
  Ecclesiastes,
  Ephesians,
  Esther,
  Exodus,
  Ezekiel,
  Ezra,
  Galatians,
  Genesis,
  Habakkuk,
  Haggai,
  Hebrews,
  Hosea,
  Isaiah,
  James,
  Jeremiah,
  Job,
  Joel,
  John,
  Jonah,
  Joshua,
  Jude,
  Judges,
  Lamentations,
  Leviticus,
  Luke,
  Malachi,
  Mark,
  Matthew,
  Micah,
  Nahum,
  Nehemiah,
  Numbers,
  Obadiah,
  Philemon,
  Philippians,
  Proverbs,
  Psalms,
  Revelation,
  Romans,
  Ruth,
  SongOfSolomon,
  Titus,
  Zechariah,
  Zephaniah,
} from "../search/books";
import { absurd, pipe } from "fp-ts/function";
import { Eq } from "fp-ts/number";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as R from "fp-ts/Record";
import * as ROA from "fp-ts/ReadonlyArray";
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray";
import * as S from "fp-ts/Set";
import * as Str from "fp-ts/string";

type SearchMsg =
  | "no main found"
  | "book not found"
  | "unable to concat searches"
  | "no result found";
type SearchError = IError<SearchMsg>;

/**
 * The search function takes the query string and returns a bible search result.
 *
 * @param query The query string (e.g. "John 3:16")
 * @returns A bible search result in JSON format
 */
function search(query: string) {
  return pipe(
    E.Do,

    // Split the query into parts on the comma, the first part being the main
    // part, the rest being subs
    E.bind("splits", () => getSplits(query)),

    // Get the main part from the splits
    E.bind("main", ({ splits }) => getMain(splits)),

    // Get the sub parts from the splits. The sub-parts are comma-seperated
    // values after the main part.
    // Example: John 3:16,18-20,22-24
    E.bind("subs", ({ splits }) => getSubs(splits)),

    E.bindW("parts", ({ main }) => getParams(main)),
    E.bind("title", ({ parts }) => getTitle(parts)),
    E.bindW("mainChapterVerses", ({ title, parts }) =>
      makeChapterArray(title, parts)
    ),
    E.bindW("subChapterVerses", ({ title, parts, subs }) =>
      getSubsChapterArrays(title, parts, ROA.toArray(subs))
    ),
    E.bind("combinedChapterVerses", ({ mainChapterVerses, subChapterVerses }) =>
      E.right(
        concatChapters([mainChapterVerses, ...ROA.toArray(subChapterVerses)])
      )
    ),
    E.bind("search", ({ title, mainChapterVerses }) =>
      E.right(<Search>{
        name: title,
        chapters: mainChapterVerses,
      })
    ),
    E.chainW(({ search }) =>
      pipe(
        search,
        getResult,
        E.fromOption<SearchError>(() => errorFrom<SearchMsg>("no result found"))
      )
    )
  );
}

function getSplits(query: string) {
  return pipe(
    query,
    Str.split(","),
    E.of<SearchError, RONEA.ReadonlyNonEmptyArray<string>>
  );
}

function getMain(splits: RONEA.ReadonlyNonEmptyArray<string>) {
  return pipe(
    splits,
    RONEA.head,
    E.fromPredicate(
      (h) => h.length > 0,
      () => errorFrom<SearchMsg>("no main found")
    )
  );
}

function getSubs(splits: RONEA.ReadonlyNonEmptyArray<string>) {
  return pipe(
    splits,
    RONEA.tail,
    ROA.map(Str.trim),
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

function getResult(search: Search) {
  return pipe(
    O.Do,
    O.apS("bookName", O.of(search.name)),
    O.apS("bookJson", O.of(getBookJson(search.name))),
    O.bind("chapters", ({ bookJson }) =>
      pipe(
        // Get the chapters
        search.chapters,

        // Get the keys we are searching for
        R.keys,

        // Map through the keys to get the chapters
        A.map((k) =>
          pipe(
            O.Do,

            // The chapter is just the key itself as a Number
            O.apS("chapter", pipe(k, Number, O.of)),

            // Get the verses we are searching for from the search object
            O.bind("verses", ({ chapter }) =>
              pipe(
                O.Do,

                // Get the search chapter to search (the value in the k/v pair)
                O.apS("chapterToSearch", pipe(search.chapters[chapter], O.of)),

                // Filter the bookJson object to only include the verses from the
                // json object that are present in the search object
                O.map(({ chapterToSearch }) =>
                  pipe(
                    bookJson.chapters[chapter].verses,
                    A.filter((v) => S.elem(Eq)(v.number)(chapterToSearch))
                  )
                )
              )
            ),
            O.map(({ chapter, verses }) => {
              return {
                number: chapter,
                verses,
              };
            })
          )
        ),
        O.sequenceArray
      )
    ),
    O.map(({ bookName, chapters }) => {
      return <Book>{
        name: bookName,
        chapters,
      };
    })
  );
}

function getBookJson(book: ValidBookName): Book {
  switch (book) {
    case "1 chronicles":
      return OneChronicles;
    case "1 corinthians":
      return OneCorinthians;
    case "1 john":
      return OneJohn;
    case "1 kings":
      return OneKings;
    case "1 peter":
      return OnePeter;
    case "1 samuel":
      return OneSamuel;
    case "1 thessalonians":
      return OneThessalonians;
    case "1 timothy":
      return OneTimothy;
    case "2 chronicles":
      return TwoChronicles;
    case "2 corinthians":
      return TwoCorinthians;
    case "2 john":
      return TwoJohn;
    case "2 kings":
      return TwoKings;
    case "2 peter":
      return TwoPeter;
    case "2 samuel":
      return TwoSamuel;
    case "2 thessalonians":
      return TwoThessalonians;
    case "2 timothy":
      return TwoTimothy;
    case "3 john":
      return ThreeJohn;
    case "acts":
      return Acts;
    case "amos":
      return Amos;
    case "colossians":
      return Colossians;
    case "daniel":
      return Daniel;
    case "deuteronomy":
      return Deuteronomy;
    case "ecclesiastes":
      return Ecclesiastes;
    case "ephesians":
      return Ephesians;
    case "esther":
      return Esther;
    case "exodus":
      return Exodus;
    case "ezekiel":
      return Ezekiel;
    case "ezra":
      return Ezra;
    case "galatians":
      return Galatians;
    case "genesis":
      return Genesis;
    case "habakkuk":
      return Habakkuk;
    case "haggai":
      return Haggai;
    case "hebrews":
      return Hebrews;
    case "hosea":
      return Hosea;
    case "isaiah":
      return Isaiah;
    case "james":
      return James;
    case "jeremiah":
      return Jeremiah;
    case "job":
      return Job;
    case "joel":
      return Joel;
    case "john":
      return John;
    case "jonah":
      return Jonah;
    case "joshua":
      return Joshua;
    case "jude":
      return Jude;
    case "judges":
      return Judges;
    case "lamentations":
      return Lamentations;
    case "leviticus":
      return Leviticus;
    case "luke":
      return Luke;
    case "malachi":
      return Malachi;
    case "mark":
      return Mark;
    case "matthew":
      return Matthew;
    case "micah":
      return Micah;
    case "nahum":
      return Nahum;
    case "nehemiah":
      return Nehemiah;
    case "numbers":
      return Numbers;
    case "obadiah":
      return Obadiah;
    case "philemon":
      return Philemon;
    case "philippians":
      return Philippians;
    case "proverbs":
      return Proverbs;
    case "psalms":
      return Psalms;
    case "revelation":
      return Revelation;
    case "romans":
      return Romans;
    case "ruth":
      return Ruth;
    case "song of solomon":
      return SongOfSolomon;
    case "titus":
      return Titus;
    case "zechariah":
      return Zechariah;
    case "zephaniah":
      return Zephaniah;
    default:
      return absurd(book);
  }
}

export { search };
