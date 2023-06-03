import { wrapCap, wrapNonCap, GroupKeys, ones } from "../regex";

describe("The regex module", () => {
  describe("The wrapNonCap function", () => {
    it("should wrap an input string into a non-capturing group", () => {
      // arrange
      const input = "^.*stuff.*$";
      const expected = `(?:${input})`;

      // act
      const result = wrapNonCap(input);

      // assert
      expect(result).toBe(expected);
    });

    it("should not wrap an empty string but return nothing", () => {
      // arrange
      const input = "";
      const expected = "";

      // act
      const result = wrapNonCap(input);

      // assert
      expect(result).toBe(expected);
    });
  });

  describe("The wrapCap function", () => {
    it("should wrap an input string into a capturing group", () => {
      // arrange
      const expected = `(?<bookNum>${ones})`;

      // act
      const result = wrapCap("bookNum", ones);

      // assert
      expect(result).toBe(expected);
    });
  });
});
