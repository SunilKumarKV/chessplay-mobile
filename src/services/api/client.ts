import { API_URL } from "@/constants/config";
import { clearAuthSession, saveAuthSession } from "@/services/storage/authStorage";
import { useAuthStore } from "@/store/authStore";
import type {
  AuthResponse,
  Conversation,
  Friend,
  FriendRequest,
  Message,
  Profile,
  SettingsPayload,
  User,
  UserSearchResult
} from "@/types/api";

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

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
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

  let response: Response;
  try {
    response = await fetch(urlFor(endpoint), {
      ...options,
      headers
    });
  } catch (error) {
    throw new ApiError("Network unavailable. Check your connection and try again.", 0, { cause: String(error) });
  }
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
    apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email, password })
    }),
  register: (username: string, email: string, password: string) =>
    apiClient<AuthResponse>("/auth/register", {
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

export const profileApi = {
  me: () => apiClient<{ profile: Profile; recentGames?: unknown[] }>("/profile/me"),
  update: (input: { username: string; bio?: string; country?: string }) =>
    apiClient<{ profile: Profile; recentGames?: unknown[] }>("/profile/me", {
      method: "PATCH",
      body: JSON.stringify(input)
    })
};

export const settingsApi = {
  me: () => apiClient<SettingsPayload>("/settings/me"),
  update: (settings: SettingsPayload["settings"]) =>
    apiClient<SettingsPayload>("/settings/me", {
      method: "PATCH",
      body: JSON.stringify({ settings })
    })
};

export const socialApi = {
  friends: () => apiClient<{ friends: Friend[]; requests: FriendRequest[] }>("/auth/friends"),
  searchUsers: (query: string) =>
    apiClient<{ users: UserSearchResult[] }>(`/auth/users/search?q=${encodeURIComponent(query)}`),
  sendFriendRequest: (userId: string) =>
    apiClient<{ message: string }>("/auth/friends/request", {
      method: "POST",
      body: JSON.stringify({ userId })
    }),
  respondToFriendRequest: (requestId: string, action: "accept" | "decline") =>
    apiClient<{ message: string }>("/auth/friends/respond", {
      method: "POST",
      body: JSON.stringify({ requestId, action })
    })
};

export const messagesApi = {
  conversations: () => apiClient<{ conversations: Conversation[] }>("/messages/conversations"),
  searchUsers: (query: string) =>
    apiClient<{ users: UserSearchResult[] }>(`/messages/users/search?q=${encodeURIComponent(query)}`),
  openConversation: (participantId: string) =>
    apiClient<{ conversation: Conversation }>("/messages/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId })
    }),
  conversation: (conversationId: string) =>
    apiClient<{ conversation: Conversation }>(`/messages/conversations/${conversationId}`),
  messages: (conversationId: string) =>
    apiClient<{ conversation: Conversation; messages: Message[] }>(`/messages/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, text: string) =>
    apiClient<{ message: Message; conversation: Conversation }>(`/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text })
    }),
  markRead: (conversationId: string) =>
    apiClient<{ conversation: Conversation; message: string }>(`/messages/conversations/${conversationId}/read`, {
      method: "PATCH"
    })
};
