import * as LocalAuthentication from "expo-local-authentication";
import { readBiometricUnlockEnabled } from "@/services/storage/nativePreferences";

export async function canUseBiometricUnlock() {
  const [hasHardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync()
  ]);
  return hasHardware && enrolled;
}

export async function authenticateIfBiometricEnabled() {
  const enabled = await readBiometricUnlockEnabled();
  if (!enabled) return true;
  if (!(await canUseBiometricUnlock())) return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock ChessPlay",
    cancelLabel: "Cancel",
    disableDeviceFallback: false
  });
  return result.success;
}
