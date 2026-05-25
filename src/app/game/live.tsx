import { useRouter } from "expo-router";
import { Alert, Share, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ChessBoard } from "@/features/chess/ChessBoard";
import { CapturedPiecesPanel } from "@/features/chess/CapturedPiecesPanel";
import { MoveHistoryPanel } from "@/features/chess/MoveHistoryPanel";
import { TimerBar } from "@/features/chess/TimerBar";
import { describeGameStatus, fenFromSocketGame, normalizeMoveRecord, squareToBackend } from "@/features/chess/chessState";
import { backendOpponent, isBackendMoveLegal } from "@/features/chess/backendChessAdapter";
import { LiveRoomChat } from "@/features/multiplayer/LiveRoomChat";
import { clearActiveRoomSnapshot } from "@/services/storage/activeRoomStorage";
import { emitSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import type { PlayerColor, Square } from "@/types/chess";

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
  const clock = useGameStore((state) => state.clock);
  const timeoutResult = useGameStore((state) => state.timeoutResult);
  const drawOffer = useGameStore((state) => state.drawOffer);
  const drawOfferSent = useGameStore((state) => state.drawOfferSent);
  const setDrawOffer = useGameStore((state) => state.setDrawOffer);
  const setDrawOfferSent = useGameStore((state) => state.setDrawOfferSent);
  const setRoomLifecycle = useGameStore((state) => state.setRoomLifecycle);
  const user = useAuthStore((state) => state.user);

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
  const gameOver = ["checkmate", "stalemate", "draw", "resigned", "abandoned", "timeout", "draw-50move", "draw-repetition"].includes(liveRoom.gameState.status || "");
  const moveHistory = liveRoom.gameState.moveHistory || liveRoom.gameState.moves || [];
  const whitePlayer = liveRoom.gameState.players?.w;
  const blackPlayer = liveRoom.gameState.players?.b;
  const whiteName = whitePlayer?.name || "White";
  const blackName = blackPlayer?.name || "Black";
  const waitingForOpponent = !blackPlayer?.name && !blackPlayer?.userId && !isSpectating && !gameOver;
  const activeTurn = liveRoom.gameState.turn || "w";
  const activeTurnName = activeTurn === "w" ? whiteName : blackName;
  const lastMove = (() => {
    const move = normalizeMoveRecord(moveHistory[moveHistory.length - 1] || {});
    if (!move) return null;
    return { from: move.from as Square, to: move.to as Square };
  })();
  const winnerColor = getWinnerColor(liveRoom.gameState.status, liveRoom.gameState.turn, timeoutResult?.winnerColor);
  const winnerName = winnerColor === "w" ? whiteName : winnerColor === "b" ? blackName : null;

  function showMoveError(message: string) {
    Alert.alert("Move not allowed", message);
  }

  function leave() {
    emitSocket("leaveRoom");
    clearActiveRoomSnapshot().catch(() => {});
    setLiveRoom(null);
    router.replace("/(tabs)/play");
  }

  function confirmLeave() {
    Alert.alert(isSpectating ? "Leave spectator view" : "Leave room", "Return to Play Online?", [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: leave }
    ]);
  }

  function shareRoom() {
    if (!liveRoom) return;
    Share.share({ message: `Join my ChessPlay room: ${liveRoom.roomId}` }).catch(() => undefined);
  }

  return (
    <Screen>
      <AppText variant="title">Room {liveRoom.roomId}</AppText>
      <Card>
        <View style={styles.headerRow}>
          <View style={styles.playerPlate}>
            <AppText muted>White</AppText>
            <AppText variant="subtitle">{whiteName}</AppText>
            <AppText muted>Rating: {whitePlayer && "rating" in whitePlayer ? String(whitePlayer.rating || "unrated") : liveRoom.color === "w" ? String(user?.rating || "unrated") : "unrated"}</AppText>
          </View>
          <View style={styles.playerPlate}>
            <AppText muted>Black</AppText>
            <AppText variant="subtitle">{blackName}</AppText>
            <AppText muted>Rating: {blackPlayer && "rating" in blackPlayer ? String(blackPlayer.rating || "unrated") : liveRoom.color === "b" ? String(user?.rating || "unrated") : "unrated"}</AppText>
          </View>
        </View>
        <AppText muted>
          {isSpectating ? "Spectator mode. Board is view-only." : `You are ${liveRoom.color === "w" ? "white" : "black"}.`}
          {" "}Turn: {activeTurnName}. Connection: {connectionLabel(reconnectStatus, roomLifecycle)}. Spectators: {spectatorCount}.
        </AppText>
        {winnerName ? <AppText variant="subtitle">Winner: {winnerName}</AppText> : null}
        <View style={styles.buttonRow}>
          <Button label="Share room" variant="secondary" onPress={shareRoom} />
          {isSpectating ? <Button label="Back to room browser" variant="secondary" onPress={confirmLeave} /> : null}
        </View>
      </Card>
      {waitingForOpponent ? (
        <Card>
          <AppText variant="subtitle">Waiting for opponent</AppText>
          <AppText muted>Share room code {liveRoom.roomId} or keep this screen open until another player joins.</AppText>
          <Button label="Share room code" variant="secondary" onPress={shareRoom} />
        </Card>
      ) : null}
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
      {timeoutResult ? (
        <Card>
          <AppText variant="subtitle">Timeout</AppText>
          <AppText muted>{timeoutResult.message}</AppText>
        </Card>
      ) : null}
      <TimerBar clock={clock || liveRoom.gameState.clock} />
      <ChessBoard
        fen={fen}
        gameState={liveRoom.gameState}
        orientation={orientation}
        lastMove={lastMove}
        allowedColor={liveRoom.color}
        disabled={gameOver || isSpectating}
        onInvalidSelection={showMoveError}
        onMove={(from, to, promotion) => {
          if (isSpectating) {
            showMoveError("Spectators cannot move pieces.");
            return;
          }
          const fromBackend = squareToBackend(from);
          const toBackend = squareToBackend(to);
          const selectedPiece = liveRoom.gameState.board?.[fromBackend.row]?.[fromBackend.col];
          if (!selectedPiece || selectedPiece[0] !== liveRoom.color) {
            showMoveError("You can only move your own pieces.");
            return;
          }
          if (liveRoom.gameState.turn !== liveRoom.color) {
            showMoveError("Wait for your opponent to move.");
            return;
          }
          if (!isBackendMoveLegal(liveRoom.gameState, fromBackend.row, fromBackend.col, toBackend.row, toBackend.col)) {
            showMoveError("That move is not legal in the current position.");
            return;
          }
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
          {isSpectating ? `Spectating room ${liveRoom.roomId}. Chat is available when the backend accepts spectator messages.` : `You are playing ${liveRoom.color === "w" ? "white" : "black"}.`}
        </AppText>
        <AppText muted>
          Room state: {roomLifecycle.replace(/_/g, " ")}. Spectators: {spectatorCount}.
          {clock?.enabled ? ` Clock: ${clock.status}.` : " No clock."}
        </AppText>
        <MoveHistoryPanel moves={moveHistory} />
        {gameOver ? <Button label="View result" onPress={() => router.push("/game/result")} /> : null}
      </Card>
      <CapturedPiecesPanel capturedW={liveRoom.gameState.capturedW} capturedB={liveRoom.gameState.capturedB} board={liveRoom.gameState.board} />
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
              Alert.alert("Resign", "Resign this game? This gives the win to your opponent.", [
                { text: "Cancel", style: "cancel" },
                { text: "Resign", style: "destructive", onPress: () => emitSocket("resign") }
              ])
            }
          />
        </>
      ) : null}
      <Button label={isSpectating ? "Back to room browser" : "Leave room"} variant="secondary" onPress={confirmLeave} />
    </Screen>
  );
}

function getWinnerColor(status?: string, turn?: PlayerColor, timeoutWinner?: PlayerColor): PlayerColor | null {
  if (timeoutWinner) return timeoutWinner;
  if (status === "checkmate" && turn) return backendOpponent(turn);
  return null;
}

function connectionLabel(reconnectStatus: string, roomLifecycle: string) {
  if (reconnectStatus === "opponent-disconnected") return "opponent disconnected";
  if (reconnectStatus === "reconnecting") return "reconnecting";
  if (roomLifecycle === "room_closed") return "room closed";
  return "connected";
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", gap: 10 },
  playerPlate: { flex: 1, gap: 4 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }
});
