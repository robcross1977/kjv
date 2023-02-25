import { getFullName } from "../book";
import { map as arrayMap, reduce } from "fp-ts/Array";
import { pipe, flow } from "fp-ts/function";
import { getParams, ParamsError, Parts } from "../params";
import { chain, map, getOrElse, fromOption, mapLeft } from "fp-ts/Either";

const nones: string[] = [""];
const ones = [
  "1",
  "1st",
  "one",
  "fst",
  "first",
  "1 ",
  "i ",
  "1st ",
  "one ",
  "fst ",
  "first ",
  "1ST",
  "ONE",
  "FST",
  "FIRST",
  "I ",
  "1ST ",
  "ONE ",
  "FST ",
  "FIRST ",
];

const twos = [
  "2",
  "2nd",
  "two",
  "sec",
  "second",
  "2 ",
  "ii ",
  "2nd ",
  "two ",
  "sec ",
  "second ",
  "2ND",
  "TWO",
  "SEC",
  "SECOND",
  "II ",
  "2ND ",
  "TWO ",
  "SEC ",
  "SECOND ",
];

const threes = [
  "3",
  "3rd",
  "three",
  "thi",
  "third",
  "3 ",
  "iii ",
  "3rd ",
  "three ",
  "thi ",
  "third ",
  "3RD",
  "THREE",
  "THI",
  "THIRD",
  "III ",
  "3RD ",
  "THIRD ",
  "THI ",
  "THIRD ",
];

describe("The book module", () => {
  describe("The getFullName function", () => {
    describe("The book of 1 Chronicles", () => {
      mapAbbreviations("ch", "ronicles", "1 chronicles", ones);
    });

    describe("The book of 1 Corinthians", () => {
      mapAbbreviations("co", "rinthians", "1 corinthians", ones);
    });

    describe("The book of 1 John", () => {
      mapAbbreviations("j", "ohn", "1 john", ones);
    });

    describe("The book of 1 Kings", () => {
      mapAbbreviations("k", "ings", "1 kings", ones);
    });

    describe("The book of 1 Peter", () => {
      mapAbbreviations("p", "eter", "1 peter", ones);
    });

    describe("The book of 1 Samuel", () => {
      mapAbbreviations("sam", "uel", "1 samuel", ones);
    });

    describe("The book of 1 Thessalonians", () => {
      mapAbbreviations("th", "essalonians", "1 thessalonians", ones);
    });

    describe("The book of 1 Timothy", () => {
      mapAbbreviations("ti", "mothy", "1 timothy", ones);
    });

    describe("The book of 2 Chronicles", () => {
      mapAbbreviations("ch", "ronicles", "2 chronicles", twos);
    });

    describe("The book of 2 Corinthians", () => {
      mapAbbreviations("co", "rinthians", "2 corinthians", twos);
    });

    describe("The book of 2 John", () => {
      mapAbbreviations("j", "ohn", "2 john", twos);
    });

    describe("The book of 2 Kings", () => {
      mapAbbreviations("k", "ings", "2 kings", twos);
    });

    describe("The book of 2 Peter", () => {
      mapAbbreviations("p", "eter", "2 peter", twos);
    });

    describe("The book of 2 Samuel", () => {
      mapAbbreviations("s", "amuel", "2 samuel", twos);
    });

    describe("The book of 2 Thessalonians", () => {
      mapAbbreviations("th", "essalonians", "2 thessalonians", twos);
    });

    describe("The book of 2 Timothy", () => {
      mapAbbreviations("ti", "mothy", "2 timothy", twos);
    });

    describe("The book of 3 John", () => {
      mapAbbreviations("j", "ohn", "3 john", threes);
    });

    describe("The book of Acts", () => {
      mapAbbreviations("ac", "ts", "acts", nones);
    });

    describe("The book of Amos", () => {
      mapAbbreviations("am", "os", "amos", nones);
    });

    describe("The book of Colossians", () => {
      mapAbbreviations("co", "lossians", "colossians", nones);
    });

    describe("The book of Daniel", () => {
      mapAbbreviations("da", "niel", "daniel", nones);
    });

    describe("The book of Deuteronomy", () => {
      mapAbbreviations("de", "uteronomy", "deuteronomy", nones);
    });

    describe("The book of Ecclesiastes", () => {
      mapAbbreviations("ec", "clesiastes", "ecclesiastes", nones);
    });

    describe("The book of Ephesians", () => {
      mapAbbreviations("ep", "hesians", "ephesians", nones);
    });

    describe("The book of Esther", () => {
      mapAbbreviations("es", "ther", "esther", nones);
    });

    describe("The book of Exodus", () => {
      mapAbbreviations("ex", "odus", "exodus", nones);
    });

    describe("The book of Ezekiel", () => {
      mapAbbreviations("eze", "kiel", "ezekiel", nones);
    });

    describe("The book of Ezra", () => {
      mapAbbreviations("ezr", "a", "ezra", nones);
    });

    describe("The book of Galatians", () => {
      mapAbbreviations("ga", "latians", "galatians", nones);
    });

    describe("The book of Genesis", () => {
      mapAbbreviations("ge", "nesis", "genesis", nones);
    });

    describe("The book of Habakkuk", () => {
      mapAbbreviations("hab", "akkuk", "habakkuk", nones);
    });

    describe("The book of Haggai", () => {
      mapAbbreviations("hag", "gai", "haggai", nones);
    });

    describe("The book of Hebrews", () => {
      mapAbbreviations("he", "brews", "hebrews", nones);
    });

    describe("The book of Hosea", () => {
      mapAbbreviations("ho", "sea", "hosea", nones);
    });

    describe("The book of Isaiah", () => {
      mapAbbreviations("is", "aiah", "isaiah", nones);
    });

    describe("The book of James", () => {
      mapAbbreviations("ja", "mes", "james", nones);
    });

    describe("The book of Jeremiah", () => {
      mapAbbreviations("je", "remiah", "jeremiah", nones);
    });

    describe("The book of Job", () => {
      mapAbbreviations("job", "", "job", nones);
    });

    describe("The book of Joel", () => {
      mapAbbreviations("joe", "l", "joel", nones);
    });

    describe("The book of John", () => {
      mapAbbreviations("joh", "n", "john", nones);
    });

    describe("The book of Jonah", () => {
      mapAbbreviations("jon", "ah", "jonah", nones);
    });

    describe("The book of Joshua", () => {
      mapAbbreviations("jos", "hua", "joshua", nones);
    });

    describe("The book of Jude", () => {
      mapAbbreviations("jude", "", "jude", nones);
    });

    describe("The book of Judges", () => {
      mapAbbreviations("judg", "es", "judges", nones);
    });

    describe("The book of Lamentations", () => {
      mapAbbreviations("la", "mentations", "lamentations", nones);
    });

    describe("The book of Leviticus", () => {
      mapAbbreviations("le", "viticus", "leviticus", nones);
    });

    describe("The book of Luke", () => {
      mapAbbreviations("lu", "ke", "luke", nones);
    });

    describe("The book of Malachi", () => {
      mapAbbreviations("mal", "achi", "malachi", nones);
    });

    describe("The book of Mark", () => {
      mapAbbreviations("mar", "k", "mark", nones);
    });

    describe("The book of Matthew", () => {
      mapAbbreviations("mat", "thew", "matthew", nones);
    });

    describe("The book of Micah", () => {
      mapAbbreviations("mi", "cah", "micah", nones);
    });

    describe("The book of Nahum", () => {
      mapAbbreviations("na", "hum", "nahum", nones);
    });

    describe("The book of Nehemiah", () => {
      mapAbbreviations("ne", "hemiah", "nehemiah", nones);
    });

    describe("The book of Numbers", () => {
      mapAbbreviations("nu", "mbers", "numbers", nones);
    });

    describe("The book of Obadiah", () => {
      mapAbbreviations("o", "badiah", "obadiah", nones);
    });

    describe("The book of Philemon", () => {
      mapAbbreviations("phile", "mon", "philemon", nones);
    });

    describe("The book of Philippians", () => {
      mapAbbreviations("phili", "ppians", "philippians", nones);
    });

    describe("The book of Proverbs", () => {
      mapAbbreviations("pr", "overbs", "proverbs", nones);
    });

    describe("The book of Psalms", () => {
      mapAbbreviations("ps", "alms", "psalms", nones);
    });

    describe("The book of Revelation", () => {
      mapAbbreviations("re", "velation", "revelation", nones);
    });

    describe("The book of Romans", () => {
      mapAbbreviations("ro", "mans", "romans", nones);
    });

    describe("The book of Ruth", () => {
      mapAbbreviations("ru", "th", "ruth", nones);
    });

    describe("The book of Song of Solomon", () => {
      mapAbbreviations("s", "ong of solomon", "song of solomon", nones);
    });

    describe("The book of Titus", () => {
      mapAbbreviations("ti", "tus", "titus", nones);
    });

    describe("The book of Zechariah", () => {
      mapAbbreviations("zec", "hariah", "zechariah", nones);
    });

    describe("The book of Zephaniah", () => {
      mapAbbreviations("zep", "haniah", "zephaniah", nones);
    });
  });
});

function mapAbbreviations(
  mando: string,
  optional: string,
  expected: string,
  bookNums: string[]
) {
  pipe(
    bookNums,
    arrayMap((bn) => {
      // run the test first with just the mando stuff
      const start = `${bn}${mando}`;
      exec(start, expected);

      pipe(
        optional.split(""),
        reduce(start, (acc, curr) => exec(`${acc}${curr}`, expected))
      );
    })
  );
}

const getRawFullName = flow(
  getFullName,
  fromOption(() => "failed to getFullName"),
  getOrElse(() => "failed to get value for book name")
);

// This is an either in an either so we rewrap it to get to final value we want
const getName = flow(chain(fullNameFrom));

function exec(search: string, expected: string | ParamsError) {
  it(`should return "${expected}" for the search: "${search}"`, () => {
    expect.assertions(1);

    pipe(
      search,
      getParams,
      chain(getName),
      map((result) => expect(result).toEqual(expected)),
      mapLeft((err) => expect(err).toEqual(expected))
    );
  });

  return search;
}

function fullNameFrom({ book }: Parts) {
  return pipe(book, map(getRawFullName));
}
