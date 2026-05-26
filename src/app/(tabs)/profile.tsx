import { useQuery } from "@tanstack/react-query";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateView";
import { apiClient, profileApi, puzzlesApi } from "@/services/api/client";
import type { GameHistoryItem } from "@/types/api";
import { useThemeColors } from "@/hooks/useThemeColors";

function pct(wins = 0, games = 0) {
  if (!games) return "0%";
  return `${Math.round((wins / games) * 100)}%`;
}

export default function ProfileScreen() {
  const colors = useThemeColors();
  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.me()
  });
  const history = useQuery({
    queryKey: ["games", "history"],
    queryFn: () => apiClient<{ games: GameHistoryItem[] }>("/games/history?limit=5")
  });
  const puzzleStats = useQuery({
    queryKey: ["puzzles", "stats", "profile"],
    queryFn: () => puzzlesApi.stats(),
    retry: 1
  });
  const data = profile.data?.profile;
  const games = Number(data?.gamesPlayed || 0);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <AppText variant="title">Profile</AppText>
        <Link href="/profile/edit" asChild>
          <Pressable>
            <Button label="Edit" />
          </Pressable>
        </Link>
      </View>
      {profile.isLoading ? <LoadingState label="Loading profile" /> : null}
      {profile.isError ? <ErrorState message={profile.error.message} retry={() => profile.refetch()} /> : null}
      {data ? (
        <>
          <Card>
            <View style={styles.identityRow}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
                {data.avatar ? (
                  <Image source={{ uri: data.avatar }} style={styles.avatarImage} />
                ) : (
                  <AppText variant="title">{data.username.slice(0, 1).toUpperCase()}</AppText>
                )}
              </View>
              <View style={styles.identityText}>
                <AppText variant="subtitle">{data.displayName || data.username}</AppText>
                <AppText muted>
                  {data.title || data.selectedBadge || "ChessPlay player"} · {data.country || "No country"}
                </AppText>
                <AppText variant="caption" muted>{data.isPremium || data.isSupporter ? "Supporter badge active" : "Free account"}</AppText>
                <AppText muted>Joined {data.joinedAt ? new Date(data.joinedAt).toLocaleDateString() : "recently"}</AppText>
              </View>
            </View>
            <AppText muted>{data.bio || "No bio yet."}</AppText>
            <Link href={"/billing" as never} asChild>
              <Pressable>
                <Button label="Billing status" variant="secondary" />
              </Pressable>
            </Link>
          </Card>

          <Card>
            <AppText variant="subtitle">Chess stats</AppText>
            <View style={styles.statsGrid}>
              <Stat label="Rating" value={String(data.rating || 1200)} />
              <Stat label="Games" value={String(games)} />
              <Stat label="Wins" value={String(data.gamesWon || data.wins || 0)} />
              <Stat label="Losses" value={String(data.gamesLost || data.losses || 0)} />
              <Stat label="Draws" value={String(data.gamesDrawn || data.draws || 0)} />
              <Stat label="Win rate" value={pct(data.gamesWon || data.wins || 0, games)} />
            </View>
          </Card>

          <Card>
            <AppText variant="subtitle">Puzzle stats</AppText>
            {puzzleStats.isLoading ? <LoadingState label="Loading puzzle stats" /> : null}
            {puzzleStats.data ? (
              <View style={styles.statsGrid}>
                <Stat label="Rating" value={String(puzzleStats.data.stats.rating || 0)} />
                <Stat label="Best" value={String(puzzleStats.data.stats.highestRating || 0)} />
                <Stat label="Solved" value={String(puzzleStats.data.stats.solved || 0)} />
                <Stat label="Accuracy" value={`${Math.round(puzzleStats.data.stats.accuracy || 0)}%`} />
              </View>
            ) : puzzleStats.isError ? (
              <AppText muted>Puzzle stats are unavailable right now.</AppText>
            ) : null}
          </Card>
        </>
      ) : null}

      <Card>
        <AppText variant="subtitle">Recent games</AppText>
        {history.isLoading ? <LoadingState label="Loading games" /> : null}
        {history.data?.games?.length ? (
          history.data.games.map((game) => (
            <AppText key={game.id || game._id} muted>
              {game.result || "finished"} · {game.moves?.length || 0} moves
            </AppText>
          ))
        ) : history.data ? (
          <AppText muted>No game history yet.</AppText>
        ) : null}
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="subtitle">{value}</AppText>
      <AppText variant="caption" muted>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  identityText: { flex: 1, gap: 4 },
  avatar: { width: 74, height: 74, borderRadius: 37, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: 74, height: 74 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "30%", minWidth: 92 }
});
