import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { messagesApi, profileApi } from "@/services/api/client";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const query = useQuery({
    queryKey: ["profile", "public", username],
    queryFn: () => profileApi.publicProfile(String(username || "")),
    enabled: Boolean(username)
  });
  const profile = query.data?.profile;

  async function startConversation() {
    if (!profile?.id) return;
    const response = await messagesApi.openConversation(profile.id);
    router.push({ pathname: "/social/conversation/[id]", params: { id: response.conversation.id } });
  }

  return (
    <Screen>
      <AppText variant="title">Player profile</AppText>
      {query.isLoading ? <LoadingState label="Loading player" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {profile ? (
        <>
          <Card>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
                {profile.avatar ? <Image source={{ uri: profile.avatar }} style={styles.avatarImage} /> : <AppText variant="title">{profile.username.slice(0, 1).toUpperCase()}</AppText>}
              </View>
              <View style={styles.copy}>
                <AppText variant="subtitle">{profile.displayName || profile.username}</AppText>
                <AppText muted>{profile.title || profile.selectedBadge || "ChessPlay player"}</AppText>
                <AppText muted>Rating {profile.rating || 1200}</AppText>
              </View>
            </View>
            <AppText muted>{profile.bio || "No public bio."}</AppText>
            <Button label="Message" onPress={startConversation} />
          </Card>

          <Card>
            <AppText variant="subtitle">Stats</AppText>
            <View style={styles.statsGrid}>
              <Stat label="Games" value={String(profile.gamesPlayed || 0)} />
              <Stat label="Wins" value={String(profile.gamesWon || profile.wins || 0)} />
              <Stat label="Losses" value={String(profile.gamesLost || profile.losses || 0)} />
              <Stat label="Draws" value={String(profile.gamesDrawn || profile.draws || 0)} />
            </View>
          </Card>

          <Card>
            <AppText variant="subtitle">Recent games</AppText>
            {query.data?.gameHistoryHidden ? <EmptyState title="Game history private" /> : null}
            {query.data?.recentGames?.length ? (
              query.data.recentGames.map((game, index) => (
                <AppText key={String((game as { id?: string }).id || index)} muted>
                  {(game as { result?: string }).result || "Finished"}
                </AppText>
              ))
            ) : !query.data?.gameHistoryHidden ? (
              <AppText muted>No public games yet.</AppText>
            ) : null}
          </Card>
        </>
      ) : null}
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
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  copy: { flex: 1, gap: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: 72, height: 72 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "45%" }
});
