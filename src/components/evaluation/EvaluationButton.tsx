"use client";

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
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Evaluating..." : "Evaluate"}
      </button>
    </div>
  );
}
