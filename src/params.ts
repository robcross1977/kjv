import { pipe } from "fp-ts/function"
import { fromNullable, fromPredicate, map, of, getOrElse, chain, isSome } from "fp-ts/Option"
import { replace, trim } from "fp-ts/string"

const searchReg = /^\s*(?<bookNum>[1|2|3])?\s*(?<bookName>[a-zA-Z ]*)(?<chapterStart>\d{1,3})?\s*(?:(?:-\s*(?<chapterEnd>\d{1,3})?)|(?::\s*(?<verseStart>\d{1,3})?\s*(?:-\s*(?<verseEnd>\d{1,3})?)?)?)\s*$/

export function getParams(search: string) {
  return pipe(
    searchReg.exec(search)?.groups ?? {},
    of,
    map(getParts),
    chain(wrapOuterOption),
  )
}

function getParts(parts: Record<string, string>) {
  return {
    book: buildBookName(parts.bookNum, parts.bookName),
    chapterStart: toNumber(parts.chapterStart),
    chapterEnd: toNumber(parts.chapterEnd),
    verseStart: toNumber(parts.verseStart),
    verseEnd: toNumber(parts.verseEnd),
  }
}

function toNumber(val?: string) {
  return pipe(
    val,
    fromNullable,
    chain(fromPredicate<string>(val => !Number.isNaN(Number(val)))),
    map(Number),
  )
}

function buildBookName(bookNum?: string, bookName?: string) {
  return fromPredicate<string>((name) => name !== undefined && name.length > 0)(`${getBookNumString(bookNum)}${trimBook(bookName ?? '')}`)
}

function trimBook(name: string) {
  return pipe(
    name,
    replace(/\s\s+/g, ' '),
    trim,
  )
}

function getBookNumString(bookNum?: string) {
  return pipe(
    bookNum,
    fromNullable,
    chain(fromPredicate<string>(n => n.length > 0)),
    map(n => `${n} `),
    getOrElse(() => ''),
  );
}

function wrapOuterOption(opt: ReturnType<typeof getParts>) {
  return fromPredicate<ReturnType<typeof getParts>>((o) => isSome(o.book) || isSome(o.chapterStart) || isSome(o.chapterEnd) || isSome(o.verseStart) || isSome(o.verseEnd))(opt)
}