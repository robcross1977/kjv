import { Search, search } from "../search";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { Eq } from "fp-ts/number";
import { fromArray } from "fp-ts/Set";

describe("The Search Module", () => {
  describe("The search function", () => {
    // book, chapter, verse, verse-range, chapter-range, mult-chapter-verse, full-range
    it("should return a valid search a book query", () => {
      const expected: E.Either<never, Search> = E.right({
        name: "1 john",
        chapters: {
          "1": fromArray(Eq)(A.makeBy(10, (i) => i + 1)), // 1-10 (1-indexed)
          "2": fromArray(Eq)(A.makeBy(29, (i) => i + 1)), // 1-29 (1-indexed)
          "3": fromArray(Eq)(A.makeBy(24, (i) => i + 1)), // 1-24 (1-indexed)
          "4": fromArray(Eq)(A.makeBy(21, (i) => i + 1)), // 1-21 (1-indexed)
          "5": fromArray(Eq)(A.makeBy(21, (i) => i + 1)), // 1-21 (1-indexed)
        },
      });

      const result = search("1 john");
      expect(result).toEqual(expected);
    });

    it("should return a valid search a chapter query", () => {
      const expected: E.Either<never, Search> = E.right({
        name: "1 john",
        chapters: {
          "2": fromArray(Eq)(A.makeBy(29, (i) => i + 1)), // 1-29 (1-indexed)
        },
      });

      const result = search("1 john 2");
      expect(result).toEqual(expected);
    });

    it("should return a valid search a verse query", () => {
      const expected: E.Either<never, Search> = E.right({
        name: "1 john",
        chapters: {
          "2": fromArray(Eq)([2]),
        },
      });

      const result = search("1 john 2:2");
      expect(result).toEqual(expected);
    });

    it("should return a valid chapter range search for a chapter range query", () => {
      const expected: E.Either<never, Search> = E.right({
        name: "1 john",
        chapters: {
          "2": fromArray(Eq)(A.makeBy(29, (i) => i + 1)), // 1-29 (1-indexed)
          "3": fromArray(Eq)(A.makeBy(24, (i) => i + 1)), // 1-24 (1-indexed)
          "4": fromArray(Eq)(A.makeBy(21, (i) => i + 1)), // 1-21 (1-indexed)
        },
      });

      const result = search("1 John 2-4");

      expect(result).toEqual(expected);
    });

    it("should return a valid multi-chapter-verse search for a multi-chapter-verse query", () => {
      const expected: E.Either<never, Search> = E.right({
        name: "1 john",
        chapters: {
          "2": fromArray(Eq)(A.makeBy(29, (i) => i + 1)), // 1-29 (1-indexed)
          "3": fromArray(Eq)(A.makeBy(24, (i) => i + 1)), // 1-24 (1-indexed)
          "4": fromArray(Eq)(A.makeBy(4, (i) => i + 1)), // 1-21 (1-indexed)
        },
      });

      const result = search("1 John 2-4:4");

      expect(result).toEqual(expected);
    });
  });
});
