import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { ChessBoard } from "@/features/chess/ChessBoard";
import { CapturedPiecesPanel } from "@/features/chess/CapturedPiecesPanel";
import { MoveHistoryPanel } from "@/features/chess/MoveHistoryPanel";
import { TimerBar } from "@/features/chess/TimerBar";
import { describeGameStatus, fenFromSocketGame, normalizeMoveRecord, squareToBackend } from "@/features/chess/chessState";
import { applyBackendMove, backendOpponent, createInitialBackendGameState } from "@/features/chess/backendChessAdapter";
import type { BackendColor, BackendSocketGameState } from "@/features/chess/backendChessAdapter";
import { readActiveRoomSnapshot } from "@/services/storage/activeRoomStorage";
import {
  DEFAULT_LOCAL_GAME_PREFERENCES,
  readLocalGamePreferences,
  saveLocalGamePreferences,
  type LocalBoardOrientation,
  type LocalBoardTheme,
  type LocalGamePreferences
} from "@/services/storage/localGameStorage";
import { recoverActiveGame } from "@/services/socket/rejoinActiveGame";
import { getSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import type { ClockState, Square } from "@/types/chess";

const ONLINE_TIME_CONTROLS = [
  { label: "No clock", value: null },
  { label: "1+0", value: 0 },
  { label: "3+0", value: 2 },
  { label: "5+3", value: 3 },
  { label: "10+0", value: 4 },
  { label: "10+5", value: 5 }
];

const LOCAL_TIME_CONTROLS = [
  { label: "No clock", value: null, initialMs: 0, incrementMs: 0 },
  { label: "1+0", value: 0, initialMs: 60_000, incrementMs: 0 },
  { label: "3+0", value: 1, initialMs: 180_000, incrementMs: 0 },
  { label: "5+0", value: 2, initialMs: 300_000, incrementMs: 0 },
  { label: "10+0", value: 3, initialMs: 600_000, incrementMs: 0 },
  { label: "15+10", value: 4, initialMs: 900_000, incrementMs: 10_000 }
];

type LocalSnapshot = {
  gameState: BackendSocketGameState;
  clock: ClockState;
};

type LocalResult = {
  title: string;
  message: string;
  winner?: BackendColor;
};

function createLocalClock(timeControlIndex: number | null): ClockState {
  const control = LOCAL_TIME_CONTROLS.find((item) => item.value === timeControlIndex) || LOCAL_TIME_CONTROLS[0];
  return {
    enabled: control.value !== null,
    timeControlIndex: control.value,
    whiteMs: control.initialMs,
    blackMs: control.initialMs,
    incrementMs: control.incrementMs,
    activeColor: "w",
    lastTickAt: control.value === null ? null : Date.now(),
    status: control.value === null ? "idle" : "running"
  };
}

function formatClock(value: number) {
  const totalSeconds = Math.max(0, Math.ceil(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function statusToLocalResult(status: BackendSocketGameState["status"], turn: BackendColor): LocalResult | null {
  if (status === "checkmate") {
    const winner = backendOpponent(turn);
    return { title: "Checkmate", message: `${winner === "w" ? "White" : "Black"} wins by checkmate.`, winner };
  }
  if (status === "stalemate") return { title: "Stalemate", message: "The game is drawn by stalemate." };
  if (status === "draw") return { title: "Draw", message: "The game ended in a draw." };
  if (status === "draw-50move") return { title: "Draw", message: "The game is drawn by the 50-move rule." };
  if (status === "draw-repetition") return { title: "Draw", message: "The game is drawn by repetition." };
  return null;
}

function cloneLocalState(gameState: BackendSocketGameState): BackendSocketGameState {
  return JSON.parse(JSON.stringify(gameState)) as BackendSocketGameState;
}

function cloneClock(clock: ClockState): ClockState {
  return { ...clock };
}

export default function PlayScreen() {
  const router = useRouter();
  const [localGameState, setLocalGameState] = useState(() => createInitialBackendGameState());
  const [localClock, setLocalClock] = useState<ClockState>(() => createLocalClock(null));
  const [localHistory, setLocalHistory] = useState<LocalSnapshot[]>([]);
  const [localResult, setLocalResult] = useState<LocalResult | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [localPaused, setLocalPaused] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<LocalGamePreferences>(DEFAULT_LOCAL_GAME_PREFERENCES);
  const [localPreferencesReady, setLocalPreferencesReady] = useState(false);
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
  const localFen = useMemo(() => fenFromSocketGame(localGameState), [localGameState]);
  const status = useMemo(() => describeGameStatus(localFen, localGameState), [localFen, localGameState]);
  const localOrientation = localPreferences.orientation === "auto" ? (localGameState.turn === "b" ? "black" : "white") : localPreferences.orientation;
  const localLastMove = useMemo(() => {
    const move = normalizeMoveRecord(localGameState.moveHistory?.[localGameState.moveHistory.length - 1] || {});
    if (!move) return null;
    return { from: move.from as Square, to: move.to as Square };
  }, [localGameState.moveHistory]);
  const isLocalGameOver = Boolean(localResult) || ["checkmate", "stalemate", "draw", "draw-50move", "draw-repetition", "resigned", "timeout"].includes(localGameState.status || "");

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

  function updateLocalPreferences(patch: Partial<LocalGamePreferences>) {
    setLocalPreferences((current) => ({ ...current, ...patch }));
  }

  function resetLocalGame(clockIndex = localPreferences.timeControlIndex) {
    const nextClock = createLocalClock(clockIndex);
    setLocalGameState(createInitialBackendGameState());
    setLocalClock(nextClock);
    setLocalHistory([]);
    setLocalResult(null);
    setLocalNotice("New local game started.");
    setLocalPaused(false);
  }

  function handleLocalMove(from: Square, to: Square, promotion?: string) {
    if (isLocalGameOver) {
      setLocalNotice("Start a new game before moving again.");
      return;
    }
    if (localClock.enabled && localClock.status !== "running") {
      setLocalNotice("Resume the clock before moving.");
      return;
    }

    const fromBackend = squareToBackend(from);
    const toBackend = squareToBackend(to);
    const movingColor = localGameState.turn || "w";
    const next = applyBackendMove(localGameState, fromBackend.row, fromBackend.col, toBackend.row, toBackend.col, promotion || "Q");
    if (!next) {
      setLocalNotice("That move is not legal in the current position.");
      return;
    }

    setLocalHistory((current) => [...current, { gameState: cloneLocalState(localGameState), clock: cloneClock(localClock) }]);
    setLocalGameState(next);
    setLocalNotice(null);

    setLocalClock((current) => {
      if (!current.enabled) return current;
      const now = Date.now();
      const activeKey = movingColor === "w" ? "whiteMs" : "blackMs";
      const elapsed = current.lastTickAt ? now - current.lastTickAt : 0;
      const remaining = Math.max(0, current[activeKey] - elapsed);
      const nextClock = {
        ...current,
        [activeKey]: remaining + current.incrementMs,
        activeColor: next.turn || backendOpponent(movingColor),
        lastTickAt: now,
        status: "running" as const
      };
      return nextClock;
    });

    const result = statusToLocalResult(next.status, next.turn || "w");
    if (result) {
      setLocalResult(result);
      setLocalClock((current) => ({ ...current, status: current.enabled ? "ended" : current.status, lastTickAt: null }));
    }
  }

  function undoLocalMove() {
    const previous = localHistory[localHistory.length - 1];
    if (!previous) {
      setLocalNotice("No moves to undo yet.");
      return;
    }
    setLocalHistory((current) => current.slice(0, -1));
    setLocalGameState(previous.gameState);
    setLocalClock(previous.clock.enabled ? { ...previous.clock, status: "running", lastTickAt: Date.now() } : previous.clock);
    setLocalResult(null);
    setLocalNotice("Last move undone.");
  }

  function resignLocalSide() {
    const loser = localGameState.turn || "w";
    const winner = backendOpponent(loser);
    setLocalGameState((current) => ({ ...current, status: "resigned" }));
    setLocalResult({ title: "Resignation", message: `${loser === "w" ? "White" : "Black"} resigned. ${winner === "w" ? "White" : "Black"} wins.`, winner });
    setLocalClock((current) => ({ ...current, status: current.enabled ? "ended" : current.status, lastTickAt: null }));
  }

  function agreeLocalDraw() {
    setLocalGameState((current) => ({ ...current, status: "draw" }));
    setLocalResult({ title: "Draw agreed", message: "Both sides agreed to a draw." });
    setLocalClock((current) => ({ ...current, status: current.enabled ? "ended" : current.status, lastTickAt: null }));
  }

  function toggleLocalPause() {
    setLocalPaused((current) => {
      const nextPaused = !current;
      setLocalClock((clock) => {
        if (!clock.enabled || clock.status === "ended") return clock;
        return { ...clock, status: nextPaused ? "paused" : "running", lastTickAt: nextPaused ? null : Date.now() };
      });
      return nextPaused;
    });
  }

  function flipLocalBoard() {
    updateLocalPreferences({ orientation: localOrientation === "white" ? "black" : "white" });
  }

  useEffect(() => {
    if (liveRoom) router.replace("/game/live");
  }, [liveRoom, router]);

  useEffect(() => {
    readActiveRoomSnapshot()
      .then((snapshot) => setStoredRoomId(snapshot.activeRoomId))
      .catch(() => setStoredRoomId(null));
  }, [liveRoom]);

  useEffect(() => {
    readLocalGamePreferences()
      .then((preferences) => {
        setLocalPreferences(preferences);
        setLocalClock(createLocalClock(preferences.timeControlIndex));
      })
      .finally(() => setLocalPreferencesReady(true));
  }, []);

  useEffect(() => {
    if (!localPreferencesReady) return;
    saveLocalGamePreferences(localPreferences).catch(() => undefined);
  }, [localPreferences, localPreferencesReady]);

  useEffect(() => {
    if (!localClock.enabled || localClock.status !== "running" || localPaused || localResult) return;
    const interval = setInterval(() => {
      setLocalClock((current) => {
        if (!current.enabled || current.status !== "running" || !current.lastTickAt) return current;
        const now = Date.now();
        const elapsed = now - current.lastTickAt;
        const activeKey = current.activeColor === "w" ? "whiteMs" : "blackMs";
        const remaining = Math.max(0, current[activeKey] - elapsed);
        if (remaining <= 0) {
          const winner = backendOpponent(current.activeColor);
          setLocalResult({ title: "Timeout", message: `${winner === "w" ? "White" : "Black"} wins on time.`, winner });
          setLocalGameState((state) => ({ ...state, status: "timeout" }));
          return { ...current, [activeKey]: 0, status: "ended", lastTickAt: null };
        }
        return { ...current, [activeKey]: remaining, lastTickAt: now };
      });
    }, 250);
    return () => clearInterval(interval);
  }, [localClock.enabled, localClock.status, localPaused, localResult]);

  return (
    <Screen>
      <AppText variant="title">Play</AppText>
      <Card>
        <AppText variant="subtitle">Local Practice · Play vs Player</AppText>
        <AppText muted>Same-device chess with backend-compatible rules. AI/Stockfish is not connected in this build.</AppText>
        <View style={styles.setupGrid}>
          <View style={styles.setupField}>
            <AppText muted>White player</AppText>
            <TextField value={localPreferences.whiteName} onChangeText={(whiteName) => updateLocalPreferences({ whiteName })} />
          </View>
          <View style={styles.setupField}>
            <AppText muted>Black player</AppText>
            <TextField value={localPreferences.blackName} onChangeText={(blackName) => updateLocalPreferences({ blackName })} />
          </View>
        </View>
        <AppText muted>Time control</AppText>
        <View style={styles.buttonWrap}>
          {LOCAL_TIME_CONTROLS.map((control) => (
            <Button
              key={control.label}
              label={control.label}
              variant={localPreferences.timeControlIndex === control.value ? "primary" : "secondary"}
              onPress={() => {
                updateLocalPreferences({ timeControlIndex: control.value });
                resetLocalGame(control.value);
              }}
            />
          ))}
        </View>
        <AppText muted>Board orientation</AppText>
        <View style={styles.buttonWrap}>
          {(["white", "black", "auto"] as LocalBoardOrientation[]).map((orientation) => (
            <Button
              key={orientation}
              label={orientation === "auto" ? "Auto turn" : orientation === "white" ? "White" : "Black"}
              variant={localPreferences.orientation === orientation ? "primary" : "secondary"}
              onPress={() => updateLocalPreferences({ orientation })}
            />
          ))}
        </View>
        <AppText muted>Board theme</AppText>
        <View style={styles.buttonWrap}>
          {(["classic", "blue", "green", "dark"] as LocalBoardTheme[]).map((boardTheme) => (
            <Button
              key={boardTheme}
              label={boardTheme[0].toUpperCase() + boardTheme.slice(1)}
              variant={localPreferences.boardTheme === boardTheme ? "primary" : "secondary"}
              onPress={() => updateLocalPreferences({ boardTheme })}
            />
          ))}
        </View>
        <View style={styles.buttonWrap}>
          <Button label="Start new game" onPress={() => resetLocalGame()} />
          <Button
            label={localPreferences.soundEnabled ? "Sound on" : "Sound off"}
            variant="secondary"
            onPress={() => updateLocalPreferences({ soundEnabled: !localPreferences.soundEnabled })}
          />
        </View>
        <TimerBar
          clock={localClock.enabled ? localClock : null}
          white={localClock.enabled ? formatClock(localClock.whiteMs) : "No clock"}
          black={localClock.enabled ? formatClock(localClock.blackMs) : "No clock"}
          whiteLabel={localPreferences.whiteName || "White"}
          blackLabel={localPreferences.blackName || "Black"}
        />
        <ChessBoard
          fen={localFen}
          gameState={localGameState}
          orientation={localOrientation}
          boardTheme={localPreferences.boardTheme}
          lastMove={localLastMove}
          allowedColor="both"
          disabled={isLocalGameOver}
          onInvalidSelection={setLocalNotice}
          onMove={(from, to, promotion) => handleLocalMove(from, to, promotion)}
        />
        <View style={styles.statusBlock}>
          <AppText variant="subtitle">{status}</AppText>
          <AppText muted>
            {localGameState.turn === "w" ? localPreferences.whiteName || "White" : localPreferences.blackName || "Black"} to move.
            {localClock.enabled ? ` Clock ${localClock.status}.` : " Casual game."}
          </AppText>
          {localNotice ? <AppText muted>{localNotice}</AppText> : null}
        </View>
        {localGameState.status === "check" ? <AppText muted>Check: the king is under attack.</AppText> : null}
        <CapturedPiecesPanel capturedW={localGameState.capturedW} capturedB={localGameState.capturedB} board={localGameState.board} />
        <MoveHistoryPanel moves={localGameState.moveHistory || []} />
        <View style={styles.buttonWrap}>
          <Button label="Undo" variant="secondary" disabled={!localHistory.length} onPress={undoLocalMove} />
          <Button label={localPaused ? "Resume" : "Pause"} variant="secondary" disabled={!localClock.enabled || localClock.status === "ended"} onPress={toggleLocalPause} />
          <Button label="Flip board" variant="secondary" onPress={flipLocalBoard} />
          <Button label="Agree draw" variant="secondary" disabled={isLocalGameOver} onPress={agreeLocalDraw} />
          <Button label="Resign side" variant="danger" disabled={isLocalGameOver} onPress={resignLocalSide} />
          <Button label="Reset" variant="secondary" onPress={() => resetLocalGame()} />
        </View>
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
      <Modal transparent visible={Boolean(localResult)} animationType="fade" onRequestClose={() => setLocalResult(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.resultModal}>
            <Card>
              <AppText variant="title">{localResult?.title}</AppText>
              <AppText muted>{localResult?.message}</AppText>
              {localResult?.winner ? (
                <AppText variant="subtitle">
                  Winner: {localResult.winner === "w" ? localPreferences.whiteName || "White" : localPreferences.blackName || "Black"}
                </AppText>
              ) : null}
              <Button label="Restart" onPress={() => resetLocalGame()} />
              <Button label="Back to play" variant="secondary" onPress={() => setLocalResult(null)} />
            </Card>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  setupGrid: { gap: 10 },
  setupField: { gap: 6 },
  buttonWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusBlock: { gap: 4 },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.56)" },
  resultModal: { width: "100%", maxWidth: 380 }
});
