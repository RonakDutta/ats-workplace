import axios from "axios";

const API_BASE_URL = "https://ats-workplace-backend.onrender.com/api";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("ats_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Signup and Login
export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
};

export const signupUser = async (name, email, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
    name,
    email,
    password,
  });
  return response.data;
};

// 1. Save a new draft to PostgreSQL
export const saveRoleDraft = async (title, description) => {
  const response = await axios.post(`${API_BASE_URL}/roles`, {
    title,
    description,
  });
  return response.data;
};

// Add this right under your saveRoleDraft function
export const updateRoleDraft = async (id, title, description) => {
  const response = await axios.put(`${API_BASE_URL}/roles/${id}`, {
    title,
    description,
  });
  return response.data;
};

// 2. Fetch a specific role and its candidates on page load
export const getRoleById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/roles/${id}`);
  return response.data;
};

// 3. Updated! Now we send the roleId so the backend knows where to save the candidates
export const analyzeCandidates = async (
  description,
  candidates,
  roleId,
  apiKey,
  strictness,
) => {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("roleId", roleId);
  formData.append("apiKey", apiKey);
  formData.append("strictness", strictness);

  candidates.forEach((file) => {
    formData.append("candidates", file);
  });

  const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// Fetch the master list of all candidates
export const fetchAllCandidates = async () => {
  const response = await axios.get(`${API_BASE_URL}/roles/candidates/all`);
  return response.data;
};

// Delete a specific role
export const deleteRoleById = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/roles/${id}`);
  return response.data;
};

// Delete a specific candidate
export const deleteCandidateById = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/roles/candidate/${id}`);
  return response.data;
};

// Fetch system analytics
export const fetchSystemMetrics = async () => {
  const response = await axios.get(`${API_BASE_URL}/roles/metrics/dashboard`);
  return response.data;
};
