import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProcessTable, GroupedProcess } from "@/components/ProcessTable";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Charts } from "./Charts";
import ExportDialog from "@/components/ExportDialog";

interface ProcessMetrics {
  name: string;
  [key: string]: number[] | string;
}

interface BackendData {
  [pid: string]: ProcessMetrics;
}

interface IndexProps {
  fileName?: string;
  isLive?: boolean;
}

const Index = ({ fileName, isLive = true }: IndexProps) => {
  
  const [pidMetrics, setPidMetrics] = useState<BackendData>({});
  const [selectedPids, setSelectedPids] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  const [viewMode, setViewMode] = useState<"table" | "charts">("table");
  
  const { filename } = useParams<{ filename: string }>();
  
  useEffect(() => {

    if (!isLive && filename) {
      fetch(`http://localhost:5000/system-data/${filename}`)
        .then(res => res.json())
        .then(data => {
          setPidMetrics(data.data);
          setIsConnected(true);
        })
        .catch(() => setIsConnected(false));
      return;
    }

    const source = new EventSource(
      "http://localhost:5000/live-metrics-stream?fetchAll=true"
    );

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const { full, data } = parsed;
    
        setPidMetrics((prev) => {
          if (full) {
            // setSelectedPids(new Set(Object.keys(data)));
            return data;
          }
    
          const newMetrics: BackendData = {};
          for (const pid in data) {
            const old = prev[pid] || {};
            const incoming = data[pid];
            newMetrics[pid] = { ...incoming };
    
            for (const key in incoming) {
              if (Array.isArray(incoming[key])) {
                newMetrics[pid][key] = [
                  ...(old?.[key] || []),
                  ...incoming[key],
                ];
              } else {
                newMetrics[pid][key] = incoming[key];
              }
            }
          }
    
          return newMetrics;
        });
    
        setIsConnected(true);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    source.onerror = () => {
      console.error("SSE connection failed");
      setIsConnected(false);
      toast.error("Lost connection to backend");
      source.close();
    };

    return () => {
      source.close();
    };
  }, [isLive, fileName]);

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
  const aggregatedMetrics = metricKeys
  .filter((key) => key !== "timestamps")
  .map((key) => {
    let sum = 0;
    selectedPids.forEach((pid) => {
      const values = pidMetrics[pid]?.[key] as number[] | undefined;
      if (values?.length) {
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

  // Prepare chart data for selected processes, within the time range
  const getChartData = (metricKey: string, timeRange: string) => {
    const chartData: { name: string; values: number[] }[] = [];
    const now = Date.now() / 1000;
  
    const rangeSeconds = {
      "10s": 10,
      "30s": 30,
      "1m": 60,
      "5m": 300,
      "10m": 600,
      "30m": 1800,
      "all": Infinity,
    }[timeRange];
  
    selectedPids.forEach((pid) => {
      const process = pidMetrics[pid];
      if (!process) return;
  
      const values = process[metricKey] as number[];
      const timestamps = process["timestamps"] as number[];
  
      if (!values || !timestamps) return;
  
      const filtered = timestamps.reduce<{ values: number[] }>(
        (acc, ts, idx) => {
          if (now - ts <= rangeSeconds) acc.values.push(values[idx]);
          return acc;
        },
        { values: [] }
      );
  
      chartData.push({
        name: `${process.name} (${pid})`,
        values: filtered.values,
      });
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
          isConnected={isConnected && isLive}
          onExport={() => setShowExportDialog(true)}
        />

        <ExportDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          pidMetrics={pidMetrics}
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
          <Charts
            metricKeys={metricKeys}
            formatMetricName={formatMetricName}
            getChartData={getChartData}
            aggregatedMetrics={aggregatedMetrics}
            defaultTimeRange={isLive ? "30s" : "all"}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
