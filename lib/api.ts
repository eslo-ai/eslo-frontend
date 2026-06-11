import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Axios instance — auto-attaches token to every request ──────────────────
export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eslo_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email: string, password: string) => {
    const form = new FormData();
    form.append("username", email);
    form.append("password", password);
    const res = await api.post("/users/login", form);
    localStorage.setItem("eslo_token", res.data.access_token);
    return res.data;
  },
  register: async (email: string, password: string, fullName: string) => {
    const res = await api.post("/users/register", {
      email, password, full_name: fullName,
    });
    return res.data;
  },
  logout: () => {
    localStorage.removeItem("eslo_token");
    window.location.href = "/login";
  },
  isLoggedIn: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("eslo_token");
  },
};

// ── Agents ─────────────────────────────────────────────────────────────────
export const agentsAPI = {
  list: async () => {
    const res = await api.get("/agents");
    return res.data;
  },
  create: async (name: string, description: string, tools: string[]) => {
    const res = await api.post("/agents", {
      name,
      description,
      allowed_tools: tools,
    });
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/agents/${id}`);
    return res.data;
  },
};

// ── Runs ───────────────────────────────────────────────────────────────────
export const runsAPI = {
  create: async (agentId: string, goal: string) => {
    const res = await api.post("/runs", { agent_id: agentId, goal });
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/runs/${id}`);
    return res.data;
  },
  getLogs: async (id: string) => {
    const res = await api.get(`/runs/${id}/logs`);
    return res.data;
  },
};