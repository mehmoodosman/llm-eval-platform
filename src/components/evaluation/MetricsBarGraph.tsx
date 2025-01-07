"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
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
        const value =
          response.metrics.evaluation[
            metric as keyof typeof response.metrics.evaluation
          ] || 0;

        dataPoint[response.model] = value;
      }
    });

    return dataPoint;
  });

  const blueColors = [
    "rgb(59, 130, 246)", // blue-500
    "rgb(37, 99, 235)", // blue-600
    "rgb(29, 78, 216)", // blue-700
  ];

  // Create config for all models
  const chartConfig = validResponses.reduce((config, response, index) => {
    return {
      ...config,
      [response.model]: {
        label: response.model,
        color: blueColors[index % blueColors.length],
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
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {validResponses.map((response, index) => (
              <Bar
                key={response.model}
                dataKey={response.model}
                fill={blueColors[index % blueColors.length]}
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
