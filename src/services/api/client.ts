import { API_URL } from "@/constants/config";
import { clearAuthSession, saveAuthSession } from "@/services/storage/authStorage";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/api";

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function urlFor(endpoint: string) {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_URL}${normalized}`;
}

export async function apiClient<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const hasBody = Boolean(options.body);
  const headers = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(!options.skipAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers
  };

  const response = await fetch(urlFor(endpoint), {
    ...options,
    headers
  });
  const data = await parseJson(response);

  if (!response.ok) {
    if (response.status === 401) {
      await clearAuthSession();
      useAuthStore.getState().clearSession();
    }
    throw new ApiError((data as { message?: string }).message || "Request failed", response.status, data);
  }

  const maybeSocketToken = (data as { socketToken?: string }).socketToken;
  const maybeUser = (data as { user?: unknown }).user;
  if (maybeSocketToken && maybeUser) {
    await saveAuthSession({ accessToken: maybeSocketToken, socketToken: maybeSocketToken, user: maybeUser });
  }

  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    apiClient<{ message: string; user: User; socketToken?: string }>("/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email, password })
    }),
  register: (username: string, email: string, password: string) =>
    apiClient<{ message: string; user: User; socketToken?: string }>("/auth/register", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ username, email, password })
    }),
  session: () => apiClient<{ user: User | null }>("/auth/session"),
  socketToken: () => apiClient<{ socketToken: string }>("/auth/socket-token"),
  logout: () => apiClient<{ message: string }>("/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) =>
    apiClient<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email })
    })
};
