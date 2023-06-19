import { search } from "../search";

describe("The Search Module", () => {
  describe("The getFinalResult function", () => {
    it("should return a Book object", () => {
      const input = "1 John";

      const result = search(input);

      expect(result).toEqual({});
    });
  });
});
