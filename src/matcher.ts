import { pipe, unsafeCoerce } from "fp-ts/function";
import { Either, fromNullable, map } from "fp-ts/Either";
import { errorFrom, IError } from "./error";

type MatcherMsg = "no groups found";
interface MatcherError extends IError<MatcherMsg> {}

function match<TType extends string>(
  search: string,
  regex: string,
  flags?: string
) {
  return pipe(search, getGroups<TType>(regex, flags));
}

function build(regex: string, flags?: string) {
  return new RegExp(regex, flags);
}

function getGroups<TType extends string>(regex: string, flags?: string) {
  return function (
    search: string
  ): Either<MatcherError, Record<TType, string>> {
    return pipe(
      build(regex, flags).exec(search)?.groups,
      fromNullable<MatcherError>(errorFrom<MatcherMsg>("no groups found")),
      map((i) => unsafeCoerce<Record<string, string>, Record<TType, string>>(i))
    );
  };
}

export { match };
