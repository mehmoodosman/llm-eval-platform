import { notFound } from "next/navigation";
import { ExperimentTestCases } from "@/components/experiments/ExperimentTestCases";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, Home } from "lucide-react";

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
    <div className="container max-w-6xl py-6 space-y-8 mx-auto">
      <Breadcrumb className="flex justify-center opacity-70 hover:opacity-100 transition-opacity">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="w-4 h-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{experiment.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white/90">
          {experiment.name}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/40">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {experiment.models.map((model: any) => (
              <span
                key={model.id}
                className="font-mono px-2 py-1 rounded-md bg-slate-800/50 border border-white/5"
              >
                {model.label}
              </span>
            ))}
          </div>
          <span>•</span>
          <span>
            {experiment.testCaseCount}{" "}
            {experiment.testCaseCount === 1 ? "test case" : "test cases"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white/80 text-center">
          System Prompt
        </h2>
        <div className="p-4 rounded-lg bg-slate-900/50 border border-white/5">
          <p className="text-white/70 whitespace-pre-wrap">
            {experiment.systemPrompt}
          </p>
        </div>
      </div>

      <ExperimentTestCases
        experimentId={experiment.id}
        systemPrompt={experiment.systemPrompt}
        models={experiment.models}
      />
    </div>
  );
}
