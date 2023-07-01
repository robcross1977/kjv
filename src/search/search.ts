import { getBookName, ValidBookName } from "./bible-meta";
import { IError, errorFrom } from "./error";
import { ParamsError, TypedParts, getParams } from "./params";
import { concatChapters, makeChapterArray, Search, SearchBuilderError } from "./search-builder";
import { getSubsChapterArrays, SubsError } from "./subs";
import { ChapterRecords, WrappedRecords } from "../lib/types";
import { kjv } from "../kjv";
import { pipe } from "fp-ts/function";
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
    E.bind("isMulti", ({ subs }) => E.right(ROA.size(subs) > 0)),

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
    E.bind("search", ({ title, combinedChapterVerses, parts, isMulti }) =>
      E.right(<Search>{
        name: title,
        type: isMulti ? "multi" : parts.type,
        chapters: combinedChapterVerses,
      })
    ),
    E.chainW(({ search }) =>
      pipe(
        search,
        getResult,
        E.fromOption<SearchError>(() => errorFrom<SearchMsg>("no result found"))
      )
    ),
    E.getOrElse<SearchError | ParamsError | SearchBuilderError | SubsError, WrappedRecords>(() => {return {
      type: "none",
      records: {}
    }})
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
    O.apS("type", O.of(search.type)),
    O.apS("bookJson", O.of(getChapterRecordsByBook(search.name))),
    O.bind("chapters", ({ bookJson }) =>
      pipe(
        // Get the chapters
        search.chapters,

        // Get the keys we are searching for
        R.keys,

        // Map through the keys to get the chapters
        A.map((key) =>
          pipe(
            O.Do,

            // The chapter is just the key itself as a Number
            O.apS("chapter", pipe(key, Number, O.of)),

            // Get the verses we are searching for from the search object
            O.bind("verses", ({ chapter }) =>
              pipe(
                O.Do,

                // Get the search chapter to search (the value in the k/v pair)
                O.apS("searchChapter", pipe(search.chapters[chapter], O.of)),

                // Filter the bookJson object to only include the verses from the
                // json object that are present in the search object
                O.map(({ searchChapter }) =>
                  pipe(
                    bookJson[chapter],
                    R.filterWithIndex((k, _) => {
                      return S.elem(Eq)(Number(k), searchChapter);
                    })
                  )
                )
              )
            ),
            O.map(
              ({ chapter, verses }) =>
                <[string, Record<string, string>]>[String(chapter), verses]
            )
          )
        ),
        O.sequenceArray
      )
    ),
    O.map(({ bookName, chapters, type }) => {
      return {
        type, 
        records: {
          [bookName]: R.fromEntries(ROA.toArray(chapters)),
        }
      };
    })
  );
}

function getChapterRecordsByBook(book: ValidBookName): ChapterRecords {
  return kjv[book];
}

export { search };
