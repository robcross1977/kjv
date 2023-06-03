/** 1 Song of Solomon 1:2 - 3:4
  Valid Types:
    None              ()
    Book              (book)
    BookChapter       (book, chapterStart)
    BookChapterRange  (book, chapterStart, chapterEnd)
    BookChapterVerse  (book, chapterStart, verseStart)
    VerseRange        (book, chapterStart, verseStart, verseEnd)
    ChapterVerseRange (book, chapterStart, verseStart, chapterEnd, verseEnd)
*/

import {
  getParams,
  ParamsError,
  ParamsMsg,
  Parts,
  SearchType,
  getTypedParts,
} from "../params";
import { Either, left, right, map, mapLeft } from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { getGroups } from "../regex";
import { makeBy, map as aMap } from "fp-ts/Array";
import { errorFrom } from "../error";

function valIsNull(): Either<ParamsError, number> {
  return left({ msg: "value is null or undefined", err: "" });
}

describe("The params module", () => {
  describe("The getParams function", () => {
    const tests: [search: string, expected: Parts][] = [
      [
        "  1   Song   of   Solomon  ",
        {
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: valIsNull(),
          chapterEnd: valIsNull(),
          verseStart: valIsNull(),
          verseEnd: valIsNull(),
        },
      ],
      [
        "  1   Song   of   Solomon   1  ",
        {
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: right(1),
          chapterEnd: valIsNull(),
          verseStart: valIsNull(),
          verseEnd: valIsNull(),
        },
      ],
      [
        "  1   Song   of   Solomon   1  :  2  ",
        {
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: right(1),
          chapterEnd: valIsNull(),
          verseStart: right(2),
          verseEnd: valIsNull(),
        },
      ],
      [
        "1 Song of Solomon1:2-  3",
        {
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: right(1),
          chapterEnd: valIsNull(),
          verseStart: right(2),
          verseEnd: right(3),
        },
      ],
      [
        "  1 Song of Solomon1:2-  3  :  4  ",
        {
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: right(1),
          chapterEnd: right(3),
          verseStart: right(2),
          verseEnd: right(4),
        },
      ],
      [
        "  1   Song   of   Solomon   1  -  4  ",
        {
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: right(1),
          chapterEnd: right(4),
          verseStart: valIsNull(),
          verseEnd: valIsNull(),
        },
      ],
    ];

    tests.map((test) => {
      it(`should return books params for the search string: ${test[0]}`, () => {
        actAndAssert(test[0], test[1]);
      });
    });

    const flops: [title: string, search: string, error: ParamsError][] = [
      [
        'should return "no groups found" error if there are no regex matches',
        "",
        { msg: "no groups found", err: "" },
      ],
    ];

    flops.map((flop) => {
      it(`${flop[0]}`, () => {
        actAndAssert(flop[1], flop[2]);
      });
    });

    /* Helpers */
    function actAndAssert(search: string, expected: Parts | ParamsError) {
      expect.assertions(1);

      pipe(
        search,
        getParams,
        map((result) => expect(result).toEqual(expected)),
        mapLeft((err) => expect(err).toEqual(expected))
      );
    }
  });

  describe("The getGroups function", () => {
    it("should take a regular expression, some regular expression options (global, multiline, case-insensivie, etc.), a search string and then return a Record<string, string> holding the groups with the names given in the regex", () => {
      const expectedA = "aloof";
      const expectedB = "eagle";
      const inputRegex = `^(?<a>${expectedA})b(?<c>${expectedB})$`;
      const inputToMatch = `${expectedA}${expectedB}`;

      pipe(
        inputToMatch,
        getGroups(inputRegex, "gi"),
        map((result) => {
          expect(result["a"]).toBe(expectedA);
          expect(result["c"]).toBe(expectedB);
        })
      );
    });

    it("should return a left(MatcherError) if the groups aren't found (set to null)", () => {
      const inputRegex = "^(?<a>a)b(?<c>c)$";
      const inputToMatch = "bdf";
      const expected = "no groups found";

      pipe(
        inputToMatch,
        getGroups(inputRegex, "gi"),
        mapLeft((err) => expect(err.msg).toBe(expected))
      );
    });

    it("should return a right instead of a left if a single match is found", () => {
      const expectedA = undefined;
      const expectedC = "aloof";
      const inputRegex = `^(?<a>notfound)?b(?<c>${expectedC})?$`;
      const inputToMatch = `b${expectedC}`;

      pipe(
        inputToMatch,
        getGroups(inputRegex, "gi"),
        map((result) => {
          expect(result["a"]).toBe(expectedA);
          expect(result["c"]).toBe(expectedC);
        })
      );
    });
  });

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
          ? right("Song of Solomon")
          : left<ParamsError>({
              msg: "value is null or undefined",
            }),
        chapterStart: chapterStartIsRight
          ? right(1)
          : left<ParamsError>({
              msg: "value is null or undefined",
            }),
        chapterEnd: chapterEndIsRight
          ? right(2)
          : left<ParamsError>({
              msg: "value is null or undefined",
            }),
        verseStart: verseStartIsRight
          ? right(3)
          : left<ParamsError>({
              msg: "value is null or undefined",
            }),
        verseEnd: verseEndIsRight
          ? right(4)
          : left<ParamsError>({
              msg: "value is null or undefined",
            }),
      };
    }

    function exec(parts: Parts, expected: string | ParamsError) {
      expect.assertions(1);

      pipe(
        parts,
        getTypedParts,
        map((p) => expect(p.type).toBe(expected))
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

      const expected = makeBy(invalidParts.length, () =>
        left(errorFrom<ParamsMsg>("invalid search parameters"))
      );

      expect.assertions(1);

      pipe(invalidParts, aMap(getTypedParts), (parts) =>
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
