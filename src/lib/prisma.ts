import Prisma from "@prisma/client";
import { PrismaClientOptions } from "@prisma/client/runtime";

const prismaGlobal = global as typeof global & {
  prisma?: Prisma.PrismaClient;
};

const prisma: Prisma.PrismaClient<PrismaClientOptions, "query"> =
  prismaGlobal.prisma ??
  new Prisma.PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [{ level: "query", emit: "event" }, "error", "warn"]
        : ["error", { level: "query", emit: "event" }],
  });

if (process.env.NODE_ENV !== "production") {
  prismaGlobal.prisma = prisma;
}

// Uncomment this batch of code if you want to see the
// actual queries being run in real-time in the console
prisma.$on("query", (e) => {
  if (process.env.NODE_ENV === "development") {
    console.log(e);
  }
});

export default prisma;
