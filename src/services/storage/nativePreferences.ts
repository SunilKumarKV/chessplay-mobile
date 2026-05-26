import * as SecureStore from "expo-secure-store";

const BIOMETRIC_UNLOCK_KEY = "chessplay.biometricUnlock";

export async function readBiometricUnlockEnabled() {
  return (await SecureStore.getItemAsync(BIOMETRIC_UNLOCK_KEY)) === "true";
}

export async function saveBiometricUnlockEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(BIOMETRIC_UNLOCK_KEY, String(enabled));
}

export async function clearNativePreferences() {
  await SecureStore.deleteItemAsync(BIOMETRIC_UNLOCK_KEY);
}
