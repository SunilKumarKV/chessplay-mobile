import { useQuery } from "@tanstack/react-query";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateView";
import { apiClient } from "@/services/api/client";
import type { LeaderboardPlayer } from "@/types/api";

export default function LeaderboardScreen() {
  const query = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiClient<{ leaderboard: LeaderboardPlayer[] }>("/games/leaderboard?limit=25")
  });

  return (
    <Screen>
      <AppText variant="title">Leaderboard</AppText>
      {query.isLoading ? <LoadingState label="Loading leaderboard" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {query.data?.leaderboard.map((player) => (
        <Card key={`${player.rank}-${player.username}`}>
          <AppText variant="subtitle">#{player.rank} {player.username}</AppText>
          <AppText muted>Rating {player.rating || "-"} · {player.wins} wins · {player.gamesPlayed} games</AppText>
        </Card>
      ))}
    </Screen>
  );
}

