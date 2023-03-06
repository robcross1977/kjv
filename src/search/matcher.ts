import { pipe, unsafeCoerce } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { errorFrom, IError } from "./error";

type MatcherMsg = "no groups found";
export type MatcherError = IError<MatcherMsg>;

function build(regex: string, flags?: string) {
  return new RegExp(regex, flags);
}

function getGroups<TType extends string>(regex: string, flags?: string) {
  return function (
    search: string
  ): E.Either<MatcherError, Record<TType, string>> {
    return pipe(
      build(regex, flags).exec(search)?.groups,
      E.fromNullable<MatcherError>(errorFrom<MatcherMsg>("no groups found")),
      E.map((i) =>
        unsafeCoerce<Record<string, string>, Record<TType, string>>(i)
      )
    );
  };
}

export { getGroups };
