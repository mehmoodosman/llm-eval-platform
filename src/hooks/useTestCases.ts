import useSWR from "swr";
import { TestCase } from "@/types/experiments";

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error("Failed to fetch test cases");
    return res.json();
  });

export function useTestCases(experimentId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { data, error, isLoading } = useSWR<TestCase[]>(
    `${baseUrl}/api/experiments/${experimentId}/test-cases`,
    fetcher
  );

  return {
    testCases: data,
    isLoading,
    error,
  };
}
