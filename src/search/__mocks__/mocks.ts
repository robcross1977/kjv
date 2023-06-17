import * as E from "fp-ts/Either";
import { errorFrom } from "../error";
import { ParamsMsg } from "../params";
import { genChapter } from "./helpers";

const johnMock = {
  "1": genChapter(10),
  "2": genChapter(29),
  "3": genChapter(24),
  "4": genChapter(21),
  "5": genChapter(21),
};

const lefty = E.left(errorFrom<ParamsMsg>("value is null or undefined"));

export { johnMock, lefty };
