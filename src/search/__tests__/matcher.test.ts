import { pipe } from "fp-ts/function";
import { map, mapLeft } from "fp-ts/Either";
import { getGroups } from "../matcher";

describe("The matcher module", () => {
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
});
