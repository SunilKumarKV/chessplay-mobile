import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { tournamentsApi } from "@/services/api/client";

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentId = String(id || "");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["tournaments", tournamentId],
    queryFn: () => tournamentsApi.detail(tournamentId),
    enabled: Boolean(tournamentId)
  });
  const join = useMutation({
    mutationFn: () => tournamentsApi.join(tournamentId),
    onSuccess: (data) => {
      Alert.alert("Tournament", data.message);
      queryClient.setQueryData(["tournaments", tournamentId], { tournament: data.tournament });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
    onError: (error) => Alert.alert("Could not join", error.message)
  });
  const leave = useMutation({
    mutationFn: () => tournamentsApi.leave(tournamentId),
    onSuccess: (data) => {
      Alert.alert("Tournament", data.message);
      queryClient.setQueryData(["tournaments", tournamentId], { tournament: data.tournament });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
    onError: (error) => Alert.alert("Could not leave", error.message)
  });
  const tournament = query.data?.tournament;

  return (
    <Screen>
      <AppText variant="title">Tournament lobby</AppText>
      {query.isLoading ? <LoadingState label="Loading tournament" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {tournament ? (
        <>
          <Card>
            <AppText variant="subtitle">{tournament.title}</AppText>
            <AppText muted>{tournament.description || "No description provided."}</AppText>
            <View style={styles.stats}>
              <Stat label="Format" value={tournament.format || "rapid"} />
              <Stat label="Status" value={tournament.status} />
              <Stat label="Players" value={`${tournament.playerCount}/${tournament.maxPlayers}`} />
              <Stat label="Start" value={tournament.startsAt ? new Date(tournament.startsAt).toLocaleDateString() : "TBD"} />
            </View>
            {tournament.isJoined ? (
              <Button label="Leave tournament" variant="danger" loading={leave.isPending} onPress={() => leave.mutate()} />
            ) : (
              <Button label="Join tournament" loading={join.isPending} disabled={tournament.status !== "open"} onPress={() => join.mutate()} />
            )}
          </Card>

          <Card>
            <AppText variant="subtitle">Rules</AppText>
            <AppText muted>{tournament.rules || "Tournament rules and pairings are managed by the backend event organizer."}</AppText>
          </Card>

          <Card>
            <AppText variant="subtitle">Participants</AppText>
            {tournament.players?.length ? (
              tournament.players.map((player, index) => (
                <View key={`${player.username}-${index}`} style={styles.playerRow}>
                  <View style={styles.playerCopy}>
                    <AppText>{index + 1}. {player.username}</AppText>
                    <AppText variant="caption" muted>Rating {player.rating || 1200} - {player.status || "joined"}</AppText>
                  </View>
                  {player.supporterBadge ? <AppText variant="caption">Supporter</AppText> : null}
                </View>
              ))
            ) : (
              <EmptyState title="No participants yet" />
            )}
          </Card>

          <Card>
            <AppText variant="subtitle">Standings</AppText>
            <EmptyState title="Standings not available yet" body="The backend currently exposes registration and participants, but not pairings, scores, standings, or schedules." />
          </Card>

          <Card>
            <AppText variant="subtitle">Roadmap</AppText>
            {(tournament.roadmap || []).map((item) => <AppText key={item} muted>- {item}</AppText>)}
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
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "45%" },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  playerCopy: { flex: 1, gap: 3 }
});
