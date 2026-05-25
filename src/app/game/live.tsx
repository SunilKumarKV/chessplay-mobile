import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ChessBoard } from "@/features/chess/ChessBoard";
import { MoveHistoryPanel } from "@/features/chess/MoveHistoryPanel";
import { TimerBar } from "@/features/chess/TimerBar";
import { describeGameStatus, fenFromSocketGame, squareToBackend } from "@/features/chess/chessState";
import { emitSocket } from "@/services/socket/socketClient";
import { useGameStore } from "@/store/gameStore";

export default function LiveGameScreen() {
  const router = useRouter();
  const liveRoom = useGameStore((state) => state.liveRoom);
  const setLiveRoom = useGameStore((state) => state.setLiveRoom);

  if (!liveRoom) {
    return (
      <Screen>
        <AppText variant="title">Live game</AppText>
        <Card>
          <AppText muted>No active room.</AppText>
          <Button label="Back to play" onPress={() => router.replace("/(tabs)/play")} />
        </Card>
      </Screen>
    );
  }

  const fen = fenFromSocketGame(liveRoom.gameState);
  const orientation = liveRoom.color === "w" ? "white" : "black";
  const gameOver = ["checkmate", "stalemate", "draw", "resigned", "draw-50move", "draw-repetition"].includes(liveRoom.gameState.status || "");

  function leave() {
    emitSocket("leaveRoom");
    setLiveRoom(null);
    router.replace("/(tabs)/play");
  }

  return (
    <Screen>
      <AppText variant="title">Room {liveRoom.roomId}</AppText>
      <TimerBar />
      <ChessBoard
        fen={fen}
        orientation={orientation}
        disabled={gameOver}
        onMove={(from, to, promotion) => {
          const fromBackend = squareToBackend(from);
          const toBackend = squareToBackend(to);
          emitSocket("makeMove", {
            fromRow: fromBackend.row,
            fromCol: fromBackend.col,
            toRow: toBackend.row,
            toCol: toBackend.col,
            promotion
          });
        }}
      />
      <Card>
        <AppText variant="subtitle">{liveRoom.gameState.status || describeGameStatus(fen)}</AppText>
        <AppText muted>You are playing {liveRoom.color === "w" ? "white" : "black"}.</AppText>
        <MoveHistoryPanel moves={liveRoom.gameState.moves} />
      </Card>
      <Button label="Offer draw" variant="secondary" onPress={() => emitSocket("drawOffer")} disabled={gameOver} />
      <Button label="Resign" variant="danger" disabled={gameOver} onPress={() => Alert.alert("Resign", "Resign this game?", [{ text: "Cancel" }, { text: "Resign", onPress: () => emitSocket("resign") }])} />
      <Button label="Leave room" variant="secondary" onPress={leave} />
    </Screen>
  );
}

