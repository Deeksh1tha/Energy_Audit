import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Index from "./main";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, RefreshCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-background text-foreground p-6">
      <h1 className="text-3xl font-bold">System Metrics Dashboard</h1>
      <p className="text-muted-foreground mb-4">Choose how you want to view data:</p>

      <div className="flex gap-4">
        <Button variant="default" onClick={handleLiveView}>
          View Live Metrics
        </Button>

        <Button asChild>
          <label className="cursor-pointer flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import File
            <input
              type="file"
              className="hidden"
              onChange={handleFileImport}
              accept=".json,.csv"
            />
          </label>
        </Button>

        <Button variant="outline" onClick={loadFiles}>
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="mt-10 w-full max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Previously Imported Systems</h2>

        {loading ? (
          <p className="text-muted-foreground">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-muted-foreground">No systems imported yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {files.map((file) => (
              <Card
                key={file}
                className="hover:bg-muted transition-colors cursor-pointer"
                onClick={() => {
                  setFileName(file);
                  setIsLive(false);
                  navigate(`/system/${file}`);
                }}
              >
                <CardHeader className="flex flex-row items-center space-x-3">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{file}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Click to open dashboard
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemDashboard;
