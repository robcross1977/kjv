import { pipe } from "fp-ts/function";
import { ParamsError, getParams, TypedParts } from "./params";
import * as ROA from "fp-ts/ReadonlyArray";
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray";
import * as E from "fp-ts/Either";
import * as S from "fp-ts/string";
import { getBookName } from "./bible-meta";
import { IError, errorFrom } from "./error";
import { ReadonlyNonEmptyArray } from "fp-ts/lib/ReadonlyNonEmptyArray";

type SearchMsg = "book not found" | "no main found" | "no subs found";
type SearchError = IError<SearchMsg>;

function search(query: string) {
  return pipe(
    E.Do,
    E.bind("splits", () => getSplits(query)),
    E.bind("main", ({ splits }) => getMain(splits)),
    E.bind("subs", ({ splits }) => getSubs(splits)),
    E.bindW("parts", ({ main }) => getParams(main)),
    E.bind("title", ({ parts }) => getTitle(parts))
    //E.bind("chapterVerses", ({ parts }) => getChapterVerses(parts))
  );
}

function getSplits(query: string) {
  return pipe(
    query,
    S.split(","),
    E.of<SearchError, ReadonlyNonEmptyArray<string>>
  );
}

function getMain(splits: ReadonlyNonEmptyArray<string>) {
  return pipe(
    splits,
    RONEA.head,
    E.fromPredicate(
      (h) => h.length > 0,
      () => errorFrom<SearchMsg>("no main found")
    )
  );
}

function getSubs(splits: ReadonlyNonEmptyArray<string>) {
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

// TODO
function getChapterVerses(parts: TypedParts) {}

export { search };
