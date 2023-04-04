import { getSearch } from "../search";
import { some, none } from "fp-ts/Option";

describe("The Search Module", () => {
  describe("The getSearch function", () => {
    it("should return a none if an empty String is passed", () => {
      const input = "";
      const expected = none;

      const result = getSearch(input);

      expect(result).toEqual(expected);
    });

    it("should return a none if undefined passed", () => {
      const input = undefined;
      const expected = none;

      const result = getSearch(input);

      expect(result).toEqual(expected);
    });

    it("should return a valid search object if only a basic search is passed (no semicolons or commas)", () => {
      const input = "Job 1";
      const expected = some({
        original: "Job 1",
        searches: [
          {
            original: "Job 1",
            subs: ["Job 1"],
          },
        ],
      });

      const result = getSearch(input);

      expect(result).toEqual(expected);
    });

    it("should return a some with multiple searches on it if semicolons are passed in", () => {
      const input = "Job 1; John 2";
      const expected = some({
        original: input,
        searches: [
          {
            original: "Job 1",
            subs: ["Job 1"],
          },
          {
            original: "John 2",
            subs: ["John 2"],
          },
        ],
      });

      const result = getSearch(input);

      expect(result).toEqual(expected);
    });

    it("should return a compacted some with valid searches only if back-to-back semicolons are passed in", () => {
      const input = "Job 1;; John 2;;;1 John 3";
      const expected = some({
        original: input,
        searches: [
          {
            original: "Job 1",
            subs: ["Job 1"],
          },
          {
            original: "John 2",
            subs: ["John 2"],
          },
          {
            original: "1 John 3",
            subs: ["1 John 3"],
          },
        ],
      });

      const result = getSearch(input);

      expect(result).toEqual(expected);
    });

    it("should return a valid subsearches if split with a comma", () => {
      const input = "Job 1, 3, 5-6";
      const expected = some({
        original: input,
        searches: [
          {
            original: input,
            subs: ["Job 1", "3", "5-6"],
          },
        ],
      });

      const result = getSearch(input);

      expect(result).toEqual(expected);
    });

    it("should return a valid subsearches if split with a comma", () => {
      const input = "Job 1, 3, 5-6; 1 John 3, 5, 6-7";
      const expected = some({
        original: input,
        searches: [
          {
            original: "Job 1, 3, 5-6",
            subs: ["Job 1", "3", "5-6"],
          },
          {
            original: "1 John 3, 5, 6-7",
            subs: ["1 John 3", "5", "6-7"],
          },
        ],
      });

      const result = getSearch(input);

      expect(result).toEqual(expected);
    });

    it("should return a ignore subsearches where commas are back to back", () => {
      const input = "Job 1,, 3,, 5-6,; 1 John 3,,, 5,, 6-7,";
      const expected = some({
        original: input,
        searches: [
          {
            original: "Job 1,, 3,, 5-6,",
            subs: ["Job 1", "3", "5-6"],
          },
          {
            original: "1 John 3,,, 5,, 6-7,",
            subs: ["1 John 3", "5", "6-7"],
          },
        ],
      });

      const result = getSearch(input);

      expect(result).toEqual(expected);
    });
  });
});
