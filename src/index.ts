import { pipe } from "fp-ts/function";
import { getParams } from "./params";
import { map, chain } from "fp-ts/Either";
import { getFullName } from "./book";

(() => {
  const result = pipe(
    "one the",
    getParams,
    chain((wrapped) => {
      return pipe(
        wrapped,
        chain((parts) => {
          return pipe(
            parts.book,
            map((book) => getFullName(book))
          );
        })
      );
    })
  );

  console.log(`result: ${JSON.stringify(result)}`);
})();
