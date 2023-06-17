import { makeChapterArray } from "../search-builder";
import * as E from "fp-ts/Either";
import { Eq } from "fp-ts/number";
import { fromArray } from "fp-ts/Set";
import { TypedParts } from "../params";
import { johnMock, lefty } from "../__mocks__/mocks";
import { genChapter } from "../__mocks__/helpers";

describe("The Search Builder Module", () => {
  describe("The makeChapterArray function", () => {
    // book, chapter, verse, verse-range, chapter-range, mult-chapter-verse, full-range
    it("should return a valid search a book query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right(
        johnMock
      );
      const parts: TypedParts = {
        type: "book",
        book: E.right("1 john"),
        chapterStart: lefty,
        chapterEnd: lefty,
        verseStart: lefty,
        verseEnd: lefty,
      };

      const result = makeChapterArray("1 john", parts);

      expect(result).toEqual(expected);
    });

    it("should return a valid search a chapter query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "2": johnMock["2"],
      });
      const parts: TypedParts = {
        type: "chapter",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: lefty,
        verseStart: lefty,
        verseEnd: lefty,
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
        chapterEnd: lefty,
        verseStart: E.right(2),
        verseEnd: lefty,
      };

      const result = makeChapterArray("1 john", parts);

      expect(result).toEqual(expected);
    });

    it("should return a valid chapter range search for a chapter range query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "2": johnMock["2"],
        "3": johnMock["3"],
        "4": johnMock["4"],
      });
      const parts: TypedParts = {
        type: "chapter-range",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: E.right(4),
        verseStart: lefty,
        verseEnd: lefty,
      };

      const result = makeChapterArray("1 john", parts);

      expect(result).toEqual(expected);
    });

    it("should return a valid multi-chapter-verse search for a multi-chapter-verse query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "2": johnMock["2"],
        "3": johnMock["3"],
        "4": genChapter(4), // fromArray(Eq)(A.makeBy(4, (i) => i + 1)),
      });
      const parts: TypedParts = {
        type: "multi-chapter-verse",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: E.right(4),
        verseStart: lefty,
        verseEnd: E.right(4),
      };

      const result = makeChapterArray("1 john", parts);

      expect(result).toEqual(expected);
    });

    it("should return a valid full search for a full search query", () => {
      const expected: E.Either<never, Record<string, Set<number>>> = E.right({
        "2": genChapter(28, 2),
        "3": johnMock["3"],
        "4": genChapter(4),
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
