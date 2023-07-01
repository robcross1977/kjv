import { kjv } from "../../kjv";
import { search } from "../search";

describe("The Search Module", () => {
  describe("The getFinalResult function", () => {
    it("should return a Book object", () => {
      const input = "1 John";
      const expected = {
        type: "book",
        records: {
        "1 john": kjv["1 john"],
      }};

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a chapter object", () => {
      const input = "1 John 1";
      const expected = {type: "chapter", records:{
        "1 john": { 1: kjv["1 john"][1] },
      }};

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a chapter range object", () => {
      const input = "1 John 2-4";
      const expected = {
        type: "chapter-range",
        records: {
        "1 john": {
          2: kjv["1 john"][2],
          3: kjv["1 john"][3],
          4: kjv["1 john"][4],
        },
      }};

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a verse object", () => {
      const input = "1 John 2:4";
      const expected = {
        type: "verse",
        records: {
        "1 john": {
          2: {
            4: kjv["1 john"][2][4],
          },
        }},
      };

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a verse range object", () => {
      const input = "1 John 2:4-7";
      const expected = {
        type: "verse-range",
        records: {
        "1 john": {
          2: {
            4: kjv["1 john"][2][4],
            5: kjv["1 john"][2][5],
            6: kjv["1 john"][2][6],
            7: kjv["1 john"][2][7],
          },
        },
      }};

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a multi-chapter-verse object", () => {
      const input = "1 John 2-4:4";
      const expected = {
        type: "multi-chapter-verse",
        records: {
        "1 john": {
          2: kjv["1 john"][2],
          3: kjv["1 john"][3],
          4: {
            1: kjv["1 john"][4][1],
            2: kjv["1 john"][4][2],
            3: kjv["1 john"][4][3],
            4: kjv["1 john"][4][4],
          },
        },
      }};

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return a full-range object", () => {
      const input = "1 John 2:25-4:5";
      const expected = {
        type: "full-range",
        records: {
        "1 john": {
          2: {
            25: kjv["1 john"][2][25],
            26: kjv["1 john"][2][26],
            27: kjv["1 john"][2][27],
            28: kjv["1 john"][2][28],
            29: kjv["1 john"][2][29],
          },
          3: kjv["1 john"][3],
          4: {
            1: kjv["1 john"][4][1],
            2: kjv["1 john"][4][2],
            3: kjv["1 john"][4][3],
            4: kjv["1 john"][4][4],
            5: kjv["1 john"][4][5],
          },
        },
      }};

      const result = search(input);

      expect(result).toEqual(expected);
    });

    it("should return searches with subs", () => {
      const input = "1 John 1, 2-3, 4:1, 4:3-6, 4:19-5:2";
      const expected = {
        type: "multi",
        records: {
          "1 john": {
          1: kjv["1 john"][1],
          2: kjv["1 john"][2],
          3: kjv["1 john"][3],
          4: {
            1: kjv["1 john"][4][1],
            3: kjv["1 john"][4][3],
            4: kjv["1 john"][4][4],
            5: kjv["1 john"][4][5],
            6: kjv["1 john"][4][6],
            19: kjv["1 john"][4][19],
            20: kjv["1 john"][4][20],
            21: kjv["1 john"][4][21],
          },
          5: {
            1: kjv["1 john"][5][1],
            2: kjv["1 john"][5][2],
          },
        },
      }};

      const result = search(input);

      expect(result).toEqual(expected);
    });
  });
});
