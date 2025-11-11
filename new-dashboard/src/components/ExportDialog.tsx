import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  pidMetrics: any;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose, pidMetrics }) => {
  const [systemName, setSystemName] = useState("");
  const [saveToBackend, setSaveToBackend] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const doc = { data: pidMetrics, systemName };
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    });

    if (saveToBackend) {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", new File([blob], `${systemName || "pidMetrics"}.json`, { type: "application/json" }));

      await fetch("http://localhost:5000/api/upload-file", {
        method: "POST",
        body: formData,
      }).finally(() => setLoading(false));
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${systemName || "pidMetrics"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export System Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">System Name</label>
            <Input
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Enter system name"
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="saveToBackend"
              checked={saveToBackend}
              onCheckedChange={(checked) => setSaveToBackend(!!checked)}
            />
            <label htmlFor="saveToBackend" className="text-sm text-muted-foreground">
              Save this file to backend
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="hover:bg-transparent hover:text-foreground"
            >Cancel</Button>
            <Button onClick={handleConfirm} disabled={!systemName || loading}>
              {loading ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
