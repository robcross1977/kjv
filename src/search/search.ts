import { pipe } from "fp-ts/function";
import * as S from "fp-ts/string";
import * as E from "fp-ts/Either";
import * as RA from "fp-ts/ReadonlyArray";

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
type Search = {
  original: string;
  splits: string[];
};

function searchFrom(search: string) {
  return pipe(
    E.Do,
    E.bind("original", () => pipe(search, S.trim, E.of)),
    E.bind("splits", ({ original }) => {
      return pipe(
        original,
        S.split(";"),
        RA.map((s) => pipe(s, S.split(","))),
        E.of
      );
    })
  );
}
