// import { pipe, flow } from "fp-ts/function";
// import { getParams } from "./params";
// import { map, chain, fromOption, getOrElse } from "fp-ts/Either";
// import { getFullName } from "./book";

// const getBookNameFromSearch = flow(
//   getFullName,
//   fromOption(() => "busted"),
//   getOrElse(() => "didn't get")
// );

// (() => {
//   const result = pipe(
//     "one thess",
//     getParams,
//     chain(flow(chain(({ book }) => pipe(book, map(getBookNameFromSearch))))),
//     getOrElse(() => "")
//   );

//   console.log(`result: ${JSON.stringify(result)}`);
// })();
