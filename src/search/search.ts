import { pipe } from "fp-ts/function";
import { trim, split, size } from "fp-ts/string";
import { Do, apS, fromPredicate, of } from "fp-ts/Option";
import { map, filter, compact } from "fp-ts/ReadonlyArray";
import { Predicate } from "fp-ts/Predicate";

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

function getSearch(query: string = "") {
  return pipe(
    Do,
    apS("original", getOriginal(query)),
    apS("searches", getSearches(query))
  );
}

function getOriginal(query: string) {
  return pipe(query, trim, fromPredicate(stringExistsPredicate));
}

function getSearches(query: string) {
  return pipe(query, trim, split(";"), map(getSubSearches), compact, of);
}

function getSubSearches(query: string) {
  return pipe(
    Do,
    apS("original", getSubOriginal(query)),
    apS("subs", getSubSearch(query))
  );
}

function getSubOriginal(query: string) {
  return pipe(query, trim, fromPredicate(stringExistsPredicate));
}

function getSubSearch(query: string) {
  return pipe(
    query,
    split(","),
    map(trim),
    filter((s) => size(s) > 0),
    of
  );
}

export { getSearch };
