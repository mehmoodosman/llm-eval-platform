import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number;
}

export function MetricCard({ label, value }: MetricCardProps) {
  const percentage = value.toFixed(2);
  const color =
    value >= 90
      ? "text-green-400"
      : value >= 70
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="rounded-lg bg-black/20 p-3">
      <div className="text-xs font-medium text-white/60">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold", color)}>
        {percentage}%
      </div>
    </div>
  );
}
