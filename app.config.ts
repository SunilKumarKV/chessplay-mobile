import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "ChessPlay",
  slug: "chessplay-mobile",
  scheme: "chessplay",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0F172A"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sunilkumarkv.chessplay"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0F172A"
    },
    package: "com.sunilkumarkv.chessplay",
    edgeToEdgeEnabled: true
  },
  plugins: ["expo-router", "expo-secure-store", "expo-splash-screen"],
  experiments: {
    typedRoutes: true
  },
  extra: {
    eas: {
      projectId: "replace-with-eas-project-id"
    }
  }
};

export default config;
