import axios from "axios";
import { getToken } from "../lib/session";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ?? "https://ats-workplace-backend.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const data = (request) => request.then((response) => response.data);

// Auth
export const loginUser = (email, password) =>
  data(api.post("/auth/login", { email, password }));

export const signupUser = (name, email, password) =>
  data(api.post("/auth/signup", { name, email, password }));

// Roles
export const getAllRoles = () => data(api.get("/roles"));
export const getRoleById = (id) => data(api.get(`/roles/${id}`));
export const createRole = (title, description) =>
  data(api.post("/roles", { title, description }));
export const updateRole = (id, title, description) =>
  data(api.put(`/roles/${id}`, { title, description }));
export const deleteRoleById = (id) => data(api.delete(`/roles/${id}`));

// Candidates
export const fetchAllCandidates = () => data(api.get("/roles/candidates/all"));
export const deleteCandidateById = (id) =>
  data(api.delete(`/roles/candidate/${id}`));

// Insights
export const fetchSystemMetrics = () => data(api.get("/roles/metrics/dashboard"));

/** Scores one resume against a role and returns the saved candidate rows. */
export async function analyzeResume({ description, file, roleId, apiKey, strictness }) {
  const form = new FormData();
  form.append("description", description);
  form.append("roleId", roleId);
  form.append("apiKey", apiKey);
  form.append("strictness", strictness);
  form.append("candidates", file);

  const rows = await data(api.post("/analyze", form));
  return Array.isArray(rows) ? rows : [];
}
