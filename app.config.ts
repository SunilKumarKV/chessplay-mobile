import type { ExpoConfig } from "expo/config";

const easProjectId = process.env.EAS_PROJECT_ID;

const config: ExpoConfig = {
  name: "ChessPlay",
  slug: "chessplay-mobile",
  scheme: "chessplay",
  version: "1.0.0",
  runtimeVersion: {
    policy: "appVersion"
  },
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  updates: {
    enabled: true,
    checkAutomatically: "ON_LOAD",
    fallbackToCacheTimeout: 0
  },
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0F172A"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.devwithsunil.chessplay",
    buildNumber: "1"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0F172A"
    },
    package: "com.devwithsunil.chessplay",
    versionCode: 1,
    edgeToEdgeEnabled: true
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: ["expo-router", "expo-secure-store", "expo-splash-screen"],
  experiments: {
    typedRoutes: true
  },
  extra: easProjectId ? { eas: { projectId: easProjectId } } : {}
};

export default config;
