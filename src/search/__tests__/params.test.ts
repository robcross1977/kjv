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

import { getParams, ParamsError, TypedParts } from "../params";
import { right, map, mapLeft } from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { lefty } from "../__mocks__/mocks";

describe("The params module", () => {
  describe("The getParams function", () => {
    const tests: [search: string, expected: TypedParts][] = [
      [
        "  1   Song   of   Solomon  ",
        {
          type: "book",
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: lefty,
          chapterEnd: lefty,
          verseStart: lefty,
          verseEnd: lefty,
        },
      ],
      [
        "  1   Song   of   Solomon   1  ",
        {
          type: "chapter",
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: right(1),
          chapterEnd: lefty,
          verseStart: lefty,
          verseEnd: lefty,
        },
      ],
      [
        "  1   Song   of   Solomon   1  :  2  ",
        {
          type: "verse",
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: right(1),
          chapterEnd: lefty,
          verseStart: right(2),
          verseEnd: lefty,
        },
      ],
      [
        "1 Song of Solomon1:2-  3",
        {
          type: "verse-range",
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: right(1),
          chapterEnd: lefty,
          verseStart: right(2),
          verseEnd: right(3),
        },
      ],
      [
        "  1 Song of Solomon1:2-  3  :  4  ",
        {
          type: "full-range",
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
          type: "chapter-range",
          book: right<ParamsError, string>("1 Song of Solomon"),
          chapterStart: right(1),
          chapterEnd: right(4),
          verseStart: lefty,
          verseEnd: lefty,
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
    function actAndAssert(search: string, expected: TypedParts | ParamsError) {
      expect.assertions(1);

      pipe(
        search,
        getParams,
        map((result) => expect(result).toEqual(expected)),
        mapLeft((err) => expect(err).toEqual(expected))
      );
    }
  });
});
