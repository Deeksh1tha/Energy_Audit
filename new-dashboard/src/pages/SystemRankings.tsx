import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Award, Medal, Zap, Cpu, HardDrive, Leaf, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProcessMetrics {
  name: string;
  cpu_utilization: number[];
  memory_usage: number[];
  energy_consumption: number[];
  carbon_emissions: number[];
  power_usage: number[];
}

interface BackendData {
  [pid: string]: ProcessMetrics;
}

interface SystemData {
  data: BackendData;
}

interface SystemMetrics {
  fileName: string;
  totalEnergyConsumption: number; // Changed to cumulative
  avgCpuUtilization: number;
  avgMemoryUsage: number;
  avgCarbonEmissions: number;
  avgPowerUsage: number;
  totalRuntime: number; // Time in seconds
  totalDataPoints: number;
  processCount: number;
}

type RankingMetric = 
  | "totalEnergyConsumption"  // Changed from avg to total
  | "avgCpuUtilization" 
  | "avgMemoryUsage"
  | "avgCarbonEmissions"
  | "avgPowerUsage";

const metricLabels: Record<RankingMetric, string> = {
  totalEnergyConsumption: "Total Energy Consumption",  // Updated label
  avgCpuUtilization: "Avg CPU Utilization",
  avgMemoryUsage: "Avg Memory Usage",
  avgCarbonEmissions: "Avg Carbon Emissions",
  avgPowerUsage: "Avg Power Usage",
};

const metricIcons: Record<RankingMetric, any> = {
  totalEnergyConsumption: Zap,
  avgCpuUtilization: Cpu,
  avgMemoryUsage: HardDrive,
  avgCarbonEmissions: Leaf,
  avgPowerUsage: Activity,
};

const metricUnits: Record<RankingMetric, string> = {
  totalEnergyConsumption: "J",
  avgCpuUtilization: "%",
  avgMemoryUsage: "MB",
  avgCarbonEmissions: "g CO2",
  avgPowerUsage: "W",
};

const SystemRankings = () => {
  const [allSystemsData, setAllSystemsData] = useState<SystemMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>("totalEnergyConsumption");
  const [selectedSystems, setSelectedSystems] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();

  // Helper function to format large numbers
  const formatValue = (value: number, metric: RankingMetric): string => {
    if (metric === "totalEnergyConsumption") {
      // Convert to kJ if value is large
      if (value >= 1000) {
        return (value / 1000).toFixed(2);
      }
    }
    return value.toFixed(2);
  };

  const getDisplayUnit = (metric: RankingMetric): string => {
    if (metric === "totalEnergyConsumption") {
      const maxValue = Math.max(...allSystemsData.map(s => s.totalEnergyConsumption));
      if (maxValue >= 1000) {
        return "kJ";
      }
    }
    return metricUnits[metric];
  };

  useEffect(() => {
    loadSystemsData();
  }, []);

  const loadSystemsData = async () => {
    setLoading(true);
    try {
      // Get list of files
      const filesRes = await fetch("http://localhost:5000/api/list-files");
      const files = await filesRes.json();
      
      console.log("Found files:", files);

      // Load data for each file
      const systemsMetrics: SystemMetrics[] = [];

      for (const file of files) {
        console.log(`Loading data for file: ${file}`);
        try {
          const dataRes = await fetch(`http://localhost:5000/system-data/${file}`);
          
          if (!dataRes.ok) {
            console.error(`Failed to fetch ${file}: ${dataRes.status} ${dataRes.statusText}`);
            continue;
          }
          
          const systemData: SystemData = await dataRes.json();
          console.log(`Data structure for ${file}:`, systemData);

          if (systemData && systemData.data) {
            const processes = Object.values(systemData.data);
            console.log(`Found ${processes.length} processes in ${file}`);
            
            let totalEnergy = 0, totalCpu = 0, totalMemory = 0, totalCarbon = 0, totalPower = 0, totalDataPoints = 0;

            processes.forEach((process, index) => {
              console.log(`Process ${index} in ${file}:`, {
                name: process.name,
                energyPoints: process.energy_consumption?.length || 0,
                cpuPoints: process.cpu_utilization?.length || 0,
                memoryPoints: process.memory_usage?.length || 0,
                carbonPoints: process.carbon_emissions?.length || 0,
                powerPoints: process.power_usage?.length || 0
              });
              
              // Energy consumption is already cumulative, take the last value (total)
              if (process.energy_consumption && process.energy_consumption.length > 0) {
                const processTotal = process.energy_consumption[process.energy_consumption.length - 1];
                totalEnergy += processTotal;
                totalDataPoints += process.energy_consumption.length;
                console.log(`Process ${process.name} total energy: ${processTotal} J`);
              }
              if (process.cpu_utilization && process.cpu_utilization.length > 0) {
                totalCpu += process.cpu_utilization.reduce((sum, val) => sum + val, 0);
              }
              if (process.memory_usage && process.memory_usage.length > 0) {
                totalMemory += process.memory_usage.reduce((sum, val) => sum + val, 0);
              }
              if (process.carbon_emissions && process.carbon_emissions.length > 0) {
                totalCarbon += process.carbon_emissions.reduce((sum, val) => sum + val, 0);
              }
              if (process.power_usage && process.power_usage.length > 0) {
                totalPower += process.power_usage.reduce((sum, val) => sum + val, 0);
              }
            });

            console.log(`${file} totals:`, {
              totalDataPoints,
              totalEnergy,
              totalCpu,
              totalMemory,
              totalCarbon,
              totalPower,
              processCount: processes.length
            });

            // Calculate total runtime (assuming 1 second interval per data point)
            // You can adjust this if your data has different sampling intervals
            const samplingInterval = 1; // seconds per data point
            const totalRuntime = totalDataPoints * samplingInterval;

            // Always add the system even if some metrics are missing
            systemsMetrics.push({
              fileName: file,
              totalEnergyConsumption: totalEnergy, // Cumulative energy
              avgCpuUtilization: totalDataPoints > 0 ? totalCpu / totalDataPoints : 0,
              avgMemoryUsage: totalDataPoints > 0 ? totalMemory / totalDataPoints : 0,
              avgCarbonEmissions: totalDataPoints > 0 ? totalCarbon / totalDataPoints : 0,
              avgPowerUsage: totalDataPoints > 0 ? totalPower / totalDataPoints : 0,
              totalRuntime: totalRuntime, // Total runtime in seconds
              totalDataPoints,
              processCount: processes.length,
            });
          } else {
            console.warn(`${file} does not have expected data structure:`, systemData);
          }
        } catch (err) {
          console.error(`Error loading data for ${file}:`, err);
        }
      }

      console.log("Final systems metrics:", systemsMetrics);
      setAllSystemsData(systemsMetrics);
      // Select all systems by default
      setSelectedSystems(new Set(systemsMetrics.map(s => s.fileName)));
    } catch (error) {
      console.error("Error loading systems data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSystemSelection = (fileName: string) => {
    const newSelected = new Set(selectedSystems);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedSystems(newSelected);
  };

  const toggleAllSystems = () => {
    if (selectedSystems.size === allSystemsData.length) {
      setSelectedSystems(new Set());
    } else {
      setSelectedSystems(new Set(allSystemsData.map(s => s.fileName)));
    }
  };

  // Filter and sort systems based on selections
  const filteredSystems = allSystemsData.filter(system => selectedSystems.has(system.fileName));
  const sortedSystems = [...filteredSystems].sort((a, b) => {
    const aVal = a[rankingMetric];
    const bVal = b[rankingMetric];
    const multiplier = sortOrder === "asc" ? 1 : -1;
    return aVal < bVal ? -1 * multiplier : aVal > bVal ? 1 * multiplier : 0;
  });

  const getRankIcon = (index: number) => {
    if (index === 0)
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1)
      return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2)
      return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="text-muted-foreground font-semibold">{index + 1}</span>;
  };

  const getRankBadge = (system: SystemMetrics, index: number, total: number) => {
    // For energy consumption, consider runtime when determining status
    if (rankingMetric === "totalEnergyConsumption" && sortedSystems.length > 1) {
      const avgRuntime = sortedSystems.reduce((sum, s) => sum + s.totalRuntime, 0) / sortedSystems.length;
      const energyPerSecond = system.totalEnergyConsumption / (system.totalRuntime || 1);
      
      // If runtime is significantly shorter but energy is high, it's inefficient
      if (system.totalRuntime < avgRuntime * 0.5 && index >= total / 2) {
        return <Badge variant="destructive">Inefficient (High Power)</Badge>;
      }
      
      // If runtime is significantly longer, consider energy per second
      if (system.totalRuntime > avgRuntime * 1.5) {
        const avgEnergyPerSecond = sortedSystems.reduce((sum, s) => 
          sum + (s.totalEnergyConsumption / (s.totalRuntime || 1)), 0) / sortedSystems.length;
        
        if (energyPerSecond < avgEnergyPerSecond) {
          return <Badge className="bg-green-600 hover:bg-green-700">Efficient (Long Runtime)</Badge>;
        }
      }
    }
    
    // Standard ranking badges
    if (index === 0)
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Best</Badge>;
    if (index === total - 1 && total > 1)
      return <Badge variant="destructive">Needs Improvement</Badge>;
    return <Badge variant="secondary">Average</Badge>;
  };

  const MetricIcon = metricIcons[rankingMetric];

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Trophy className="h-8 w-8 text-primary" />
                System Rankings
              </h1>
              <p className="text-muted-foreground">
                Compare performance across all systems
              </p>
            </div>
          </div>
          <Button onClick={loadSystemsData} variant="outline">
            Refresh
          </Button>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Ranking Methodology</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Energy Consumption:</strong> Shows cumulative total energy used by the system. 
                  <strong className="ml-2">Other Metrics:</strong> CPU, Memory, Carbon, and Power values are averaged across all data points. 
                  <strong className="ml-2">Runtime:</strong> Total time the system was monitored (based on data sampling intervals). 
                  <strong className="ml-2">Status:</strong> Considers both metric value and runtime - systems with high energy but short runtime are marked as "Inefficient", while systems with longer runtime but lower energy-per-second are marked as "Efficient".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-10">
              <p className="text-center text-muted-foreground">Loading system data...</p>
            </CardContent>
          </Card>
        ) : allSystemsData.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <p className="text-center text-muted-foreground">
                No system data available. Import some files to see rankings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Ranking Metric Selection */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MetricIcon className="h-5 w-5" />
                    Ranking Metric
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={rankingMetric} onValueChange={(value: RankingMetric) => setRankingMetric(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(metricLabels) as RankingMetric[]).map((metric) => {
                        const Icon = metricIcons[metric];
                        return (
                          <SelectItem key={metric} value={metric}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {metricLabels[metric]}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 mt-3">
                    <Label htmlFor="sort-order">Sort Order:</Label>
                    <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Low to High</SelectItem>
                        <SelectItem value="desc">High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* System Selection */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">System Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      id="select-all"
                      checked={selectedSystems.size === allSystemsData.length}
                      onCheckedChange={toggleAllSystems}
                    />
                    <Label htmlFor="select-all" className="font-medium">
                      Select All ({allSystemsData.length} systems)
                    </Label>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {allSystemsData.map((system) => (
                      <div key={system.fileName} className="flex items-center gap-2">
                        <Checkbox
                          id={system.fileName}
                          checked={selectedSystems.has(system.fileName)}
                          onCheckedChange={() => toggleSystemSelection(system.fileName)}
                        />
                        <Label htmlFor={system.fileName} className="text-sm truncate">
                          {system.fileName}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MetricIcon className="h-4 w-4" />
                    Systems Comparison - {metricLabels[rankingMetric]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sortedSystems.map((system, index) => ({
                          name: system.fileName.length > 12 ? 
                            system.fileName.substring(0, 12) + '...' : 
                            system.fileName,
                          fullName: system.fileName,
                          value: system[rankingMetric],
                          rank: index + 1,
                        }))}
                        margin={{
                          top: 5,
                          right: 5,
                          left: 5,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="name" 
                          fontSize={10}
                          className="fill-muted-foreground"
                        />
                        <YAxis 
                          fontSize={10}
                          className="fill-muted-foreground"
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const system = sortedSystems.find(s => s.fileName === data.fullName);
                              const runtime = system?.totalRuntime || 0;
                              const hours = Math.floor(runtime / 3600);
                              const minutes = Math.floor((runtime % 3600) / 60);
                              const runtimeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                              
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-md">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        System
                                      </span>
                                      <span className="font-bold text-muted-foreground">
                                        {data.fullName}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        {metricLabels[rankingMetric]}
                                      </span>
                                      <span className="font-bold">
                                        {formatValue(data.value, rankingMetric)} {getDisplayUnit(rankingMetric)}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        Runtime
                                      </span>
                                      <span className="font-bold text-blue-500">
                                        {runtimeDisplay}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        Rank
                                      </span>
                                      <span className="font-bold text-primary">
                                        #{data.rank}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="hsl(var(--primary))"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Best Performer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sortedSystems.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-lg font-bold text-accent truncate">
                        {sortedSystems[0].fileName}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{metricLabels[rankingMetric]}</span>
                          <span className="font-medium">
                            {formatValue(sortedSystems[0][rankingMetric], rankingMetric)} {getDisplayUnit(rankingMetric)}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${Math.min(100, (sortedSystems[0][rankingMetric] / Math.max(...sortedSystems.map(s => s[rankingMetric]))) * 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Processes: {sortedSystems[0].processCount}</span>
                          <span>Runtime: {(() => {
                            const runtime = sortedSystems[0].totalRuntime;
                            const hours = Math.floor(runtime / 3600);
                            const minutes = Math.floor((runtime % 3600) / 60);
                            return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                          })()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No data available</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sortedSystems.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-lg font-bold text-primary">
                        {formatValue(sortedSystems.reduce((sum, s) => sum + s[rankingMetric], 0) / sortedSystems.length, rankingMetric)}
                        <span className="text-sm text-muted-foreground ml-1">{getDisplayUnit(rankingMetric)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Average {metricLabels[rankingMetric]}
                      </div>
                      
                      {/* Performance Distribution */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">Best: {formatValue(Math.min(...sortedSystems.map(s => s[rankingMetric])), rankingMetric)}</span>
                          <span className="text-red-600">Worst: {formatValue(Math.max(...sortedSystems.map(s => s[rankingMetric])), rankingMetric)}</span>
                        </div>
                        
                        {/* Range bar */}
                        <div className="relative w-full bg-muted rounded-full h-2">
                          <div className="absolute left-0 w-1/3 bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-l-full" />
                          <div className="absolute left-1/3 w-1/3 bg-gradient-to-r from-yellow-500 to-orange-500 h-2" />
                          <div className="absolute right-0 w-1/3 bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-r-full" />
                        </div>
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Total Systems: {sortedSystems.length}</span>
                          <span>
                            Avg Processes: {Math.round(sortedSystems.reduce((sum, s) => sum + s.processCount, 0) / sortedSystems.length)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No data available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Rankings Table */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>System Rankings - {metricLabels[rankingMetric]}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSystems.size === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Please select at least one system to view rankings.
                  </p>
                ) : (
                  <div className="rounded-md border border-border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>System Name</TableHead>
                          <TableHead>
                            {metricLabels[rankingMetric]} ({getDisplayUnit(rankingMetric)})
                          </TableHead>
                          <TableHead>Runtime</TableHead>
                          <TableHead>Process Count</TableHead>
                          <TableHead>Data Points</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedSystems.map((system, index) => {
                          // Format runtime
                          const hours = Math.floor(system.totalRuntime / 3600);
                          const minutes = Math.floor((system.totalRuntime % 3600) / 60);
                          const seconds = system.totalRuntime % 60;
                          const runtimeDisplay = hours > 0 
                            ? `${hours}h ${minutes}m ${seconds}s`
                            : minutes > 0 
                            ? `${minutes}m ${seconds}s`
                            : `${seconds}s`;
                          
                          return (
                            <TableRow
                              key={system.fileName}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center justify-center">
                                  {getRankIcon(index)}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {system.fileName}
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold">
                                  {formatValue(system[rankingMetric], rankingMetric)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {runtimeDisplay}
                                </span>
                              </TableCell>
                              <TableCell>
                                {system.processCount}
                              </TableCell>
                              <TableCell>
                                {system.totalDataPoints}
                              </TableCell>
                              <TableCell>{getRankBadge(system, index, sortedSystems.length)}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/system/${system.fileName}`)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default SystemRankings;
