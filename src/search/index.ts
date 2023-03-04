import { pipe, flow } from "fp-ts/function";
import { chain, chainW, map, Do, bind, fromOption } from "fp-ts/lib/Either";
import { getParams } from "./params";
import { getBookName } from "./book";
import { errorFrom, IError } from "./error";
import { MatcherError } from "./matcher";

type SearchMsg = "failed to get final book name";

type SearchError = IError<SearchMsg>;

const getBookNameAsEither = flow(
  getBookName,
  fromOption<SearchError>(() =>
    errorFrom<SearchMsg>("failed to get final book name")
  )
);

function getFinalName(search: string) {
  return pipe(
    search,
    getParams,
    chainW(({ book }) => pipe(book, chainW(getBookNameAsEither)))
  );
}

function search(search: string) {
  return pipe(
    Do,
    bind("book", (_) => getFinalName(search))
  );
}

export { search };
