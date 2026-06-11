"use client";
import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { runsAPI, authAPI } from "@/lib/api";

interface Log {
  level: string;
  message: string;
  step: number | null;
  extra_data: any;
}

interface Run {
  id: string;
  goal: string;
  status: string;
  result: any;
  error: string | null;
}

export default function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: runId } = use(params);
  const router = useRouter();

  const [run, setRun]       = useState<Run | null>(null);
  const [logs, setLogs]     = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone]     = useState(false);
  const logsEndRef          = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as logs appear
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Load the run details
  useEffect(() => {
    if (!authAPI.isLoggedIn()) { router.push("/login"); return; }

    runsAPI.get(runId)
      .then((data) => setRun(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [runId, router]);

  // Connect to the live log stream
  useEffect(() => {
    if (!authAPI.isLoggedIn()) return;

    const token = localStorage.getItem("eslo_token");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Poll logs every 2 seconds (simpler than SSE for now)
    const interval = setInterval(async () => {
      try {
        const fetchedLogs = await runsAPI.getLogs(runId);
        setLogs(fetchedLogs);

        const fetchedRun = await runsAPI.get(runId);
        setRun(fetchedRun);

        // Stop polling when agent finishes
        if (["completed", "failed", "cancelled"].includes(fetchedRun.status)) {
          setDone(true);
          clearInterval(interval);
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [runId]);

  // Color each log level differently
  function levelColor(level: string) {
    switch (level?.toLowerCase()) {
      case "error":   return "text-red-400";
      case "warning": return "text-yellow-400";
      case "action":  return "text-blue-400";
      case "approval": return "text-orange-400";
      default:        return "text-emerald-400";
    }
  }

  function levelIcon(level: string) {
    switch (level?.toLowerCase()) {
      case "error":   return "✗";
      case "warning": return "⚠";
      case "action":  return "→";
      case "approval": return "?";
      default:        return "✓";
    }
  }

  function statusBadge(status: string) {
    switch (status) {
      case "completed": return "bg-emerald-900/40 text-emerald-400 border-emerald-800";
      case "failed":    return "bg-red-900/40 text-red-400 border-red-800";
      case "running":   return "bg-blue-900/40 text-blue-400 border-blue-800";
      case "queued":    return "bg-zinc-800 text-zinc-400 border-zinc-700";
      default:          return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 animate-pulse">Loading run...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">eslo.ai</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-zinc-400 hover:text-white text-sm transition"
        >
          ← Back to dashboard
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Run header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Agent Run</h2>
            {run && (
              <span className={`text-xs px-3 py-1 rounded-full border font-medium
                               ${statusBadge(run.status)}`}>
                {run.status === "running" && (
                  <span className="inline-block animate-pulse mr-1">●</span>
                )}
                {run.status}
              </span>
            )}
          </div>

          {run && (
            <p className="text-zinc-400 text-sm">
              <span className="text-zinc-500">Goal: </span>
              {run.goal}
            </p>
          )}
        </div>

        {/* Live log terminal */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="text-zinc-500 text-xs ml-2">Agent logs</span>
            {!done && (
              <span className="ml-auto text-xs text-zinc-600 animate-pulse">
                live
              </span>
            )}
          </div>

          {/* Log lines */}
          <div className="p-4 font-mono text-sm min-h-64 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex items-center gap-2 text-zinc-600">
                <span className="animate-pulse">▋</span>
                <span>Waiting for agent to start...</span>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-3 mb-2 leading-relaxed">
                  {/* Step number */}
                  <span className="text-zinc-600 text-xs min-w-6 mt-0.5">
                    {log.step ?? i}
                  </span>
                  {/* Level icon */}
                  <span className={`text-xs mt-0.5 ${levelColor(log.level)}`}>
                    {levelIcon(log.level)}
                  </span>
                  {/* Message */}
                  <span className="text-zinc-300 flex-1">{log.message}</span>
                </div>
              ))
            )}

            {/* Blinking cursor while running */}
            {!done && logs.length > 0 && (
              <div className="flex gap-3 mt-2">
                <span className="text-zinc-600 text-xs min-w-6" />
                <span className="text-zinc-600 animate-pulse">▋</span>
              </div>
            )}

            {/* Auto scroll anchor */}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Result box — shows when agent completes */}
        {done && run?.result && (
          <div className="mt-6 bg-zinc-900 border border-emerald-900/50 rounded-xl p-6">
            <h3 className="font-semibold text-emerald-400 mb-3">
              ✓ Agent completed
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
              {typeof run.result === "object"
                ? run.result.output || JSON.stringify(run.result, null, 2)
                : run.result}
            </p>
          </div>
        )}

        {/* Error box */}
        {done && run?.status === "failed" && (
          <div className="mt-6 bg-zinc-900 border border-red-900/50 rounded-xl p-6">
            <h3 className="font-semibold text-red-400 mb-2">✗ Agent failed</h3>
            <p className="text-zinc-400 text-sm">{run.error || "Unknown error"}</p>
          </div>
        )}

        {/* Run again button */}
        {done && (
          <button
            onClick={() => router.back()}
            className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 
                       text-zinc-300 py-3 rounded-lg text-sm transition"
          >
            ← Run agent again
          </button>
        )}
      </div>
    </main>
  );
}