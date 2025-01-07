"use client";

import { Loader2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EvaluationButtonProps {
  isLoading: boolean;
  userMessage?: string;
  expectedOutput?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EvaluationButton({
  isLoading,
  userMessage,
  expectedOutput,
  onClick,
}: EvaluationButtonProps) {
  const getTooltipMessage = () => {
    if (!userMessage?.trim() && !expectedOutput?.trim()) {
      return "Please enter both user message and expected output";
    }
    if (!userMessage?.trim()) {
      return "Please enter a user message";
    }
    if (!expectedOutput?.trim()) {
      return "Please enter expected output";
    }
    return "";
  };

  const isDisabled =
    !userMessage?.trim() || !expectedOutput?.trim() || isLoading;

  return (
    <div className="pt-4">
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div className="w-full" role="button" tabIndex={-1}>
              <button
                type="button"
                onClick={onClick}
                disabled={isDisabled}
                className={`
                  w-full flex items-center justify-center gap-3 py-3.5 px-8 
                  rounded-2xl text-base font-medium text-white/95
                  bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 
                  bg-[length:200%_100%] bg-[position:0%] hover:bg-[position:100%]
                  shadow-lg shadow-blue-500/20 
                  hover:shadow-blue-500/30 hover:text-white 
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 
                  active:scale-[0.98] 
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none
                  transition-all duration-500 ease-out
                  relative overflow-hidden
                  before:absolute before:inset-0 
                  before:bg-gradient-to-r before:from-white/10 before:via-white/5 before:to-transparent 
                  before:rounded-2xl before:pointer-events-none
                  ${isLoading ? "" : ""}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin opacity-90" />
                    <span className="inline-block">Evaluating...</span>
                  </>
                ) : (
                  <>
                    {isDisabled && (
                      <AlertCircle className="h-5 w-5 opacity-90" />
                    )}
                    <span>Evaluate</span>
                  </>
                )}
              </button>
            </div>
          </TooltipTrigger>
          {isDisabled && !isLoading && (
            <TooltipContent>
              <p>{getTooltipMessage()}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
