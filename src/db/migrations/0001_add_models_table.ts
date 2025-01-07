import { sql } from "drizzle-orm";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";

export async function up(db: PostgresJsDatabase) {
  // 1. Create models table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS models (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // 2. Create experiment_models join table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS experiment_models (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      experiment_id UUID NOT NULL REFERENCES experiments(id),
      model_id UUID NOT NULL REFERENCES models(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // 3. Add modelId to experiment_results
  await db.execute(sql`
    ALTER TABLE experiment_results
    ADD COLUMN model_id UUID REFERENCES models(id);
  `);

  // 4. Migrate existing data
  // First, insert all unique models from experiments table
  await db.execute(sql`
    INSERT INTO models (value, label, category)
    SELECT DISTINCT 
      model as value,
      model as label,
      CASE 
        WHEN model LIKE 'gpt%' THEN 'OpenAI'
        WHEN model LIKE 'gemini%' THEN 'Google'
        WHEN model LIKE 'llama%' THEN 'Meta'
        ELSE 'Other'
      END as category
    FROM experiments;
  `);

  // Then create experiment_models relationships
  await db.execute(sql`
    INSERT INTO experiment_models (experiment_id, model_id)
    SELECT e.id as experiment_id, m.id as model_id
    FROM experiments e
    JOIN models m ON e.model = m.value;
  `);

  // Update experiment_results with model_id
  await db.execute(sql`
    UPDATE experiment_results er
    SET model_id = m.id
    FROM experiments e
    JOIN models m ON e.model = m.value
    WHERE er.experiment_id = e.id;
  `);

  // Make model_id NOT NULL after migration
  await db.execute(sql`
    ALTER TABLE experiment_results
    ALTER COLUMN model_id SET NOT NULL;
  `);

  // 5. Drop model column from experiments
  await db.execute(sql`
    ALTER TABLE experiments
    DROP COLUMN model;
  `);
}

export async function down(db: PostgresJsDatabase) {
  // 1. Add back model column to experiments
  await db.execute(sql`
    ALTER TABLE experiments
    ADD COLUMN model TEXT;
  `);

  // 2. Migrate data back
  await db.execute(sql`
    UPDATE experiments e
    SET model = m.value
    FROM experiment_models em
    JOIN models m ON em.model_id = m.id
    WHERE em.experiment_id = e.id;
  `);

  // 3. Make model NOT NULL
  await db.execute(sql`
    ALTER TABLE experiments
    ALTER COLUMN model SET NOT NULL;
  `);

  // 4. Drop modelId from experiment_results
  await db.execute(sql`
    ALTER TABLE experiment_results
    DROP COLUMN model_id;
  `);

  // 5. Drop experiment_models table
  await db.execute(sql`
    DROP TABLE IF EXISTS experiment_models;
  `);

  // 6. Drop models table
  await db.execute(sql`
    DROP TABLE IF EXISTS models;
  `);
}
