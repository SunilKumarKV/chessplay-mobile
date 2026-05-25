function readPublicEnv(name: "EXPO_PUBLIC_API_URL" | "EXPO_PUBLIC_SOCKET_URL") {
  const value = process.env[name]?.trim();
  if (value) return value.replace(/\/$/, "");

  const message = `${name} is not configured. Set it in .env or your EAS environment before using backend features.`;
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(message);
  } else {
    console.error(message);
  }
  return "";
}

export const API_URL = readPublicEnv("EXPO_PUBLIC_API_URL");

export const SOCKET_URL = readPublicEnv("EXPO_PUBLIC_SOCKET_URL");

export const APP_NAME = "ChessPlay";
