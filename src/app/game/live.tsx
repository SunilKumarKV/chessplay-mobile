import { useRouter } from "expo-router";
import { Chess } from "chess.js";
import { Alert } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ChessBoard } from "@/features/chess/ChessBoard";
import { MoveHistoryPanel } from "@/features/chess/MoveHistoryPanel";
import { TimerBar } from "@/features/chess/TimerBar";
import { describeGameStatus, fenFromSocketGame, squareToBackend } from "@/features/chess/chessState";
import { LiveRoomChat } from "@/features/multiplayer/LiveRoomChat";
import { clearActiveRoomSnapshot } from "@/services/storage/activeRoomStorage";
import { emitSocket } from "@/services/socket/socketClient";
import { useGameStore } from "@/store/gameStore";

export default function LiveGameScreen() {
  const router = useRouter();
  const liveRoom = useGameStore((state) => state.liveRoom);
  const setLiveRoom = useGameStore((state) => state.setLiveRoom);
  const lastServerError = useGameStore((state) => state.lastServerError);
  const roomLifecycle = useGameStore((state) => state.roomLifecycle);
  const reconnectStatus = useGameStore((state) => state.reconnectStatus);
  const lifecycleMessage = useGameStore((state) => state.lifecycleMessage);
  const opponentReconnectBy = useGameStore((state) => state.opponentReconnectBy);
  const spectatorCount = useGameStore((state) => state.spectatorCount);
  const isSpectating = useGameStore((state) => state.isSpectating);
  const drawOffer = useGameStore((state) => state.drawOffer);
  const drawOfferSent = useGameStore((state) => state.drawOfferSent);
  const setDrawOffer = useGameStore((state) => state.setDrawOffer);
  const setDrawOfferSent = useGameStore((state) => state.setDrawOfferSent);
  const setRoomLifecycle = useGameStore((state) => state.setRoomLifecycle);

  if (!liveRoom) {
    return (
      <Screen>
        <AppText variant="title">Live game</AppText>
        <Card>
          <AppText muted>No active room.</AppText>
          {lifecycleMessage ? <AppText muted>{lifecycleMessage}</AppText> : null}
          <Button label="Back to play" onPress={() => router.replace("/(tabs)/play")} />
        </Card>
      </Screen>
    );
  }

  const fen = fenFromSocketGame(liveRoom.gameState);
  const orientation = liveRoom.color === "w" ? "white" : "black";
  const gameOver = ["checkmate", "stalemate", "draw", "resigned", "abandoned", "draw-50move", "draw-repetition"].includes(liveRoom.gameState.status || "");
  const moveHistory = liveRoom.gameState.moveHistory || liveRoom.gameState.moves || [];

  function showMoveError(message: string) {
    Alert.alert("Move not allowed", message);
  }

  function leave() {
    emitSocket("leaveRoom");
    clearActiveRoomSnapshot().catch(() => {});
    setLiveRoom(null);
    router.replace("/(tabs)/play");
  }

  return (
    <Screen>
      <AppText variant="title">Room {liveRoom.roomId}</AppText>
      {lastServerError ? (
        <Card>
          <AppText variant="subtitle">Live game notice</AppText>
          <AppText muted>{lastServerError}</AppText>
        </Card>
      ) : null}
      {reconnectStatus !== "idle" && lifecycleMessage ? (
        <Card>
          <AppText variant="subtitle">
            {reconnectStatus === "reconnecting"
              ? "Reconnecting..."
              : reconnectStatus === "opponent-disconnected"
                ? "Opponent disconnected"
                : reconnectStatus === "opponent-rejoined"
                  ? "Opponent rejoined"
                  : reconnectStatus === "abandoned"
                    ? "Game ended"
                    : "Room update"}
          </AppText>
          <AppText muted>{lifecycleMessage}</AppText>
          {opponentReconnectBy ? <AppText muted>Reconnect grace ends at {new Date(opponentReconnectBy).toLocaleTimeString()}.</AppText> : null}
        </Card>
      ) : null}
      {drawOffer ? (
        <Card>
          <AppText variant="subtitle">Draw offered</AppText>
          <AppText muted>{drawOffer.fromName || "Opponent"} offered a draw.</AppText>
          <Button label="Accept draw" onPress={() => { emitSocket("drawAccepted"); setDrawOffer(null); setRoomLifecycle("game_over", "Draw accepted."); }} />
          <Button label="Decline" variant="secondary" onPress={() => { emitSocket("drawDeclined"); setDrawOffer(null); setRoomLifecycle("connected", "Draw offer declined."); }} />
        </Card>
      ) : null}
      <TimerBar />
      <ChessBoard
        fen={fen}
        orientation={orientation}
        allowedColor={liveRoom.color}
        disabled={gameOver || isSpectating}
        onInvalidSelection={showMoveError}
        onMove={(from, to, promotion) => {
          if (isSpectating) {
            showMoveError("Spectators cannot move pieces.");
            return;
          }
          const chess = new Chess(fen);
          const selectedPiece = chess.get(from);
          if (!selectedPiece || selectedPiece.color !== liveRoom.color) {
            showMoveError("You can only move your own pieces.");
            return;
          }
          if (chess.turn() !== liveRoom.color) {
            showMoveError("Wait for your opponent to move.");
            return;
          }
          const candidate = chess.moves({ square: from, verbose: true }).find((move) => move.to === to && (!move.promotion || move.promotion === promotion));
          if (!candidate) {
            showMoveError("That move is not legal in the current position.");
            return;
          }
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
        <AppText variant="subtitle">{describeGameStatus(fen, liveRoom.gameState)}</AppText>
        <AppText muted>
          {isSpectating ? `Spectating room ${liveRoom.roomId}.` : `You are playing ${liveRoom.color === "w" ? "white" : "black"}.`}
        </AppText>
        <AppText muted>Room state: {roomLifecycle.replace(/_/g, " ")}. Spectators: {spectatorCount}.</AppText>
        <MoveHistoryPanel moves={moveHistory} />
        {gameOver ? <Button label="View result" onPress={() => router.push("/game/result")} /> : null}
      </Card>
      <LiveRoomChat />
      {!isSpectating ? (
        <>
          <Button
            label={drawOfferSent ? "Draw offered" : "Offer draw"}
            variant="secondary"
            onPress={() => {
              if (drawOfferSent) return;
              emitSocket("drawOffer");
              setDrawOfferSent(true);
              setRoomLifecycle("draw_offered", "Draw offer sent.");
            }}
            disabled={gameOver || drawOfferSent || Boolean(drawOffer)}
          />
          <Button
            label="Resign"
            variant="danger"
            disabled={gameOver}
            onPress={() =>
              Alert.alert("Resign", "Resign this game?", [
                { text: "Cancel" },
                { text: "Resign", onPress: () => emitSocket("resign") }
              ])
            }
          />
        </>
      ) : null}
      <Button label="Leave room" variant="secondary" onPress={leave} />
    </Screen>
  );
}
