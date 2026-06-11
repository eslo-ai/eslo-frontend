"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { agentsAPI, authAPI } from "@/lib/api";

// ── TypeScript type — shape of one agent from the API ──────────────────────
interface Agent {
  id: string;
  name: string;
  description: string | null;
  allowed_tools: string[];
  is_active: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── On page load: check auth + fetch agents ──────────────────────────────
  useEffect(() => {
    // Job 1: not logged in? go to login
    if (!authAPI.isLoggedIn()) {
      router.push("/login");
      return;
    }

    // Job 2: fetch agents from backend
    agentsAPI
      .list()
      .then((data) => setAgents(data))
      .catch(() => setError("Failed to load agents"))
      .finally(() => setLoading(false));
  }, [router]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 animate-pulse">Loading your agents...</p>
      </main>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black text-white">

      {/* Top navigation bar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">eslo.ai</h1>
        <button
          onClick={() => authAPI.logout()}
          className="text-zinc-400 hover:text-white text-sm transition"
        >
          Sign out
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Your Agents</h2>
            <p className="text-zinc-400 mt-1">
              {agents.length === 0
                ? "No agents yet — create your first one"
                : `${agents.length} agent${agents.length > 1 ? "s" : ""} ready`}
            </p>
          </div>
          <button
            onClick={() => router.push("/agents/new")}
            className="bg-violet-600 hover:bg-violet-500 text-white 
                       px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            + New Agent
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 
                          rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Job 3a: Empty state */}
        {agents.length === 0 && !error && (
          <div className="text-center py-24 border border-dashed border-zinc-800 
                          rounded-2xl">
            <p className="text-zinc-500 text-lg mb-2">No agents yet</p>
            <p className="text-zinc-600 text-sm mb-6">
              Create your first agent to get started
            </p>
            <button
              onClick={() => router.push("/agents/new")}
              className="bg-violet-600 hover:bg-violet-500 text-white 
                         px-6 py-3 rounded-lg font-semibold transition"
            >
              Create Agent
            </button>
          </div>
        )}

        {/* Job 3b: Agent cards */}
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 
                         flex justify-between items-start hover:border-zinc-700 
                         transition"
            >
              {/* Left side — agent info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Green dot = active */}
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="font-semibold text-white">{agent.name}</h3>
                </div>

                {/* Description */}
                <p className="text-zinc-400 text-sm mb-3">
                  {agent.description || "No description"}
                </p>

                {/* Tool badges — shows which tools this agent can use */}
                <div className="flex gap-2 flex-wrap">
                  {agent.allowed_tools.length === 0 ? (
                    <span className="text-zinc-600 text-xs">No tools connected</span>
                  ) : (
                    agent.allowed_tools.map((tool) => (
                      <span
                        key={tool}
                        className="bg-zinc-800 text-zinc-300 text-xs 
                                   px-2 py-1 rounded-md border border-zinc-700"
                      >
                        {tool}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Right side — action buttons */}
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => router.push(`/agents/${agent.id}`)}
                  className="bg-violet-600 hover:bg-violet-500 text-white 
                             px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Run
                </button>
                <button
                  onClick={() => router.push(`/agents/${agent.id}`)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 
                             px-4 py-2 rounded-lg text-sm transition"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}