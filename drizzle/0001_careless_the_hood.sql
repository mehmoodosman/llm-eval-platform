ALTER TABLE "experiment_results" RENAME COLUMN "experiment_id" TO "experimentId";--> statement-breakpoint
ALTER TABLE "experiment_results" RENAME COLUMN "test_case_id" TO "testCaseId";--> statement-breakpoint
ALTER TABLE "experiment_results" RENAME COLUMN "exact_match_score" TO "exactMatchScore";--> statement-breakpoint
ALTER TABLE "experiment_results" RENAME COLUMN "llm_match_score" TO "llmMatchScore";--> statement-breakpoint
ALTER TABLE "experiment_results" RENAME COLUMN "cosine_similarity_score" TO "cosineSimilarityScore";--> statement-breakpoint
ALTER TABLE "experiment_results" DROP CONSTRAINT "experiment_results_experiment_id_experiments_id_fk";
--> statement-breakpoint
ALTER TABLE "experiment_results" DROP CONSTRAINT "experiment_results_test_case_id_test_cases_id_fk";
--> statement-breakpoint
ALTER TABLE "experiment_results" ADD CONSTRAINT "experiment_results_experimentId_experiments_id_fk" FOREIGN KEY ("experimentId") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_results" ADD CONSTRAINT "experiment_results_testCaseId_test_cases_id_fk" FOREIGN KEY ("testCaseId") REFERENCES "public"."test_cases"("id") ON DELETE no action ON UPDATE no action;