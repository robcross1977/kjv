/**
 * The Search Module
 *
 * A search will be sliced up, distilled into bits, queried, collected,
 * reassembled and then delivered. This module provides utilities for
 * that process, enabling what is split to be reconciled to its origin.
 *
 */

/**
 * The Split Type
 *
 * A search can use commas to include further chapters/verses.
 *
 * > "Job 1:2, 3, 5" => head is "Job 1:2", tail would be ["3", "5"]
 * > "Job 1,3,5" => head is "Job 1", tail are ["3", "5"]
 */
type Split = {
  head: string;
  tail: string[];
};

/**
 * The Search Type
 *
 * A single search can include multiple sub-searches separated
 * by the ';' character. NOTE: these sub-searches can further
 * be whittled down into multiple parts on the ',' character,
 * which is what the Split type holds.
 */
type Search = {
  search: string;
  singles: Split[];
};
