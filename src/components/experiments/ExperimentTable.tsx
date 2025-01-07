"use client";

import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Experiment } from "@/types/experiments";

interface ExperimentTableProps {
  experiments: Experiment[];
  onDelete?: (id: string) => void;
}

export function ExperimentTable({
  experiments,
  onDelete,
}: ExperimentTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-white/5 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-white/60">Name</TableHead>
            <TableHead className="text-white/60">Models</TableHead>
            <TableHead className="text-white/60 text-right">
              Test Cases
            </TableHead>
            <TableHead className="text-white/60">Created</TableHead>
            <TableHead className="text-white/60 w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {experiments.map(experiment => (
            <TableRow
              key={experiment.id}
              className="border-white/5 hover:bg-slate-800/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/experiments/${experiment.id}`)}
            >
              <TableCell className="font-medium text-white">
                {experiment.name}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {experiment.models.map(model => (
                    <span
                      key={model.id}
                      className="px-2 py-1 rounded-full bg-slate-800 text-white/70 font-mono text-xs"
                      title={`${model.category} - ${model.label}`}
                    >
                      {model.value}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right text-white/60">
                {experiment.testCaseCount}
              </TableCell>
              <TableCell className="text-white/60">
                {formatDistanceToNow(new Date(experiment.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={e => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/40 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-slate-900 border-slate-800"
                  >
                    <DropdownMenuItem
                      className="text-white/80 focus:bg-slate-800 focus:text-white"
                      onClick={e => {
                        e.stopPropagation();
                        router.push(`/experiments/${experiment.id}`);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        className="text-red-400 focus:bg-red-950 focus:text-red-400"
                        onClick={e => {
                          e.stopPropagation();
                          onDelete(experiment.id);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
