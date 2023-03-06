import { pipe, flow } from "fp-ts/function";
import * as E from "fp-ts/lib/Either";
import { getParams } from "./params";
import { getBookName } from "./book";
import { errorFrom, IError } from "./error";

type SearchMsg = "failed to get final book name";

type SearchError = IError<SearchMsg>;

const getBookNameAsEither = flow(
  getBookName,
  E.fromOption<SearchError>(() =>
    errorFrom<SearchMsg>("failed to get final book name")
  )
);

function getFinalName(search: string) {
  return pipe(
    search,
    getParams,
    E.chainW(({ book }) => pipe(book, E.chainW(getBookNameAsEither)))
  );
}

function search(search: string) {
  return pipe(
    E.Do,
    E.bind("book", (_) => getFinalName(search))
  );
}

export { search };
