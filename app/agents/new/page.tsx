"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { agentsAPI, authAPI } from "@/lib/api";

const AVAILABLE_TOOLS = [
  { id: "search_web",     label: "Web Search",    desc: "Search the internet" },
  { id: "summarize_text", label: "Summarize",      desc: "Summarize documents" },
  { id: "gmail",          label: "Gmail",          desc: "Read and send emails" },
  { id: "slack",          label: "Slack",          desc: "Send Slack messages" },
  { id: "google_drive",   label: "Google Drive",   desc: "Read Drive files" },
];

export default function NewAgentPage() {
  const router = useRouter();
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  // Redirect if not logged in
  if (typeof window !== "undefined" && !authAPI.isLoggedIn()) {
    router.push("/login");
  }

  // Toggle a tool on/off
  function toggleTool(toolId: string) {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)   // remove if already selected
        : [...prev, toolId]                   // add if not selected
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Agent name is required"); return; }

    setLoading(true);
    setError("");
    try {
      await agentsAPI.create(name, description, selectedTools);
      router.push("/dashboard");  // ← go back to dashboard on success
    } catch {
      setError("Failed to create agent. Try again.");
    } finally {
      setLoading(false);
    }
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

      <div className="max-w-xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Create an Agent</h2>
        <p className="text-zinc-400 text-sm mb-8">
          Give your agent a name, describe what it does, and choose its tools.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Agent name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research Agent, Sales Assistant..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg 
                         px-4 py-3 text-white placeholder-zinc-500 
                         focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg 
                         px-4 py-3 text-white placeholder-zinc-500 
                         focus:outline-none focus:border-violet-500 transition resize-none"
            />
          </div>

          {/* Tool selector */}
          <div>
            <label className="block text-sm text-zinc-400 mb-3">
              Tools — what can this agent use?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_TOOLS.map((tool) => {
                const selected = selectedTools.includes(tool.id);
                return (
                  <button
                    type="button"
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-center justify-between px-4 py-3 
                                rounded-lg border text-left transition
                                ${selected
                                  ? "border-violet-500 bg-violet-600/10 text-white"
                                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                                }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{tool.label}</p>
                      <p className="text-xs text-zinc-500">{tool.desc}</p>
                    </div>
                    {/* Checkmark when selected */}
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-violet-500 
                                      flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 
                       disabled:bg-violet-800 text-white font-semibold 
                       py-3 rounded-lg transition"
          >
            {loading ? "Creating..." : "Create Agent"}
          </button>

        </form>
      </div>
    </main>
  );
}