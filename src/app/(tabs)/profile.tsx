import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateView";
import { apiClient, profileApi } from "@/services/api/client";
import type { GameHistoryItem } from "@/types/api";

export default function ProfileScreen() {
  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.me()
  });
  const history = useQuery({
    queryKey: ["games", "history"],
    queryFn: () => apiClient<{ games: GameHistoryItem[] }>("/games/history?limit=5")
  });

  return (
    <Screen>
      <AppText variant="title">Profile</AppText>
      {profile.isLoading ? <LoadingState label="Loading profile" /> : null}
      {profile.isError ? <ErrorState message={profile.error.message} retry={() => profile.refetch()} /> : null}
      {profile.data ? (
        <Card>
          <AppText variant="subtitle">{profile.data.profile.displayName || profile.data.profile.username}</AppText>
          <AppText muted>Rating {profile.data.profile.rating || 1200}</AppText>
          <AppText muted>{profile.data.profile.bio || "No bio yet."}</AppText>
          <Link href="/profile/edit" asChild>
            <Pressable>
              <AppText>Edit profile</AppText>
            </Pressable>
          </Link>
        </Card>
      ) : null}
      <Card>
        <AppText variant="subtitle">Recent games</AppText>
        {history.isLoading ? <LoadingState label="Loading games" /> : null}
        {history.data?.games?.length ? (
          history.data.games.map((game) => (
            <AppText key={game.id || game._id} muted>
              {game.result || "finished"} - {game.moves?.length || 0} moves
            </AppText>
          ))
        ) : history.data ? (
          <AppText muted>No game history yet.</AppText>
        ) : null}
      </Card>
    </Screen>
  );
}
