import { useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { describeGameStatus, fenFromSocketGame } from "@/features/chess/chessState";
import { useGameStore } from "@/store/gameStore";

export default function ResultScreen() {
  const router = useRouter();
  const liveRoom = useGameStore((state) => state.liveRoom);
  const setLiveRoom = useGameStore((state) => state.setLiveRoom);
  const status = liveRoom?.gameState.status;
  const resultTitle =
    status === "checkmate"
      ? "Checkmate"
      : status === "resigned"
        ? "Game resigned"
        : status === "stalemate"
          ? "Stalemate"
          : status?.startsWith("draw")
            ? "Draw"
            : status || "Game result";
  const fen = liveRoom ? fenFromSocketGame(liveRoom.gameState) : "";

  function done() {
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
        <AppText muted>
          Timeout and rematch result states need backend support and are tracked in `docs/backend-mobile-gaps.md`.
        </AppText>
      </Card>
      <Button label="Back to play" onPress={done} />
    </Screen>
  );
}
