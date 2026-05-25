import { useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";

export default function ResultScreen() {
  const router = useRouter();
  return (
    <Screen>
      <AppText variant="title">Game result</AppText>
      <Card>
        <AppText muted>Live result state is shown on the board screen. A dedicated shareable result summary is planned after backend game detail parity is complete.</AppText>
      </Card>
      <Button label="Back to play" onPress={() => router.replace("/(tabs)/play")} />
    </Screen>
  );
}

