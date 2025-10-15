import { useEffect, useState } from "react";
import { ProcessTable, GroupedProcess } from "@/components/ProcessTable";
import { MetricCard } from "@/components/MetricCard";
import { MetricChart } from "@/components/MetricChart";
import { toast } from "sonner";
import { Header } from "@/components/Header";

interface ProcessMetrics {
  name: string;
  [key: string]: number[] | string;
}

interface BackendData {
  [pid: string]: ProcessMetrics;
}

const Index = () => {
  const [pidMetrics, setPidMetrics] = useState<BackendData>({});
  const [selectedPids, setSelectedPids] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(true);

  const [viewMode, setViewMode] = useState<"table" | "charts">("table");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("http://localhost:5000/live-metrics");
        if (!response.ok) throw new Error("Failed to fetch");

        const data: BackendData = await response.json();
        setPidMetrics(data);

        // Auto-select all PIDs on first load
        // if (selectedPids.size === 0) {
        //   setSelectedPids(new Set(Object.keys(data)));
        // }

        if (!isConnected) {
          setIsConnected(true);
          toast.success("Connected to backend");
        }
      } catch (error) {
        if (isConnected) {
          setIsConnected(false);
          toast.error("Failed to connect to backend");
        }
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 200);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Group processes by name
  const groupedProcesses: GroupedProcess[] = Object.entries(pidMetrics).reduce(
    (acc, [pid, data]) => {
      const existing = acc.find((g) => g.name === data.name);
      if (existing) {
        existing.pids.push(pid);
        existing.processes[pid] = data;
      } else {
        acc.push({
          name: data.name as string,
          pids: [pid],
          processes: { [pid]: data },
        });
      }
      return acc;
    },
    [] as GroupedProcess[]
  );

  // Get all metric keys (excluding 'name')
  const metricKeys = Object.keys(
    pidMetrics[Object.keys(pidMetrics)[0]] || {}
  ).filter(
    (key) =>
      key !== "name" &&
      Array.isArray(pidMetrics[Object.keys(pidMetrics)[0]][key])
  );

  // Calculate aggregated metrics for selected PIDs
  const aggregatedMetrics = metricKeys.map((key) => {
    let sum = 0;
    selectedPids.forEach((pid) => {
      const values = pidMetrics[pid]?.[key] as number[] | undefined;
      if (values && values.length > 0) {
        sum += values[values.length - 1];
      }
    });
    return { key, value: sum };
  });

  const handleTogglePid = (pid: string) => {
    const newSelected = new Set(selectedPids);
    if (newSelected.has(pid)) {
      newSelected.delete(pid);
    } else {
      newSelected.add(pid);
    }
    setSelectedPids(newSelected);
  };

  const handleToggleGroup = (pids: string[]) => {
    const allSelected = pids.every((pid) => selectedPids.has(pid));
    const newSelected = new Set(selectedPids);

    if (allSelected) {
      pids.forEach((pid) => newSelected.delete(pid));
    } else {
      pids.forEach((pid) => newSelected.add(pid));
    }

    setSelectedPids(newSelected);
  };

  // Prepare chart data for selected processes
  const getChartData = (metricKey: string) => {
    const chartData: { name: string; values: number[] }[] = [];

    selectedPids.forEach((pid) => {
      const process = pidMetrics[pid];
      if (process) {
        const values = process[metricKey] as number[];
        chartData.push({
          name: `${process.name} (${pid})`,
          values: values || [],
        });
      }
    });

    return chartData;
  };

  const formatMetricName = (key: string) => {
    return key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header
          selectedPids={selectedPids}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isConnected={isConnected}
        />

        {viewMode === "table" && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Processes
            </h2>
            <ProcessTable
              groupedProcesses={groupedProcesses}
              selectedPids={selectedPids}
              onTogglePid={handleTogglePid}
              onToggleGroup={handleToggleGroup}
              metricKeys={metricKeys}
            />
          </div>
        )}

        {viewMode === "charts" && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Metrics Over Time
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {metricKeys.map((key) => (
                <MetricChart
                  key={key}
                  title={formatMetricName(key)}
                  data={getChartData(key)}
                  metricKey={key}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
