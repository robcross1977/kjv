import {
  ChapterError,
  ChapterMsg,
  getSearchParts,
  SearchType,
} from "../chapter";
import { ParamsError, Parts } from "../params";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { errorFrom } from "../error";

describe("The Chapter Module", () => {
  describe("The getSearchParts function", () => {
    function buildPartConfigurations(
      bookIsRight: boolean,
      chapterStartIsRight: boolean,
      chapterEndIsRight: boolean,
      verseStartIsRight: boolean,
      verseEndIsRight: boolean
    ): Parts {
      return {
        book: bookIsRight
          ? E.right("Song of Solomon")
          : E.left<ParamsError>({
              msg: "value is null or undefined",
            }),
        chapterStart: chapterStartIsRight
          ? E.right(1)
          : E.left<ParamsError>({
              msg: "value is null or undefined",
            }),
        chapterEnd: chapterEndIsRight
          ? E.right(2)
          : E.left<ParamsError>({
              msg: "value is null or undefined",
            }),
        verseStart: verseStartIsRight
          ? E.right(3)
          : E.left<ParamsError>({
              msg: "value is null or undefined",
            }),
        verseEnd: verseEndIsRight
          ? E.right(4)
          : E.left<ParamsError>({
              msg: "value is null or undefined",
            }),
      };
    }

    function exec(parts: Parts, expected: string | ChapterError) {
      expect.assertions(1);

      pipe(
        parts,
        getSearchParts,
        E.map((p) => expect(p.type).toBe(expected))
      );
    }

    it("should return an error for all of the invalid part combinations", () => {
      const invalidParts: Parts[] = [
        buildPartConfigurations(false, false, false, false, false),
        buildPartConfigurations(false, false, false, false, true),
        buildPartConfigurations(false, false, false, true, false),
        buildPartConfigurations(false, false, false, true, true),
        buildPartConfigurations(false, false, true, false, false),
        buildPartConfigurations(false, false, true, false, true),
        buildPartConfigurations(false, false, true, true, false),
        buildPartConfigurations(false, false, true, true, true),
        buildPartConfigurations(false, true, false, false, false),
        buildPartConfigurations(false, true, false, false, true),
        buildPartConfigurations(false, true, false, true, false),
        buildPartConfigurations(false, true, false, true, true),
        buildPartConfigurations(false, true, true, false, false),
        buildPartConfigurations(false, true, true, false, true),
        buildPartConfigurations(false, true, true, true, false),
        buildPartConfigurations(false, true, true, true, true),
        buildPartConfigurations(true, false, false, false, true),
        buildPartConfigurations(true, false, false, true, false),
        buildPartConfigurations(true, false, false, true, true),
        buildPartConfigurations(true, false, true, false, false),
        buildPartConfigurations(true, false, true, false, true),
        buildPartConfigurations(true, false, true, true, false),
        buildPartConfigurations(true, false, true, true, true),
        buildPartConfigurations(true, true, false, false, true),
        buildPartConfigurations(true, true, true, true, false), // no way to get this in the regex
      ];

      const expected = A.makeBy(invalidParts.length, () =>
        E.left(errorFrom<ChapterMsg>("invalid search parameters"))
      );

      expect.assertions(1);

      pipe(invalidParts, A.map(getSearchParts), (parts) =>
        expect(parts).toEqual(expected)
      );
    });

    it("should get a book type if only book specified (Ex: Job)", () => {
      const parts: Parts = buildPartConfigurations(
        true,
        false,
        false,
        false,
        false
      );
      const expected: SearchType = "book";
      exec(parts, expected);
    });

    it("should get a book/chapter type if only book and chapterStart specified (Ex: Job 1)", () => {
      const parts: Parts = buildPartConfigurations(
        true,
        true,
        false,
        false,
        false
      );
      const expected: SearchType = "chapter";
      exec(parts, expected);
    });

    it("should get a bverse type if only book, chapterStart and verseStart are specified (Ex: Job 1:2)", () => {
      const parts: Parts = buildPartConfigurations(
        true,
        true,
        false,
        true,
        false
      );
      const expected: SearchType = "verse";
      exec(parts, expected);
    });

    it("should get a chapterStart:VerseStart - verseEnd (verse-range) if only book, chapterStart, verseStart and verseEnd are specified (Ex: Job 1:3-5)", () => {
      const parts: Parts = buildPartConfigurations(
        true,
        true,
        false,
        true,
        true
      );
      const expected: SearchType = "verse-range";
      exec(parts, expected);
    });

    it("should get chapterStart - chapterEnd (chapter-range) if only book, chapterStart, and chapterEnd are specified (Ex: Job 1:3-5)", () => {
      const parts: Parts = buildPartConfigurations(
        true,
        true,
        true,
        false,
        false
      );
      const expected: SearchType = "chapter-range";
      exec(parts, expected);
    });

    it("should get chapterStart - chapterEnd:verseEnd (multi-chapter-verse) if only book, chapterStart, chapterEnd and verseEnd are specified (Ex: Job 1-2:3)", () => {
      const parts: Parts = buildPartConfigurations(
        true,
        true,
        true,
        false,
        true
      );
      const expected: SearchType = "multi-chapter-verse";
      exec(parts, expected);
    });

    it("should get chapterStart:verseStart - chapterEnd:verseEnd (full-range) if book, chapterStart, chapterEnd, verseStart and verseEnd are all specified (Ex: Job 1:2-3:4)", () => {
      const parts: Parts = buildPartConfigurations(
        true,
        true,
        true,
        true,
        true
      );
      const expected: SearchType = "full-range";
      exec(parts, expected);
    });
  });
});
