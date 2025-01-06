import { EvaluationForm } from "@/components/EvaluationForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-black/95 p-4 sm:p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
          LLM Evaluation Platform
        </h1>
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 sm:p-8 shadow-2xl">
          <EvaluationForm />
        </div>
      </main>
    </div>
  );
}
