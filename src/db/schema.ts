import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  json,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { EvaluationMetric } from "@/types/evaluation";

// Table to store available models
export const models = pgTable("models", {
  id: uuid("id").defaultRandom().primaryKey(),
  value: text("value").notNull().unique(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const experiments = pgTable("experiments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Join table for many-to-many relationship between experiments and models
export const experimentModels = pgTable("experiment_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  experimentId: uuid("experiment_id")
    .notNull()
    .references(() => experiments.id),
  modelId: uuid("model_id")
    .notNull()
    .references(() => models.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testCases = pgTable("test_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  userMessage: text("user_message").notNull(),
  expectedOutput: text("expected_output").notNull(),
  metrics: json("metrics").$type<EvaluationMetric[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Join table for many-to-many relationship between experiments and test cases
export const experimentTestCases = pgTable("experiment_test_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  experimentId: uuid("experiment_id")
    .notNull()
    .references(() => experiments.id),
  testCaseId: uuid("test_case_id")
    .notNull()
    .references(() => testCases.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Results for each test case in an experiment
export const experimentResults = pgTable("experiment_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  experimentId: uuid("experiment_id")
    .notNull()
    .references(() => experiments.id),
  modelId: uuid("model_id")
    .notNull()
    .references(() => models.id),
  testCaseId: uuid("test_case_id")
    .notNull()
    .references(() => testCases.id),
  response: text("response").notNull(),
  exactMatchScore: text("exact_match_score"),
  llmMatchScore: text("llm_match_score"),
  cosineSimilarityScore: text("cosine_similarity_score"),
  metrics: json("metrics").$type<Record<EvaluationMetric, number>>(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const experimentsRelations = relations(experiments, ({ many }) => ({
  testCases: many(experimentTestCases),
  models: many(experimentModels),
  results: many(experimentResults),
}));

export const modelsRelations = relations(models, ({ many }) => ({
  experiments: many(experimentModels),
  results: many(experimentResults),
}));

export const experimentModelsRelations = relations(
  experimentModels,
  ({ one }) => ({
    experiment: one(experiments, {
      fields: [experimentModels.experimentId],
      references: [experiments.id],
    }),
    model: one(models, {
      fields: [experimentModels.modelId],
      references: [models.id],
    }),
  })
);

export const testCasesRelations = relations(testCases, ({ many }) => ({
  experiments: many(experimentTestCases),
  results: many(experimentResults),
}));

export const experimentTestCasesRelations = relations(
  experimentTestCases,
  ({ one }) => ({
    experiment: one(experiments, {
      fields: [experimentTestCases.experimentId],
      references: [experiments.id],
    }),
    testCase: one(testCases, {
      fields: [experimentTestCases.testCaseId],
      references: [testCases.id],
    }),
  })
);
