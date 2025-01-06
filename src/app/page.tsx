import { EvaluationForm } from "@/components/EvaluationForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#000314] bg-gradient-to-b from-[#000314] to-[#000520] p-4 sm:p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-100">
          LLM Evaluation Platform
        </h1>
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-white/10 p-6 sm:p-8 shadow-2xl shadow-white/20">
          <EvaluationForm />
        </div>
      </main>
    </div>
  );
}
