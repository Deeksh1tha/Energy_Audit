import { MetricChart } from "@/components/MetricChart";
import { MetricCard } from "@/components/MetricCard";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
} from "recharts";

export const Charts = ({
  metricKeys,
  formatMetricName,
  getChartData,
  aggregatedMetrics,
}) => {
  const pieColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
  ];

  // Compute an aggregated metric snapshot (like energy distribution)
  const energyData =
    getChartData("energy_consumption")?.map((proc) => ({
      name: proc.name,
      value: proc.values[proc.values.length - 1], // latest snapshot
    })) || [];

  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Aggregated Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {aggregatedMetrics.map(({ key, value }) => (
            <MetricCard
              key={key}
              title={formatMetricName(key)}
              value={value}
              metricKey={key}
            />
          ))}
        </div>
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-3">
        Metrics over time
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* PIE / DONUT for Energy/CO2 Distribution */}
        {energyData.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">
                Energy Distribution (Live Share)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Pie
                    data={energyData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {energyData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Line/Area panels for first 3 */}
        {metricKeys.slice(1, 4).map((key) => (
          <MetricChart
            key={key}
            title={formatMetricName(key)}
            data={getChartData(key)}
            metricKey={key}
          />
        ))}

        {/* BAR Chart with Tooltip */}
        {metricKeys.slice(5, 6).map((key) => {
          const raw = getChartData(key);
          const latest = raw.map((p) => ({
            name: p.name,
            current: p.values[p.values.length - 1] ?? 0,
          }));

          return (
            <Card key={key} className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {formatMetricName(key)} (Latest Snapshot)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={latest}>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey="current" fill="hsl(var(--chart-4))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
