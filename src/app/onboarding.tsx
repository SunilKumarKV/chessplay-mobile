import { useRouter } from "expo-router";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { saveOnboarded } from "@/services/storage/authStorage";
import { useAuthStore } from "@/store/authStore";

export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboarded = useAuthStore((state) => state.setOnboarded);

  async function continueToAuth() {
    await saveOnboarded(true);
    setOnboarded(true);
    router.replace("/(auth)/login");
  }

  return (
    <Screen>
      <AppText variant="title">ChessPlay</AppText>
      <AppText muted>Play real chess on mobile with native touch controls, live rooms, puzzles, history, and your ChessPlay account.</AppText>
      <Card>
        <AppText variant="subtitle">Built for mobile</AppText>
        <AppText muted>Fast board interactions, safe layouts, secure token storage, and production backend configuration.</AppText>
      </Card>
      <Button label="Get started" onPress={continueToAuth} />
    </Screen>
  );
}

