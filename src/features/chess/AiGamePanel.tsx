import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ChessBoard } from "@/features/chess/ChessBoard";
import { CapturedPiecesPanel } from "@/features/chess/CapturedPiecesPanel";
import { MoveHistoryPanel } from "@/features/chess/MoveHistoryPanel";
import { TimerBar } from "@/features/chess/TimerBar";
import { describeGameStatus, fenFromSocketGame, normalizeMoveRecord, squareToBackend } from "@/features/chess/chessState";
import {
  applyBackendMove,
  backendOpponent,
  backendRowColToSquare,
  createInitialBackendGameState,
  isBackendMoveLegal,
  type BackendColor,
  type BackendSocketGameState
} from "@/features/chess/backendChessAdapter";
import { aiApi, gamesApi, isApiError } from "@/services/api/client";
import type { ClockState, Square } from "@/types/chess";

const AI_LEVELS = [
  { id: "easy", label: "Easy", copy: "Beginner friendly", difficulty: 3 },
  { id: "medium", label: "Medium", copy: "Balanced club challenge", difficulty: 10 },
  { id: "hard", label: "Hard", copy: "Sharper tactical play", difficulty: 18 },
  { id: "pro", label: "Pro", copy: "Maximum server engine level", difficulty: 20 }
] as const;

const AI_TIME_CONTROLS = [
  { label: "No clock", value: null, initialMs: 0, incrementMs: 0 },
  { label: "1+0", value: 0, initialMs: 60_000, incrementMs: 0 },
  { label: "3+0", value: 1, initialMs: 180_000, incrementMs: 0 },
  { label: "5+0", value: 2, initialMs: 300_000, incrementMs: 0 },
  { label: "10+0", value: 3, initialMs: 600_000, incrementMs: 0 },
  { label: "15+10", value: 4, initialMs: 900_000, incrementMs: 10_000 }
];

type AiLevel = (typeof AI_LEVELS)[number]["id"];
type SideSelection = "w" | "b" | "random";
type AiResult = { title: string; message: string; winner?: BackendColor | null };
type Snapshot = { gameState: BackendSocketGameState; clock: ClockState };

function createAiClock(timeControlIndex: number | null): ClockState {
  const control = AI_TIME_CONTROLS.find((item) => item.value === timeControlIndex) || AI_TIME_CONTROLS[0];
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
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function cloneGameState(gameState: BackendSocketGameState): BackendSocketGameState {
  return JSON.parse(JSON.stringify(gameState)) as BackendSocketGameState;
}

function terminalResult(gameState: BackendSocketGameState): AiResult | null {
  const status = gameState.status;
  if (status === "checkmate") {
    const winner = backendOpponent(gameState.turn || "w");
    return { title: "Checkmate", message: `${winner === "w" ? "White" : "Black"} wins by checkmate.`, winner };
  }
  if (status === "stalemate") return { title: "Stalemate", message: "The game is drawn by stalemate.", winner: null };
  if (status === "draw" || status === "draw-50move" || status === "draw-repetition") {
    return { title: "Draw", message: describeDraw(status), winner: null };
  }
  if (status === "timeout") return { title: "Timeout", message: "The game ended on time.", winner: null };
  if (status === "resigned") return { title: "Resignation", message: "The game ended by resignation.", winner: null };
  return null;
}

function describeDraw(status?: string) {
  if (status === "draw-50move") return "Draw by the 50-move rule.";
  if (status === "draw-repetition") return "Draw by repetition.";
  return "The game ended in a draw.";
}

function moveLabel(move: { fromRow: number; fromCol: number; toRow: number; toCol: number; promotion?: string }) {
  const from = backendRowColToSquare(move.fromRow, move.fromCol) || "--";
  const to = backendRowColToSquare(move.toRow, move.toCol) || "--";
  return `${from}-${to}${move.promotion ? `=${move.promotion.toUpperCase()}` : ""}`;
}

export function AiGamePanel() {
  const [gameState, setGameState] = useState<BackendSocketGameState>(() => createInitialBackendGameState());
  const [sideSelection, setSideSelection] = useState<SideSelection>("w");
  const [playerColor, setPlayerColor] = useState<BackendColor>("w");
  const [level, setLevel] = useState<AiLevel>("medium");
  const [timeControlIndex, setTimeControlIndex] = useState<number | null>(null);
  const [clock, setClock] = useState<ClockState>(() => createAiClock(null));
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [thinking, setThinking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<{ type: "cp" | "mate"; value: number } | null>(null);
  const [bestLine, setBestLine] = useState<string[]>([]);
  const [depth, setDepth] = useState<number | null>(null);
  const [source, setSource] = useState<"stockfish" | "fallback" | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const aiRequestKeyRef = useRef("");

  const aiColor = backendOpponent(playerColor);
  const fen = useMemo(() => fenFromSocketGame(gameState), [gameState]);
  const status = useMemo(() => describeGameStatus(fen, gameState), [fen, gameState]);
  const lastMove = useMemo(() => {
    const normalized = normalizeMoveRecord(gameState.moveHistory?.[gameState.moveHistory.length - 1] || {});
    if (!normalized) return null;
    return { from: normalized.from as Square, to: normalized.to as Square };
  }, [gameState.moveHistory]);
  const gameOver = Boolean(result) || ["checkmate", "stalemate", "draw", "draw-50move", "draw-repetition", "resigned", "timeout"].includes(gameState.status || "");
  const aiLevel = AI_LEVELS.find((item) => item.id === level) || AI_LEVELS[1];

  function startGame() {
    const chosenSide = sideSelection === "random" ? (Math.random() < 0.5 ? "w" : "b") : sideSelection;
    const initialState = createInitialBackendGameState();
    setPlayerColor(chosenSide);
    setGameState(initialState);
    setClock(createAiClock(timeControlIndex));
    setHistory([]);
    setThinking(false);
    setNotice(`Started against ${aiLevel.label} AI. You play ${chosenSide === "w" ? "white" : "black"}.`);
    setHint(null);
    setEvaluation(null);
    setBestLine([]);
    setDepth(null);
    setSource(null);
    setResult(null);
    setRecorded(false);
    setStartedAt(Date.now());
    aiRequestKeyRef.current = "";
  }

  const updateClockAfterMove = useCallback((movingColor: BackendColor, nextTurn: BackendColor) => {
    setClock((current) => {
      if (!current.enabled || current.status === "ended") return current;
      const now = Date.now();
      const activeKey = movingColor === "w" ? "whiteMs" : "blackMs";
      const elapsed = current.lastTickAt ? now - current.lastTickAt : 0;
      return {
        ...current,
        [activeKey]: Math.max(0, current[activeKey] - elapsed) + current.incrementMs,
        activeColor: nextTurn,
        lastTickAt: now,
        status: "running"
      };
    });
  }, []);

  const applyMove = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number, promotion?: string, saveSnapshot = true) => {
    const movingColor = gameState.turn || "w";
    const next = applyBackendMove(gameState, fromRow, fromCol, toRow, toCol, promotion || "Q");
    if (!next) {
      setNotice("That move is not legal in the current position.");
      return null;
    }
    if (saveSnapshot) setHistory((current) => [...current, { gameState: cloneGameState(gameState), clock: { ...clock } }]);
    setGameState(next);
    updateClockAfterMove(movingColor, next.turn || backendOpponent(movingColor));
    const nextResult = terminalResult(next);
    if (nextResult) {
      setResult(nextResult);
      setClock((current) => ({ ...current, status: current.enabled ? "ended" : current.status, lastTickAt: null }));
    }
    return next;
  }, [clock, gameState, updateClockAfterMove]);

  function handleUserMove(from: Square, to: Square, promotion?: string) {
    if (thinking) {
      setNotice("Wait for the AI move.");
      return;
    }
    if (gameOver) {
      setNotice("Start a new AI game before moving again.");
      return;
    }
    if (gameState.turn !== playerColor) {
      setNotice("It is the AI's turn.");
      return;
    }
    const fromBackend = squareToBackend(from);
    const toBackend = squareToBackend(to);
    if (!isBackendMoveLegal(gameState, fromBackend.row, fromBackend.col, toBackend.row, toBackend.col)) {
      setNotice("That move is not legal in the current position.");
      return;
    }
    setHint(null);
    setNotice(null);
    applyMove(fromBackend.row, fromBackend.col, toBackend.row, toBackend.col, promotion);
  }

  const requestAiMove = useCallback(async (currentState: BackendSocketGameState, hintOnly = false) => {
    const currentFen = fenFromSocketGame(currentState);
    const response = await aiApi.move({
      board: currentState.board,
      turn: currentState.turn || "w",
      level,
      moveHistory: currentState.moveHistory,
      fen: currentFen,
      hint: hintOnly
    });
    setEvaluation(response.evaluation);
    setBestLine(response.bestLine || []);
    setDepth(response.depth);
    setSource(response.source);
    return response;
  }, [level]);

  async function getHint() {
    if (thinking || gameOver || gameState.turn !== playerColor) return;
    try {
      setNotice("Asking AI for a hint...");
      const response = await requestAiMove(gameState, true);
      setHint(moveLabel(response.move));
      setNotice(response.source === "fallback" ? "Hint used legal fallback because Stockfish is unavailable." : "Hint ready.");
    } catch (error) {
      setNotice(isApiError(error) ? error.message : "Unable to get a hint right now.");
    }
  }

  function undoPair() {
    if (thinking) return;
    const targetIndex = Math.max(0, history.length - 2);
    const snapshot = history[targetIndex];
    if (!snapshot) {
      setNotice("No completed player/AI move pair to undo.");
      return;
    }
    setHistory((current) => current.slice(0, targetIndex));
    setGameState(snapshot.gameState);
    setClock(snapshot.clock.enabled ? { ...snapshot.clock, status: "running", lastTickAt: Date.now() } : snapshot.clock);
    setResult(null);
    setHint(null);
    setNotice("Undid the last player and AI moves.");
  }

  function resign() {
    const winner = aiColor;
    setGameState((current) => ({ ...current, status: "resigned" }));
    setResult({ title: "Resignation", message: `You resigned. ${winner === "w" ? "White" : "Black"} wins.`, winner });
    setClock((current) => ({ ...current, status: current.enabled ? "ended" : current.status, lastTickAt: null }));
  }

  useEffect(() => {
    if (gameOver || thinking || gameState.turn !== aiColor) return;
    const requestKey = `${fen}:${level}`;
    if (aiRequestKeyRef.current === requestKey) return;
    aiRequestKeyRef.current = requestKey;
    let cancelled = false;
    setThinking(true);
    setNotice("AI is thinking...");
    requestAiMove(gameState)
      .then((response) => {
        if (cancelled) return;
        const next = applyMove(response.move.fromRow, response.move.fromCol, response.move.toRow, response.move.toCol, response.move.promotion, true);
        if (next) setNotice(response.source === "fallback" ? "AI used legal fallback because Stockfish is unavailable." : null);
      })
      .catch((error) => {
        if (!cancelled) setNotice(isApiError(error) ? error.message : "AI move failed. Try again.");
      })
      .finally(() => {
        if (!cancelled) setThinking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [aiColor, applyMove, fen, gameOver, gameState, level, requestAiMove, thinking]);

  useEffect(() => {
    if (!clock.enabled || clock.status !== "running" || result) return;
    const interval = setInterval(() => {
      setClock((current) => {
        if (!current.enabled || current.status !== "running" || !current.lastTickAt) return current;
        const now = Date.now();
        const activeKey = current.activeColor === "w" ? "whiteMs" : "blackMs";
        const remaining = Math.max(0, current[activeKey] - (now - current.lastTickAt));
        if (remaining <= 0) {
          const winner = backendOpponent(current.activeColor);
          setGameState((state) => ({ ...state, status: "timeout" }));
          setResult({ title: "Timeout", message: `${winner === playerColor ? "You win" : "AI wins"} on time.`, winner });
          return { ...current, [activeKey]: 0, status: "ended", lastTickAt: null };
        }
        return { ...current, [activeKey]: remaining, lastTickAt: now };
      });
    }, 250);
    return () => clearInterval(interval);
  }, [clock.enabled, clock.status, playerColor, result]);

  useEffect(() => {
    if (!result || recorded || !startedAt || !gameState.moveHistory?.length) return;
    const winnerColor = result.winner || null;
    const resultValue = winnerColor ? (winnerColor === "w" ? "white" : "black") : "draw";
    gamesApi.record({
      aiOpponent: true,
      aiDifficulty: aiLevel.difficulty,
      playerColor,
      result: resultValue,
      winnerColor,
      duration: Math.floor((Date.now() - startedAt) / 1000),
      moves: (gameState.moveHistory || []).map((move) => {
        const normalized = normalizeMoveRecord(move);
        return {
          from: normalized?.from || "",
          to: normalized?.to || "",
          piece: normalized?.piece,
          promotion: normalized?.promotion,
          timestamp: normalized?.timestamp
        };
      })
    }).then(() => setRecorded(true)).catch(() => setNotice("AI game finished, but recording failed."));
  }, [aiLevel.difficulty, gameState.moveHistory, playerColor, recorded, result, startedAt]);

  return (
    <Card>
      <AppText variant="subtitle">Play vs AI</AppText>
      <AppText muted>Server-powered AI. Stockfish is used when configured on the backend; legal fallback is labeled when needed.</AppText>
      <AppText muted>Side</AppText>
      <View style={styles.buttonWrap}>
        {(["w", "b", "random"] as SideSelection[]).map((side) => (
          <Button
            key={side}
            label={side === "w" ? "White" : side === "b" ? "Black" : "Random"}
            variant={sideSelection === side ? "primary" : "secondary"}
            onPress={() => setSideSelection(side)}
          />
        ))}
      </View>
      <AppText muted>AI level</AppText>
      <View style={styles.levelGrid}>
        {AI_LEVELS.map((item) => (
          <View key={item.id} style={styles.levelCell}>
            <Button label={item.label} variant={level === item.id ? "primary" : "secondary"} onPress={() => setLevel(item.id)} />
            <AppText muted style={styles.levelCopy}>{item.copy}</AppText>
          </View>
        ))}
      </View>
      <AppText muted>Time control</AppText>
      <View style={styles.buttonWrap}>
        {AI_TIME_CONTROLS.map((control) => (
          <Button
            key={control.label}
            label={control.label}
            variant={timeControlIndex === control.value ? "primary" : "secondary"}
            onPress={() => setTimeControlIndex(control.value)}
          />
        ))}
      </View>
      <Button label="Start AI game" onPress={startGame} />
      <TimerBar
        clock={clock.enabled ? clock : null}
        white={clock.enabled ? formatClock(clock.whiteMs) : "No clock"}
        black={clock.enabled ? formatClock(clock.blackMs) : "No clock"}
        whiteLabel={playerColor === "w" ? "You" : "AI"}
        blackLabel={playerColor === "b" ? "You" : "AI"}
      />
      <ChessBoard
        fen={fen}
        gameState={gameState}
        orientation={playerColor === "w" ? "white" : "black"}
        allowedColor={playerColor}
        lastMove={lastMove}
        disabled={thinking || gameOver || gameState.turn !== playerColor}
        onInvalidSelection={setNotice}
        onMove={(from, to, promotion) => handleUserMove(from, to, promotion)}
      />
      <View style={styles.statusBlock}>
        <AppText variant="subtitle">{thinking ? "AI thinking..." : status}</AppText>
        <AppText muted>
          You are {playerColor === "w" ? "white" : "black"}. Level: {aiLevel.label}.
          {source ? ` Source: ${source}.` : ""}
          {depth ? ` Depth ${depth}.` : ""}
        </AppText>
        {evaluation ? <AppText muted>Evaluation: {evaluation.type === "mate" ? `Mate ${evaluation.value}` : `${evaluation.value > 0 ? "+" : ""}${evaluation.value.toFixed(2)}`}</AppText> : null}
        {bestLine.length ? <AppText muted>Best line: {bestLine.join(" ")}</AppText> : null}
        {hint ? <AppText muted>Hint: {hint}</AppText> : null}
        {notice ? <AppText muted>{notice}</AppText> : null}
      </View>
      <CapturedPiecesPanel capturedW={gameState.capturedW} capturedB={gameState.capturedB} board={gameState.board} />
      <MoveHistoryPanel moves={gameState.moveHistory || []} />
      <View style={styles.buttonWrap}>
        <Button label="Hint" variant="secondary" disabled={thinking || gameOver || gameState.turn !== playerColor} onPress={getHint} />
        <Button label="Undo pair" variant="secondary" disabled={thinking || history.length < 2} onPress={undoPair} />
        <Button
          label="Resign"
          variant="danger"
          disabled={thinking || gameOver}
          onPress={() => Alert.alert("Resign", "Resign this AI game?", [{ text: "Cancel", style: "cancel" }, { text: "Resign", style: "destructive", onPress: resign }])}
        />
        <Button label="Reset" variant="secondary" onPress={startGame} />
      </View>
      <Modal transparent visible={Boolean(result)} animationType="fade" onRequestClose={() => setResult(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.resultModal}>
            <Card>
              <AppText variant="title">{result?.title}</AppText>
              <AppText muted>{result?.message}</AppText>
              {recorded ? <AppText muted>Game recorded.</AppText> : null}
              <Button label="Restart" onPress={startGame} />
              <Button label="Back to play" variant="secondary" onPress={() => setResult(null)} />
            </Card>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  buttonWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  levelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  levelCell: { width: "47%", gap: 4 },
  levelCopy: { fontSize: 12 },
  statusBlock: { gap: 4 },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.56)" },
  resultModal: { width: "100%", maxWidth: 380 }
});
