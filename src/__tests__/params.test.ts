import { getParams } from "../params"
import { some, none, Option } from "fp-ts/Option"

describe('The params module', () => {
  const searches = [
    "  1   Song   of   Solomon  ",
    "  1   Song   of   Solomon   1  ",
    "  1   Song   of   Solomon   1  :  2  ",
    "1Song of Solomon1:2-  3",
    "  1   Song   of   Solomon   1  -  4  ",
  ]
  
  const expectations: ReturnType<typeof getParams>[] = [
    some({ book: some("1 Song of Solomon"), chapterStart: none,    chapterEnd: none,    verseStart: none,    verseEnd: none }),
    some({ book: some("1 Song of Solomon"), chapterStart: some(1), chapterEnd: none,    verseStart: none,    verseEnd: none }),
    some({ book: some("1 Song of Solomon"), chapterStart: some(1), chapterEnd: none,    verseStart: some(2), verseEnd: none }),
    some({ book: some("1 Song of Solomon"), chapterStart: some(1), chapterEnd: none,    verseStart: some(2), verseEnd: some(3) }),
    some({ book: some("1 Song of Solomon"), chapterStart: some(1), chapterEnd: some(4), verseStart: none,    verseEnd: none }),
  ]
  /* 1 Song of Solomon 1:2 - 3:4
  Valid Types:
  None              ()
  Book              (book)
  BookChapter       (book, chapterStart)
  BookChapterRange  (book, chapterStart, chapterEnd)
  BookChapterVerse  (book, chapterStart, verseStart)
  VerseRange        (book, chapterStart, verseStart, verseEnd)
  ChapterVerseRange (book, chapterStart, verseStart, chapterEnd, verseEnd)
  */
  searches.map((val, index) => {
    it(`should return the proper params for the search string ${val}`, () => {
      // arrange
      // act
      const result = getParams(val)
      // assert
      expect(result).toEqual(expectations[index])
    })
  })

  it('should return none if no book name', () => {
    // arrange
    const input = undefined as unknown as string
    const expected: Option<number> = none
    // act
    const result = getParams(input)
    console.log(`result: ${JSON.stringify(result)}`)
    // assert
    expect(result).toEqual(expected)
  })
})