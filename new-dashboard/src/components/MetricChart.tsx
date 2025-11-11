import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MetricChartProps {
  title: string;
  data: { name: string; values: number[] }[];
  metricKey: string;
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

export function MetricChart({ title, data, metricKey }: MetricChartProps) {
  // Transform data for recharts
  const maxLength = Math.max(...data.map(d => d.values.length));
  const chartData = Array.from({ length: maxLength }, (_, i) => {
    const point: any = { index: i };
    data.forEach((process) => {
      point[process.name] = process.values[i] ?? null;
    });
    return point;
  });

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="index" 
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Time (samples)', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              label={{ value: metricKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
            {data.map((process, i) => (
              <Line
                key={process.name}
                type="monotone"
                dataKey={process.name}
                stroke={chartColors[i % chartColors.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
