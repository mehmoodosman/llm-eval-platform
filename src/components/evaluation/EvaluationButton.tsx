"use client";

import { Play, Loader2 } from "lucide-react";

interface EvaluationButtonProps {
  isLoading: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EvaluationButton({
  isLoading,
  onClick,
}: EvaluationButtonProps) {
  return (
    <div className="pt-4">
      <button
        type="submit"
        onClick={onClick}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-base font-semibold text-white/90 bg-gradient-to-r from-blue-600/70 to-blue-700/90 backdrop-blur-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:text-white hover:-translate-y-0.5 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg disabled:hover:shadow-blue-500/20 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-white/5 before:to-transparent before:pointer-events-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Evaluating...</span>
          </>
        ) : (
          <>
            <span>Evaluate</span>
          </>
        )}
      </button>
    </div>
  );
}
