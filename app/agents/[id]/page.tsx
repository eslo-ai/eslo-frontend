"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { agentsAPI, runsAPI, authAPI } from "@/lib/api";

// Shape of one agent from the API
interface Agent {
  id: string;
  name: string;
  description: string | null;
  allowed_tools: string[];
  system_prompt: string | null;
  is_active: boolean;
}

export default function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Read the agent ID from the URL
  const { id: agentId } = use(params);
  const router = useRouter();

  const [agent, setAgent]   = useState<Agent | null>(null);
  const [goal, setGoal]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [running, setRunning]   = useState(false);
  const [error, setError]       = useState("");

  // ── On load: check auth + fetch this agent ──────────────────────────────
  useEffect(() => {
    if (!authAPI.isLoggedIn()) {
      router.push("/login");
      return;
    }

    agentsAPI
      .get(agentId)
      .then((data) => setAgent(data))
      .catch(() => setError("Agent not found"))
      .finally(() => setLoading(false));
  }, [agentId, router]);

  // ── Run the agent ────────────────────────────────────────────────────────
  async function handleRun(e: React.FormEvent) {
    e.preventDefault();

    if (!goal.trim()) {
      setError("Please enter a goal for the agent");
      return;
    }

    setRunning(true);
    setError("");

    try {
      // POST /runs → creates a run record + queues Celery job
      const run = await runsAPI.create(agentId, goal);

      // Immediately redirect to the live log page
      router.push(`/runs/${run.id}`);
    } catch {
      setError("Failed to start agent. Is the backend running?");
      setRunning(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 animate-pulse">Loading agent...</p>
      </main>
    );
  }

  // ── Agent not found ──────────────────────────────────────────────────────
  if (!agent) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Agent not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-zinc-400 hover:text-white text-sm transition"
          >
            ← Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 
                      flex justify-between items-center">
        <h1 className="text-xl font-bold">eslo.ai</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-zinc-400 hover:text-white text-sm transition"
        >
          ← Back to dashboard
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Agent info card */}
        <div className="bg-zinc-900 border border-zinc-800 
                        rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-bold">{agent.name}</h2>
          </div>

          {agent.description && (
            <p className="text-zinc-400 text-sm mb-4">
              {agent.description}
            </p>
          )}

          {/* Tools this agent has */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Available tools</p>
            <div className="flex gap-2 flex-wrap">
              {agent.allowed_tools.length === 0 ? (
                <span className="text-zinc-600 text-xs">No tools</span>
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
        </div>

        {/* Goal input + Run button */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-1">Give this agent a goal</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Describe what you want the agent to do. Be specific.
          </p>

          <form onSubmit={handleRun} className="space-y-4">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={
                `Examples:\n` +
                `• Research the top 5 AI startups in 2025\n` +
                `• Summarize this week's sales emails\n` +
                `• Find competitors to eslo.ai and list their pricing`
              }
              rows={5}
              disabled={running}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg 
                         px-4 py-3 text-white placeholder-zinc-600 text-sm
                         focus:outline-none focus:border-violet-500 transition 
                         resize-none disabled:opacity-50"
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={running || !goal.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 
                         disabled:bg-zinc-700 disabled:text-zinc-500
                         text-white font-semibold py-3 rounded-lg 
                         transition flex items-center justify-center gap-2"
            >
              {running ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Starting agent...
                </>
              ) : (
                "▶ Run Agent"
              )}
            </button>
          </form>
        </div>

        {/* What happens next — helps user understand */}
        <div className="mt-6 bg-zinc-900/50 border border-zinc-800/50 
                        rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-2">What happens when you click Run</p>
          <div className="space-y-1">
            {[
              "Your goal is sent to the backend",
              "A job is queued for the AI worker",
              "You are redirected to the live log page",
              "Watch the agent work step by step in real time",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-violet-400 text-xs">{i + 1}.</span>
                <span className="text-zinc-400 text-xs">{step}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}