import { useRouter } from "expo-router";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { describeGameStatus, fenFromSocketGame } from "@/features/chess/chessState";
import { backendOpponent } from "@/features/chess/backendChessAdapter";
import { clearActiveRoomSnapshot } from "@/services/storage/activeRoomStorage";
import { shareGameResult } from "@/services/native/share";
import { useGameStore } from "@/store/gameStore";
import type { PlayerColor } from "@/types/chess";

export default function ResultScreen() {
  const router = useRouter();
  const liveRoom = useGameStore((state) => state.liveRoom);
  const setLiveRoom = useGameStore((state) => state.setLiveRoom);
  const resultSummary = useGameStore((state) => state.resultSummary);
  const timeoutResult = useGameStore((state) => state.timeoutResult);
  const setResultSummary = useGameStore((state) => state.setResultSummary);
  const setTimeoutResult = useGameStore((state) => state.setTimeoutResult);
  const status = liveRoom?.gameState.status;
  const whiteName = liveRoom?.gameState.players?.w?.name || "White";
  const blackName = liveRoom?.gameState.players?.b?.name || "Black";
  const winnerColor = resultSummary?.winnerColor || timeoutResult?.winnerColor || inferWinnerColor(status, liveRoom?.gameState.turn);
  const winnerName = winnerColor === "w" ? whiteName : winnerColor === "b" ? blackName : null;
  const resultTitle =
    status === "checkmate"
      ? "Checkmate"
      : status === "resigned"
        ? "Game resigned"
        : status === "timeout"
          ? "Timeout"
          : status === "abandoned"
            ? "Abandoned"
            : status === "stalemate"
              ? "Stalemate"
              : status?.startsWith("draw")
                ? "Draw"
                : status || "Game result";
  const fen = liveRoom ? fenFromSocketGame(liveRoom.gameState) : "";

  function done() {
    clearActiveRoomSnapshot().catch(() => {});
    setResultSummary(null);
    setTimeoutResult(null);
    setLiveRoom(null);
    router.replace("/(tabs)/play");
  }

  return (
    <Screen>
      <AppText variant="title">Game result</AppText>
      <Card>
        <AppText variant="subtitle">{resultTitle}</AppText>
        <AppText muted>
          {liveRoom
            ? `${describeGameStatus(fen)}. You played ${liveRoom.color === "w" ? "white" : "black"}.`
            : "No active result is available. Completed games are available in game history after backend persistence."}
        </AppText>
        {winnerName ? <AppText variant="subtitle">Winner: {winnerName} ({winnerColor === "w" ? "white" : "black"})</AppText> : null}
        {resultSummary?.message || timeoutResult?.message ? <AppText muted>{resultSummary?.message || timeoutResult?.message}</AppText> : null}
        {liveRoom ? (
          <View style={{ gap: 4 }}>
            <AppText muted>White: {whiteName}</AppText>
            <AppText muted>Black: {blackName}</AppText>
            <AppText muted>Room: {liveRoom.roomId}</AppText>
          </View>
        ) : null}
      </Card>
      <Button label="Share result" variant="secondary" onPress={() => shareGameResult({ title: resultTitle, roomId: liveRoom?.roomId, winner: winnerName })} />
      <Button label="Back to play" onPress={done} />
    </Screen>
  );
}

function inferWinnerColor(status?: string, turn?: PlayerColor): PlayerColor | null {
  if (status === "checkmate" && turn) return backendOpponent(turn);
  return null;
}
