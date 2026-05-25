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
import { readActiveRoomSnapshot } from "@/services/storage/activeRoomStorage";
import { recoverActiveGame } from "@/services/socket/rejoinActiveGame";
import { getSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import type { MoveRecord } from "@/types/api";

const ONLINE_TIME_CONTROLS = [
  { label: "No clock", value: null },
  { label: "1+0", value: 0 },
  { label: "3+0", value: 2 },
  { label: "5+3", value: 3 },
  { label: "10+0", value: 4 },
  { label: "10+5", value: 5 }
];

export default function PlayScreen() {
  const router = useRouter();
  const [localChess, setLocalChess] = useState(() => new Chess());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [storedRoomId, setStoredRoomId] = useState<string | null>(null);
  const [timeControlIndex, setTimeControlIndex] = useState<number | null>(null);
  const token = useAuthStore((state) => state.socketToken || state.accessToken);
  const queueSize = useGameStore((state) => state.queueSize);
  const connectionStatus = useGameStore((state) => state.connectionStatus);
  const liveRoom = useGameStore((state) => state.liveRoom);
  const lastServerError = useGameStore((state) => state.lastServerError);
  const roomsList = useGameStore((state) => state.roomsList);
  const roomLifecycle = useGameStore((state) => state.roomLifecycle);
  const roomOperation = useGameStore((state) => state.roomOperation);
  const setRoomLifecycle = useGameStore((state) => state.setRoomLifecycle);
  const setRoomOperation = useGameStore((state) => state.setRoomOperation);
  const reconnectStatus = useGameStore((state) => state.reconnectStatus);
  const lifecycleMessage = useGameStore((state) => state.lifecycleMessage);
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
    socket?.emit("joinQueue", { mode: "casual", playerName: "Mobile Player", timeControlIndex });
  }

  function createRoom() {
    const socket = connect();
    if (!socket) return;
    setRoomOperation("creating");
    setRoomLifecycle("creating", "Creating room...");
    socket?.emit("createRoom", { playerName: "Mobile Player", timeControlIndex });
  }

  function joinRoomById(roomId: string) {
    const socket = connect();
    if (!socket) return;
    const normalizedRoomId = roomId.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalizedRoomId)) {
      setRoomLifecycle("room_closed", "Invalid room code. Use the 6-character room code.");
      return;
    }
    setRoomOperation("joining");
    setRoomLifecycle("joining", `Joining ${normalizedRoomId}...`);
    socket.emit("joinRoom", { roomId: normalizedRoomId, playerName: "Mobile Player" });
  }

  function joinRoom() {
    joinRoomById(roomCode);
  }

  function browseRooms() {
    const socket = connect();
    if (!socket) return;
    setRoomOperation("browsing");
    socket.emit("getRooms");
  }

  function spectateRoom(roomId: string) {
    const socket = connect();
    if (!socket) return;
    setRoomOperation("spectating");
    setRoomLifecycle("joining", `Opening spectator view for ${roomId}...`);
    socket.emit("spectateRoom", { roomId });
  }

  useEffect(() => {
    if (liveRoom) router.replace("/game/live");
  }, [liveRoom, router]);

  useEffect(() => {
    readActiveRoomSnapshot()
      .then((snapshot) => setStoredRoomId(snapshot.activeRoomId))
      .catch(() => setStoredRoomId(null));
  }, [liveRoom]);

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
        <AppText muted>Room state: {roomLifecycle.replace(/_/g, " ")}.</AppText>
        {lifecycleMessage ? <AppText muted>{lifecycleMessage}</AppText> : null}
        {lastServerError ? <AppText muted>{lastServerError}</AppText> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ONLINE_TIME_CONTROLS.map((control) => (
            <Button
              key={control.label}
              label={control.label}
              variant={timeControlIndex === control.value ? "primary" : "secondary"}
              onPress={() => setTimeControlIndex(control.value)}
            />
          ))}
        </View>
        {storedRoomId || reconnectStatus === "reconnecting" ? (
          <Button
            label={reconnectStatus === "reconnecting" ? "Reconnecting..." : `Rejoin ${storedRoomId}`}
            variant="secondary"
            loading={reconnectStatus === "reconnecting"}
            onPress={() => recoverActiveGame("manual")}
          />
        ) : null}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button label="Find match" onPress={startQueue} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Create room" variant="secondary" loading={roomOperation === "creating"} onPress={createRoom} />
          </View>
        </View>
        <TextField placeholder="Room code" value={roomCode} onChangeText={setRoomCode} autoCapitalize="characters" />
        <Button label="Join room" variant="secondary" loading={roomOperation === "joining"} disabled={!roomCode.trim()} onPress={joinRoom} />
        <Button label="Browse live rooms" variant="secondary" loading={roomOperation === "browsing"} onPress={browseRooms} />
        {roomsList.length ? (
          <View style={{ gap: 10 }}>
            {roomsList.map((room) => (
              <View key={room.id} style={{ gap: 8, paddingVertical: 10 }}>
                <AppText variant="subtitle">Room {room.id}</AppText>
                <AppText muted>
                  {room.players?.w || "Waiting"} vs {room.players?.b || "Waiting"} · {room.status || "unknown"} · {room.spectatorCount || 0} watching
                </AppText>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Button label="Join" disabled={room.isFull} onPress={() => { setRoomCode(room.id); joinRoomById(room.id); }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label="Watch" variant="secondary" loading={roomOperation === "spectating"} onPress={() => spectateRoom(room.id)} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
