import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { analysisApi } from "@/services/api/client";

const START_FEN = "rn1qkbnr/ppp2ppp/3b4/3pp3/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 2 5";

export default function AnalysisScreen() {
  const queryClient = useQueryClient();
  const [gameId, setGameId] = useState("manual");
  const [fen, setFen] = useState(START_FEN);
  const [pgn, setPgn] = useState("");
  const [note, setNote] = useState("");
  const [mistakeStatus, setMistakeStatus] = useState<"open" | "reviewed" | "dismissed">("open");
  const report = useQuery({
    queryKey: ["analysis", "report", gameId],
    queryFn: () => analysisApi.report(gameId),
    enabled: Boolean(gameId)
  });
  const savedNote = useQuery({
    queryKey: ["analysis", "note", gameId],
    queryFn: () => analysisApi.note(gameId),
    enabled: Boolean(gameId)
  });
  const mistakes = useQuery({
    queryKey: ["analysis", "mistakes", mistakeStatus],
    queryFn: () => analysisApi.mistakes(mistakeStatus)
  });
  const saveNote = useMutation({
    mutationFn: () => analysisApi.saveNote({ gameId, fen, pgn, note }),
    onSuccess: (data) => {
      Alert.alert("Analysis", data.message);
      queryClient.invalidateQueries({ queryKey: ["analysis", "note", gameId] });
    },
    onError: (error) => Alert.alert("Could not save note", error.message)
  });
  const updateMistake = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "reviewed" | "dismissed" }) => analysisApi.updateMistake(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analysis", "mistakes"] }),
    onError: (error) => Alert.alert("Could not update review", error.message)
  });
  const coach = useMutation({
    mutationFn: () => analysisApi.coachSession({ fen, goal: "Review this position" }),
    onError: (error) => Alert.alert("Coach unavailable", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Analysis</AppText>
      <AppText muted>Saved notes and stored reports are supported. Server-side engine move review is not enabled on this backend deployment.</AppText>

      <Card>
        <AppText variant="subtitle">Position notes</AppText>
        <TextField placeholder="Game ID or manual" value={gameId} onChangeText={setGameId} autoCapitalize="none" />
        <TextField placeholder="FEN" value={fen} onChangeText={setFen} autoCapitalize="none" />
        <TextField placeholder="PGN (optional)" value={pgn} onChangeText={setPgn} multiline style={{ minHeight: 82, textAlignVertical: "top", paddingTop: 12 }} />
        <TextField placeholder="Your analysis note" value={note} onChangeText={setNote} multiline maxLength={2000} style={{ minHeight: 96, textAlignVertical: "top", paddingTop: 12 }} />
        <Button label="Save note" loading={saveNote.isPending} onPress={() => saveNote.mutate()} />
        {savedNote.data?.note ? <AppText muted>Last saved {savedNote.data.note.updatedAt ? new Date(savedNote.data.note.updatedAt).toLocaleString() : "recently"}</AppText> : null}
      </Card>

      <Card>
        <AppText variant="subtitle">Analysis report</AppText>
        {report.isLoading ? <LoadingState label="Loading report" /> : null}
        {report.isError ? <ErrorState message={report.error.message} retry={() => report.refetch()} /> : null}
        {report.data?.available && report.data.report ? (
          <View style={styles.stats}>
            <Stat label="Accuracy" value={`${report.data.report.accuracy || 0}%`} />
            <Stat label="Mistakes" value={String(report.data.report.mistakes || 0)} />
            <Stat label="Blunders" value={String(report.data.report.blunders || 0)} />
            <Stat label="Status" value={report.data.report.status || "complete"} />
          </View>
        ) : report.data ? (
          <EmptyState title="Engine report unavailable" body={report.data.message} />
        ) : null}
      </Card>

      <Card>
        <AppText variant="subtitle">Mistakes review</AppText>
        <View style={styles.row}>
          {(["open", "reviewed", "dismissed"] as const).map((status) => (
            <Pressable key={status} onPress={() => setMistakeStatus(status)} style={[styles.filter, mistakeStatus === status ? styles.filterActive : null]}>
              <AppText variant="caption">{status}</AppText>
            </Pressable>
          ))}
        </View>
        {mistakes.isLoading ? <LoadingState label="Loading mistakes" /> : null}
        {mistakes.data?.items.length === 0 ? <EmptyState title="No review items" /> : null}
        {mistakes.data?.items.map((item) => {
          const id = String(item.id || item._id || "");
          return (
            <View key={id} style={styles.reviewItem}>
              <AppText>{item.severity || "mistake"} - {item.movePlayed || "move"}</AppText>
              <AppText variant="caption" muted>Best: {item.bestMove || "not provided"}</AppText>
              <AppText muted>{item.reason || item.fen}</AppText>
              <View style={styles.row}>
                <Button label="Reviewed" variant="secondary" loading={updateMistake.isPending} onPress={() => updateMistake.mutate({ id, status: "reviewed" })} />
                <Button label="Dismiss" variant="secondary" loading={updateMistake.isPending} onPress={() => updateMistake.mutate({ id, status: "dismissed" })} />
              </View>
            </View>
          );
        })}
      </Card>

      <Card>
        <AppText variant="subtitle">Coach</AppText>
        <Button label="Ask coach" variant="secondary" loading={coach.isPending} onPress={() => coach.mutate()} />
        {coach.data ? (
          <View style={styles.reviewItem}>
            <AppText muted>{coach.data.message}</AppText>
            {coach.data.coaching.nextSteps.map((step) => <AppText key={step} muted>- {step}</AppText>)}
          </View>
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
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "45%" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  filterActive: { borderWidth: 2 },
  reviewItem: { gap: 6 }
});
