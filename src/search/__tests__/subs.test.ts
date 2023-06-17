import { TypedParts } from "../params";
import { getSubsChapterArrays } from "../subs";
import * as E from "fp-ts/Either";
import { johnMock, lefty } from "../__mocks__/mocks";
import { Eq } from "fp-ts/lib/number";
import { fromArray } from "fp-ts/Set";

const bookParts: TypedParts = {
  type: "book",
  book: E.right("1 john"),
  chapterStart: lefty,
  chapterEnd: lefty,
  verseStart: lefty,
  verseEnd: lefty,
};

const chapterParts: TypedParts = {
  type: "chapter",
  book: E.right("1 john"),
  chapterStart: E.right(2),
  chapterEnd: lefty,
  verseStart: lefty,
  verseEnd: lefty,
};

const chapterRangeParts: TypedParts = {
  type: "chapter-range",
  book: E.right("1 john"),
  chapterStart: E.right(2),
  chapterEnd: E.right(4),
  verseStart: lefty,
  verseEnd: lefty,
};

const verseParts: TypedParts = {
  type: "verse",
  book: E.right("1 john"),
  chapterStart: E.right(2),
  chapterEnd: lefty,
  verseStart: E.right(5),
  verseEnd: lefty,
};

const verseRangeParts: TypedParts = {
  type: "verse-range",
  book: E.right("1 john"),
  chapterStart: E.right(2),
  chapterEnd: lefty,
  verseStart: E.right(3),
  verseEnd: E.right(5),
};

const multiChapterVerseParts: TypedParts = {
  type: "multi-chapter-verse",
  book: E.right("1 john"),
  chapterStart: E.right(2),
  chapterEnd: E.right(4),
  verseStart: lefty,
  verseEnd: E.right(6),
};

const fullRangeParts: TypedParts = {
  type: "full-range",
  book: E.right("1 john"),
  chapterStart: E.right(2),
  chapterEnd: E.right(4),
  verseStart: E.right(3),
  verseEnd: E.right(5),
};

describe("The Subs Module", () => {
  describe("The getSubsAsTypedParts function", () => {
    describe("Chapter Subs", () => {
      it(`
        should return a correct chapter object
        for a book/chapter/chapterRange query but not for a
        verse/verse-range/multi-chapter-verse/full-range query
      `, () => {
        const expected = E.right([
          {
            "3": johnMock["3"],
          },
        ]);

        const bookResult = getSubsChapterArrays("1 john", bookParts, ["3"]);
        const chapterResult = getSubsChapterArrays("1 john", chapterParts, [
          "3",
        ]);
        const chapterRangeResult = getSubsChapterArrays(
          "1 john",
          chapterRangeParts,
          ["3"]
        );
        const verseResult = getSubsChapterArrays("1 john", verseParts, ["3"]);
        const verseRangeResult = getSubsChapterArrays(
          "1 john",
          verseRangeParts,
          ["3"]
        );
        const multiChapterVerseResult = getSubsChapterArrays(
          "1 john",
          multiChapterVerseParts,
          ["3"]
        );
        const fullRangeResult = getSubsChapterArrays("1 john", fullRangeParts, [
          "3",
        ]);

        expect(bookResult).toEqual(expected);
        expect(chapterResult).toEqual(expected);
        expect(chapterRangeResult).toEqual(expected);
        expect(verseResult).not.toEqual(expected);
        expect(verseRangeResult).not.toEqual(expected);
        expect(multiChapterVerseResult).not.toEqual(expected);
        expect(fullRangeResult).not.toEqual(expected);
      });
    });

    describe("Chapter Range Subs", () => {
      it(`
        should return a correct chapter-range object for a 
        book/chapter/chapter-range query with a chapter-range sub but not for a
        verse/verse-range/multi-chapter-verse/full-range query
      `, () => {
        const expected = E.right([
          {
            "2": johnMock["2"],
            "3": johnMock["3"],
            "4": johnMock["4"],
          },
        ]);

        const bookResult = getSubsChapterArrays("1 john", bookParts, ["2-4"]);
        const chapterResult = getSubsChapterArrays("1 john", chapterParts, [
          "2-4",
        ]);
        const chapterRangeResult = getSubsChapterArrays(
          "1 john",
          chapterRangeParts,
          ["2-4"]
        );
        const verseResult = getSubsChapterArrays("1 john", verseParts, ["2-4"]);
        const verseRangeResult = getSubsChapterArrays(
          "1 john",
          verseRangeParts,
          ["2-4"]
        );
        const multiChapterVerseResult = getSubsChapterArrays(
          "1 john",
          multiChapterVerseParts,
          ["2-4"]
        );
        const fullRangeResult = getSubsChapterArrays("1 john", fullRangeParts, [
          "2-4",
        ]);

        expect(bookResult).toEqual(expected);
        expect(chapterResult).toEqual(expected);
        expect(chapterRangeResult).toEqual(expected);
        expect(verseResult).not.toEqual(expected);
        expect(verseRangeResult).not.toEqual(expected);
        expect(multiChapterVerseResult).not.toEqual(expected);
        expect(fullRangeResult).not.toEqual(expected);
      });
    });

    describe("Chapter Verse Subs", () => {
      it(`should return a correct chapter/verse object for any query`, () => {
        const expected = E.right([
          {
            "2": fromArray(Eq)([3]),
          },
        ]);

        const bookResult = getSubsChapterArrays("1 john", bookParts, ["2:3"]);
        const chapterResult = getSubsChapterArrays("1 john", chapterParts, [
          "2:3",
        ]);
        const chapterRangeResult = getSubsChapterArrays(
          "1 john",
          chapterRangeParts,
          ["2:3"]
        );
        const verseResult = getSubsChapterArrays("1 john", verseParts, ["2:3"]);
        const verseRangeResult = getSubsChapterArrays(
          "1 john",
          verseRangeParts,
          ["2:3"]
        );
        const multiChapterVerseResult = getSubsChapterArrays(
          "1 john",
          multiChapterVerseParts,
          ["2:3"]
        );
        const fullRangeResult = getSubsChapterArrays("1 john", fullRangeParts, [
          "2:3",
        ]);

        expect(bookResult).toEqual(expected);
        expect(chapterResult).toEqual(expected);
        expect(chapterRangeResult).toEqual(expected);
        expect(verseResult).toEqual(expected);
        expect(verseRangeResult).toEqual(expected);
        expect(multiChapterVerseResult).toEqual(expected);
        expect(fullRangeResult).toEqual(expected);
      });
    });

    describe("Verse Subs", () => {
      it(`
        should return a correct verse object for a
        verse/verse-range/multi-chapter-verse/full-range query with a verse sub
        but not for a book/chapter/chapter-range query
      `, () => {
        const expected = E.right([
          {
            "2": fromArray(Eq)([3]),
          },
        ]);

        const bookResult = getSubsChapterArrays("1 john", bookParts, ["3"]);
        const chapterResult = getSubsChapterArrays("1 john", chapterParts, [
          "3",
        ]);
        const chapterRangeResult = getSubsChapterArrays(
          "1 john",
          chapterRangeParts,
          ["3"]
        );
        const verseResult = getSubsChapterArrays("1 john", verseParts, ["3"]);
        const verseRangeResult = getSubsChapterArrays(
          "1 john",
          verseRangeParts,
          ["3"]
        );
        const multiChapterVerseResult = getSubsChapterArrays(
          "1 john",
          multiChapterVerseParts,
          ["3"]
        );
        const fullRangeResult = getSubsChapterArrays("1 john", fullRangeParts, [
          "3",
        ]);

        expect(bookResult).not.toEqual(expected);
        expect(chapterResult).not.toEqual(expected);
        expect(chapterRangeResult).not.toEqual(expected);
        expect(verseResult).toEqual(expected);
        expect(verseRangeResult).toEqual(expected);
        expect(multiChapterVerseResult).toEqual(expected);
        expect(fullRangeResult).toEqual(expected);
      });
    });

    describe("Verse Range Subs", () => {
      it(`
        should return a correct verse-range object for a
        verse/verse-range/multi-chapter-verse/full-range query with a 
        verse-range sub but not with a book/chapter/chapter-range query
      `, () => {
        const expected = E.right([
          {
            "2": fromArray(Eq)([3, 4, 5]),
          },
        ]);

        const bookResult = getSubsChapterArrays("1 john", bookParts, ["3-5"]);
        const chapterResult = getSubsChapterArrays("1 john", chapterParts, [
          "3-5",
        ]);
        const chapterRangeResult = getSubsChapterArrays(
          "1 john",
          chapterRangeParts,
          ["3-5"]
        );
        const verseResult = getSubsChapterArrays("1 john", verseParts, ["3-5"]);
        const verseRangeResult = getSubsChapterArrays(
          "1 john",
          verseRangeParts,
          ["3-5"]
        );
        const multiChapterVerseResult = getSubsChapterArrays(
          "1 john",
          multiChapterVerseParts,
          ["3-5"]
        );
        const fullRangeResult = getSubsChapterArrays("1 john", fullRangeParts, [
          "3-5",
        ]);

        expect(bookResult).not.toEqual(expected);
        expect(chapterResult).not.toEqual(expected);
        expect(chapterRangeResult).not.toEqual(expected);
        expect(verseResult).toEqual(expected);
        expect(verseRangeResult).toEqual(expected);
        expect(multiChapterVerseResult).toEqual(expected);
        expect(fullRangeResult).toEqual(expected);
      });
    });

    describe("Full Verse Range Subs", () => {
      it(`
        should return a correct verse-range object for a any query with a
        full-verse range sub
      `, () => {
        const expected = E.right([
          {
            "3": fromArray(Eq)([3, 4, 5]),
          },
        ]);

        const bookResult = getSubsChapterArrays("1 john", bookParts, ["3:3-5"]);
        const chapterResult = getSubsChapterArrays("1 john", chapterParts, [
          "3:3-5",
        ]);
        const chapterRangeResult = getSubsChapterArrays(
          "1 john",
          chapterRangeParts,
          ["3:3-5"]
        );
        const verseResult = getSubsChapterArrays("1 john", verseParts, [
          "3:3-5",
        ]);
        const verseRangeResult = getSubsChapterArrays(
          "1 john",
          verseRangeParts,
          ["3:3-5"]
        );
        const multiChapterVerseResult = getSubsChapterArrays(
          "1 john",
          multiChapterVerseParts,
          ["3:3-5"]
        );
        const fullRangeResult = getSubsChapterArrays("1 john", fullRangeParts, [
          "3:3-5",
        ]);

        expect(bookResult).toEqual(expected);
        expect(chapterResult).toEqual(expected);
        expect(chapterRangeResult).toEqual(expected);
        expect(verseResult).toEqual(expected);
        expect(verseRangeResult).toEqual(expected);
        expect(multiChapterVerseResult).toEqual(expected);
        expect(fullRangeResult).toEqual(expected);
      });
    });

    describe("Multi-Chapter Verse Subs", () => {
      it(`
        should return a correct multi-chapter-verse object for any query with
        a multi-chapter-verse sub
      `, () => {
        const expected = E.right([
          {
            "2": johnMock["2"],
            "3": johnMock["3"],
            "4": fromArray(Eq)([1, 2, 3, 4]),
          },
        ]);

        const bookResult = getSubsChapterArrays("1 john", bookParts, ["2-4:4"]);
        const chapterResult = getSubsChapterArrays("1 john", chapterParts, [
          "2-4:4",
        ]);
        const chapterRangeResult = getSubsChapterArrays(
          "1 john",
          chapterRangeParts,
          ["2-4:4"]
        );
        const verseResult = getSubsChapterArrays("1 john", verseParts, [
          "2-4:4",
        ]);
        const verseRangeResult = getSubsChapterArrays(
          "1 john",
          verseRangeParts,
          ["2-4:4"]
        );
        const multiChapterVerseResult = getSubsChapterArrays(
          "1 john",
          multiChapterVerseParts,
          ["2-4:4"]
        );
        const fullRangeResult = getSubsChapterArrays("1 john", fullRangeParts, [
          "2-4:4",
        ]);

        expect(bookResult).toEqual(expected);
        expect(chapterResult).toEqual(expected);
        expect(chapterRangeResult).toEqual(expected);
        expect(verseResult).toEqual(expected);
        expect(verseRangeResult).toEqual(expected);
        expect(multiChapterVerseResult).toEqual(expected);
        expect(fullRangeResult).toEqual(expected);
      });
    });

    describe("Full-Range Subs", () => {
      it(`
        should return a correct full-range object for any query with a 
        full-range sub
      `, () => {
        const expected = E.right([
          {
            "2": fromArray(Eq)([25, 26, 27, 28, 29]),
            "3": johnMock["3"],
            "4": fromArray(Eq)([1, 2, 3, 4]),
          },
        ]);

        const bookResult = getSubsChapterArrays("1 john", bookParts, [
          "2:25-4:4",
        ]);
        const chapterResult = getSubsChapterArrays("1 john", chapterParts, [
          "2:25-4:4",
        ]);
        const chapterRangeResult = getSubsChapterArrays(
          "1 john",
          chapterRangeParts,
          ["2:25-4:4"]
        );
        const verseResult = getSubsChapterArrays("1 john", verseParts, [
          "2:25-4:4",
        ]);
        const verseRangeResult = getSubsChapterArrays(
          "1 john",
          verseRangeParts,
          ["2:25-4:4"]
        );
        const multiChapterVerseResult = getSubsChapterArrays(
          "1 john",
          multiChapterVerseParts,
          ["2:25-4:4"]
        );
        const fullRangeResult = getSubsChapterArrays("1 john", fullRangeParts, [
          "2:25-4:4",
        ]);

        expect(bookResult).toEqual(expected);
        expect(chapterResult).toEqual(expected);
        expect(chapterRangeResult).toEqual(expected);
        expect(verseResult).toEqual(expected);
        expect(verseRangeResult).toEqual(expected);
        expect(multiChapterVerseResult).toEqual(expected);
        expect(fullRangeResult).toEqual(expected);
      });
    });

    describe("Multi-Subs", () => {
      it("should return a correct multi-sub object for a book query with a multi-sub", () => {
        const expected = E.right([
          { "1": johnMock["1"] },
          { "2": johnMock["2"], "3": johnMock["3"] },
          { "4": fromArray(Eq)([2]) },
          { "4": fromArray(Eq)([4, 5, 6]) },
          {
            "4": fromArray(Eq)([18, 19, 20, 21]),
            "5": fromArray(Eq)([1, 2, 3, 4]),
          },
        ]);

        const result = getSubsChapterArrays("1 john", bookParts, [
          "1",
          "2-3",
          "4:2",
          "4:4-6",
          "4:18-5:4",
        ]);

        expect(result).toEqual(expected);
      });
    });
  });
});
