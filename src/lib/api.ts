const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

export const apiFetch = async (endpoint: string, options: RequestOptions = {}) => {
  const token = localStorage.getItem("access_token");
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const impersonated = localStorage.getItem("impersonate_client");
  if (impersonated) {
    const { id } = JSON.parse(impersonated);
    headers.set("X-Impersonate-Client-ID", id);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let url = `${API_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Unauthorized - clear token and redirect to login if necessary
    localStorage.removeItem("access_token");
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "An error occurred");
  }

  return data;
};

export const api = {
  get: (endpoint: string, params?: Record<string, string | number>) => 
    apiFetch(endpoint, { method: "GET", params }),
  post: (endpoint: string, body: any = {}) => 
    apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) }),
  postFormData: (endpoint: string, body: FormData) =>
    apiFetch(endpoint, { method: "POST", body }),
  put: (endpoint: string, body: any = {}) => 
    apiFetch(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint: string, params?: Record<string, string | number>) => 
    apiFetch(endpoint, { method: "DELETE", params }),
  patch: (endpoint: string, body: any = {}) => 
    apiFetch(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
};
