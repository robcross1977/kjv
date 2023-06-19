import { OneJohn } from "../books";
import { search } from "../search";
import * as E from "fp-ts/Either";

describe("The Search Module", () => {
  describe("The getFinalResult function", () => {
    it("should return a Book object", () => {
      const input = "1 John";
      const expected = E.right(OneJohn);

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a chapter object", () => {
      const input = "1 John 1";
      const expected = E.right({
        "1 john": { 1: OneJohn["1 john"][1] },
      });

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a chapter range object", () => {
      const input = "1 John 2-4";
      const expected = E.right({
        "1 john": {
          2: OneJohn["1 john"][2],
          3: OneJohn["1 john"][3],
          4: OneJohn["1 john"][4],
        },
      });

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a verse object", () => {
      const input = "1 John 2:4";
      const expected = E.right({
        "1 john": {
          2: {
            4: OneJohn["1 john"][2][4],
          },
        },
      });

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a verse range object", () => {
      const input = "1 John 2:4-7";
      const expected = E.right({
        "1 john": {
          2: {
            4: OneJohn["1 john"][2][4],
            5: OneJohn["1 john"][2][5],
            6: OneJohn["1 john"][2][6],
            7: OneJohn["1 john"][2][7],
          },
        },
      });

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a multi-chapter-verse object", () => {
      const input = "1 John 2-4:4";
      const expected = E.right({
        "1 john": {
          2: OneJohn["1 john"][2],
          3: OneJohn["1 john"][3],
          4: {
            1: OneJohn["1 john"][4][1],
            2: OneJohn["1 john"][4][2],
            3: OneJohn["1 john"][4][3],
            4: OneJohn["1 john"][4][4],
          },
        },
      });

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a full-range object", () => {
      const input = "1 John 2:25-4:5";
      const expected = E.right({
        "1 john": {
          2: {
            25: OneJohn["1 john"][2][25],
            26: OneJohn["1 john"][2][26],
            27: OneJohn["1 john"][2][27],
            28: OneJohn["1 john"][2][28],
            29: OneJohn["1 john"][2][29],
          },
          3: OneJohn["1 john"][3],
          4: {
            1: OneJohn["1 john"][4][1],
            2: OneJohn["1 john"][4][2],
            3: OneJohn["1 john"][4][3],
            4: OneJohn["1 john"][4][4],
            5: OneJohn["1 john"][4][5],
          },
        },
      });

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return searches with subs", () => {
      const input = "1 John 1, 2-3 4:1, 4:3-6, 4:19-5:2";
      const expected = E.right({
        "1 john": {
          1: OneJohn["1 john"][1],
          2: OneJohn["1 john"][2],
          3: OneJohn["1 john"][3],
          4: {
            1: OneJohn["1 john"][4][1],
            3: OneJohn["1 john"][4][3],
            4: OneJohn["1 john"][4][4],
            5: OneJohn["1 john"][4][5],
            6: OneJohn["1 john"][4][6],
            19: OneJohn["1 john"][4][19],
            20: OneJohn["1 john"][4][20],
            21: OneJohn["1 john"][4][21],
          },
          5: {
            1: OneJohn["1 john"][5][1],
            2: OneJohn["1 john"][5][2],
          },
        },
      });

      const result = search(input);

      expect(result).toEqual(expected);
    });
  });
});
