import type { Config } from "drizzle-kit";
import { env } from "./src/config/env";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  breakpoints: true,
} satisfies Config;
