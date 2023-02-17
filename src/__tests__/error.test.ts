import { IError, errorFrom } from "../error";

describe("The error module", () => {
  describe("The errorFrom function", () => {
    it("Should create an IError wrapping a message and error when provided", () => {
      const msg = "test";
      const err = { code: 100 };
      const result = errorFrom(msg, err);
      const expected = {
        msg,
        err,
      };

      expect(result).toEqual(expected);
    });

    it("should return err as an empty string if no value is provided", () => {
      const msg = "test";
      const result = errorFrom(msg);
      const expected = {
        msg,
        err: "",
      };

      expect(result).toEqual(expected);
    });
  });
});
