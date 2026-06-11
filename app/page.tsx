"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Logged in → dashboard. Not logged in → login.
    if (authAPI.isLoggedIn()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500 animate-pulse">Loading eslo.ai...</p>
    </main>
  );
}