import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Leaf, Zap, Wifi } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  metricKey: string;
}

const metricConfig: Record<string, { icon: LucideIcon; color: string; unit: string }> = {
  energy_consumption: { icon: Zap, color: "text-metric-energy", unit: "J" },
  cpu_utilization: { icon: Cpu, color: "text-metric-cpu", unit: "%" },
  memory_usage: { icon: HardDrive, color: "text-metric-memory", unit: "MB" },
  carbon_emissions: { icon: Leaf, color: "text-metric-carbon", unit: "g CO2" },
  power_usage: { icon: Activity, color: "text-metric-power", unit: "W" },
  network_usage: { icon: Wifi, color: "text-metric-network", unit: "KB/s" },
};

export function MetricCard({ title, value, unit = "", metricKey }: MetricCardProps) {
  const config = metricConfig[metricKey] || { icon: Activity, color: "text-primary", unit: "" };
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
            {value.toFixed(2)} <span className="text-lg brightness-50 font-medium">{config.unit}</span>
          </div>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
