import { TypedParts } from "../params";
import { getSubsChapterArrays } from "../subs";
import * as E from "fp-ts/Either";
import { johnMock, lefty } from "../__mocks__/mocks";

describe("The Subs Module", () => {
  describe("The getSubsAsTypedParts function", () => {
    it("should return a correct chapter object for a book query with a chapter sub", () => {
      const mainParts: TypedParts = {
        type: "book",
        book: E.right("1 john"),
        chapterStart: lefty,
        chapterEnd: lefty,
        verseStart: lefty,
        verseEnd: lefty,
      };
      const expected = E.right([
        {
          "3": johnMock["3"],
        },
      ]);

      const result = getSubsChapterArrays("1 john", mainParts, ["3"]);
      expect(result).toEqual(expected);
    });

    it("should return a correct chapter object for a chapter query with a chapter sub", () => {
      const mainParts: TypedParts = {
        type: "chapter",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: lefty,
        verseStart: lefty,
        verseEnd: lefty,
      };
      const expected = E.right([
        {
          "3": johnMock["3"],
        },
      ]);

      const result = getSubsChapterArrays("1 john", mainParts, ["3"]);
      expect(result).toEqual(expected);
    });

    it("should return a correct chapter object for a chapter-range query with a chapter sub", () => {
      const mainParts: TypedParts = {
        type: "chapter-range",
        book: E.right("1 john"),
        chapterStart: E.right(2),
        chapterEnd: lefty,
        verseStart: lefty,
        verseEnd: lefty,
      };
      const expected = E.right([
        {
          "3": johnMock["3"],
        },
      ]);

      const result = getSubsChapterArrays("1 john", mainParts, ["3"]);
      expect(result).toEqual(expected);
    });
  });
});
