import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as ROA from "fp-ts/ReadonlyArray";
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray";
import * as S from "fp-ts/string";
import { ParamsError, TypedParts, getParams } from "./params";
import { Search, makeChapterArray } from "./search-builder";
import { IError, errorFrom } from "./error";
import { getBookName } from "./bible-meta";

type SearchMsg = "no main found" | "book not found";
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

    // Split the query into parts on the comma, the first part being the main part, the rest being subs
    E.bind("splits", () => getSplits(query)),

    // Get the main part from the splits
    E.bind("main", ({ splits }) => getMain(splits)),

    // Get the sub parts from the splits. The sub-parts are comma-seperated values after the main part.
    // Example: John 3:16,18-20,22-24
    E.bind("subs", ({ splits }) => getSubs(splits)),

    E.bindW("parts", ({ main }) => getParams(main)),
    E.bind("title", ({ parts }) => getTitle(parts)),
    E.bindW("mainChapterVerses", ({ title, parts }) =>
      makeChapterArray(title, parts)
    ),
    //E.bind("subChapterVerses", ({ title, parts, subs}) => getSubChapterVerses(title, parts, subs)),
    //E.bind("combinedChapterVerses", ({ mainChapterVerses, subChapterVerses }) => combineChapterVerses(mainChapterVerses, subChapterVerses)
    E.bind("search", ({ title, mainChapterVerses }) =>
      E.right(<Search>{
        name: title,
        chapters: mainChapterVerses,
      })
    ),
    E.map(({ search }) => search)
    // add subs to chapter verses (might use that function that is like reduce but keeps the state)
    // get final bible search result

    // query the sql database and return the result
  );
}

function getSplits(query: string) {
  return pipe(
    query,
    S.split(","),
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
    ROA.map(S.trim),
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

export { search };
