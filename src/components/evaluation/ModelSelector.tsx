"use client";

import { useRef, useEffect, useState } from "react";
import { LLM_MODELS, ALL_MODELS } from "@/lib/models";
import { Checkbox } from "./Checkbox";

interface ModelSelectorProps {
  selectedModels: string[];
  onToggleModel: (value: string) => void;
}

export function ModelSelector({
  selectedModels,
  onToggleModel,
}: ModelSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get selected model labels for the top display
  const selectedModelLabels = selectedModels
    .map(value => ALL_MODELS.find(m => m.value === value)?.label)
    .filter(Boolean) as string[];

  return (
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
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="block w-full rounded-lg bg-black/50 border border-white/10 text-white/90 shadow-sm p-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-shadow"
          >
            <span className="text-white/60">Select models...</span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
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
                        onClick={() => onToggleModel(model.value)}
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
  );
}
