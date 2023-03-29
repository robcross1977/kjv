import { pipe } from "fp-ts/function";
import * as S from "fp-ts/string";
import * as O from "fp-ts/Option";
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray";
import { Predicate } from "fp-ts/lib/Predicate";

/**
 * The Search Module
 *
 * A search will be sliced up, distilled into bits, queried, collected,
 * reassembled and then delivered. This module provides utilities for
 * that process, enabling what is split to be reconciled to its origin.
 *
 */

/**
 * The Search Type
 *
 * A single search can include multiple sub-searches separated
 * by the ';' character. These sub-searches can further
 * be whittled down into multiple parts on the ',' character,
 * which is what the Split type holds.
 */

const stringExistsPredicate: Predicate<string> = (s) => s.length > 0;

function getSearch(query: string) {
  return pipe(
    O.Do,
    O.apS("original", getOriginal(query)),
    O.apS("searches", getSearches(query))
  );
}

function getOriginal(query: string) {
  return pipe(query, S.trim, O.fromPredicate(stringExistsPredicate));
}

function getSearches(query: string) {
  return pipe(query, S.trim, S.split(";"), RONEA.map(getSubSearches), O.of);
}

function getSubSearches(query: string) {
  return pipe(
    O.Do,
    O.apS("original", getSubOriginal(query)),
    O.apS("subs", getSubSearch(query))
  );
}

function getSubOriginal(query: string) {
  return pipe(query, S.trim, O.fromPredicate(stringExistsPredicate));
}

function getSubSearch(query: string) {
  return pipe(query, S.split(","), RONEA.map(S.trim), O.of);
}

(() => {
  const search = "things,stuff, dude, what;more,moar,moare;huh,what,sutff;;";
  const result = getSearch(search);
  console.log(`The result is ${JSON.stringify(result)}`);
})();
