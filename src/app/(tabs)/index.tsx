import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/store/authStore";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  return (
    <Screen>
      <AppText variant="title">Hi, {user?.username || "Player"}</AppText>
      <AppText muted>Pick up a quick game, review your progress, or jump into the live queue.</AppText>
      <View style={{ gap: 12 }}>
        <Link href="/(tabs)/play" asChild>
          <Pressable>
            <Card>
              <AppText variant="subtitle">Play chess</AppText>
              <AppText muted>AI, online matchmaking, room codes, and touch board controls.</AppText>
            </Card>
          </Pressable>
        </Link>
        <Link href="/leaderboard" asChild>
          <Pressable>
            <Card>
              <AppText variant="subtitle">Leaderboard</AppText>
              <AppText muted>See top players from the production backend.</AppText>
            </Card>
          </Pressable>
        </Link>
        <Link href="/history" asChild>
          <Pressable>
            <Card>
              <AppText variant="subtitle">Game history</AppText>
              <AppText muted>Review completed games from your ChessPlay account.</AppText>
            </Card>
          </Pressable>
        </Link>
        <Link href="/puzzles" asChild>
          <Pressable>
            <Card>
              <AppText variant="subtitle">Training</AppText>
              <AppText muted>Practice backend-backed puzzles and tactics.</AppText>
            </Card>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
