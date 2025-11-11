import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Table, LineChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = ({
  selectedPids,
  viewMode,
  setViewMode,
  isConnected,
  onExport,
}) => {
  const toggleView = (mode: "table" | "charts") => setViewMode(mode);

  return (
    <div className="flex items-center gap-3 pb-2 border-b border-border">
      <Activity className="h-8 w-8 text-primary" />
      <div>
        <h1 className="text-3xl font-bold text-foreground">Process Monitor</h1>
        <p className="text-sm text-muted-foreground">
          Real-time system metrics • {selectedPids.size} processes selected
        </p>
      </div>

      {/* Right side controls grouped */}
      <div className="ml-auto flex items-center gap-4">
        {/* Connection Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isConnected ? "bg-accent" : "bg-destructive"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="text-muted-foreground hover:text-foreground hover:bg-transparent"
        >
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>

        {/* View Switch */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <Toggle
            pressed={viewMode === "table"}
            onPressedChange={() => toggleView("table")}
            className={`px-3 ${viewMode === "table" ? "bg-primary" : ""}`}
          >
            <Table className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={viewMode === "charts"}
            onPressedChange={() => toggleView("charts")}
            className={`px-3 ${viewMode === "charts" ? "bg-muted" : ""}`}
          >
            <LineChart className="h-4 w-4" />
          </Toggle>
        </div>
      </div>
    </div>
  );
};
