import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import React from "react";

export interface ProcessData {
  name: string;
  [key: string]: any;
}

export interface GroupedProcess {
  name: string;
  pids: string[];
  processes: { [pid: string]: ProcessData };
}

interface ProcessTableProps {
  groupedProcesses: GroupedProcess[];
  selectedPids: Set<string>;
  onTogglePid: (pid: string) => void;
  onToggleGroup: (pids: string[]) => void;
  metricKeys: string[];
}

export function ProcessTable({
  groupedProcesses,
  selectedPids,
  onTogglePid,
  onToggleGroup,
  metricKeys,
}: ProcessTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const isGroupSelected = (pids: string[]) => {
    return pids.every((pid) => selectedPids.has(pid));
  };

  const isGroupPartiallySelected = (pids: string[]) => {
    const selectedCount = pids.filter((pid) => selectedPids.has(pid)).length;
    return selectedCount > 0 && selectedCount < pids.length;
  };

  const getLastValue = (arr: number[] | undefined) => {
    if (!arr || arr.length === 0) return 0;
    return arr[arr.length - 1];
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-12"></TableHead>
            <TableHead className="text-foreground">Process Name</TableHead>
            {metricKeys.slice(0, 3).map((key) => (
              <TableHead key={key} className="text-foreground text-right">
                {key
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedProcesses.map((group) => {
            const isExpanded = expandedGroups.has(group.name);
            const isSelected = isGroupSelected(group.pids);
            const isPartial = isGroupPartiallySelected(group.pids);

            return (
              <React.Fragment key={group.name}>
                <TableRow className="border-border hover:bg-muted/50 cursor-pointer">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected || isPartial}
                        onCheckedChange={() => onToggleGroup(group.pids)}
                        className={
                          isPartial ? "data-[state=checked]:bg-primary/50" : ""
                        }
                      />
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground py-3">
                    {group.name} ({group.pids.length})
                  </TableCell>
                  {metricKeys.slice(0, 3).map((key) => {
                    const total = group.pids.reduce((sum, pid) => {
                      return sum + getLastValue(group.processes[pid][key]);
                    }, 0);
                    return (
                      <TableCell
                        key={key}
                        className="text-right text-muted-foreground py-3"
                      >
                        {total.toFixed(2)}
                      </TableCell>
                    );
                  })}
                </TableRow>

                {isExpanded &&
                  group.pids.map((pid) => {
                    const process = group.processes[pid];
                    return (
                      <TableRow
                        key={pid}
                        className="border-border hover:bg-muted/30"
                      >
                        <TableCell className="py-2 pl-12">
                          <Checkbox
                            checked={selectedPids.has(pid)}
                            onCheckedChange={() => onTogglePid(pid)}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground py-2 pl-4">
                          PID: {pid}
                        </TableCell>
                        {metricKeys.slice(0, 3).map((key) => (
                          <TableCell
                            key={key}
                            className="text-right text-muted-foreground py-2"
                          >
                            {getLastValue(process[key]).toFixed(2)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
