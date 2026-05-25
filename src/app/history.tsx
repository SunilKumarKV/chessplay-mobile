import { useQuery } from "@tanstack/react-query";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { apiClient } from "@/services/api/client";
import type { GameHistoryItem } from "@/types/api";

export default function GameHistoryScreen() {
  const query = useQuery({
    queryKey: ["games", "history", "full"],
    queryFn: () => apiClient<{ games: GameHistoryItem[] }>("/games/history?limit=20")
  });

  return (
    <Screen>
      <AppText variant="title">Game history</AppText>
      {query.isLoading ? <LoadingState label="Loading games" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {query.data && query.data.games.length === 0 ? <EmptyState title="No games yet" body="Completed online and recorded AI games will appear here." /> : null}
      {query.data?.games.map((game) => (
        <Card key={game.id || game._id}>
          <AppText variant="subtitle">{game.result || "Result pending"}</AppText>
          <AppText muted>{game.moves?.length || 0} moves</AppText>
        </Card>
      ))}
    </Screen>
  );
}

