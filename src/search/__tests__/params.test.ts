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

import { getParams, ParamsError, Parts } from "../params";
import { Either, left, right, map, mapLeft } from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";

function valIsNull(): Either<ParamsError, number> {
  return left({ msg: "value is null or undefined", err: "" });
}

describe("The params module", () => {
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
