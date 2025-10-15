import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Leaf, Zap, Wifi } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  metricKey: string;
}

const metricConfig: Record<string, { icon: LucideIcon; color: string }> = {
  energy_consumption: { icon: Zap, color: "text-metric-energy" },
  cpu_utilization: { icon: Cpu, color: "text-metric-cpu" },
  memory_usage: { icon: HardDrive, color: "text-metric-memory" },
  carbon_emissions: { icon: Leaf, color: "text-metric-carbon" },
  power_usage: { icon: Activity, color: "text-metric-power" },
  network_usage: { icon: Wifi, color: "text-metric-network" },
};

export function MetricCard({ title, value, unit = "", metricKey }: MetricCardProps) {
  const config = metricConfig[metricKey] || { icon: Activity, color: "text-primary" };
  const Icon = config.icon;

  return (
    <Card className="border-border bg-card hover:bg-card/80 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <div className={`text-2xl font-bold ${config.color}`}>
            {value.toFixed(2)}
          </div>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
