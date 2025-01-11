"use client";

import { useRef, useEffect, useState } from "react";
import { LLM_MODELS, ALL_MODELS } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ModelSelectorProps {
  selectedModels: string[];
  onToggleModel: (value: string) => void;
}

export function ModelSelector({
  selectedModels,
  onToggleModel,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown only when clicking outside the entire component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get selected model labels for the top display
  const selectedModelLabels = selectedModels
    .map(value => ALL_MODELS.find(m => m.value === value)?.label)
    .filter(Boolean) as string[];

  const handleModelToggle = (value: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleModel(value);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/90">
        <div className="mt-1.5 relative" ref={dropdownRef}>
          {/* Selected Models Display */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedModelLabels.map(label => (
              <Badge
                key={label}
                variant="secondary"
                className="bg-blue-600/10 text-blue-400 border-blue-600/20"
              >
                {label}
              </Badge>
            ))}
          </div>

          {/* Dropdown Trigger */}
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-slate-900/50 border-slate-700 text-white/90 hover:bg-slate-800/80 hover:text-white"
            onClick={toggleDropdown}
          >
            <span className="text-white/60">Select models...</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute z-50 top-full left-0 w-full mt-1">
              <div
                className="rounded-lg border bg-slate-900 border-slate-800 shadow-lg overflow-hidden max-h-[120px] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {LLM_MODELS.map(category => (
                  <div key={category.category}>
                    <div className="px-2 py-1.5 text-xs font-medium text-white/50 bg-slate-950/30">
                      {category.category}
                    </div>
                    {category.models.map(model => (
                      <div
                        key={model.value}
                        onClick={e => handleModelToggle(model.value, e)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-800/80",
                          selectedModels.includes(model.value) && "bg-slate-800"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            selectedModels.includes(model.value)
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-700 bg-transparent"
                          )}
                        >
                          {selectedModels.includes(model.value) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="flex-1 text-white/90">
                          {model.label}
                        </span>
                      </div>
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
