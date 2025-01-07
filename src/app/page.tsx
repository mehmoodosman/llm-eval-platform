import { ExperimentList } from "@/components/experiments/ExperimentList";
import { CreateExperimentDialog } from "@/components/experiments/CreateExperimentDialog";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#000314] bg-gradient-to-b from-[#000314] to-[#000520] p-4 sm:p-8">
      <main className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white/90">
            LLM Evaluation Platform
          </h1>
          <CreateExperimentDialog />
        </div>

        <ExperimentList />
      </main>
    </div>
  );
}
