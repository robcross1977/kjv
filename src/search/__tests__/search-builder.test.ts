import { makeChapterArray } from "../search-builder";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { Eq } from "fp-ts/number";
import { fromArray } from "fp-ts/Set";
import { ParamsMsg, TypedParts } from "../params";
import { errorFrom } from "../error";

describe("The Search Builder Module", () => {
  describe("The makeChapterArray function", () => {
    // book, chapter, verse, verse-range, chapter-range, mult-chapter-verse, full-range
    it("should return a valid search a book query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "1": fromArray(Eq)(A.makeBy(10, (i) => i + 1)), // 1-10 (1-indexed)
        "2": fromArray(Eq)(A.makeBy(29, (i) => i + 1)), // 1-29 (1-indexed)
        "3": fromArray(Eq)(A.makeBy(24, (i) => i + 1)), // 1-24 (1-indexed)
        "4": fromArray(Eq)(A.makeBy(21, (i) => i + 1)), // 1-21 (1-indexed)
        "5": fromArray(Eq)(A.makeBy(21, (i) => i + 1)), // 1-21 (1-indexed)
      });
      const parts: TypedParts = {
        type: "book",
        book: E.right("1 john"),
        chapterStart: E.left(
          errorFrom<ParamsMsg>("value is null or undefined")
        ),
        chapterEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        verseStart: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        verseEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
      };

      const result = makeChapterArray("1 john", parts);
      expect(result).toEqual(expected);
    });

    it("should return a valid search a chapter query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "2": fromArray(Eq)(A.makeBy(29, (i) => i + 1)), // 1-29 (1-indexed)
      });
      const parts: TypedParts = {
        type: "chapter",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        verseStart: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        verseEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
      };

      const result = makeChapterArray("1 john", parts);
      expect(result).toEqual(expected);
    });

    it("should return a valid search a verse query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "2": fromArray(Eq)([2]),
      });
      const parts: TypedParts = {
        type: "verse",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        verseStart: E.right(2),
        verseEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
      };

      const result = makeChapterArray("1 john", parts);
      expect(result).toEqual(expected);
    });

    it("should return a valid chapter range search for a chapter range query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "2": fromArray(Eq)(A.makeBy(29, (i) => i + 1)), // 1-29 (1-indexed)
        "3": fromArray(Eq)(A.makeBy(24, (i) => i + 1)), // 1-24 (1-indexed)
        "4": fromArray(Eq)(A.makeBy(21, (i) => i + 1)), // 1-21 (1-indexed)
      });
      const parts: TypedParts = {
        type: "chapter-range",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: E.right(4),
        verseStart: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        verseEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
      };

      const result = makeChapterArray("1 john", parts);

      expect(result).toEqual(expected);
    });

    it("should return a valid multi-chapter-verse search for a multi-chapter-verse query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "2": fromArray(Eq)(A.makeBy(29, (i) => i + 1)), // 1-29 (1-indexed)
        "3": fromArray(Eq)(A.makeBy(24, (i) => i + 1)), // 1-24 (1-indexed)
        "4": fromArray(Eq)(A.makeBy(4, (i) => i + 1)), // 1-21 (1-indexed)
      });
      const parts: TypedParts = {
        type: "multi-chapter-verse",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: E.right(4),
        verseStart: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        verseEnd: E.right(4),
      };

      const result = makeChapterArray("1 john", parts);

      expect(result).toEqual(expected);
    });

    it("should return a valid full search for a full search query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "2": fromArray(Eq)(A.makeBy(28, (i) => i + 2)), // 1-29 (1-indexed)
        "3": fromArray(Eq)(A.makeBy(24, (i) => i + 1)), // 1-24 (1-indexed)
        "4": fromArray(Eq)(A.makeBy(4, (i) => i + 1)), // 1-21 (1-indexed)
      });
      const parts: TypedParts = {
        type: "full-range",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: E.right(4),
        verseStart: E.right(2),
        verseEnd: E.right(4),
      };

      const result = makeChapterArray("1 john", parts);

      expect(result).toEqual(expected);
    });
  });
});
