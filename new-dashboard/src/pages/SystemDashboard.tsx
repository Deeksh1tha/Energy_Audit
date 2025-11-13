import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Index from "./main";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, RefreshCcw, Trophy, Zap, Activity, BarChart3, TrendingUp, Clock, Database } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import sustainabilityImage from "../sustainability.png";

const SystemDashboard = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const navigate = useNavigate();

  // --- handle file upload ---
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { fileName } = await res.json();
      setFileName(fileName);
      setIsLive(false);
      navigate(`/system/${fileName}`);
    }
  };

  // --- handle live view ---
  const handleLiveView = () => {
    setFileName(null);
    setIsLive(true);
    navigate("/live-metrics");
  };

  // --- load existing uploaded files ---
  const loadFiles = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/list-files");
    const data = await res.json();
    setFiles(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // --- if viewing data ---
  // if (fileName || isLive) {
  //   return <Index fileName={fileName ?? ""} isLive={isLive} />;
  // }

  // --- main dashboard view ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-16">
          {/* Left: Large Energy Audit Title */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div className="h-12 w-1 bg-gradient-to-b from-primary to-primary/0"></div>
            </div>
            <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
              Energy
              <br />
              Audit
            </h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Monitor, analyze, and optimize your system's energy consumption in real-time
            </p>
          </div>
{/* Right: Action Cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
            {/* Live Metrics Card */}
            <Card 
              className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary hover:shadow-xl hover:shadow-primary/20"
              onClick={handleLiveView}
            >
              <CardHeader className="space-y-2 pb-3">
                <div className="p-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg w-fit group-hover:scale-110 transition-transform">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-base">Live Metrics</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Real-time monitoring of system performance
                </p>
              </CardContent>
            </Card>

            {/* Rankings Card */}
            <Card 
              className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-yellow-500 hover:shadow-xl hover:shadow-yellow-500/20"
              onClick={() => navigate("/rankings")}
            >
              <CardHeader className="space-y-2 pb-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg w-fit group-hover:scale-110 transition-transform">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <CardTitle className="text-base">Rankings</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Compare and rank energy efficiency
                </p>
              </CardContent>
            </Card>

            {/* Import File Card */}
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 relative">
              <label className="cursor-pointer block">
                <CardHeader className="space-y-2 pb-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg w-fit group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5 text-blue-500" />
                  </div>
                  <CardTitle className="text-base">Import Data</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Upload historical energy logs
                  </p>
                </CardContent>
              </label>
              <input
                type="file"
                className="hidden"
                onChange={handleFileImport}
                accept=".json,.csv"
              />
            </Card>

            {/* Sustainability Image */}
            <div className="flex items-center justify-center h-full">
              <img 
                src={sustainabilityImage} 
                alt="Sustainability" 
                className="w-full h-[160px] object-cover rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Previously Imported Systems */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Saved Systems</h2>
              <p className="text-muted-foreground">Access your previously imported energy data</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadFiles}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading systems...</p>
            </div>
          ) : files.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="p-4 bg-muted rounded-full">
                  <FolderOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">No systems imported yet</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Upload your first energy log file to start analyzing system performance
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <Card
                  key={file}
                  className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary hover:shadow-lg relative overflow-hidden"
                  onClick={() => {
                    setFileName(file);
                    setIsLive(false);
                    navigate(`/system/${file}`);
                  }}
                >
                  {/* Animated gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold break-all">
                            {file}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                        #{index + 1}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm text-muted-foreground mb-3">
                      Click to analyze energy metrics
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      <span>Full dashboard available</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;
