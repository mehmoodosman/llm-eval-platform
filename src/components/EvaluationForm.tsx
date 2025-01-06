"use client";

import { useState, useRef, useEffect } from "react";
import { LLM_MODELS, ALL_MODELS } from "@/lib/models";

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-4 h-4 rounded border ${checked ? "bg-blue-500 border-blue-500" : "border-white/20 bg-transparent"} relative flex items-center justify-center transition-colors`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
          <path
            d="M10 3L4.5 8.5L2 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export function EvaluationForm() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [selectedModels, setSelectedModels] = useState(["gpt-4"]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleModel = (value: string) => {
    setSelectedModels(prev => {
      const isSelected = prev.includes(value);
      if (isSelected) {
        // Don't remove if it's the last selected model
        if (prev.length === 1) return prev;
        return prev.filter(v => v !== value);
      }
      return [...prev, value];
    });
  };

  // Get selected model labels for the top display
  const selectedModelLabels = selectedModels
    .map(value => ALL_MODELS.find(m => m.value === value)?.label)
    .filter(Boolean) as string[];

  return (
    <form className="w-full space-y-6" onSubmit={e => e.preventDefault()}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          System Prompt
          <div className="mt-1.5 relative">
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="block w-full rounded-lg bg-black/50 border border-white/10 text-white/90 shadow-sm p-3 min-h-[100px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-shadow"
              placeholder="Enter system prompt..."
            />
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          User Message
          <div className="mt-1.5 relative">
            <textarea
              value={userMessage}
              onChange={e => setUserMessage(e.target.value)}
              className="block w-full rounded-lg bg-black/50 border border-white/10 text-white/90 shadow-sm p-3 min-h-[100px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-shadow"
              placeholder="Enter user message..."
            />
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          Expected Output
          <div className="mt-1.5 relative">
            <textarea
              value={expectedOutput}
              onChange={e => setExpectedOutput(e.target.value)}
              className="block w-full rounded-lg bg-black/50 border border-white/10 text-white/90 shadow-sm p-3 min-h-[100px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-shadow"
              placeholder="Enter expected output..."
            />
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          LLM Models
          <div className="mt-1.5 relative" ref={dropdownRef}>
            {/* Selected Models Display */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedModelLabels.map(label => (
                <span
                  key={label}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-200 text-sm border border-blue-500/20"
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="block w-full rounded-lg bg-black/50 border border-white/10 text-white/90 shadow-sm p-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-shadow"
            >
              <span className="text-white/60">Select models...</span>
            </button>

            {/* Dropdown Menu */}
            {isModelDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-lg bg-[#0a0a0a] border border-white/10 shadow-lg overflow-hidden">
                <div className="py-1">
                  {LLM_MODELS.map(category => (
                    <div key={category.category}>
                      <div className="px-3 py-1.5 text-xs font-medium text-white/50 bg-white/5">
                        {category.category}
                      </div>
                      {category.models.map(model => (
                        <button
                          key={model.value}
                          type="button"
                          className="w-full px-3 py-2 text-left text-white/90 hover:bg-white/5 flex items-center space-x-2.5 transition-colors"
                          onClick={() => toggleModel(model.value)}
                        >
                          <Checkbox
                            checked={selectedModels.includes(model.value)}
                          />
                          <span className="text-sm">{model.label}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Evaluate
        </button>
      </div>
    </form>
  );
}
