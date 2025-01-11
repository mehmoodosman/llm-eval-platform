import useSWR from "swr";
import { TestCase } from "@/types/experiments";
import { Logger } from "@/utils/logger";

const logger = new Logger("useTestCases");

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error("Failed to fetch test cases");
    return res.json();
  });

export function useTestCases(experimentId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  logger.info("Fetching test cases", {
    experimentId,
    baseUrl,
  });
  const { data, error, isLoading } = useSWR<TestCase[]>(
    `${baseUrl}/api/experiments/${experimentId}/test-cases`,
    fetcher
  );

  logger.info("Test cases fetched", {
    data,
    error,
    isLoading,
  });

  return {
    testCases: data,
    isLoading,
    error,
  };
}
