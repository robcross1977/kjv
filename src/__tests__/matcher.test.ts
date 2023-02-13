import { wrapNonCap } from "../matcher";

describe("The matcher module", () => {
  describe("The wrapNonCap function", () => {
    it('should wrap an input string into a non-capturing group', () => {
      // arrange
      const input = '^\.*stuff\.*$';
      const expected = `(?:${input})`;
      
      // act
      const result = wrapNonCap(input);

      // assert
      expect(result).toBe(expected);
    });

    it('should not wrap an empty string but return nothing', () => {
      // arrange
      const input = '';
      const expected = '';

      // act
      const result = wrapNonCap(input);

      // assert
      expect(result).toBe(expected);
    });
  });
});