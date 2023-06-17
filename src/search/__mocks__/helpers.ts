import * as A from "fp-ts/Array";

function genChapter(endChapter: number, startChapter: number = 1) {
  return new Set(A.makeBy(endChapter, (i) => i + startChapter));
}

export { genChapter };
