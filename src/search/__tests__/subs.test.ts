import { errorFrom } from "../error";
import { ParamsMsg, TypedParts } from "../params";
import { getSubsAsTypedParts } from "../subs";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

describe("The Subs Module", () => {
  describe("The getSubsAsTypedParts function", () => {
    it("should return a correct chapter/verse object for a book query with subs", () => {
      // original 1 john, 3:4
      const mainParts: TypedParts = {
        type: "book",
        book: E.right("1 john"),
        chapterStart: E.left(
          errorFrom<ParamsMsg>("value is null or undefined")
        ),
        chapterEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        verseStart: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        verseEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
      };

      const expected: O.Option<TypedParts[]> = O.some([
        {
          type: "verse",
          book: E.right("1 john"),
          chapterStart: E.right(3),
          chapterEnd: E.left(
            errorFrom<ParamsMsg>("value is null or undefined")
          ),
          verseStart: E.right(4),
          verseEnd: E.left(errorFrom<ParamsMsg>("value is null or undefined")),
        },
      ]);

      const result = getSubsAsTypedParts("1 john", mainParts, ["3:4"]);
      console.log(JSON.stringify(result));
      expect(result).toEqual(expected);
    });
  });
});
