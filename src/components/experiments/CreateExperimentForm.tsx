import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ModelSelector } from "@/components/evaluation/ModelSelector";
import { ALL_MODELS } from "@/lib/models";
import type { Experiment } from "@/types/experiments";

interface CreateExperimentFormProps {
  onSuccess?: (experiment: Experiment) => void;
}

export function CreateExperimentForm({ onSuccess }: CreateExperimentFormProps) {
  const [name, setName] = useState("");
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
          name,
          systemPrompt,
          modelIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create experiment");
      }

      const experiment = await response.json();
      toast({
        title: "Success",
        description: "Experiment created successfully",
      });

      if (onSuccess) {
        onSuccess(experiment);
      }

      // Reset form
      setName("");
      setSystemPrompt("");
      setSelectedModels([]);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="Enter experiment name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          value={systemPrompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setSystemPrompt(e.target.value)
          }
          placeholder="Enter system prompt"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Model</Label>
        <ModelSelector
          selectedModels={selectedModels}
          onToggleModel={handleToggleModel}
        />
      </div>

      <Button type="submit" disabled={isLoading || selectedModels.length === 0}>
        {isLoading ? "Creating..." : "Create Experiment"}
      </Button>
    </form>
  );
}
