"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { type TimingInfo } from "@/types/evaluation";

interface MetricsBarGraphProps {
  responses: Array<{
    model: string;
    metrics?: TimingInfo;
  }>;
}

function formatMetricLabel(metric: string): string {
  return metric
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function MetricsBarGraph({ responses }: MetricsBarGraphProps) {
  // Filter responses that have evaluation metrics
  const validResponses = responses.filter(
    (r): r is { model: string; metrics: TimingInfo } =>
      r.metrics?.evaluation !== undefined &&
      Object.keys(r.metrics.evaluation).length > 0
  );

  if (validResponses.length === 0) {
    return null;
  }

  // Get all unique metrics across all responses
  const allMetrics = Array.from(
    new Set(
      validResponses.flatMap(r => Object.keys(r.metrics.evaluation || {}))
    )
  );

  // Transform data for the chart
  const chartData = allMetrics.map(metric => {
    const dataPoint = {
      metric: formatMetricLabel(metric),
    } as { metric: string } & Record<string, number>;

    // Add each model's value for this metric
    validResponses.forEach(response => {
      if (response.metrics?.evaluation) {
        let value =
          response.metrics.evaluation[
            metric as keyof typeof response.metrics.evaluation
          ] || 0;
        // If the metric is LLM_JUDGE, normalize it by dividing by 100 since it comes as percentage
        if (metric === "LLM_JUDGE") {
          value = value / 100;
        }

        dataPoint[response.model] = value;
      }
    });

    return dataPoint;
  });

  const distinctColors = [
    "rgb(59, 130, 246)", // blue
    "rgb(236, 72, 153)", // pink
    "rgb(34, 197, 94)", // green
    "rgb(168, 85, 247)", // purple
    "rgb(249, 115, 22)", // orange
    "rgb(236, 72, 153)", // pink
  ];

  // Create config for all models
  const chartConfig = validResponses.reduce((config, response, index) => {
    return {
      ...config,
      [response.model]: {
        label: response.model,
        color: distinctColors[index % distinctColors.length],
      },
    };
  }, {});

  return (
    <Card className="bg-transparent border-none">
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} margin={{ top: 20, right: 30 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="metric"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="fill-white/80"
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              className="fill-white/80 pt-4"
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {validResponses.map((response, index) => (
              <Bar
                key={response.model}
                dataKey={response.model}
                fill={distinctColors[index % distinctColors.length]}
                radius={8}
              >
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
