import prisma from "../lib/prisma";
import * as TE from "fp-ts/TaskEither";
import { bibleToPrisma } from "./bibleToPrisma";
import { kjv } from "../kjv";
import { pipe } from "fp-ts/lib/function";

function clearDb() {
  return prisma.book.deleteMany({});
}

function connect() {
  return pipe(
    console.log("Starting DB Seed"),
    TE.of,
    TE.chain(() => TE.tryCatch(
      () => prisma.$connect(),
      (e) => new Error(String(e))
    )),
  );
}

function write() {
  return pipe(
    TE.of(console.log("Writing KJV")),
    TE.chain(() => TE.tryCatch(
      () => prisma.$transaction([clearDb(), ...bibleToPrisma(kjv)]),
      (e) => new Error(String(e))
    )),
  )
}

function disconnect(writeResult: ReturnType<typeof write>) {
  return pipe(
    writeResult,
    TE.chainFirst(() => {
      return TE.tryCatch(
        () => prisma.$disconnect(),
        (e) => new Error(String(e))
      )
    }),
    TE.chainFirst(() => TE.of(console.log("DB seed complete")))
  );
}

function seed() {
  return pipe(
    connect(),
    write,
    disconnect,
  );
}

(async () => {
  await pipe(
    seed(),
    TE.chainFirst(res => TE.of(console.log(`Success: ${JSON.stringify(res)}`))),
    TE.mapLeft(e => console.log(`Error: ${JSON.stringify(e)}`)),
  )();
})();