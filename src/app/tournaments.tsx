import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { tournamentsApi } from "@/services/api/client";

export default function TournamentsScreen() {
  const query = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => tournamentsApi.list()
  });

  return (
    <Screen>
      <AppText variant="title">Tournaments</AppText>
      <AppText muted>Registration and lobby support are live. Pairings, standings, and live tournament rooms are backend roadmap items.</AppText>
      {query.isLoading ? <LoadingState label="Loading tournaments" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {query.data?.tournaments.length === 0 ? <EmptyState title="No tournaments" body="Published tournaments will appear here when the backend has active events." /> : null}
      {query.data?.tournaments.map((tournament) => {
        const id = String(tournament.id || tournament._id || "");
        return (
          <Card key={id}>
            <View style={styles.header}>
              <View style={styles.copy}>
                <AppText variant="subtitle">{tournament.title}</AppText>
                <AppText muted>{tournament.format || "rapid"} - {tournament.status}</AppText>
              </View>
              <AppText>{tournament.playerCount}/{tournament.maxPlayers}</AppText>
            </View>
            <AppText muted>{tournament.description || "ChessPlay tournament lobby."}</AppText>
            <AppText variant="caption" muted>{tournament.startsAt ? `Starts ${new Date(tournament.startsAt).toLocaleString()}` : "Schedule pending"}</AppText>
            <Link href={{ pathname: "/tournaments/[id]" as never, params: { id } }} asChild>
              <Pressable>
                <Button label={tournament.isJoined ? "Open lobby" : "View details"} variant={tournament.isJoined ? "primary" : "secondary"} />
              </Pressable>
            </Link>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  copy: { flex: 1, gap: 3 }
});
