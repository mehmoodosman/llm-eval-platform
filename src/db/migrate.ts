import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { env } from "@/config/env";
import { seedModels } from "./operations";

async function dropAllTables(db: any) {
  console.log("Dropping all existing tables...");

  const tables = [
    "experiment_results",
    "experiment_models",
    "experiment_test_cases",
    "experiments",
    "models",
    "test_cases",
  ];

  for (const table of tables) {
    try {
      await db.execute(
        sql`DROP TABLE IF EXISTS ${sql.identifier(table)} CASCADE;`
      );
      console.log(`Dropped table ${table}`);
    } catch (error) {
      console.error(`Failed to drop table ${table}:`, error);
    }
  }

  console.log("All tables dropped successfully");
}

async function runMigrations() {
  const sql = neon(env.DATABASE_URL);
  const db = drizzle(sql);

  const isSeedOnly = process.argv.includes("--seed-only");
  const shouldDrop = process.argv.includes("--drop-tables");

  try {
    if (shouldDrop) {
      await dropAllTables(db);
    }

    if (!isSeedOnly) {
      console.log("Running migrations...");
      await migrate(db, {
        migrationsFolder: "src/db/migrations",
      });
      console.log("Migrations completed successfully");
    }

    console.log("Seeding models...");
    await seedModels();
    console.log("Models seeded successfully");
  } catch (error) {
    console.error("Operation failed:", error);
    process.exit(1);
  }
}

runMigrations();
