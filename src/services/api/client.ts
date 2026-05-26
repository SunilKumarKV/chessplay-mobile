import { API_URL } from "@/constants/config";
import { clearAuthSession, saveAuthSession } from "@/services/storage/authStorage";
import { useAuthStore } from "@/store/authStore";
import type {
  AuthResponse,
  AnalysisNote,
  AnalysisReport,
  BillingPlan,
  BillingState,
  CommunityPost,
  Conversation,
  Friend,
  FriendRequest,
  Message,
  PaymentIntent,
  PaymentMethod,
  MistakeReviewItem,
  Opening,
  Profile,
  PublicRoom,
  Puzzle,
  PuzzleHint,
  PuzzleHistoryItem,
  PuzzleLearning,
  PuzzleLimits,
  PuzzleStats,
  ReferralDashboard,
  SettingsPayload,
  SupporterRequest,
  Tournament,
  User,
  UserSearchResult
} from "@/types/api";
import type { BackendSocketGameState } from "@/features/chess/backendChessAdapter";

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
  preserveSessionOnUnauthorized?: boolean;
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
  if (!API_URL) {
    throw new ApiError("API URL is not configured. Set EXPO_PUBLIC_API_URL before using backend features.", 0, {});
  }
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
    if (response.status === 401 && !options.preserveSessionOnUnauthorized) {
      await clearAuthSession();
      useAuthStore.getState().clearSession();
    }
    throw new ApiError((data as { message?: string }).message || "Request failed", response.status, data);
  }

  const tokenData = data as { accessToken?: string; refreshToken?: string; socketToken?: string };
  const responseAccessToken = tokenData.accessToken || tokenData.socketToken;
  const responseSocketToken = tokenData.socketToken || tokenData.accessToken;
  const maybeUser = (data as { user?: unknown }).user;
  if ((responseAccessToken || responseSocketToken || tokenData.refreshToken) && maybeUser) {
    await saveAuthSession({
      accessToken: responseAccessToken,
      refreshToken: tokenData.refreshToken,
      socketToken: responseSocketToken,
      user: maybeUser
    });
  }

  return data as T;
}

function authResponseSession(data: AuthResponse) {
  const accessToken = data.accessToken || data.socketToken || null;
  const socketToken = data.socketToken || data.accessToken || null;
  return {
    user: data.user,
    accessToken,
    refreshToken: data.refreshToken || null,
    socketToken
  };
}

export const api = {
  login: (email: string, password: string) =>
    apiClient<AuthResponse>("/auth/mobile/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email, password })
    }),
  register: (username: string, email: string, password: string) =>
    apiClient<AuthResponse>("/auth/mobile/register", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ username, email, password })
    }),
  session: () => apiClient<{ user: User | null }>("/auth/mobile/session", { preserveSessionOnUnauthorized: true }),
  refresh: (refreshToken: string) =>
    apiClient<AuthResponse>("/auth/mobile/refresh", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ refreshToken })
    }),
  socketToken: () => apiClient<{ socketToken: string }>("/auth/mobile/socket-token"),
  logout: () =>
    apiClient<{ message: string }>("/auth/mobile/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: useAuthStore.getState().refreshToken })
    }),
  forgotPassword: (email: string) =>
    apiClient<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email })
    })
};

export const gamesApi = {
  activeRoom: () => apiClient<{ activeRoom: import("@/types/chess").LiveRoom | null }>("/games/active-room", { preserveSessionOnUnauthorized: true }),
  record: (payload: {
    moves: { from: string; to: string; piece?: string; promotion?: string; timestamp?: string | number }[];
    aiOpponent?: boolean;
    aiDifficulty?: string | number;
    playerColor: "w" | "b";
    result: "white" | "black" | "draw";
    winnerColor?: "w" | "b" | null;
    duration?: number | null;
  }) =>
    apiClient<{ game: unknown }>("/games/record", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};

export const aiApi = {
  move: (payload: {
    board: BackendSocketGameState["board"];
    turn: "w" | "b";
    level: "easy" | "medium" | "hard" | "pro";
    moveHistory?: BackendSocketGameState["moveHistory"];
    fen?: string;
    hint?: boolean;
  }) =>
    apiClient<{
      move: { fromRow: number; fromCol: number; toRow: number; toCol: number; promotion?: string };
      evaluation: { type: "cp" | "mate"; value: number } | null;
      bestLine: string[];
      depth: number;
      source: "stockfish" | "fallback";
    }>("/ai/move", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};

export const puzzlesApi = {
  next: (input: { difficulty?: string; theme?: string; fresh?: boolean; daily?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (input.difficulty) params.set("difficulty", input.difficulty);
    if (input.theme) params.set("theme", input.theme);
    if (input.fresh) params.set("fresh", "1");
    const endpoint = input.daily ? "/puzzles/daily" : "/puzzles/next";
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient<{ puzzle: Puzzle | null; limits?: PuzzleLimits; message?: string; upgradeMessage?: string }>(`${endpoint}${suffix}`, {
      preserveSessionOnUnauthorized: true
    });
  },
  limits: () => apiClient<{ limits: PuzzleLimits }>("/puzzles/limits/me", { preserveSessionOnUnauthorized: true }),
  stats: () => apiClient<{ stats: PuzzleStats; limits: PuzzleLimits }>("/puzzles/stats/me", { preserveSessionOnUnauthorized: true }),
  history: () => apiClient<{ history: PuzzleHistoryItem[] }>("/puzzles/history/me", { preserveSessionOnUnauthorized: true }),
  hint: (puzzleId: string, moveIndex: number) =>
    apiClient<{ hint: PuzzleHint; hintsUsed: number; hintsLimit: number }>(`/puzzles/${puzzleId}/hint`, {
      method: "POST",
      body: JSON.stringify({ moveIndex }),
      preserveSessionOnUnauthorized: true
    }),
  submit: (puzzleId: string, move: string, moveIndex: number) =>
    apiClient<{
      correct: boolean;
      completed: boolean;
      message?: string;
      fen: string;
      moveIndex: number;
      move?: string;
      opponentMove?: string;
      progress?: { completedMoves: number; totalPlayerMoves: number };
      learning?: PuzzleLearning | null;
    }>(`/puzzles/${puzzleId}/submit`, {
      method: "POST",
      body: JSON.stringify({ move, moveIndex }),
      preserveSessionOnUnauthorized: true
    })
};

export const authApi = {
  responseSession: authResponseSession
};

export const profileApi = {
  me: () => apiClient<{ profile: Profile; recentGames?: unknown[] }>("/profile/me"),
  publicProfile: (username: string) =>
    apiClient<{ profile: Profile; recentGames?: unknown[]; gameHistoryHidden?: boolean }>(`/profile/${encodeURIComponent(username)}`, {
      skipAuth: true
    }),
  update: (input: { username: string; bio?: string; country?: string }) =>
    apiClient<{ profile: Profile; recentGames?: unknown[] }>("/profile/me", {
      method: "PATCH",
      body: JSON.stringify(input)
    }),
  uploadAvatar: (imageDataUrl: string) =>
    apiClient<{ message: string; avatar: string; storage?: string }>("/auth/avatar", {
      method: "POST",
      body: JSON.stringify({ imageDataUrl })
    }),
  deleteAvatar: () =>
    apiClient<{ message: string; user?: User }>("/auth/avatar", {
      method: "DELETE"
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

export const communityApi = {
  bootstrap: () => apiClient<{ publicRooms: PublicRoom[]; friends: Friend[] }>("/social/messaging/bootstrap"),
  posts: (input: { type?: string; status?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (input.type) params.set("type", input.type);
    if (input.status) params.set("status", input.status);
    if (input.limit) params.set("limit", String(input.limit));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient<{ posts: CommunityPost[] }>(`/social/community/posts${suffix}`, { preserveSessionOnUnauthorized: true });
  },
  createPost: (input: { type: CommunityPost["type"]; title: string; body: string }) =>
    apiClient<{ message?: string; post: CommunityPost }>("/social/community/posts", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  likePost: (postId: string) =>
    apiClient<{ post: CommunityPost }>(`/social/community/posts/${postId}/like`, {
      method: "POST"
    }),
  comment: (postId: string, text: string) =>
    apiClient<{ post: CommunityPost }>(`/social/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ text })
    }),
  openPublicRoom: (roomKey: string) =>
    apiClient<{ conversation: Conversation }>("/social/messaging/open", {
      method: "POST",
      body: JSON.stringify({ type: "public", roomKey })
    })
};

export const billingApi = {
  plans: () =>
    apiClient<{
      currency: string;
      upiId?: string;
      merchantName?: string;
      plans: Record<string, BillingPlan>;
      paymentMethods: { india: PaymentMethod[]; global: PaymentMethod[]; manualFallback?: { enabled: boolean; label: string } };
      support?: { contactEmail?: string; manualVerification?: boolean; message?: string };
      adNetworks?: { web?: string[]; mobileLater?: string[] };
    }>("/billing/plans", { skipAuth: true }),
  paymentMethods: (plan: string) =>
    apiClient<{ plan: string; methods: { india: PaymentMethod[]; global: PaymentMethod[]; manualFallback?: { enabled: boolean; label: string } } }>(
      `/billing/payment-methods?plan=${encodeURIComponent(plan)}`,
      { skipAuth: true }
    ),
  me: () =>
    apiClient<{ billing: BillingState; requests: SupporterRequest[]; intents: PaymentIntent[]; referralCode?: string | null }>("/billing/me"),
  monetization: () =>
    apiClient<{
      billing: BillingState;
      ads: { enabled: boolean; placements: string[]; networks: { web?: string[]; mobileLater?: string[] } };
      premiumUnlocks: string[];
    }>("/billing/monetization"),
  submitSupporterRequest: (input: {
    plan: string;
    paymentMethod: "upi" | "bank" | "paypal";
    amount: number;
    upiId?: string;
    utr?: string;
    bankReference?: string;
    payerEmail?: string;
    providerReference?: string;
    paymentProofUrl?: string;
    paymentDate?: string;
    note?: string;
  }) =>
    apiClient<{ message: string; request: SupporterRequest }>("/billing/upi-request", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  referrals: () => apiClient<ReferralDashboard>("/referrals/me"),
  claimReferral: (code: string) =>
    apiClient<{ message: string }>("/referrals/claim", {
      method: "POST",
      body: JSON.stringify({ code })
    }),
  entitlements: () =>
    apiClient<{ plan: string; entitlements: Record<string, boolean>; limits: Record<string, unknown>; planStatus?: string; planExpiresAt?: string | null; isPremium?: boolean }>(
      "/me/entitlements"
    )
};

export const tournamentsApi = {
  list: (status?: string) => {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiClient<{ tournaments: Tournament[] }>(`/tournaments${suffix}`, { preserveSessionOnUnauthorized: true });
  },
  detail: (id: string) => apiClient<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}`, { preserveSessionOnUnauthorized: true }),
  join: (id: string) =>
    apiClient<{ message: string; tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}/join`, {
      method: "POST"
    }),
  leave: (id: string) =>
    apiClient<{ message: string; tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}/leave`, {
      method: "POST"
    })
};

export const analysisApi = {
  note: (gameId: string) => apiClient<{ note: AnalysisNote | null }>(`/analysis/notes/${encodeURIComponent(gameId)}`),
  saveNote: (input: { gameId?: string; fen?: string; pgn?: string; note?: string }) =>
    apiClient<{ note: AnalysisNote; message: string }>("/analysis/notes", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  report: (gameId: string) =>
    apiClient<{ report: AnalysisReport | null; available: boolean; message: string }>(`/analysis/reports/${encodeURIComponent(gameId)}`),
  mistakes: (status: "open" | "reviewed" | "dismissed" = "open") =>
    apiClient<{ items: MistakeReviewItem[] }>(`/mistakes?status=${encodeURIComponent(status)}`),
  updateMistake: (id: string, status: "open" | "reviewed" | "dismissed") =>
    apiClient<{ item: MistakeReviewItem }>(`/mistakes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  coachSession: (input: { fen: string; goal: string }) =>
    apiClient<{
      mode: string;
      engineAvailable: boolean;
      message: string;
      coaching: { goal: string; fen: string; nextSteps: string[] };
    }>("/coach/session", {
      method: "POST",
      body: JSON.stringify(input)
    })
};

export const openingsApi = {
  search: (query: string, limit = 15) =>
    apiClient<{ openings: Opening[]; source: "database" | "static-eco-sample" }>(
      `/openings/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { skipAuth: true }
    )
};

export const supportApi = {
  feedback: (input: { category: "bug" | "feature" | "payment" | "general"; message: string; email?: string; page?: string }) =>
    apiClient<{ message: string; feedbackId: string }>("/feedback", {
      method: "POST",
      preserveSessionOnUnauthorized: true,
      body: JSON.stringify(input)
    }),
  ticket: (input: { type: "general" | "payment" | "refund" | "bug" | "account" | "premium" | "faq"; subject: string; message: string; relatedPaymentReference?: string }) =>
    apiClient<{ message: string; ticket: unknown }>("/automation/support-ticket", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  waitlist: (input: { email: string; source?: string; interest?: string }) =>
    apiClient<{ message: string; duplicate?: boolean }>("/waitlist", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(input)
    }),
  shareAchievement: (input: { type: string; title: string; description: string }) =>
    apiClient<{ metadata: { type: string; title: string; description: string; url: string; imageRequired: boolean } }>("/share/achievement", {
      method: "POST",
      body: JSON.stringify(input)
    })
};
