const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
  /** Skip the X-Admin-Client-ID header even if Admin Mode is active — for
   * calls about the caller's own identity (e.g. /auth/profile) that must
   * not be able to fail because of an unrelated Admin Mode/tenant issue. */
  skipAdminHeader?: boolean;
}

/**
 * Builds the Authorization + Admin Mode headers from localStorage.
 * Exported so callers that need raw fetch() (e.g. blob/CSV downloads)
 * can attach the same headers without duplicating this logic.
 */
export function getAuthHeaders(options: { skipAdminHeader?: boolean } = {}): Record<string, string> {
  const headers: Record<string, string> = {};

  const token = localStorage.getItem("access_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const managedClient = localStorage.getItem("admin_managed_client");
  if (managedClient && !options.skipAdminHeader) {
    const { id } = JSON.parse(managedClient);
    headers["X-Admin-Client-ID"] = id;
  }

  return headers;
}

export const apiFetch = async (endpoint: string, options: RequestOptions = {}) => {
  const headers = new Headers(options.headers || {});
  Object.entries(getAuthHeaders({ skipAdminHeader: options.skipAdminHeader })).forEach(([key, value]) => {
    headers.set(key, value);
  });

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

  // Parse body first so we can surface the real server message on any error status
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    // Always clear stale session token
    localStorage.removeItem("access_token");
    // Redirect to login only when this wasn't the login call itself (avoids redirect loop)
    if (!endpoint.includes("/auth/login") && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    // Throw the actual server error message so the UI shows something useful
    const authError = new Error(data.error || data.message || "Invalid credentials");
    (authError as any).status = 401;
    throw authError;
  }

  if (!response.ok) {
    const err = new Error(data.error || data.message || "An error occurred");
    (err as any).status = response.status;
    throw err;
  }

  return data;
};

export const api = {
  get: (endpoint: string, params?: Record<string, string | number>, options?: Pick<RequestOptions, "skipAdminHeader">) =>
    apiFetch(endpoint, { method: "GET", params, ...options }),
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
