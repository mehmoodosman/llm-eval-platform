import { type Config } from "drizzle-kit";
import { env } from "@/config/env";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
} as Config;
