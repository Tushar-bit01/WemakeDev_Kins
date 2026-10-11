import axios from "axios";

// ── Token helpers (localStorage) ─────────────────────────────
const TOKEN_KEY = "kins_token";

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const isAuthenticated = () => !!getToken();

// ── Axios instance ────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach JWT ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle errors ──────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No response at all — true network failure, CORS, or server down
    if (!error.response) {
      return Promise.reject(error); // preserve original error so callers can inspect .code etc.
    }

    const { status, data } = error.response;

    if (status === 401) {
      const isLoginRequest = error.config?.url?.includes("/login");
    
      if (isLoginRequest) {
        // Let login pages handle their own 401s
        return Promise.reject(error);
      }
    
      const onLoginPage = window.location.pathname.includes("/login") ||
                          window.location.pathname.includes("/signup");
    
      removeToken();
    
      if (!onLoginPage) {
        let redirectTo = "/login";
        try {
          const token = getToken();
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role === 'vendor') redirectTo = "/vendor/login";
          }
        } catch {}
        window.location.href = redirectTo;
      }
    
      return Promise.reject(new Error("Session expired. Please log in again."));
    }

    if (status === 403) {
      return Promise.reject(new Error("Access denied."));
    }

    if (status === 429) {
      return Promise.reject(new Error("Too many requests. Please try again later."));
    }

    if (status >= 500) {
      return Promise.reject(new Error("Server error. Please try again later."));
    }

    // For 400s and anything else — pass backend message through if available
    // Backend uses both "message" and "error" keys in different controllers
    const backendMessage = data?.message || data?.error;
    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }

    // No message from backend — reject with original so response is still accessible
    return Promise.reject(error);
  }
);

export default api;