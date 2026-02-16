import { useEffect, useMemo, useReducer, useState } from "react";
import { api } from "../lib/api";
import { initialState, reducer } from "../lib/state";
import type { MemoryFile, SessionFile } from "../lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(1)} ${units[index]}`;
}

export function Doctor() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [memoryFiles, setMemoryFiles] = useState<MemoryFile[]>([]);
  const [sessionFiles, setSessionFiles] = useState<SessionFile[]>([]);
  const [dataMessage, setDataMessage] = useState("");

  const hasReport = Boolean(state.doctor);
  const autoFixable = hasReport
    ? state.doctor!.issues
        .filter((issue) => issue.autoFixable)
        .map((issue) => issue.id)
    : [];

  const agents = useMemo(() => {
    const map = new Map<string, { count: number; size: number }>();
    for (const f of sessionFiles) {
      const entry = map.get(f.agent) || { count: 0, size: 0 };
      entry.count += 1;
      entry.size += f.sizeBytes;
      map.set(f.agent, entry);
    }
    return Array.from(map.entries()).map(([agent, info]) => ({
      agent,
      count: info.count,
      size: info.size,
    }));
  }, [sessionFiles]);

  const totalMemoryBytes = useMemo(
    () => memoryFiles.reduce((sum, f) => sum + f.sizeBytes, 0),
    [memoryFiles],
  );
  const totalSessionBytes = useMemo(
    () => sessionFiles.reduce((sum, f) => sum + f.sizeBytes, 0),
    [sessionFiles],
  );

  function refreshData() {
    api
      .listMemoryFiles()
      .then(setMemoryFiles)
      .catch(() => setDataMessage("Failed to load memory files"));
    api
      .listSessionFiles()
      .then(setSessionFiles)
      .catch(() => setDataMessage("Failed to load session files"));
  }

  useEffect(() => {
    api
      .runDoctor()
      .then((report) => dispatch({ type: "setDoctor", doctor: report }))
      .catch(() =>
        dispatch({ type: "setMessage", message: "Failed to run doctor" }),
      );
    refreshData();
  }, []);

  return (
    <section>
      <h2 className="text-2xl font-bold text-text-main mb-4">Doctor</h2>

      {/* Config Diagnostics */}
      {state.doctor && (
        <div>
          <p className="text-sm text-text-main/70 mb-3">
            Health score: {state.doctor.score}
          </p>
          <div className="space-y-2">
            {state.doctor.issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-2 text-sm"
              >
                {issue.severity === "error" && (
                  <Badge variant="destructive">ERROR</Badge>
                )}
                {issue.severity === "warn" && (
                  <Badge variant="secondary">WARN</Badge>
                )}
                {issue.severity === "info" && (
                  <Badge variant="outline">INFO</Badge>
                )}
                <span>{issue.message}</span>
                {issue.autoFixable && (
                  <Button
                    size="sm"
                    onClick={() => {
                      api
                        .fixIssues([issue.id])
                        .then(() => api.runDoctor())
                        .then((report) =>
                          dispatch({ type: "setDoctor", doctor: report }),
                        )
                        .catch(() =>
                          dispatch({
                            type: "setMessage",
                            message: "Failed to fix issue",
                          }),
                        );
                    }}
                  >
                    fix
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              onClick={() => {
                api
                  .fixIssues(autoFixable)
                  .then(() => api.runDoctor())
                  .then((report) =>
                    dispatch({ type: "setDoctor", doctor: report }),
                  )
                  .catch(() =>
                    dispatch({
                      type: "setMessage",
                      message: "Failed to fix all issues",
                    }),
                  );
              }}
              disabled={!autoFixable.length}
            >
              Fix all auto issues
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                api
                  .runDoctor()
                  .then((report) =>
                    dispatch({ type: "setDoctor", doctor: report }),
                  )
                  .catch(() =>
                    dispatch({
                      type: "setMessage",
                      message: "Refresh failed",
                    }),
                  )
              }
            >
              Refresh
            </Button>
          </div>
        </div>
      )}
      {!hasReport ? (
        <Button
          onClick={() =>
            api
              .runDoctor()
              .then((report) =>
                dispatch({ type: "setDoctor", doctor: report }),
              )
          }
        >
          Run Doctor
        </Button>
      ) : null}
      <p className="text-sm text-text-main/70 mt-2">{state.message}</p>

      {/* Data Cleanup */}
      <h3 className="text-lg font-semibold text-text-main mt-6 mb-3">
        Data Cleanup
      </h3>
      {dataMessage && (
        <p className="text-sm text-text-main/70 mt-2">{dataMessage}</p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {/* Memory */}
        <Card className="bg-panel border-border-subtle">
          <CardHeader>
            <CardTitle>Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">
              {memoryFiles.length} files ({formatBytes(totalMemoryBytes)})
            </p>
            <Button
              size="sm"
              disabled={memoryFiles.length === 0}
              onClick={() => {
                api
                  .clearMemory()
                  .then((count) => {
                    setDataMessage(`Cleared ${count} memory file(s)`);
                    refreshData();
                  })
                  .catch(() => setDataMessage("Failed to clear memory"));
              }}
            >
              Clear all memory
            </Button>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card className="bg-panel border-border-subtle">
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">
              {sessionFiles.length} files ({formatBytes(totalSessionBytes)})
            </p>
            {agents.map((a) => (
              <div
                key={a.agent}
                className="flex items-center gap-2 my-1"
              >
                <span className="text-sm">
                  {a.agent}: {a.count} files ({formatBytes(a.size)})
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    api
                      .clearAgentSessions(a.agent)
                      .then((count) => {
                        setDataMessage(
                          `Cleared ${count} session file(s) for ${a.agent}`,
                        );
                        refreshData();
                      })
                      .catch(() =>
                        setDataMessage(
                          `Failed to clear sessions for ${a.agent}`,
                        ),
                      );
                  }}
                >
                  Clear
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              disabled={sessionFiles.length === 0}
              onClick={() => {
                api
                  .clearAllSessions()
                  .then((count) => {
                    setDataMessage(`Cleared ${count} session file(s)`);
                    refreshData();
                  })
                  .catch(() => setDataMessage("Failed to clear sessions"));
              }}
            >
              Clear all sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
