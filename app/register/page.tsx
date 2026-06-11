"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // 1. Create the account
      await authAPI.register(email, password, fullName);
      // 2. Auto-login so they don't have to type it again
      await authAPI.login(email, password);
      // 3. Straight to the dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-8 border border-zinc-800">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">eslo.ai</h1>
          <p className="text-zinc-400 mt-2">Create your workspace</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Abner J"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3
                         text-white placeholder-zinc-500 focus:outline-none
                         focus:border-violet-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3
                         text-white placeholder-zinc-500 focus:outline-none
                         focus:border-violet-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3
                         text-white placeholder-zinc-500 focus:outline-none
                         focus:border-violet-500 transition"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800
                       text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-violet-400 hover:underline">Sign in</a>
        </p>
      </div>
    </main>
  );
}