ALTER TABLE "experiment_results" RENAME COLUMN "experimentId" TO "experiment_id";--> statement-breakpoint
ALTER TABLE "experiment_results" RENAME COLUMN "testCaseId" TO "test_case_id";--> statement-breakpoint
ALTER TABLE "experiment_results" RENAME COLUMN "exactMatchScore" TO "exact_match_score";--> statement-breakpoint
ALTER TABLE "experiment_results" RENAME COLUMN "llmMatchScore" TO "llm_match_score";--> statement-breakpoint
ALTER TABLE "experiment_results" RENAME COLUMN "cosineSimilarityScore" TO "cosine_similarity_score";--> statement-breakpoint
ALTER TABLE "experiment_results" DROP CONSTRAINT "experiment_results_experimentId_experiments_id_fk";
--> statement-breakpoint
ALTER TABLE "experiment_results" DROP CONSTRAINT "experiment_results_testCaseId_test_cases_id_fk";
--> statement-breakpoint
ALTER TABLE "experiment_results" ADD CONSTRAINT "experiment_results_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_results" ADD CONSTRAINT "experiment_results_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE no action ON UPDATE no action;