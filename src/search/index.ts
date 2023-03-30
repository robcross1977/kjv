import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { errorFrom, IError } from "./error";
import { getSearch } from "./search";

type MainMsg = "No search found";

type MainError = IError<MainMsg>;

function search(search: string) {
  return pipe(E.Do, E.apS("searches", getSearches(search)));
}

function getSearches(search: string) {
  return pipe(
    search,
    getSearch,
    E.fromOption<MainError>(() => errorFrom<MainMsg>("No search found"))
  );
}

export { search };

const result = search("Job 1:2; Job 2:3,4; Job 3:5,6,7");
console.log(JSON.stringify(result, null, 2));
