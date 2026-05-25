import { Chess } from "chess.js";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { ChessBoard } from "@/features/chess/ChessBoard";
import { MoveHistoryPanel } from "@/features/chess/MoveHistoryPanel";
import { TimerBar } from "@/features/chess/TimerBar";
import { describeGameStatus } from "@/features/chess/chessState";
import { getSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import type { MoveRecord } from "@/types/api";

export default function PlayScreen() {
  const router = useRouter();
  const [localChess, setLocalChess] = useState(() => new Chess());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const token = useAuthStore((state) => state.socketToken || state.accessToken);
  const queueSize = useGameStore((state) => state.queueSize);
  const connectionStatus = useGameStore((state) => state.connectionStatus);
  const liveRoom = useGameStore((state) => state.liveRoom);
  const status = useMemo(() => describeGameStatus(localChess.fen()), [localChess]);

  function connect() {
    if (!token) {
      Alert.alert("Sign in required", "Please log in again before starting online play.");
      return null;
    }
    return getSocket(token);
  }

  function startQueue() {
    const socket = connect();
    socket?.emit("joinQueue", { mode: "casual", playerName: "Mobile Player" });
  }

  function createRoom() {
    const socket = connect();
    socket?.emit("createRoom", { playerName: "Mobile Player" });
  }

  function joinRoom() {
    const socket = connect();
    socket?.emit("joinRoom", { roomId: roomCode.trim().toUpperCase(), playerName: "Mobile Player" });
  }

  useEffect(() => {
    if (liveRoom) router.replace("/game/live");
  }, [liveRoom, router]);

  return (
    <Screen>
      <AppText variant="title">Play</AppText>
      <Card>
        <AppText variant="subtitle">Local practice</AppText>
        <AppText muted>Practice legal moves locally. AI/Stockfish is not connected in this build.</AppText>
        <TimerBar />
        <ChessBoard
          fen={localChess.fen()}
          allowedColor="both"
          onMove={(from, to, promotion) => {
            const next = new Chess(localChess.fen());
            const move = next.move({ from, to, promotion });
            if (move) {
              setLocalChess(next);
              setMoves((current) => [...current, { from, to, piece: move.piece, promotion }]);
            }
          }}
        />
        <AppText muted>{status}</AppText>
        <MoveHistoryPanel moves={moves} />
        <Button label="Reset board" variant="secondary" onPress={() => { setLocalChess(new Chess()); setMoves([]); }} />
      </Card>
      <Card>
        <AppText variant="subtitle">Online multiplayer</AppText>
        <AppText muted>Socket status: {connectionStatus}. Queue size: {queueSize}</AppText>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button label="Find match" onPress={startQueue} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Create room" variant="secondary" onPress={createRoom} />
          </View>
        </View>
        <TextField placeholder="Room code" value={roomCode} onChangeText={setRoomCode} autoCapitalize="characters" />
        <Button label="Join room" variant="secondary" disabled={!roomCode.trim()} onPress={joinRoom} />
      </Card>
    </Screen>
  );
}
