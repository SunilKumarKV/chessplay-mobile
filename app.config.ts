import type { ExpoConfig } from "expo/config";

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
    buildNumber: "1",
    infoPlist: {
      NSFaceIDUsageDescription: "Allow ChessPlay to unlock the app with Face ID."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0F172A"
    },
    package: "com.devwithsunil.chessplay",
    versionCode: 1,
    edgeToEdgeEnabled: true,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: false,
        data: [{ scheme: "chessplay" }],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-splash-screen",
    [
      "expo-notifications",
      {
        color: "#2563EB"
      }
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Allow ChessPlay to unlock the app with Face ID."
      }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow ChessPlay to choose a profile avatar from your photo library.",
        cameraPermission: false,
        microphonePermission: false
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID || "e5d94c9e-f47d-4206-bd25-5e48192a5ea2"
    }
  }
};

export default config;
