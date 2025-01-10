"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/evaluation/ModelSelector";
import { useToast } from "@/hooks/use-toast";
import { ALL_MODELS } from "@/lib/models";

interface CreateExperimentDialogProps {
  onExperimentCreated?: () => void;
}

export function CreateExperimentDialog({
  onExperimentCreated,
}: CreateExperimentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggleModel = (value: string) => {
    setSelectedModels(prev => {
      if (prev.includes(value)) {
        return prev.filter(m => m !== value);
      }
      return [...prev, value];
    });
  };

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("Name is required");
      return false;
    }
    if (value.length < 3) {
      setNameError("Name must be at least 3 characters");
      return false;
    }
    if (value.length > 50) {
      setNameError("Name must be less than 50 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    validateName(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateName(name) || !systemPrompt || selectedModels.length === 0)
      return;

    setIsLoading(true);
    try {
      // Convert model values to model IDs
      const modelIds = selectedModels
        .map(value => ALL_MODELS.find(m => m.value === value)?.id)
        .filter(Boolean) as string[];

      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          systemPrompt,
          modelIds,
        }),
      });

      if (!response.ok) throw new Error("Failed to create experiment");

      toast({
        title: "Success",
        description: "Experiment created successfully",
        variant: "success",
      });

      // Reset form
      setName("");
      setNameError("");
      setSystemPrompt("");
      setSelectedModels([]);
      setIsOpen(false);

      // Notify parent
      onExperimentCreated?.();
    } catch (error) {
      console.error("Error creating experiment:", error);
      toast({
        title: "Error",
        description: "Failed to create experiment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
        >
          Create New Experiment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold text-white">
            Create New Experiment
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-base">
            Set up a new experiment to evaluate LLM responses with custom
            parameters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white font-medium">
              Experiment Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              onBlur={() => validateName(name)}
              className={`bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 h-11 ${
                nameError
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "focus-visible:ring-blue-500"
              }`}
              placeholder="e.g., Code Review Assistant Evaluation"
              required
              maxLength={50}
            />
            {nameError && (
              <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-red-400" />
                {nameError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt" className="text-white font-medium">
              System Prompt
            </Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px] focus-visible:ring-blue-500"
              placeholder="Enter the system prompt that will guide the LLM's behavior..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-medium">Select Model</Label>
            <ModelSelector
              selectedModels={selectedModels}
              onToggleModel={handleToggleModel}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800/80 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || selectedModels.length === 0 || !!nameError}
              className={`bg-blue-600 text-white shadow-lg ${
                !isLoading && "hover:bg-blue-500 hover:shadow-blue-500/20"
              } transition-all duration-200 min-w-[120px]`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
