import { notFound } from "next/navigation";
import { ExperimentTestCases } from "@/components/experiments/ExperimentTestCases";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, Home } from "lucide-react";
import type { Model } from "@/types/experiments";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getExperiment(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/experiments/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch experiment");
  }

  return res.json();
}

export default async function ExperimentPage({ params }: PageProps) {
  const { id } = await params;
  const experiment = await getExperiment(id);

  if (!experiment) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container max-w-6xl py-12 space-y-10 mx-auto px-4 sm:px-6">
        <Breadcrumb className="text-sm text-muted-foreground">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="w-3.5 h-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-foreground">
                {experiment.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground/90 sm:text-4xl text-center">
              {experiment.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {experiment.models.map((model: Model) => (
                  <span
                    key={model.id}
                    className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20"
                  >
                    {model.label}
                  </span>
                ))}
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {experiment.testCaseCount}{" "}
                {experiment.testCaseCount === 1 ? "test case" : "test cases"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground/80">
            System Prompt
          </h2>
          <div className="relative rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
                {experiment.systemPrompt}
              </p>
            </div>
          </div>
        </div>

        <ExperimentTestCases
          experimentId={experiment.id}
          systemPrompt={experiment.systemPrompt}
          models={experiment.models}
        />
      </div>
    </div>
  );
}
