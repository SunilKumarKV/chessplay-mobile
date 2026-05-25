import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Share, StyleSheet, View } from "react-native";
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
  { label: "10+5", value: 5 },
  { label: "30+0", value: 6 }
];

const MATCH_MODES = [
  { id: "casual", label: "Casual", copy: "Friendly auto match" },
  { id: "ranked", label: "Ranked", copy: "Rating focused pairing", ratingRange: "rated" },
  { id: "blitz", label: "Blitz", copy: "Fast online game", timeControlIndex: 3 },
  { id: "rapid", label: "Rapid", copy: "More thinking time", timeControlIndex: 4 },
  { id: "beginner", label: "Beginner", copy: "New player friendly", ratingRange: "beginner" },
  { id: "intermediate", label: "Intermediate", copy: "Balanced opponents", ratingRange: "intermediate" },
  { id: "advanced", label: "Advanced", copy: "Stronger players", ratingRange: "advanced" }
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
  const [selectedMatchMode, setSelectedMatchMode] = useState("casual");
  const [queueStartedAt, setQueueStartedAt] = useState<number | null>(null);
  const [queueElapsed, setQueueElapsed] = useState(0);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.socketToken || state.accessToken);
  const queueSize = useGameStore((state) => state.queueSize);
  const isSearching = useGameStore((state) => state.isSearching);
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
  const playerName = user?.username || "Mobile Player";
  const activeMode = MATCH_MODES.find((mode) => mode.id === selectedMatchMode) || MATCH_MODES[0];

  function connect() {
    if (!token) {
      Alert.alert("Sign in required", "Please log in again before starting online play.");
      return null;
    }
    return getSocket(token);
  }

  function startQueue() {
    const socket = connect();
    if (!socket) return;
    const nextTimeControl = typeof activeMode.timeControlIndex === "number" ? activeMode.timeControlIndex : timeControlIndex;
    setTimeControlIndex(nextTimeControl);
    setQueueStartedAt(Date.now());
    setRoomLifecycle("idle", `Searching ${activeMode.label.toLowerCase()} opponents...`);
    socket.emit("joinQueue", {
      mode: activeMode.id,
      ratingRange: activeMode.ratingRange,
      playerName,
      timeControlIndex: nextTimeControl
    });
  }

  function cancelQueue() {
    const socket = connect();
    socket?.emit("leaveQueue");
    setQueueStartedAt(null);
    setQueueElapsed(0);
    useGameStore.getState().setIsSearching(false);
    setRoomLifecycle("idle", "Matchmaking cancelled.");
  }

  function createRoom() {
    const socket = connect();
    if (!socket) return;
    setRoomOperation("creating");
    setRoomLifecycle("creating", "Creating room...");
    socket?.emit("createRoom", { playerName, timeControlIndex });
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
    socket.emit("joinRoom", { roomId: normalizedRoomId, playerName });
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

  function shareRoomCode(roomId: string) {
    Share.share({ message: `Join my ChessPlay room: ${roomId}` }).catch(() => undefined);
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
    if (!isSearching || !queueStartedAt) return undefined;
    const interval = setInterval(() => setQueueElapsed(Math.floor((Date.now() - queueStartedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [isSearching, queueStartedAt]);

  useEffect(() => {
    if (!isSearching) {
      setQueueStartedAt(null);
      setQueueElapsed(0);
    }
  }, [isSearching]);

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
        <AppText variant="subtitle">Play Online</AppText>
        <AppText muted>Signed in as {playerName}. Socket: {connectionStatus}. Room state: {roomLifecycle.replace(/_/g, " ")}.</AppText>
        {lifecycleMessage ? <AppText muted>{lifecycleMessage}</AppText> : null}
        {lastServerError ? <AppText muted>{lastServerError}</AppText> : null}
        <AppText muted>Matchmaking mode</AppText>
        <View style={styles.modeGrid}>
          {MATCH_MODES.map((mode) => (
            <View key={mode.id} style={styles.modeButton}>
              <Button
                label={mode.label}
                variant={selectedMatchMode === mode.id ? "primary" : "secondary"}
                onPress={() => {
                  setSelectedMatchMode(mode.id);
                  if (typeof mode.timeControlIndex === "number") setTimeControlIndex(mode.timeControlIndex);
                }}
              />
              <AppText muted style={styles.modeCopy}>{mode.copy}</AppText>
            </View>
          ))}
        </View>
        <AppText muted>Time control</AppText>
        <View style={styles.buttonWrap}>
          {ONLINE_TIME_CONTROLS.map((control) => (
            <Button
              key={control.label}
              label={control.label}
              variant={timeControlIndex === control.value ? "primary" : "secondary"}
              onPress={() => setTimeControlIndex(control.value)}
            />
          ))}
        </View>
        {isSearching ? (
          <View style={styles.statusBlock}>
            <AppText variant="subtitle">Searching for opponent...</AppText>
            <AppText muted>Mode: {activeMode.label}. Queue: {queueSize}. Elapsed: {queueElapsed}s.</AppText>
            <Button label="Cancel search" variant="secondary" onPress={cancelQueue} />
          </View>
        ) : (
          <AppText muted>Queue size: {queueSize}. Choose a mode and time control, then find a match.</AppText>
        )}
        {storedRoomId || reconnectStatus === "reconnecting" ? (
          <View style={styles.statusBlock}>
            <AppText variant="subtitle">Active game available</AppText>
            <AppText muted>{storedRoomId ? `Room ${storedRoomId} can be rejoined.` : "Trying to reconnect your active game."}</AppText>
            <Button
              label={reconnectStatus === "reconnecting" ? "Reconnecting..." : `Rejoin ${storedRoomId}`}
              variant="secondary"
              loading={reconnectStatus === "reconnecting"}
              onPress={() => recoverActiveGame("manual")}
            />
          </View>
        ) : null}
        <View style={styles.twoColumn}>
          <View style={{ flex: 1 }}>
            <Button label="Find match" loading={isSearching} disabled={isSearching} onPress={startQueue} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Create room" variant="secondary" loading={roomOperation === "creating"} onPress={createRoom} />
          </View>
        </View>
        <TextField
          placeholder="Room code"
          value={roomCode}
          onChangeText={(value) => setRoomCode(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          autoCapitalize="characters"
          maxLength={6}
        />
        <Button label="Join room" variant="secondary" loading={roomOperation === "joining"} disabled={!roomCode.trim()} onPress={joinRoom} />
        <Button label="Browse live rooms" variant="secondary" loading={roomOperation === "browsing"} onPress={browseRooms} />
        <Button label="Refresh rooms" variant="secondary" disabled={roomOperation === "browsing"} onPress={browseRooms} />
        {roomsList.length ? (
          <View style={{ gap: 10 }}>
            {roomsList.map((room) => (
              <View key={room.id} style={styles.roomRow}>
                <AppText variant="subtitle">Room {room.id}</AppText>
                <AppText muted>
                  {room.players?.w || "Waiting"} vs {room.players?.b || "Waiting"} · {room.status || "unknown"} · {room.spectatorCount || 0} watching
                </AppText>
                <View style={styles.twoColumn}>
                  <View style={{ flex: 1 }}>
                    <Button label="Join" disabled={room.isFull} onPress={() => { setRoomCode(room.id); joinRoomById(room.id); }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label="Watch" variant="secondary" loading={roomOperation === "spectating"} onPress={() => spectateRoom(room.id)} />
                  </View>
                </View>
                <Button label="Share code" variant="secondary" onPress={() => shareRoomCode(room.id)} />
              </View>
            ))}
          </View>
        ) : roomOperation === "browsing" ? null : (
          <AppText muted>No public rooms loaded. Tap Browse live rooms to refresh.</AppText>
        )}
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
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  modeButton: { width: "47%", gap: 4 },
  modeCopy: { fontSize: 12 },
  twoColumn: { flexDirection: "row", gap: 10 },
  roomRow: { gap: 8, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(148,163,184,0.35)" },
  statusBlock: { gap: 4 },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.56)" },
  resultModal: { width: "100%", maxWidth: 380 }
});
